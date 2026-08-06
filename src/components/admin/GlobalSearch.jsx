import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentsAPI } from '../../api/students';
import { teacherService } from '../../api/teachers';
import { getEnquiries } from '../../api/enquiries';

// Normalizes different API response shapes into a plain array
const extractList = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.data?.data)) return res.data.data;
  return [];
};

// Student objects come straight from the raw API (not the page's mapStudent()),
// so the name can be under fullName, or split firstName/lastName, or name.
const getStudentName = (s) => {
  return s.fullName || s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unnamed';
};

export default function GlobalSearch({
  variant = 'desktop',
  autoFocus = false,
  onNavigate,
  scopes = { students: true, employees: true, enquiries: true },
  navBase = 'admin',
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ students: [], employees: [], enquiries: [] });
  const [activeIndex, setActiveIndex] = useState(-1);
  const [errored, setErrored] = useState(false);
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState('');
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  const SpeechRecognitionAPI = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;
  const speechSupported = !!SpeechRecognitionAPI;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Stop mic if component unmounts mid-listen
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      }
    };
  }, []);

  const runSearch = useCallback(async (term) => {
    setLoading(true);
    setErrored(false);
    try {
      // Sirf wahi APIs call karte hain jinki permission di gayi hai —
      // disallowed category ke liye request bhejte hi nahi, taaki
      // koi data leak ya 403 error na aaye.
      const jobs = [];
      if (scopes.students) jobs.push(['students', getStudentsAPI({ search: term, limit: 5 })]);
      if (scopes.employees) jobs.push(['employees', teacherService.getAll({ search: term, limit: 5 })]);
      if (scopes.enquiries) jobs.push(['enquiries', getEnquiries({ search: term, limit: 5 })]);

      if (jobs.length === 0) {
        setResults({ students: [], employees: [], enquiries: [] });
        return;
      }

      const settled = await Promise.allSettled(jobs.map(([, promise]) => promise));

      const newResults = { students: [], employees: [], enquiries: [] };
      settled.forEach((res, idx) => {
        const key = jobs[idx][0];
        newResults[key] = res.status === 'fulfilled' ? extractList(res.value).slice(0, 5) : [];
      });
      setResults(newResults);

      // Agar sab call fail ho gayi to error dikhana
      if (settled.every(r => r.status === 'rejected')) {
        setErrored(true);
      }
    } catch (err) {
      console.error('Global search failed', err);
      setErrored(true);
    } finally {
      setLoading(false);
    }
  }, [scopes.students, scopes.employees, scopes.enquiries]);

  const applyQuery = useCallback((value, { immediate = false } = {}) => {
    setQuery(value);
    setActiveIndex(-1);
    setMicError('');

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setResults({ students: [], employees: [], enquiries: [] });
      setOpen(false);
      setLoading(false);
      return;
    }

    setOpen(true);
    if (immediate) {
      runSearch(trimmed);
    } else {
      debounceRef.current = setTimeout(() => runSearch(trimmed), 400);
    }
  }, [runSearch]);

  const handleChange = (e) => applyQuery(e.target.value);

  const handleMicClick = () => {
    if (!speechSupported) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    setMicError('');
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) applyQuery(transcript, { immediate: true });
    };
    recognition.onerror = (event) => {
      setListening(false);
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        setMicError('Mic permission denied');
      } else if (event.error !== 'aborted') {
        setMicError('Could not hear you, try again');
      }
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const closeAndReset = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setOpen(false);
    setQuery('');
    setResults({ students: [], employees: [], enquiries: [] });
    if (onNavigate) onNavigate();
  };

  const goTo = (path) => {
    navigate(path);
    closeAndReset();
  };

  // Flat list of all clickable results, used for keyboard navigation
  const flatResults = [
    ...results.students.map(s => ({ type: 'student', item: s })),
    ...results.employees.map(t => ({ type: 'employee', item: t })),
    ...results.enquiries.map(e => ({ type: 'enquiry', item: e })),
  ];

  const handleResultClick = (entry) => {
    const { type, item } = entry;
    if (navBase === 'teacher') {
      // Teacher panel ke apne routes — inhi permissions (canManageStudents/
      // canManageEmployees/canManageEnquiries) se already guard hote hain,
      // isliye yahan navigate karna safe hai.
      if (type === 'student') {
        goTo(`/teacher/manage-students/edit/${item._id}`);
      } else if (type === 'employee') {
        goTo(`/teacher/manage-employees/view/${item._id}`);
      } else if (type === 'enquiry') {
        goTo(`/teacher/manage-enquiries/${item._id}`);
      }
      return;
    }
    if (type === 'student') {
      goTo(`/admin/students/${item.admissionNo || item._id}`);
    } else if (type === 'employee') {
      goTo(`/admin/teachers/${item._id}`);
    } else if (type === 'enquiry') {
      goTo(`/admin/enquiry/${item._id}`);
    }
  };

  const handleKeyDown = (e) => {
    if (!open || flatResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % flatResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + flatResults.length) % flatResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const entry = activeIndex >= 0 ? flatResults[activeIndex] : flatResults[0];
      if (entry) handleResultClick(entry);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const hasAnyResult = flatResults.length > 0;
  const showDropdown = open && query.trim().length >= 2;

  const scopeLabels = [
    scopes.students && 'students',
    scopes.employees && 'employees',
    scopes.enquiries && 'enquiries',
  ].filter(Boolean);
  const placeholder = scopeLabels.length
    ? `Search ${scopeLabels.join(', ')}...`
    : 'Search...';

  const containerClass = variant === 'mobile'
    ? 'relative w-full'
    : 'relative w-full max-w-xl mx-auto';

  const inputClass = variant === 'mobile'
    ? 'w-full rounded-2xl bg-gray-100 py-2.5 pl-9 pr-10 text-sm outline-none'
    : 'search-box w-full rounded-2xl border border-transparent bg-slate-100 py-2.5 pl-10 pr-11 text-sm outline-none transition-all focus:bg-white focus:border-indigo-200 focus:ring-2 focus:ring-indigo-100';

  return (
    <div className={containerClass} ref={wrapperRef}>
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (query.trim().length >= 2) setOpen(true); }}
        className={inputClass}
      />
      <svg
        className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>

      {speechSupported && (
        <button
          type="button"
          onClick={handleMicClick}
          title={listening ? 'Listening... click to stop' : 'Search by voice'}
          className={`absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
            listening ? 'bg-red-50 text-red-500 animate-pulse' : 'text-gray-400 hover:bg-slate-200 hover:text-indigo-600'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
            />
          </svg>
        </button>
      )}

      {micError && (
        <p className="absolute -bottom-5 left-0 text-[11px] font-semibold text-red-500">{micError}</p>
      )}

      {showDropdown && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 max-h-[70vh] overflow-y-auto">
          {loading && (
            <div className="p-4 text-sm text-slate-400 flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-200 border-t-indigo-600"></div>
              Searching...
            </div>
          )}

          {!loading && errored && (
            <div className="p-4 text-sm text-red-500 font-medium">
              Search failed. Please try again.
            </div>
          )}

          {!loading && !errored && !hasAnyResult && (
            <div className="p-4 text-sm text-slate-400">
              No results found for "{query}"
            </div>
          )}

          {!loading && !errored && results.students.length > 0 && (
            <div className="py-2">
              <p className="px-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Students</p>
              {results.students.map((s) => {
                const globalIdx = flatResults.findIndex(f => f.type === 'student' && f.item === s);
                return (
                  <button
                    key={s._id}
                    onClick={() => handleResultClick({ type: 'student', item: s })}
                    className={`w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between gap-2 ${activeIndex === globalIdx ? 'bg-indigo-50' : ''}`}
                  >
                    <span className="font-semibold text-slate-800 text-sm truncate">{getStudentName(s)}</span>
                    <span className="text-xs text-slate-400 font-mono flex-shrink-0">{s.admissionNo || '—'}</span>
                  </button>
                );
              })}
            </div>
          )}

          {!loading && !errored && results.employees.length > 0 && (
            <div className="py-2 border-t border-slate-100">
              <p className="px-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Employees</p>
              {results.employees.map((t) => {
                const globalIdx = flatResults.findIndex(f => f.type === 'employee' && f.item === t);
                return (
                  <button
                    key={t._id}
                    onClick={() => handleResultClick({ type: 'employee', item: t })}
                    className={`w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between gap-2 ${activeIndex === globalIdx ? 'bg-indigo-50' : ''}`}
                  >
                    <span className="font-semibold text-slate-800 text-sm truncate">{t.name || `${t.firstName || ''} ${t.lastName || ''}`.trim()}</span>
                    <span className="text-xs text-slate-400 font-mono flex-shrink-0">{t.employeeId || t.phone || '—'}</span>
                  </button>
                );
              })}
            </div>
          )}

          {!loading && !errored && results.enquiries.length > 0 && (
            <div className="py-2 border-t border-slate-100">
              <p className="px-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Enquiries</p>
              {results.enquiries.map((en) => {
                const globalIdx = flatResults.findIndex(f => f.type === 'enquiry' && f.item === en);
                return (
                  <button
                    key={en._id}
                    onClick={() => handleResultClick({ type: 'enquiry', item: en })}
                    className={`w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between gap-2 ${activeIndex === globalIdx ? 'bg-indigo-50' : ''}`}
                  >
                    <span className="font-semibold text-slate-800 text-sm truncate">
                      {en.childName || en.applicantName || en.fatherName || 'Enquiry'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono flex-shrink-0">{en.mobile || en.enquiryId || '—'}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
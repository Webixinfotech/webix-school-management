import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Download, Calendar, Clock, User, Hourglass,
  ChevronLeft, Loader2, AlertCircle, CheckCircle,
  TrendingDown, TrendingUp, AlertTriangle, Grid, List, Zap
} from 'lucide-react';
import { getStudentsAPI } from '../../api/students';
import { getClassesAPI } from '../../api/classes';
import { calculateFlexHoursSummary } from '../../api/flexReport.api';
import { getAttendanceList } from '../../api/attendance';

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
  blue: { bg: '#EFF6FF', text: '#0C2A47', border: '#BFDBFE', from: '#60A5FA', to: '#0C2A47' },
  green: { bg: '#ECFDF5', text: '#065F46', border: '#6EE7B7', from: '#4ADE80', to: '#16A34A' },
  red: { bg: '#FFF1F2', text: '#E2B94D', border: '#FECDD3', from: '#E2B94D', to: '#E2B94D' },
  orange: { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA', from: '#FB923C', to: '#EA580C' },
  teal: { bg: '#F0FDFA', text: '#0F766E', border: '#5EEAD4', from: '#2DD4BF', to: '#0D9488' },
  amber: { bg: '#FFFBEB', text: '#92400E', border: '#FCD34D', from: '#FBBF24', to: '#D97706' },
  gray: { bg: '#F9FAFB', text: '#374151', border: '#E5E7EB', from: '#94A3B8', to: '#64748B' },
};

const PALETTES = [
  ['#3B82F6', '#0C2A47'], ['#8B5CF6', '#6D28D9'], ['#10B981', '#065F46'],
  ['#EF4444', '#B91C1C'], ['#F97316', '#C2410C'], ['#06B6D4', '#0E7490'],
];
const getPalette = (name = '?') => PALETTES[name.charCodeAt(0) % PALETTES.length];

const Avatar = ({ name, size = 40 }) => {
  const [from, to] = getPalette(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: `linear-gradient(150deg,${from},${to})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 800, fontSize: size * 0.4, flexShrink: 0,
      boxShadow: `0 6px 12px -4px ${to}77, inset 0 -3px 5px rgba(0,0,0,0.15), inset 0 2px 2px rgba(255,255,255,0.4)`,
    }}>
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
};

const Toast = ({ message, type = 'error', onClose }) => {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [message, onClose]);
  if (!message) return null;
  const s = { error: { bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C' }, success: { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' } }[type] || {};
  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: 12, padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', maxWidth: 340 }}>
      <AlertCircle size={16} color={s.text} />
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: s.text }}>{message}</p>
    </div>
  );
};

const IconBubble = ({ icon: Icon, color, size = 40 }) => {
  const c = C[color];
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.32, flexShrink: 0,
      background: `linear-gradient(150deg, ${c.from}, ${c.to})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 8px 14px -5px ${c.to}88, inset 0 -3px 5px rgba(0,0,0,0.18), inset 0 2px 3px rgba(255,255,255,0.45)`,
    }}>
      <Icon size={size * 0.42} color="#fff" strokeWidth={2.3} />
    </div>
  );
};

const OverviewCard = ({ icon, label, value, color }) => (
  <div style={{ background: '#fff', borderRadius: 14, padding: 14, border: `1.5px solid ${C[color].border}`, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
    <IconBubble icon={icon} color={color} />
    <div>
      <p style={{ margin: 0, fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
      <p style={{ margin: '2px 0 0', fontSize: 19, fontWeight: 900, color: '#030B15' }}>{value}</p>
    </div>
  </div>
);

const isoDaysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};
const isoMonthStart = (monthsBack = 0) => {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsBack, 1);
  return d.toISOString().split('T')[0];
};
const isoToday = () => new Date().toISOString().split('T')[0];

const FlexiHoursHistoryPage = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [classesData, setClassesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | low | zero | overstay
  const [preset, setPreset] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewMode, setViewMode] = useState('table'); // table or timeline

  // Students who have any flexi activity within the selected date range.
  // `null` = date filter not yet resolved (show everyone); a Set = apply it.
  const [activeStudentIds, setActiveStudentIds] = useState(null);
  const [dateLoading, setDateLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Classes first (required to resolve each student's paid/free/consumed
        // flexi hours). If this fails the status filters would silently return
        // nothing, so we await it and surface an error instead.
        const classRes = await getClassesAPI({ limit: 100 });
        const classes = Array.isArray(classRes) ? classRes : (classRes?.data || []);
        setClassesData(classes);

        const studentsRes = await getStudentsAPI({ status: 'Active', limit: 1000 });
        const envelope = studentsRes?.data || {};
        const studentsList = Array.isArray(envelope)
          ? envelope
          : (Array.isArray(envelope.data) ? envelope.data : []);
        setStudents(studentsList);
      } catch (error) {
        setToast({ message: 'Error loading data', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const applyPreset = (p) => {
    setPreset(p);
    if (p === 'all') { setDateFrom(''); setDateTo(''); }
    else if (p === 'month') { setDateFrom(isoMonthStart(0)); setDateTo(isoToday()); }
    else if (p === 'lastMonth') { setDateFrom(isoMonthStart(1)); setDateTo(isoMonthStart(0)); }
    else if (p === '3months') { setDateFrom(isoMonthStart(3)); setDateTo(isoToday()); }
    else if (p === '30days') { setDateFrom(isoDaysAgo(30)); setDateTo(isoToday()); }
  };

  // Resolve which students actually used flexi hours in the selected range.
  // Attendance records carry studentId (string or populated object) and the
  // server-computed flexiHoursDeducted — we keep only students with any billed
  // flexi activity so the date presets narrow the list meaningfully.
  const recordStudentId = (record) => {
    const sid = record?.studentId;
    if (!sid) return '';
    if (typeof sid === 'object') return String(sid._id || sid.id || '');
    return String(sid);
  };

  useEffect(() => {
    // "All Time" preset leaves the dates empty → show every student, no fetch.
    if (!dateFrom || !dateTo) {
      setActiveStudentIds(null);
      setDateLoading(false);
      return;
    }
    let cancelled = false;
    const fetchActive = async () => {
      setDateLoading(true);
      try {
        const res = await getAttendanceList({ dateFrom, dateTo, limit: 10000 });
        const records = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        const ids = new Set();
        records.forEach((r) => {
          if (Number(r?.flexiHoursDeducted) > 0) {
            const sid = recordStudentId(r);
            if (sid) ids.add(sid);
          }
        });
        if (!cancelled) setActiveStudentIds(ids);
      } catch {
        if (!cancelled) setActiveStudentIds(new Set());
        setToast({ message: 'Could not load date-range activity', type: 'error' });
      } finally {
        if (!cancelled) setDateLoading(false);
      }
    };
    fetchActive();
    return () => { cancelled = true; };
  }, [dateFrom, dateTo]);

  const filteredStudents = useMemo(() => {
    let result = students.map(s => ({ ...s, id: s._id, summary: calculateFlexHoursSummary(s, classesData) }));

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s => (s.fullName || '').toLowerCase().includes(q) || (s.admissionNo || '').toLowerCase().includes(q));
    }

    if (statusFilter === 'low') result = result.filter(s => s.summary.isLow);
    else if (statusFilter === 'zero') result = result.filter(s => s.summary.hasAnyFlexi && s.summary.totalLeft === 0);
    else if (statusFilter === 'overstay') result = result.filter(s => s.summary.hasOverstay);

    if (activeStudentIds) {
      result = result.filter(s => activeStudentIds.has(s.id) || activeStudentIds.has(s._id));
    }

    return result.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
  }, [students, classesData, search, statusFilter, activeStudentIds]);

  const overview = useMemo(() => ({
    total: filteredStudents.length,
    low: filteredStudents.filter(s => s.summary.isLow).length,
    overstay: filteredStudents.filter(s => s.summary.hasOverstay).length,
    avgRemaining: filteredStudents.length ? (filteredStudents.reduce((sum, s) => sum + s.summary.totalLeft, 0) / filteredStudents.length) : 0,
  }), [filteredStudents]);

  const handleExport = () => {
    const headers = ['Student Name', 'Enrollment ID', 'Total Paid', 'Total Free', 'Consumed', 'Remaining', 'Extra Stay (No Plan)'];
    const rows = filteredStudents.map(s => [
      s.fullName || '', s.admissionNo || '',
      s.summary.totalPaid.toFixed(2), s.summary.totalFree.toFixed(2),
      s.summary.totalConsumed.toFixed(2), s.summary.totalLeft.toFixed(2), s.summary.overstayHours.toFixed(2),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Flexi_Hours_History_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setToast({ message: 'CSV downloaded', type: 'success' });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={48} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px', color: '#0C2A47' }} />
          <p style={{ fontSize: 16, fontWeight: 600, color: '#64748B' }}>Loading flex hours history...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '20px 16px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .fhh-header { display: flex; gap: 16px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
        .fhh-overview { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .fhh-row { display: grid; grid-template-columns: 220px 140px 90px 90px 100px 100px 100px 1fr; gap: 10px; align-items: center; padding: 12px 14px; }
        .fhh-row-header { display: none; }
        .fhh-mobile-card { display: none; }
        @media (min-width: 861px) {
          .fhh-row-header { display: grid; }
        }
        @media (max-width: 860px) {
          .fhh-row { display: none; }
          .fhh-mobile-card { display: flex; }
        }
        @media (max-width: 640px) {
          .fhh-overview { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '' })} />

      {/* Header */}
      <div className="fhh-header" style={{ maxWidth: 1400, margin: '0 auto 20px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => navigate(window.location.pathname.includes('/teacher') ? '/teacher' : '/admin')} style={{
            width: 40, height: 40, borderRadius: 10, border: 'none', background: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', transition: 'all .15s',
          }} onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
            <ChevronLeft size={20} color="#0C2A47" />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#030B15' }}>Flex Hours History</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>{filteredStudents.length} students • Track exactly when flexi hours were consumed</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, background: '#fff', borderRadius: 10, padding: 4, border: '1px solid #E2E8F0' }}>
            <button onClick={() => setViewMode('table')} style={viewToggleStyle(viewMode === 'table')}><List size={15} /> Table</button>
            <button onClick={() => setViewMode('timeline')} style={viewToggleStyle(viewMode === 'timeline')}><Grid size={15} /> Cards</button>
          </div>
          <button onClick={handleExport} style={{
            padding: '11px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#10B981,#059669)',
            color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 12px rgba(16,185,129,0.3)', transition: 'all .15s',
          }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Overview */}
      <div className="fhh-overview" style={{ maxWidth: 1400, margin: '0 auto 20px' }}>
        <OverviewCard icon={User} label="Students Shown" value={overview.total} color="blue" />
        <OverviewCard icon={AlertTriangle} label="Low Balance (<6h)" value={overview.low} color="red" />
        <OverviewCard icon={Zap} label="Extra Stay Cases" value={overview.overstay} color="orange" />
        <OverviewCard icon={Clock} label="Avg Remaining" value={`${overview.avgRemaining.toFixed(1)}h`} color="teal" />
      </div>

      {/* Filters */}
      <div style={{ maxWidth: 1400, margin: '0 auto 20px', background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or admission no..."
              style={{ width: '100%', padding: '10px 12px 10px 40px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 14, fontWeight: 500, outline: 'none' }} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
            <option value="all">All Students</option>
            <option value="low">Low Balance (&lt;6h)</option>
            <option value="zero">Zero Remaining</option>
            <option value="overstay">Has Extra Stay</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Calendar size={15} color="#64748B" />
          {[
            ['all', 'All Time'], ['month', 'This Month'], ['lastMonth', 'Last Month'], ['30days', 'Last 30 Days'], ['3months', 'Last 3 Months'],
          ].map(([key, label]) => (
            <button key={key} onClick={() => applyPreset(key)} style={{
              padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
              background: preset === key ? '#0C2A47' : '#F1F5F9', color: preset === key ? '#fff' : '#475569', transition: 'all .15s',
            }}>{label}</button>
          ))}
          <span style={{ color: '#CBD5E1' }}>|</span>
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPreset('custom'); }} style={dateInputStyle} />
          <span style={{ color: '#94A3B8', fontWeight: 600, fontSize: 12 }}>to</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPreset('custom'); }} style={dateInputStyle} />
          {dateLoading && <Loader2 size={15} color="#0C2A47" style={{ animation: 'spin 1s linear infinite' }} />}
          <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 'auto' }}>
            {!dateFrom || !dateTo
              ? 'Showing all students'
              : dateLoading
                ? 'Filtering by date range…'
                : `Showing students with flexi activity ${dateFrom} → ${dateTo}`}
          </span>
        </div>
      </div>

      {/* Student List/Table */}
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {filteredStudents.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 14, padding: '60px 20px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
            <AlertCircle size={40} color="#CBD5E1" style={{ margin: '0 auto 12px' }} />
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#64748B' }}>No students found matching your criteria</p>
          </div>
        ) : viewMode === 'table' ? (
          <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
            <div className="fhh-row fhh-row-header" style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', fontWeight: 700, fontSize: 11, color: '#64748B', textTransform: 'uppercase' }}>
              <div>Student</div><div>Enrollment</div><div>Paid</div><div>Free</div><div>Consumed</div><div>Remaining</div><div>Extra Stay</div><div style={{ textAlign: 'center' }}>Details</div>
            </div>

            {filteredStudents.map((student) => (
              <div key={student.id}>
                {/* Desktop row */}
                <div className="fhh-row" style={{ borderBottom: '1px solid #F1F5F9', transition: 'background .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAFAFC'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={student.fullName} size={36} />
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#030B15' }}>{student.fullName}</span>
                  </div>
                  <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#64748B' }}>{student.admissionNo}</div>
                  <div style={pillStyle(C.amber)}>{student.summary.totalPaid.toFixed(2)}</div>
                  <div style={pillStyle(C.green)}>{student.summary.totalFree.toFixed(2)}</div>
                  <div style={pillStyle(C.orange)}>{student.summary.totalConsumed.toFixed(2)}</div>
                  <div style={pillStyle(student.summary.isLow ? C.red : C.teal)}>
                    {student.summary.totalLeft.toFixed(2)}
                    {student.summary.overstayHours > 0 && <span style={{ fontSize: 10, display: 'block' }}>+{student.summary.overstayHours.toFixed(1)}</span>}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
                    {student.summary.overstayHours > 0 ? (
                      <span style={{ background: C.orange.bg, color: C.orange.text, padding: '4px 8px', borderRadius: 6 }}>{student.summary.overstayHours.toFixed(1)}</span>
                    ) : <span style={{ color: '#CBD5E1' }}>—</span>}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <button onClick={() => navigate(window.location.pathname.includes('/teacher') ? `/teacher/flex-report/${student.id}` : `/admin/flex-report/${student.id}`)} style={detailBtnStyle}>
                      <Clock size={14} /> View History
                    </button>
                  </div>
                </div>

                {/* Mobile card */}
                <div className="fhh-mobile-card" style={{ flexDirection: 'column', gap: 10, padding: 14, borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={student.fullName} size={38} />
                      <div>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: '#030B15' }}>{student.fullName}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748B', fontFamily: 'monospace' }}>{student.admissionNo}</p>
                      </div>
                    </div>
                    <button onClick={() => navigate(window.location.pathname.includes('/teacher') ? `/teacher/flex-report/${student.id}` : `/admin/flex-report/${student.id}`)} style={detailBtnStyle}><Clock size={14} /> History</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                    <div style={pillStyle(C.amber)}>P {student.summary.totalPaid.toFixed(1)}</div>
                    <div style={pillStyle(C.green)}>F {student.summary.totalFree.toFixed(1)}</div>
                    <div style={pillStyle(C.orange)}>U {student.summary.totalConsumed.toFixed(1)}</div>
                    <div style={pillStyle(student.summary.isLow ? C.red : C.teal)}>L {student.summary.totalLeft.toFixed(1)}</div>
                  </div>
                  {student.summary.overstayHours > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.orange.text, background: C.orange.bg, padding: '4px 10px', borderRadius: 8, alignSelf: 'flex-start' }}>
                      Extra stay: {student.summary.overstayHours.toFixed(1)}h
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Card / timeline view
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filteredStudents.map((s) => (
              <div key={s.id} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: 14, background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={s.fullName} size={38} />
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#030B15' }}>{s.fullName}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748B' }}>{s.admissionNo}</p>
                    </div>
                  </div>
                  <button onClick={() => navigate(window.location.pathname.includes('/teacher') ? `/teacher/flex-report/${s.id}` : `/admin/flex-report/${s.id}`)} style={detailBtnStyle}><Clock size={14} /> Details</button>
                </div>
                <div style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  <MiniBlock label="Paid" value={s.summary.totalPaid} color="amber" />
                  <MiniBlock label="Free" value={s.summary.totalFree} color="green" />
                  <MiniBlock label="Used" value={s.summary.totalConsumed} color="orange" />
                  <MiniBlock label={s.summary.hasAnyFlexi ? 'Left' : 'Extra'} value={s.summary.hasAnyFlexi ? s.summary.totalLeft : s.summary.overstayHours} color={s.summary.hasAnyFlexi ? (s.summary.totalLeft < 6 ? 'red' : 'teal') : 'orange'} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const viewToggleStyle = (active) => ({
  padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
  background: active ? '#3B82F6' : '#fff', color: active ? '#fff' : '#64748B', fontWeight: 600,
  transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
});

const selectStyle = { padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 13, fontWeight: 600, color: '#374151', background: '#fff', cursor: 'pointer' };
const dateInputStyle = { padding: '8px 10px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 13 };
const detailBtnStyle = {
  padding: '8px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', background: '#fff', color: '#3B82F6',
  fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
};
const pillStyle = (c) => ({ fontSize: 13, fontWeight: 700, color: c.text, background: c.bg, padding: '4px 8px', borderRadius: 6, textAlign: 'center' });

const MiniBlock = ({ label, value, color }) => (
  <div style={{ textAlign: 'center', padding: '10px', background: C[color].bg, borderRadius: 8 }}>
    <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: C[color].text, textTransform: 'uppercase' }}>{label}</p>
    <p style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 800, color: C[color].text }}>{value.toFixed(1)}</p>
  </div>
);

export default FlexiHoursHistoryPage;

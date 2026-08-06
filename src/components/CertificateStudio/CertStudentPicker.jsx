// src/components/CertificateStudio/CertStudentPicker.jsx
import { useState, useMemo } from 'react';
import { Search, User } from 'lucide-react';

export default function CertStudentPicker({ students = [], selectedId, onSelect, loading }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return students;
    const q = query.trim().toLowerCase();
    return students.filter((s) => (s.name || '').toLowerCase().includes(q));
  }, [students, query]);

  return (
    <div className="space-y-2.5">
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a92a8]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search student…"
          className="w-full pl-8 pr-3 py-2 text-xs border border-[#EDE8DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/30 focus:border-[#C9A24B] bg-white"
        />
      </div>

      {loading ? (
        <p className="text-xs text-[#9a92a8] py-2">Loading students…</p>
      ) : students.length === 0 ? (
        <p className="text-xs text-[#9a92a8] py-2">No students found.</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-[#9a92a8] py-2">No student matches "{query}".</p>
      ) : (
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {filtered.map((s) => {
            const active = String(selectedId) === String(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelect(s.id)}
                className={`w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-xl border text-sm transition-all
                  ${active
                    ? 'border-[#C9A24B] bg-[#FBF3DF] ring-1 ring-[#C9A24B]/40'
                    : 'border-[#EDE8DC] hover:border-[#C9A24B]/50 hover:bg-[#FBF3DF]/40'}`}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-[#EDE8DC] shrink-0 flex items-center justify-center">
                  {s.photo ? (
                    <img src={s.photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={14} className="text-[#8a8296]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[#2B2440] truncate">{s.name}</div>
                  <div className="text-[11px] text-[#9a92a8] truncate">{s.className || ''}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// src/components/BirthdayPosterStudio/components/Panel/StudentPicker.jsx
import { useState, useMemo } from 'react';
import { Search, Cake } from 'lucide-react';

export default function StudentPicker({ birthdays, selectedPersonId, onSelect }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return birthdays;
    const q = query.trim().toLowerCase();
    return birthdays.filter((p) => (p.name || '').toLowerCase().includes(q));
  }, [birthdays, query]);

  return (
    <div className="space-y-2.5">
      {birthdays.length > 5 && (
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a92a8]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search student…"
            className="w-full pl-8 pr-3 py-2 text-xs border border-[#EDE8DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/30 focus:border-[#C9A24B] bg-white"
          />
        </div>
      )}

      {birthdays.length === 0 ? (
        <p className="text-xs text-[#9a92a8] py-2">No upcoming birthdays loaded.</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-[#9a92a8] py-2">No student matches “{query}”.</p>
      ) : (
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
          {filtered.map((p) => {
            const active = String(selectedPersonId) === String(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelect(p.id)}
                className={`w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-xl border text-sm transition-all
                  ${active
                    ? 'border-[#C9A24B] bg-[#FBF3DF] ring-1 ring-[#C9A24B]/40'
                    : 'border-[#EDE8DC] hover:border-[#C9A24B]/50 hover:bg-[#FBF3DF]/40'}`}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-[#EDE8DC] shrink-0 flex items-center justify-center">
                  {(() => {
                    const photoUrl = p.photo || p.photoUrl || p.profileImage || p.profilePic || p.avatar;
                    return photoUrl ? (
                      <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-[#8a8296]">
                        {(p.name || '?').trim().slice(0, 1).toUpperCase()}
                      </span>
                    );
                  })()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[#2B2440] truncate">{p.name}</div>
                  <div className="text-[11px] text-[#9a92a8] flex items-center gap-1">
                    <Cake size={10} />
                    {p.daysRemaining === 0 ? 'Today 🎂' : `In ${p.daysRemaining} day${p.daysRemaining > 1 ? 's' : ''}`}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// src/components/BirthdayPosterStudio/components/Panel/Section.jsx
//
// Small collapsible section wrapper so the panel stays uncluttered — only
// one or two sections need to be open at a time to get the job done.
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Section({ icon: Icon, title, subtitle, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[#EDE8DC] rounded-2xl bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left"
      >
        {Icon && (
          <div className="w-7 h-7 rounded-lg bg-[#F4F1EA] flex items-center justify-center shrink-0">
            <Icon size={14} className="text-[#C9A24B]" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-[#2B2440] leading-tight">{title}</div>
          {subtitle && <div className="text-[11px] text-[#9a92a8] truncate leading-tight mt-0.5">{subtitle}</div>}
        </div>
        <ChevronDown size={16} className={`text-[#9a92a8] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4 pt-0.5">{children}</div>}
    </div>
  );
}

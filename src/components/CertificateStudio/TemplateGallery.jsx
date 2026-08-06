// src/components/CertificateStudio/TemplateGallery.jsx
import { ACHIEVEMENT_TEMPLATES } from './templates';

export default function TemplateGallery({ selectedId, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {ACHIEVEMENT_TEMPLATES.map((t) => {
        const active = t.id === selectedId;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className={`relative rounded-xl overflow-hidden border-2 transition-all text-left
              ${active ? 'border-[#C9A24B] ring-2 ring-[#C9A24B]/30' : 'border-[#EDE8DC] hover:border-[#C9A24B]/50'}`}
          >
            <div
              className="h-16 w-full"
              style={{ background: `linear-gradient(120deg, ${t.bandFrom}, ${t.bandTo})` }}
            />
            <div
              className="px-2 py-1.5 text-[11px] font-semibold truncate"
              style={{ color: t.accentDark, background: t.bg }}
            >
              {t.name}
            </div>
          </button>
        );
      })}
    </div>
  );
}

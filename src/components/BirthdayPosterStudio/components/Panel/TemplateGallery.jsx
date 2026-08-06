// src/components/BirthdayPosterStudio/components/Panel/TemplateGallery.jsx
//
// The template picker: a clean, attractive grid of fixed designs. Selecting
// one only swaps the design — name and photo the user already set are kept.
import { Check } from 'lucide-react';
import TemplateThumb from './TemplateThumb';

export default function TemplateGallery({ templates, activeId, onSelect, name, photoSrc }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {templates.map((t) => {
        const active = t.id === activeId;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className={`relative group rounded-xl p-1.5 border-2 transition-all text-left
              ${active
                ? 'border-[#C9A24B] bg-[#FBF3DF] shadow-sm'
                : 'border-transparent bg-[#F4F1EA] hover:border-[#C9A24B]/40'}`}
          >
            <div className="rounded-lg overflow-hidden ring-1 ring-black/5">
              <TemplateThumb template={t} name={name} photoSrc={photoSrc} />
            </div>
            <div className="mt-1.5 px-0.5 flex items-center justify-between gap-1">
              <span className="text-[11px] font-semibold text-[#2B2440] truncate">{t.name}</span>
              {active && (
                <span className="w-4 h-4 rounded-full bg-[#C9A24B] flex items-center justify-center shrink-0">
                  <Check size={11} className="text-white" strokeWidth={3} />
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

import { LoaderCircle } from 'lucide-react';

const VARIANT_STYLES = {
  emerald: 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  rose: 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
  sky: 'border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100',
  slate: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  default: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
};

export default function PhotoActions({ actions = [] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={action.onClick}
          disabled={action.disabled || action.loading}
          className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${action.className || VARIANT_STYLES[action.variant] || VARIANT_STYLES.default} disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {action.loading ? <LoaderCircle size={14} className="animate-spin" /> : action.icon ? <action.icon size={14} /> : null}
          {action.label}
        </button>
      ))}
    </div>
  );
}

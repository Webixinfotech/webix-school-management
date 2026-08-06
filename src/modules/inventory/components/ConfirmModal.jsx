import { AlertTriangle, LoaderCircle, X } from 'lucide-react';

const COLOR_MAP = {
  emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  rose: 'bg-rose-600 hover:bg-rose-700 text-white',
  sky: 'bg-sky-600 hover:bg-sky-700 text-white',
  slate: 'bg-slate-900 hover:bg-slate-800 text-white',
  amber: 'bg-amber-600 hover:bg-amber-700 text-white',
};

export default function ConfirmModal({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', confirmColor = 'slate', onConfirm, onCancel, loading }) {
  // Guard: don't render if no title or message
  if (!title && !message) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <AlertTriangle size={22} />
          </div>
          <button type="button" onClick={onCancel} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>
        {title && <h3 className="mt-4 text-xl font-semibold text-slate-900">{title}</h3>}
        {message && <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>}
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-70 ${COLOR_MAP[confirmColor] || COLOR_MAP.slate}`}>
            {loading ? <span className="inline-flex items-center gap-2"><LoaderCircle size={16} className="animate-spin" /> Working</span> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

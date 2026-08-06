import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * ConfirmDialog — small reusable confirm modal.
 * Usage: <ConfirmDialog open={...} title="..." message="..." confirmLabel="Cancel Enrollment"
 *          danger onConfirm={...} onClose={...} loading={busy} />
 */
export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Go back',
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm animate-[feeFadeIn_.15s_ease-out]"
      onClick={(e) => e.target === e.currentTarget && !loading && onClose?.()}
    >
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl animate-[feePopIn_.18s_ease-out]">
        <div className="flex flex-col items-center gap-3 px-6 pb-2 pt-8 text-center">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${danger ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
            <AlertTriangle size={26} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="text-sm leading-relaxed text-slate-500">{message}</p>
        </div>
        <div className="flex gap-3 p-5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60 ${
              danger ? 'bg-rose-600 shadow-rose-500/20 hover:bg-rose-700' : 'bg-amber-500 shadow-amber-500/20 hover:bg-amber-600'
            }`}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes feeFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes feePopIn { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}

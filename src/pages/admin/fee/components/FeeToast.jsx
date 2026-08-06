import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

/**
 * FeeToast — self-contained toast notification (no external dependency).
 * Usage: <FeeToast toast={toast} onClose={() => setToast(null)} />
 * toast shape: { type: 'success' | 'error' | 'warning', title?: string, message: string }
 */
const STYLES = {
  success: {
    wrap: 'from-emerald-50 to-emerald-100/95 border-emerald-200',
    icon: 'bg-emerald-500',
    title: 'text-emerald-900',
    body: 'text-emerald-700',
    bar: 'bg-emerald-500',
    barTrack: 'bg-emerald-200',
    Icon: CheckCircle2,
    defaultTitle: 'Success',
  },
  error: {
    wrap: 'from-rose-50 to-rose-100/95 border-rose-200',
    icon: 'bg-rose-500',
    title: 'text-rose-900',
    body: 'text-rose-700',
    bar: 'bg-rose-500',
    barTrack: 'bg-rose-200',
    Icon: XCircle,
    defaultTitle: 'Something went wrong',
  },
  warning: {
    wrap: 'from-amber-50 to-amber-100/95 border-amber-200',
    icon: 'bg-amber-500',
    title: 'text-amber-900',
    body: 'text-amber-700',
    bar: 'bg-amber-500',
    barTrack: 'bg-amber-200',
    Icon: AlertTriangle,
    defaultTitle: 'Heads up',
  },
};

export default function FeeToast({ toast, onClose, duration = 4500 }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [toast, onClose, duration]);

  if (!toast) return null;
  const s = STYLES[toast.type] || STYLES.success;
  const { Icon } = s;

  return (
    <div className="fixed right-4 top-4 z-[9999] w-[calc(100%-2rem)] max-w-sm sm:right-6 sm:top-6">
      <div className={`overflow-hidden rounded-2xl border bg-gradient-to-br shadow-2xl backdrop-blur-xl animate-[feeToastIn_.25s_ease-out] ${s.wrap}`}>
        <div className="flex items-start gap-3 p-4">
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white shadow-md ${s.icon}`}>
            <Icon size={20} />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className={`text-sm font-bold ${s.title}`}>{toast.title || s.defaultTitle}</p>
            <p className={`mt-0.5 text-sm leading-relaxed ${s.body}`}>{toast.message}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-black/5 hover:text-slate-700"
            aria-label="Close"
          >
            <XCircle size={16} />
          </button>
        </div>
        <div className={`h-1 ${s.barTrack}`}>
          <div
            key={toast.message + (toast.__t || '')}
            className={`h-full ${s.bar}`}
            style={{ animation: `feeToastShrink ${duration}ms linear forwards` }}
          />
        </div>
      </div>
      <style>{`
        @keyframes feeToastIn { from { opacity: 0; transform: translateY(-8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes feeToastShrink { from { width: 100%; } to { width: 0%; } }
      `}</style>
    </div>
  );
}

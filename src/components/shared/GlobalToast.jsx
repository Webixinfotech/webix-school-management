import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { TOAST_EVENT_NAME } from '../../utils/toastBus';

let idCounter = 0;

// App-wide toast renderer, mounted once near the root. Listens for
// events emitted via src/utils/toastBus.js (used by code that has no
// local toast UI of its own, e.g. context providers, axios interceptors).
export default function GlobalToast() {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, type: 'error', ...e.detail }]);
      window.setTimeout(() => remove(id), 5000);
    };
    window.addEventListener(TOAST_EVENT_NAME, handler);
    return () => window.removeEventListener(TOAST_EVENT_NAME, handler);
  }, [remove]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-5 top-5 z-[9999] flex w-full max-w-md flex-col gap-2">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        return (
          <div
            key={toast.id}
            className={`animate-slide-in-right overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl ${
              isSuccess
                ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/95 border-emerald-200'
                : 'bg-gradient-to-br from-rose-50 to-rose-100/95 border-rose-200'
            }`}
          >
            <div className="flex items-start gap-3 p-4">
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl shadow-md ${
                  isSuccess ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                }`}
              >
                {isSuccess ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-bold ${isSuccess ? 'text-emerald-900' : 'text-rose-900'}`}>
                  {toast.title || (isSuccess ? 'Success' : 'Error')}
                </p>
                <p className={`mt-0.5 text-sm leading-relaxed ${isSuccess ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(toast.id)}
                className={`flex-shrink-0 rounded-lg p-1.5 transition-colors ${
                  isSuccess
                    ? 'text-emerald-400 hover:bg-emerald-200 hover:text-emerald-600'
                    : 'text-rose-400 hover:bg-rose-200 hover:text-rose-600'
                }`}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        );
      })}
      <style>{`
        @keyframes slide-in-right { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
      `}</style>
    </div>
  );
}

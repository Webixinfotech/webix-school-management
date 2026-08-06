import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export function useToast() {
  const [toast, setToast] = useState(null);
  const showToast = (type, message, title) => setToast({ type, message, title });
  const hideToast = () => setToast(null);
  return { toast, showToast, hideToast, setToast };
}

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(onClose, 5000);
    return () => window.clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div className="fixed right-5 top-5 z-[9999] w-full max-w-md animate-slide-in-right">
      <div className={`rounded-2xl border shadow-2xl backdrop-blur-xl overflow-hidden ${
        isSuccess 
          ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/95 border-emerald-200' 
          : 'bg-gradient-to-br from-rose-50 to-rose-100/95 border-rose-200'
      }`}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl shadow-md ${
              isSuccess ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
            }`}>
              {isSuccess ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-base font-bold ${isSuccess ? 'text-emerald-900' : 'text-rose-900'}`}>
                {toast.title || (isSuccess ? 'Success' : 'Error')}
              </p>
              <p className={`mt-1 text-sm leading-relaxed ${isSuccess ? 'text-emerald-700' : 'text-rose-700'}`}>
                {toast.message}
              </p>
            </div>
            <button 
              type="button" 
              onClick={onClose} 
              className={`flex-shrink-0 rounded-lg p-2 transition-colors ${
                isSuccess 
                  ? 'text-emerald-400 hover:bg-emerald-200 hover:text-emerald-600' 
                  : 'text-rose-400 hover:bg-rose-200 hover:text-rose-600'
              }`}
            >
              <X size={18} />
            </button>
          </div>
        </div>
        {/* Progress bar showing auto-close */}
        <div className={`h-1 ${isSuccess ? 'bg-emerald-200' : 'bg-rose-200'}`}>
          <div 
            className={`h-full ${isSuccess ? 'bg-emerald-500' : 'bg-rose-500'}`}
            style={{
              animation: 'shrink 5s linear forwards'
            }}
          />
        </div>
      </div>
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}

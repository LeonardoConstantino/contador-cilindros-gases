import React from 'react';
import { ToastMessage } from '../types/gas';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 z-50 flex flex-col gap-2 w-[92vw] max-w-sm pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-xl border shadow-lg backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 duration-200 ${
            t.type === 'error'
              ? 'bg-rose-50/95 dark:bg-rose-950/95 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100'
              : t.type === 'info'
              ? 'bg-sky-50/95 dark:bg-sky-950/95 border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-100'
              : 'bg-emerald-50/95 dark:bg-emerald-950/95 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {t.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            ) : t.type === 'info' ? (
              <Info className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
          <p className="text-xs sm:text-sm font-medium flex-1 leading-snug">
            {t.text}
          </p>
          <button
            onClick={() => onDismiss(t.id)}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md shrink-0"
            aria-label="Fechar notificação"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

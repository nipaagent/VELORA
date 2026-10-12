import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

export function triggerToast(message: string, type: ToastType = 'success') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('nipa-toast', {
        detail: { message, type }
      })
    );
  }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type?: ToastType }>;
      if (!customEvent.detail || !customEvent.detail.message) return;

      const newToast: ToastItem = {
        id: crypto.randomUUID(),
        message: customEvent.detail.message,
        type: customEvent.detail.type || 'success'
      };

      setToasts(prev => [newToast, ...prev].slice(0, 3)); // Max 3 stacked
    };

    window.addEventListener('nipa-toast', handleToastEvent);
    return () => window.removeEventListener('nipa-toast', handleToastEvent);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3 sm:px-0">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => {
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onAnimationComplete={() => {
                const timer = setTimeout(() => {
                  removeToast(toast.id);
                }, 3000);
                return () => clearTimeout(timer);
              }}
              onClick={() => removeToast(toast.id)}
              className="pointer-events-auto cursor-pointer bg-slate-900 border border-slate-800 text-white rounded-2xl p-3.5 shadow-xl flex items-center justify-between gap-3 group selection:bg-slate-800"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                  {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-white" />}
                  {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-slate-300" />}
                  {toast.type === 'info' && <Info className="w-4 h-4 text-slate-300" />}
                </div>
                <p className="text-xs font-semibold text-slate-100 leading-snug break-words">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeToast(toast.id);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
                aria-label="Close notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

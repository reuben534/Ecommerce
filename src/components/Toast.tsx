import React from 'react';
import { useStore } from '../context/StoreContext.tsx';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export default function Toast() {
  const { toasts, removeToast } = useStore();

  return (
    <div
      id="toast-container"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl text-sm font-medium border ${
              toast.type === 'error'
                ? 'bg-rose-950/95 text-rose-100 border-rose-800'
                : toast.type === 'info'
                ? 'bg-neutral-900/95 text-neutral-100 border-neutral-700'
                : 'bg-emerald-950/95 text-emerald-100 border-emerald-800'
            } backdrop-blur-md`}
          >
            {toast.type === 'error' && (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            {toast.type === 'info' && (
              <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            )}
            {toast.type === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 leading-snug">{toast.message}</div>
            <button
              id={`dismiss-toast-${toast.id}`}
              onClick={() => removeToast(toast.id)}
              className="text-neutral-400 hover:text-white transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

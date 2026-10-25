import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts, onDismiss }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isError = toast.type === 'error';
          const isSuccess = toast.type === 'success';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md text-sm ${
                isError
                  ? 'bg-rose-950/80 border-rose-500/40 text-rose-100'
                  : isSuccess
                  ? 'bg-emerald-950/80 border-[#42DDB2]/50 text-emerald-100'
                  : 'bg-[#122337]/90 border-slate-700 text-slate-200'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isError ? (
                  <AlertCircle size={18} className="text-rose-400" />
                ) : isSuccess ? (
                  <CheckCircle2 size={18} className="text-[#42DDB2]" />
                ) : (
                  <Info size={18} className="text-[#78A8FF]" />
                )}
              </div>
              <div className="flex-1">
                {toast.title && <div className="font-semibold text-white mb-0.5">{toast.title}</div>}
                <div>{toast.message}</div>
              </div>
              <button
                onClick={() => onDismiss(toast.id)}
                className="text-slate-400 hover:text-white transition-colors p-0.5"
                aria-label="Close notification"
              >
                <X size={16} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

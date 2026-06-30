import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const value = useMemo(() => ({ toast, removeToast }), [toast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Floating Toast Area */}
      <div id="toast-root" className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-md w-full sm:w-auto">
        <AnimatePresence>
          {toasts.map((t) => {
            let Icon = Info;
            let bgColor = 'bg-white border-zinc-200 text-zinc-800';
            let iconColor = 'text-zinc-500';

            switch (t.type) {
              case 'success':
                Icon = CheckCircle2;
                bgColor = 'bg-emerald-50 border-emerald-200 text-emerald-900';
                iconColor = 'text-emerald-500';
                break;
              case 'error':
                Icon = XCircle;
                bgColor = 'bg-rose-50 border-rose-200 text-rose-900';
                iconColor = 'text-rose-500';
                break;
              case 'warning':
                Icon = AlertTriangle;
                bgColor = 'bg-amber-50 border-amber-200 text-amber-900';
                iconColor = 'text-amber-500';
                break;
              case 'info':
                Icon = Info;
                bgColor = 'bg-blue-50 border-blue-200 text-blue-900';
                iconColor = 'text-blue-500';
                break;
            }

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg ${bgColor} backdrop-blur-md`}
              >
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
                <div className="text-sm font-medium pr-6 flex-1">{t.message}</div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="text-zinc-400 hover:text-zinc-600 rounded-lg p-0.5 transition-colors absolute top-3 right-3"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

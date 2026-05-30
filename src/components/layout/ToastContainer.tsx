import React, { useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Toast, ToastType } from '../../types';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const TOAST_DURATION_MS = 4000;

const TOAST_STYLE: Record<ToastType, { border: string; icon: React.ReactNode; accent: string }> = {
  success: {
    border: 'border-brand-success/40',
    accent: 'text-brand-success',
    icon: <CheckCircle2 className="w-5 h-5 text-brand-success shrink-0" />,
  },
  error: {
    border: 'border-brand-danger/40',
    accent: 'text-brand-danger',
    icon: <XCircle className="w-5 h-5 text-brand-danger shrink-0" />,
  },
  warning: {
    border: 'border-brand-warning/40',
    accent: 'text-brand-warning',
    icon: <AlertTriangle className="w-5 h-5 text-brand-warning shrink-0" />,
  },
  info: {
    border: 'border-brand-cyan/40',
    accent: 'text-brand-cyan',
    icon: <Info className="w-5 h-5 text-brand-cyan shrink-0" />,
  },
};

const ToastCard: React.FC<{ toast: Toast }> = ({ toast }) => {
  const removeToast = useGameStore((state) => state.removeToast);
  const style = TOAST_STYLE[toast.type];

  useEffect(() => {
    const timer = window.setTimeout(() => removeToast(toast.id), TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [toast.id, removeToast]);

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 w-80 bg-brand-card border ${style.border} rounded-xl px-4 py-3 shadow-2xl`}
    >
      {style.icon}
      <p className="flex-1 text-xs font-bold text-slate-100 leading-snug">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className={`shrink-0 ${style.accent} hover:opacity-70 transition-opacity`}
        aria-label="Fechar notificação"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const toasts = useGameStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2.5 pointer-events-none">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

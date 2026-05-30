import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  readonly open: boolean;
  readonly title: string;
  readonly message: string;
  readonly confirmLabel?: string;
  readonly danger?: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  danger = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          {/* OVERLAY ESCURO */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* CARD CENTRAL */}
          <motion.div
            className="relative w-full max-w-sm bg-brand-card border border-brand-border rounded-2xl p-5 shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-start gap-3 mb-4">
              <span
                className={`shrink-0 flex items-center justify-center w-9 h-9 rounded-xl border ${
                  danger
                    ? 'bg-brand-danger/10 border-brand-danger/30 text-brand-danger'
                    : 'bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan glow-cyan'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-black text-white uppercase tracking-tight">{title}</h3>
                <p className="text-xs text-slate-400 font-semibold mt-1 leading-snug">{message}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={onCancel}
                className="py-2.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider bg-zinc-900 text-slate-300 border border-brand-border hover:border-brand-cyan/40 hover:text-brand-cyan transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`py-2.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider transition-colors ${
                  danger
                    ? 'bg-brand-danger/15 text-brand-danger border border-brand-danger/40 hover:bg-brand-danger/25'
                    : 'bg-brand-cyan text-zinc-950 hover:bg-brand-cyan/80'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

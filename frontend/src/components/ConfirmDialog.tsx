import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Onayla',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="animate-fade-in-up fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-surface-dark-2"
        onClick={(e) => e.stopPropagation()}
      >
        {danger && (
          <div className="mb-4 grid h-11 w-11 place-items-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
        )}
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-brand-ink/70 dark:text-slate-400">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl border border-brand-line px-4 py-2 text-sm font-medium transition hover:bg-brand-mist dark:border-line-dark dark:hover:bg-white/5"
          >
            Vazgeç
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5 ${
              danger
                ? 'bg-red-600 shadow-lg shadow-red-600/25 hover:bg-red-700'
                : 'bg-brand-gradient shadow-lg shadow-brand-teal/25'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

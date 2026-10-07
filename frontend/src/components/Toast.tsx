import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  tone?: 'success' | 'error';
  onClose: () => void;
}

export default function Toast({ message, tone = 'success', onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const Icon = tone === 'success' ? CheckCircle2 : AlertCircle;
  const toneClasses =
    tone === 'success'
      ? 'border-brand-teal/40 bg-brand-teal text-white'
      : 'border-red-400/40 bg-red-600 text-white';

  return (
    <div
      role="status"
      className={`animate-fade-in-up fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl backdrop-blur ${toneClasses}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{message}</span>
      <button
        onClick={onClose}
        aria-label="Kapat"
        className="rounded-md p-1 opacity-70 transition hover:bg-white/15 hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

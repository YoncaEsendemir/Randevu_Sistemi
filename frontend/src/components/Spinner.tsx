interface SpinnerProps {
  className?: string;
}

export default function Spinner({ className = 'h-5 w-5' }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Yükleniyor"
      className={`animate-spin rounded-full border-2 border-brand-teal/25 border-t-brand-teal dark:border-brand-teal/20 dark:border-t-brand-teal ${className}`}
    />
  );
}

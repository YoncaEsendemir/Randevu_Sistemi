import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number; // 1-based
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

// İstemci taraflı basit sayfalama. Sunucu sayfalaması eklendiğinde
// aynı arayüzü koruyup, sayfa parametresini API'ye vermek yeterli olur.
// Görüntülenecek sayfa numaraları için "1 … 4 5 6 … 12" gibi kısaltılmış bir liste üretir.
function pageWindow(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set<number>([1, total, current, current - 1, current + 1]);
  const pages = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  for (let i = 0; i < pages.length; i++) {
    out.push(pages[i]);
    if (i < pages.length - 1 && pages[i + 1] - pages[i] > 1) out.push('…');
  }
  return out;
}

export default function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const pages = pageWindow(page, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-sm">
      <p className="text-xs text-brand-ink/50 dark:text-slate-500">
        <span className="font-medium text-brand-ink dark:text-slate-300">
          {from}–{to}
        </span>{' '}
        / {total}
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="grid h-8 w-8 place-items-center rounded-lg text-brand-ink/60 transition hover:bg-brand-mist disabled:opacity-40 dark:text-slate-400 dark:hover:bg-white/5"
          aria-label="Önceki sayfa"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e-${i}`} className="px-1.5 text-brand-ink/40 dark:text-slate-600">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={[
                'h-8 min-w-8 rounded-lg px-2 text-sm font-medium transition',
                p === page
                  ? 'bg-brand-gradient text-white shadow-lg shadow-brand-teal/25'
                  : 'text-brand-ink/70 hover:bg-brand-mist dark:text-slate-300 dark:hover:bg-white/5',
              ].join(' ')}
            >
              {p}
            </button>
          ),
        )}

        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="grid h-8 w-8 place-items-center rounded-lg text-brand-ink/60 transition hover:bg-brand-mist disabled:opacity-40 dark:text-slate-400 dark:hover:bg-white/5"
          aria-label="Sonraki sayfa"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

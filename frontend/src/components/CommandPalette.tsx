import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Users,
  Scissors,
  CalendarClock,
  Moon,
  Sun,
  LogOut,
  ArrowRight,
  Command as CommandIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getCustomers } from '../api/customers';
import { getServices } from '../api/services';
import type { Customer, Service } from '../types';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

type Action = {
  id: string;
  label: string;
  hint?: string;
  icon: typeof Search;
  perform: () => void;
  group: 'Sayfalar' | 'Eylemler' | 'Müşteriler' | 'Hizmetler';
};

// Basit fuzzy: sorgudaki her karakteri, sırayla text içinde arıyoruz.
// Bulunursa true - Cmd+K palettelerinin klasik "eslflh" tarzı sırasız
// arama davranışı için yeterli.
function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLocaleLowerCase('tr');
  const t = text.toLocaleLowerCase('tr');
  if (!q) return true;
  if (t.includes(q)) return true;
  let ti = 0;
  for (const ch of q) {
    const found = t.indexOf(ch, ti);
    if (found === -1) return false;
    ti = found + 1;
  }
  return true;
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Açıldığında input'a odaklan + veriyi bir kez çek
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    inputRef.current?.focus();
    // Veri henüz yoksa çek (basit lazy cache)
    if (customers.length === 0 && services.length === 0) {
      Promise.all([getCustomers(), getServices()])
        .then(([c, s]) => {
          setCustomers(c);
          setServices(s);
        })
        .catch(() => {
          /* palette için hata sessiz - Ana sayfa zaten yükleyemezse gösterir */
        });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const actions: Action[] = useMemo(() => {
    const runAndClose = (fn: () => void) => () => {
      fn();
      onClose();
    };

    const staticActions: Action[] = [
      {
        id: 'nav-dashboard',
        label: 'Panele git',
        icon: LayoutDashboard,
        group: 'Sayfalar',
        perform: runAndClose(() => navigate('/')),
      },
      {
        id: 'nav-customers',
        label: 'Müşteriler',
        icon: Users,
        group: 'Sayfalar',
        perform: runAndClose(() => navigate('/musteriler')),
      },
      {
        id: 'nav-services',
        label: 'Hizmetler',
        icon: Scissors,
        group: 'Sayfalar',
        perform: runAndClose(() => navigate('/hizmetler')),
      },
      {
        id: 'nav-appointments',
        label: 'Randevular',
        icon: CalendarClock,
        group: 'Sayfalar',
        perform: runAndClose(() => navigate('/randevular')),
      },
      {
        id: 'action-new-appointment',
        label: 'Yeni randevu oluştur',
        hint: 'Randevular sayfasına gider',
        icon: CalendarClock,
        group: 'Eylemler',
        perform: runAndClose(() => navigate('/randevular')),
      },
      {
        id: 'action-theme',
        label: theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç',
        icon: theme === 'dark' ? Sun : Moon,
        group: 'Eylemler',
        perform: runAndClose(() => toggleTheme()),
      },
      {
        id: 'action-logout',
        label: 'Çıkış yap',
        icon: LogOut,
        group: 'Eylemler',
        perform: runAndClose(() => logout()),
      },
    ];

    const customerActions: Action[] = customers.map((c) => ({
      id: `customer-${c.id}`,
      label: c.name,
      hint: c.phone,
      icon: Users,
      group: 'Müşteriler',
      perform: runAndClose(() => navigate('/musteriler')),
    }));

    const serviceActions: Action[] = services.map((s) => ({
      id: `service-${s.id}`,
      label: s.name,
      hint: `${s.duration_minutes} dk · ${s.price} ₺`,
      icon: Scissors,
      group: 'Hizmetler',
      perform: runAndClose(() => navigate('/hizmetler')),
    }));

    return [...staticActions, ...customerActions, ...serviceActions];
  }, [customers, services, theme, navigate, toggleTheme, logout, onClose]);

  const filtered = useMemo(
    () => actions.filter((a) => fuzzyMatch(query, `${a.label} ${a.hint ?? ''}`)),
    [actions, query],
  );

  // Grupla - render sırasında başlıklarla ayıralım
  const grouped = useMemo(() => {
    const map = new Map<Action['group'], Action[]>();
    filtered.forEach((a) => {
      if (!map.has(a.group)) map.set(a.group, []);
      map.get(a.group)!.push(a);
    });
    return Array.from(map.entries());
  }, [filtered]);

  // Klavye navigasyonu
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        filtered[activeIndex]?.perform();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, filtered, activeIndex, onClose]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!open) return null;

  // Aktif öğenin gerçek index'ini gruplu render'da bulmak için düz sıralı bir sayaç kullanıyoruz.
  let flatIndex = -1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[10vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-in-up w-full max-w-xl overflow-hidden rounded-2xl border border-brand-line/60 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-line-dark dark:bg-surface-dark-2/95"
      >
        <div className="flex items-center gap-3 border-b border-brand-line/60 px-4 py-3 dark:border-line-dark">
          <Search className="h-4 w-4 text-brand-ink/40 dark:text-slate-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sayfa, eylem, müşteri veya hizmet ara..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-brand-ink/40 dark:placeholder:text-slate-500"
          />
          <kbd className="hidden items-center gap-1 rounded-md border border-brand-line bg-brand-mist px-1.5 py-0.5 text-[10px] font-medium text-brand-ink/60 sm:inline-flex dark:border-line-dark dark:bg-white/5 dark:text-slate-400">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-brand-ink/50 dark:text-slate-500">
              Sonuç bulunamadı.
            </div>
          ) : (
            grouped.map(([group, items]) => (
              <div key={group} className="mb-2 last:mb-0">
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-brand-ink/40 dark:text-slate-500">
                  {group}
                </p>
                <ul>
                  {items.map((a) => {
                    flatIndex += 1;
                    const isActive = flatIndex === activeIndex;
                    return (
                      <li key={a.id}>
                        <button
                          onMouseEnter={() => setActiveIndex(flatIndex)}
                          onClick={() => a.perform()}
                          className={[
                            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition',
                            isActive
                              ? 'bg-brand-teal/10 text-brand-teal dark:bg-brand-teal/15'
                              : 'text-brand-ink/80 hover:bg-brand-mist dark:text-slate-200 dark:hover:bg-white/5',
                          ].join(' ')}
                        >
                          <a.icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1 truncate font-medium">{a.label}</span>
                          {a.hint && (
                            <span className="truncate text-xs text-brand-ink/50 dark:text-slate-500">
                              {a.hint}
                            </span>
                          )}
                          <ArrowRight
                            className={[
                              'h-3.5 w-3.5 transition',
                              isActive ? 'translate-x-0.5 opacity-100' : 'opacity-0',
                            ].join(' ')}
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-brand-line/60 px-4 py-2 text-[11px] text-brand-ink/50 dark:border-line-dark dark:text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <CommandIcon className="h-3 w-3" />
            <span>+ K açar/kapatır</span>
          </span>
          <span>↑ ↓ gez · ↵ seç</span>
        </div>
      </div>
    </div>
  );
}

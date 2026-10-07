import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Scissors,
  CalendarClock,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Sparkles,
  Search,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import CommandPalette from '../CommandPalette';

const navItems = [
  { to: '/', label: 'Panel', icon: LayoutDashboard, end: true },
  { to: '/musteriler', label: 'Müşteriler', icon: Users },
  { to: '/hizmetler', label: 'Hizmetler', icon: Scissors },
  { to: '/randevular', label: 'Randevular', icon: CalendarClock },
  { to: '/ayarlar', label: 'Ayarlar', icon: Settings },
];

// Yan menüdeki her bir bağlantı - aktifken hafif bir yatay çubuk + gradient
// yakınlığı, hover'da yumuşak arka plan.
function navLinkClass({ isActive }: { isActive: boolean }) {
  return [
    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
    isActive
      ? 'bg-brand-teal/10 text-brand-teal dark:bg-brand-teal/15 dark:text-brand-teal'
      : 'text-brand-ink/70 hover:bg-brand-mist hover:text-brand-ink dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white',
  ].join(' ');
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Cmd/Ctrl + K global kısayolu ile command palette açılır/kapanır.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Kullanıcı ismini iki büyük harfe indirip avatar rozeti yapıyoruz.
  const initials = (user?.name ?? 'K')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen">
      {/* Mobil için üst çubuk - yalnızca lg altında görünür */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-brand-line/60 bg-white/70 px-4 py-3 backdrop-blur-md dark:border-line-dark dark:bg-surface-dark/70 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-gradient text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-display text-base font-semibold">Randevu</span>
        </div>
        <button
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Menüyü aç/kapat"
          className="rounded-lg p-2 text-brand-ink/70 hover:bg-brand-mist dark:text-slate-300 dark:hover:bg-white/5"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      <div className="lg:flex">
        {/* Yan menü (sidebar). lg altında overlay olarak açılıyor. */}
        <aside
          className={[
            'fixed inset-y-0 left-0 z-50 w-72 transform border-r border-brand-line/60 bg-white/85 p-5 backdrop-blur-xl transition-transform duration-300 dark:border-line-dark dark:bg-surface-dark-2/80',
            'lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:translate-x-0',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
        >
          <div className="flex h-full flex-col">
            {/* Logo bloğu */}
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-gradient text-white shadow-lg shadow-brand-teal/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-lg font-semibold leading-none">Randevu</p>
                <p className="mt-1 text-xs text-brand-ink/50 dark:text-slate-400">
                  yönetim paneli
                </p>
              </div>
            </div>

            {/* Arama tetikleyici - Cmd/Ctrl+K'yı görünür kılıyor */}
            <button
              onClick={() => setPaletteOpen(true)}
              className="mt-8 flex w-full items-center gap-2 rounded-xl border border-brand-line/70 bg-brand-mist/60 px-3 py-2 text-sm text-brand-ink/60 transition hover:border-brand-teal/40 hover:bg-brand-mist dark:border-line-dark dark:bg-white/[0.03] dark:text-slate-400 dark:hover:border-brand-teal/40 dark:hover:bg-white/[0.06]"
            >
              <Search className="h-4 w-4" />
              <span className="flex-1 text-left">Ara veya git...</span>
              <kbd className="rounded-md border border-brand-line bg-white px-1.5 py-0.5 text-[10px] font-medium dark:border-line-dark dark:bg-surface-dark-2">
                ⌘K
              </kbd>
            </button>

            {/* Menü öğeleri */}
            <nav className="mt-4 flex-1 space-y-1">
              {navItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMobileOpen(false)}
                  className={navLinkClass}
                >
                  {({ isActive }) => (
                    <>
                      {/* Aktif göstergesi: solda küçük dikey bar */}
                      <span
                        className={[
                          'absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full transition',
                          isActive ? 'bg-brand-gradient opacity-100' : 'opacity-0',
                        ].join(' ')}
                      />
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Alt kısım: kullanıcı kartı + tema + çıkış */}
            <div className="mt-6 space-y-3 border-t border-brand-line/60 pt-4 dark:border-line-dark">
              <div className="flex items-center gap-3 rounded-xl bg-brand-mist/60 p-2.5 dark:bg-white/5">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-gradient text-sm font-semibold text-white">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{user?.name}</p>
                  <p className="truncate text-xs text-brand-ink/50 dark:text-slate-400">
                    {user?.role === 'admin' ? 'Yönetici' : 'Çalışan'}
                  </p>
                </div>
              </div>

              <button
                onClick={toggleTheme}
                aria-label="Temayı değiştir"
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-brand-ink/70 transition hover:bg-brand-mist dark:text-slate-300 dark:hover:bg-white/5"
              >
                <span className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                  {theme === 'dark' ? 'Açık tema' : 'Koyu tema'}
                </span>
                <span
                  className={[
                    'relative h-5 w-9 rounded-full transition',
                    theme === 'dark' ? 'bg-brand-teal' : 'bg-brand-line',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all',
                      theme === 'dark' ? 'left-4' : 'left-0.5',
                    ].join(' ')}
                  />
                </span>
              </button>

              <button
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                Çıkış yap
              </button>
            </div>
          </div>
        </aside>

        {/* Mobilde sidebar açıkken arkadaki karartma */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          />
        )}

        {/* Ana içerik alanı */}
        <main
          key={location.pathname}
          className="animate-fade-in-up min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10 lg:px-10"
        >
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global command palette */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/layout/AuthLayout';

// Merkezî input sınıfı - hem ışık hem koyu temada tutarlı
const inputClasses =
  'w-full rounded-xl border border-brand-line bg-white pl-10 pr-3 py-2.5 text-brand-ink outline-none transition placeholder:text-brand-ink/40 focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/15 dark:border-line-dark dark:bg-surface-dark-2 dark:text-slate-100 dark:placeholder:text-slate-500';

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('E-posta veya şifre hatalı.');
    }
  }

  // Her alana sırayla gelen bir gecikme uyguluyoruz ki form yumuşakça açılsın.
  const stagger = (i: number) => ({ animationDelay: `${i * 70}ms` });

  return (
    <AuthLayout title="Tekrar hoş geldin" subtitle="Hesabına erişmek için bilgilerini gir.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="animate-slide-up-fade" style={stagger(0)}>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            E-posta
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/40 dark:text-slate-500" />
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClasses}
              placeholder="ornek@sirket.com"
            />
          </div>
        </div>

        <div className="animate-slide-up-fade" style={stagger(1)}>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
            Şifre
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/40 dark:text-slate-500" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClasses} pr-10`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-brand-ink/50 hover:bg-brand-mist dark:text-slate-400 dark:hover:bg-white/5"
              aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div
          className="animate-slide-up-fade flex items-center justify-between pt-1 text-sm"
          style={stagger(2)}
        >
          <label className="inline-flex cursor-pointer items-center gap-2 text-brand-ink/70 dark:text-slate-400">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-brand-line text-brand-teal accent-brand-teal focus:ring-brand-teal/40 dark:border-line-dark dark:bg-surface-dark-2"
            />
            Beni hatırla
          </label>
          <button
            type="button"
            className="font-medium text-brand-teal hover:underline"
            onClick={() =>
              setError(
                'Şifre sıfırlama şu an demo modunda. Sistem yöneticinizle iletişime geçin.'
              )
            }
          >
            Şifremi unuttum?
          </button>
        </div>

        {error && (
          <p
            className="animate-slide-up-fade flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="animate-slide-up-fade inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 font-medium text-white shadow-lg shadow-brand-teal/25 transition hover:-translate-y-0.5 hover:shadow-xl disabled:translate-y-0 disabled:opacity-60"
          style={stagger(3)}
        >
          {isLoading ? (
            'Giriş yapılıyor...'
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              Giriş yap
            </>
          )}
        </button>
      </form>

      <p
        className="animate-slide-up-fade mt-6 text-center text-sm text-brand-ink/60 dark:text-slate-400"
        style={stagger(4)}
      >
        Hesabın yok mu?{' '}
        <Link to="/kayit" className="font-medium text-brand-teal hover:underline">
          Kayıt ol
        </Link>
      </p>
    </AuthLayout>
  );
}

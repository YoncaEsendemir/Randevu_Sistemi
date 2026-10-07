import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, AlertCircle, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/layout/AuthLayout';

const inputClasses =
  'w-full rounded-xl border border-brand-line bg-white pl-10 pr-3 py-2.5 text-brand-ink outline-none transition placeholder:text-brand-ink/40 focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/15 dark:border-line-dark dark:bg-surface-dark-2 dark:text-slate-100 dark:placeholder:text-slate-500';

interface FormState {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone: string;
}

// Şifre gücü: harf, rakam, uzunluk, özel karakter kriterlerine göre 0-4 skor.
function scorePassword(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-zA-Z]/.test(pw) && /\d/.test(pw)) score++;
  if (pw.length >= 12) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const strengthMeta = [
  { label: 'Çok zayıf', color: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
  { label: 'Zayıf', color: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400' },
  { label: 'Orta', color: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  { label: 'İyi', color: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  { label: 'Güçlü', color: 'bg-brand-teal', text: 'text-brand-teal' },
];

export default function RegisterPage() {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pwScore = useMemo(() => scorePassword(form.password), [form.password]);
  const pwMeta = strengthMeta[pwScore];

  function updateField(field: keyof FormState) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!acceptTerms) {
      setError('Devam etmek için kullanım şartlarını kabul etmelisin.');
      return;
    }
    setError(null);
    try {
      await register(form);
      navigate('/');
    } catch {
      setError('Kayıt oluşturulamadı. Bilgileri kontrol edip tekrar deneyin.');
    }
  }

  const stagger = (i: number) => ({ animationDelay: `${i * 60}ms` });

  return (
    <AuthLayout title="Hesap oluştur" subtitle="İşletmen için birkaç bilgi yeterli.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="animate-slide-up-fade" style={stagger(0)}>
          <FieldWithIcon
            id="name"
            label="Ad Soyad / İşletme Adı"
            icon={User}
            type="text"
            required
            value={form.name}
            onChange={updateField('name')}
            placeholder="Örn. Ayşe Yılmaz"
          />
        </div>
        <div className="animate-slide-up-fade" style={stagger(1)}>
          <FieldWithIcon
            id="email"
            label="E-posta"
            icon={Mail}
            type="email"
            required
            value={form.email}
            onChange={updateField('email')}
            placeholder="ornek@sirket.com"
          />
        </div>
        <div className="animate-slide-up-fade" style={stagger(2)}>
          <FieldWithIcon
            id="phone"
            label="Telefon (opsiyonel)"
            icon={Phone}
            type="tel"
            value={form.phone}
            onChange={updateField('phone')}
            placeholder="+90..."
          />
        </div>

        <div className="animate-slide-up-fade" style={stagger(3)}>
          <FieldWithIcon
            id="password"
            label="Şifre"
            icon={Lock}
            type="password"
            required
            value={form.password}
            onChange={updateField('password')}
            placeholder="••••••••"
          />
          {/* Şifre gücü göstergesi - 4 segmentli renkli bar + anlık etiket */}
          <div className="mt-2 space-y-1.5">
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    form.password && i < pwScore
                      ? pwMeta.color
                      : 'bg-brand-line dark:bg-line-dark'
                  }`}
                />
              ))}
            </div>
            <p className="flex items-center justify-between text-xs">
              <span className="text-brand-ink/50 dark:text-slate-500">
                En az 8 karakter, harf ve rakam içermeli.
              </span>
              {form.password && (
                <span className={`font-medium ${pwMeta.text}`}>{pwMeta.label}</span>
              )}
            </p>
          </div>
        </div>

        <div className="animate-slide-up-fade" style={stagger(4)}>
          <FieldWithIcon
            id="password_confirmation"
            label="Şifre (tekrar)"
            icon={Lock}
            type="password"
            required
            value={form.password_confirmation}
            onChange={updateField('password_confirmation')}
            placeholder="••••••••"
          />
          {form.password_confirmation && form.password !== form.password_confirmation && (
            <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">Şifreler eşleşmiyor.</p>
          )}
        </div>

        <label
          className="animate-slide-up-fade flex cursor-pointer items-start gap-2.5 pt-1 text-sm text-brand-ink/70 dark:text-slate-400"
          style={stagger(5)}
        >
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-brand-line text-brand-teal accent-brand-teal focus:ring-brand-teal/40 dark:border-line-dark dark:bg-surface-dark-2"
          />
          <span>
            <Link to="#" className="font-medium text-brand-teal hover:underline">
              Kullanım şartlarını
            </Link>{' '}
            ve{' '}
            <Link to="#" className="font-medium text-brand-teal hover:underline">
              gizlilik politikasını
            </Link>{' '}
            okudum, kabul ediyorum.
          </span>
        </label>

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
          style={stagger(6)}
        >
          {isLoading ? (
            'Hesap oluşturuluyor...'
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Hesap oluştur
            </>
          )}
        </button>
      </form>

      <p
        className="animate-slide-up-fade mt-6 text-center text-sm text-brand-ink/60 dark:text-slate-400"
        style={stagger(7)}
      >
        Zaten hesabın var mı?{' '}
        <Link to="/giris" className="font-medium text-brand-teal hover:underline">
          Giriş yap
        </Link>
      </p>
    </AuthLayout>
  );
}

interface FieldWithIconProps {
  id: string;
  label: string;
  icon: typeof User;
  type: string;
  required?: boolean;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

function FieldWithIcon({
  id,
  label,
  icon: Icon,
  type,
  required,
  value,
  onChange,
  placeholder,
}: FieldWithIconProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/40 dark:text-slate-500" />
        <input
          id={id}
          type={type}
          required={required}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={inputClasses}
        />
      </div>
    </div>
  );
}

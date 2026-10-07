import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CalendarCheck2,
  Clock,
  Scissors,
  User,
  Phone,
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  createPublicBooking,
  fetchAvailableSlots,
  fetchBusinessInfo,
  type PublicShowResponse,
} from '../api/publicBooking';

type Step = 1 | 2 | 3;

export default function PublicBookingPage() {
  const { slug = '' } = useParams();
  const [info, setInfo] = useState<PublicShowResponse | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep] = useState<Step>(1);

  // Form state
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');

  // Slot state
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchBusinessInfo(slug)
      .then(setInfo)
      .catch((err) => {
        if (err?.response?.status === 404) setNotFound(true);
        else setError('İşletme bilgisi yüklenemedi.');
      });
  }, [slug]);

  // Hizmet veya tarih değişince müsait saatleri çek
  useEffect(() => {
    if (!serviceId || !date) {
      setSlots([]);
      setTime('');
      return;
    }
    setSlotsLoading(true);
    setTime('');
    fetchAvailableSlots(slug, date, serviceId)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [slug, serviceId, date]);

  const selectedService = useMemo(
    () => info?.services.find((s) => s.id === serviceId),
    [info, serviceId],
  );

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 60); // 60 gün ileri sınır
    return d.toISOString().split('T')[0];
  }, []);

  async function handleSubmit() {
    if (!serviceId || !date || !time || !name || !phone) {
      setError('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await createPublicBooking(slug, {
        customer_name: name,
        customer_phone: phone,
        customer_email: email || undefined,
        service_id: serviceId,
        starts_at: `${date} ${time}:00`,
        note: note || undefined,
      });
      const when = new Date(`${date}T${time}`).toLocaleString('tr-TR', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      });
      // SMS yalnızca gerçekten gönderildiyse cümleye eklenir (yanıltıcı olmasın).
      setSuccess(
        result.sms_sent
          ? `Randevunuz alındı! ${when} için onay SMS'i gönderildi.`
          : `Randevunuz ${when} için alındı.`,
      );
    } catch (err: unknown) {
      const resp = (err as { response?: { status?: number; data?: { message?: string } } })?.response;
      setError(
        resp?.data?.message ??
          (resp?.status === 429
            ? 'Çok fazla deneme. Lütfen 1 dakika sonra tekrar deneyin.'
            : 'Randevu alınamadı. Lütfen tekrar deneyin.'),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (notFound) {
    return (
      <CenteredCard>
        <AlertCircle className="h-10 w-10 text-amber-500" />
        <h1 className="mt-4 font-display text-xl font-semibold">İşletme bulunamadı</h1>
        <p className="mt-2 text-sm text-brand-ink/60 dark:text-slate-400">
          Linki kontrol edin veya işletme sahibinden doğru adresi isteyin.
        </p>
      </CenteredCard>
    );
  }

  if (!info) {
    return (
      <CenteredCard>
        <Loader2 className="h-8 w-8 animate-spin text-brand-teal" />
        <p className="mt-4 text-sm text-brand-ink/60 dark:text-slate-400">Yükleniyor...</p>
      </CenteredCard>
    );
  }

  if (success) {
    return (
      <CenteredCard>
        <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="mt-4 font-display text-xl font-semibold">Teşekkürler!</h1>
        <p className="mt-2 text-center text-sm text-brand-ink/60 dark:text-slate-400">{success}</p>
      </CenteredCard>
    );
  }

  return (
    <div className="min-h-screen bg-brand-mist dark:bg-surface-dark">
      {/* Üst şerit - işletme adı + marka */}
      <header className="bg-brand-gradient px-6 py-8 text-white">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 backdrop-blur ring-1 ring-white/25">
            <CalendarCheck2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-white/70">
              Online Randevu
            </p>
            <h1 className="font-display text-2xl font-semibold leading-tight">{info.business.name}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto -mt-4 max-w-2xl px-4 pb-16">
        {/* Adım göstergesi */}
        <div className="mb-6 flex items-center justify-center gap-2 rounded-2xl border border-brand-line bg-white/90 p-3 backdrop-blur dark:border-line-dark dark:bg-surface-dark-2/80">
          <StepBadge n={1} label="Hizmet" active={step === 1} done={step > 1} />
          <div className="h-px w-6 bg-brand-line dark:bg-line-dark" />
          <StepBadge n={2} label="Tarih/Saat" active={step === 2} done={step > 2} />
          <div className="h-px w-6 bg-brand-line dark:bg-line-dark" />
          <StepBadge n={3} label="Bilgiler" active={step === 3} done={false} />
        </div>

        <div className="surface-card p-5 sm:p-7">
          {/* Adım 1 - Hizmet seçimi */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-semibold">Hizmet seçin</h2>
              <div className="grid gap-2">
                {info.services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setServiceId(s.id)}
                    className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${
                      serviceId === s.id
                        ? 'border-brand-teal bg-brand-teal/5 ring-2 ring-brand-teal/20'
                        : 'border-brand-line hover:border-brand-teal/40 hover:bg-brand-mist/60 dark:border-line-dark dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-gradient text-white">
                        <Scissors className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-brand-ink/60 dark:text-slate-400">
                          {s.duration_minutes} dk
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-brand-teal">
                      {Number(s.price).toLocaleString('tr-TR')} ₺
                    </p>
                  </button>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <PrimaryButton
                  disabled={!serviceId}
                  onClick={() => setStep(2)}
                  rightIcon={ArrowRight}
                >
                  Devam
                </PrimaryButton>
              </div>
            </div>
          )}

          {/* Adım 2 - Tarih + Saat */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-semibold">Tarih ve saat seçin</h2>
              {selectedService && (
                <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-teal/10 px-3 py-1 text-xs font-medium text-brand-teal">
                  <Sparkles className="h-3 w-3" />
                  {selectedService.name} · {selectedService.duration_minutes} dk
                </p>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium">Tarih</label>
                <input
                  type="date"
                  value={date}
                  min={today}
                  max={maxDate}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-brand-line bg-white px-3 py-2.5 text-brand-ink outline-none transition focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/15 dark:border-line-dark dark:bg-surface-dark-2 dark:text-slate-100"
                />
              </div>

              {date && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Müsait saatler</label>
                  {slotsLoading ? (
                    <div className="flex items-center gap-2 py-6 text-sm text-brand-ink/60 dark:text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saatler yükleniyor...
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                      Bu gün için müsait saat yok. Başka bir tarih deneyin.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {slots.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setTime(s)}
                          className={`rounded-lg border px-2 py-2 text-sm font-medium transition ${
                            time === s
                              ? 'border-brand-teal bg-brand-teal text-white'
                              : 'border-brand-line hover:border-brand-teal/40 hover:bg-brand-mist/60 dark:border-line-dark dark:hover:bg-white/5'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <SecondaryButton onClick={() => setStep(1)} leftIcon={ArrowLeft}>
                  Geri
                </SecondaryButton>
                <PrimaryButton
                  disabled={!date || !time}
                  onClick={() => setStep(3)}
                  rightIcon={ArrowRight}
                >
                  Devam
                </PrimaryButton>
              </div>
            </div>
          )}

          {/* Adım 3 - Kişisel bilgi */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-semibold">İletişim bilgileriniz</h2>

              {/* Özet kart */}
              <div className="rounded-xl border border-brand-line bg-brand-mist/60 p-4 dark:border-line-dark dark:bg-white/[0.03]">
                <p className="text-xs font-medium uppercase tracking-wider text-brand-ink/50 dark:text-slate-500">
                  Randevu özeti
                </p>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="font-medium">{selectedService?.name}</span>
                  <span className="text-brand-ink/70 dark:text-slate-300">
                    {new Date(`${date}T${time}`).toLocaleString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              <IconField icon={User} label="Ad Soyad" required>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent outline-none placeholder:text-brand-ink/40 dark:placeholder:text-slate-500"
                  placeholder="Ayşe Yılmaz"
                />
              </IconField>
              <IconField icon={Phone} label="Telefon" required>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-transparent outline-none placeholder:text-brand-ink/40 dark:placeholder:text-slate-500"
                  placeholder="0555 123 45 67"
                />
              </IconField>
              <IconField icon={Mail} label="E-posta (opsiyonel)">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent outline-none placeholder:text-brand-ink/40 dark:placeholder:text-slate-500"
                  placeholder="ornek@mail.com"
                />
              </IconField>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Not (opsiyonel)</label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-xl border border-brand-line bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/15 dark:border-line-dark dark:bg-surface-dark-2 dark:text-slate-100"
                  placeholder="Varsa belirtmek istediğiniz bir şey..."
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <SecondaryButton onClick={() => setStep(2)} leftIcon={ArrowLeft}>
                  Geri
                </SecondaryButton>
                <PrimaryButton
                  disabled={submitting || !name || !phone}
                  onClick={handleSubmit}
                  rightIcon={submitting ? Loader2 : CheckCircle2}
                  spinIcon={submitting}
                >
                  {submitting ? 'Gönderiliyor...' : 'Randevuyu onayla'}
                </PrimaryButton>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-brand-ink/50 dark:text-slate-500">
          Randevu Sistemi · güvenli ve ücretsiz
        </p>
      </main>
    </div>
  );
}

// ---------- Küçük UI yardımcıları ----------

function StepBadge({
  n,
  label,
  active,
  done,
}: {
  n: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold transition ${
          done
            ? 'bg-brand-teal text-white'
            : active
            ? 'bg-brand-gradient text-white shadow-md shadow-brand-teal/30'
            : 'bg-brand-line text-brand-ink/60 dark:bg-line-dark dark:text-slate-400'
        }`}
      >
        {done ? <CheckCircle2 className="h-4 w-4" /> : n}
      </div>
      <span
        className={`text-xs font-medium ${
          active ? 'text-brand-teal' : 'text-brand-ink/60 dark:text-slate-400'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-mist p-6 dark:bg-surface-dark">
      <div className="surface-card flex max-w-sm flex-col items-center p-8 text-center">
        {children}
      </div>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  rightIcon: Icon,
  spinIcon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  rightIcon?: typeof ArrowRight;
  spinIcon?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand-teal/25 transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
    >
      {children}
      {Icon && <Icon className={`h-4 w-4 ${spinIcon ? 'animate-spin' : ''}`} />}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
  leftIcon: Icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  leftIcon?: typeof ArrowLeft;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-brand-line px-4 py-2.5 text-sm font-medium text-brand-ink/70 transition hover:bg-brand-mist dark:border-line-dark dark:text-slate-300 dark:hover:bg-white/5"
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

function IconField({
  icon: Icon,
  label,
  required,
  children,
}: {
  icon: typeof User;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex items-center gap-2 rounded-xl border border-brand-line bg-white px-3 py-2.5 transition focus-within:border-brand-teal focus-within:ring-4 focus-within:ring-brand-teal/15 dark:border-line-dark dark:bg-surface-dark-2">
        <Icon className="h-4 w-4 shrink-0 text-brand-ink/40 dark:text-slate-500" />
        {children}
      </div>
    </div>
  );
}

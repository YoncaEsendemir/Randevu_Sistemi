import { useEffect, useState } from 'react';
import { Clock, Save, AlertCircle, Coffee, Lock, Loader2, Link2, Copy, Check, ExternalLink } from 'lucide-react';
import { fetchBusinessHours, updateBusinessHours } from '../api/settings';
import { useAuth } from '../context/AuthContext';
import type { BusinessHours, DayHours, WeekDay } from '../types';

// 7 gün başlıkları - UI sırası (Pzt'den başlar).
const DAY_LABELS: Record<WeekDay, string> = {
  mon: 'Pazartesi',
  tue: 'Salı',
  wed: 'Çarşamba',
  thu: 'Perşembe',
  fri: 'Cuma',
  sat: 'Cumartesi',
  sun: 'Pazar',
};

const DAYS = Object.keys(DAY_LABELS) as WeekDay[];

export default function SettingsPage() {
  const { user } = useAuth();
  const [hours, setHours] = useState<BusinessHours | null>(null);
  const [editable, setEditable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Public booking URL - slug varsa tam URL üret
  const publicUrl = user?.slug ? `${window.location.origin}/randevu-al/${user.slug}` : null;

  function copyLink() {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  useEffect(() => {
    fetchBusinessHours()
      .then((res) => {
        setHours(res.business_hours);
        setEditable(res.editable);
      })
      .catch(() => setFeedback({ type: 'error', msg: 'Ayarlar yüklenemedi.' }))
      .finally(() => setLoading(false));
  }, []);

  function updateDay(day: WeekDay, patch: Partial<DayHours>) {
    if (!hours) return;
    setHours({ ...hours, [day]: { ...hours[day], ...patch } });
  }

  async function handleSave() {
    if (!hours) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await updateBusinessHours(hours);
      setHours(res.business_hours);
      setFeedback({ type: 'success', msg: 'Çalışma saatleri kaydedildi.' });
    } catch (err: unknown) {
      // Laravel 422 "message" alanı dönüyor
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Kaydedilemedi. Lütfen tekrar deneyin.';
      setFeedback({ type: 'error', msg });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-brand-ink/50 dark:text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Yükleniyor...
      </div>
    );
  }

  if (!hours) return null;

  return (
    <div className="space-y-6">
      {/* Sayfa başlığı */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Ayarlar</h1>
          <p className="mt-1 text-sm text-brand-ink/60 dark:text-slate-400">
            İşletmenin çalışma günleri ve saatleri. Randevular bu aralığın dışında alınamaz.
          </p>
        </div>
        {editable && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand-teal/25 transition hover:-translate-y-0.5 hover:shadow-xl disabled:translate-y-0 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        )}
      </div>

      {/* Public booking link kartı - sadece admin ve slug varsa göster */}
      {editable && publicUrl && (
        <div className="surface-card overflow-hidden">
          <div className="flex items-start gap-4 p-5">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white shadow-md shadow-brand-teal/25">
              <Link2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-base font-semibold">Online randevu linkin</h3>
              <p className="mt-1 text-sm text-brand-ink/60 dark:text-slate-400">
                Bu linki müşterilerinle paylaş — WhatsApp, Instagram biyografi, kartvizit… Giriş yapmadan randevu alabilirler.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg border border-brand-line bg-brand-mist/60 px-3 py-2 text-xs text-brand-ink/80 dark:border-line-dark dark:bg-white/[0.03] dark:text-slate-300">
                  {publicUrl}
                </code>
                <button
                  onClick={copyLink}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-brand-line px-3 py-2 text-xs font-medium text-brand-ink/70 transition hover:bg-brand-mist dark:border-line-dark dark:text-slate-300 dark:hover:bg-white/5"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      Kopyalandı
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Kopyala
                    </>
                  )}
                </button>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-gradient px-3 py-2 text-xs font-medium text-white transition hover:-translate-y-0.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Önizle
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Yazma yetkisi yoksa bilgi şeridi */}
      {!editable && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <Lock className="h-4 w-4 shrink-0" />
          Çalışma saatlerini sadece yönetici (admin) düzenleyebilir. Siz sadece görüntülüyorsunuz.
        </div>
      )}

      {/* Geri bildirim toast'u */}
      {feedback && (
        <div
          role="alert"
          className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
              : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
          }`}
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {feedback.msg}
        </div>
      )}

      {/* 7 gün kartları */}
      <div className="grid gap-3">
        {DAYS.map((day) => (
          <DayCard
            key={day}
            label={DAY_LABELS[day]}
            value={hours[day]}
            editable={editable}
            onChange={(patch) => updateDay(day, patch)}
          />
        ))}
      </div>
    </div>
  );
}

interface DayCardProps {
  label: string;
  value: DayHours;
  editable: boolean;
  onChange: (patch: Partial<DayHours>) => void;
}

function DayCard({ label, value, editable, onChange }: DayCardProps) {
  const hasBreak = value.break_start !== null && value.break_end !== null;

  return (
    <div
      className={`surface-card p-4 transition ${
        !value.is_open ? 'opacity-70' : ''
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {/* Gün + açık/kapalı toggle */}
        <div className="flex min-w-[140px] items-center gap-3">
          <button
            type="button"
            disabled={!editable}
            onClick={() => onChange({ is_open: !value.is_open })}
            className={`relative h-5 w-10 rounded-full transition ${
              value.is_open ? 'bg-brand-teal' : 'bg-brand-line dark:bg-line-dark'
            } ${!editable ? 'cursor-not-allowed opacity-60' : ''}`}
            aria-label={`${label} açık/kapalı`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                value.is_open ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
          <div>
            <p className="font-medium">{label}</p>
            <p className="text-xs text-brand-ink/50 dark:text-slate-500">
              {value.is_open ? 'Açık' : 'Kapalı'}
            </p>
          </div>
        </div>

        {/* Çalışma saati */}
        {value.is_open && (
          <>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-ink/50 dark:text-slate-500" />
              <TimeInput
                value={value.start}
                onChange={(v) => onChange({ start: v })}
                disabled={!editable}
                label="Açılış"
              />
              <span className="text-brand-ink/40">–</span>
              <TimeInput
                value={value.end}
                onChange={(v) => onChange({ end: v })}
                disabled={!editable}
                label="Kapanış"
              />
            </div>

            {/* Mola */}
            <div className="flex items-center gap-2">
              <Coffee className="h-4 w-4 text-brand-ink/50 dark:text-slate-500" />
              {hasBreak ? (
                <>
                  <TimeInput
                    value={value.break_start ?? ''}
                    onChange={(v) => onChange({ break_start: v })}
                    disabled={!editable}
                    label="Mola başlangıç"
                  />
                  <span className="text-brand-ink/40">–</span>
                  <TimeInput
                    value={value.break_end ?? ''}
                    onChange={(v) => onChange({ break_end: v })}
                    disabled={!editable}
                    label="Mola bitiş"
                  />
                  {editable && (
                    <button
                      type="button"
                      onClick={() => onChange({ break_start: null, break_end: null })}
                      className="text-xs text-red-600 hover:underline dark:text-red-400"
                    >
                      Mola yok
                    </button>
                  )}
                </>
              ) : (
                editable && (
                  <button
                    type="button"
                    onClick={() => onChange({ break_start: '12:00', break_end: '13:00' })}
                    className="text-xs font-medium text-brand-teal hover:underline"
                  >
                    + Mola ekle
                  </button>
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface TimeInputProps {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  label: string;
}

function TimeInput({ value, onChange, disabled, label }: TimeInputProps) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      aria-label={label}
      className="rounded-lg border border-brand-line bg-white px-2 py-1.5 text-sm text-brand-ink outline-none transition focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-line-dark dark:bg-surface-dark-2 dark:text-slate-100"
    />
  );
}

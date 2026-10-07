import { useEffect, useMemo, useState, type FormEvent } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, EventDropArg, EventInput } from '@fullcalendar/core';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';
import {
  CalendarClock,
  User,
  Scissors,
  CalendarDays,
  Clock,
  Plus,
  X,
  CheckCircle2,
  XCircle,
  CircleDashed,
  Trash2,
} from 'lucide-react';
import { createAppointment, deleteAppointment, getAppointments, updateAppointment } from '../api/appointments';
import { getCustomers } from '../api/customers';
import { getServices } from '../api/services';
import type { Appointment, AppointmentStatus, Customer, Service } from '../types';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import { PageHeader } from './Customerspage';

const inputClasses =
  'w-full rounded-xl border border-brand-line bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-brand-ink/40 focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/15 dark:border-line-dark dark:bg-surface-dark-2 dark:text-slate-100 dark:placeholder:text-slate-500';

const iconInputClasses = `${inputClasses} pl-9`;

// Randevu durumuna göre takvimde farklı renk göstermek için
const STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending: '#e8b876',
  confirmed: '#0f9c8a',
  completed: '#1d6fa8',
  cancelled: '#94a3b8',
};

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: 'Beklemede',
  confirmed: 'Onaylı',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [form, setForm] = useState({
    customer_id: '',
    service_id: '',
    date: '',
    time: '',
    note: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const [appts, custs, servs] = await Promise.all([
        getAppointments(),
        getCustomers(),
        getServices(),
      ]);
      setAppointments(appts);
      setCustomers(custs);
      setServices(servs);
      setIsLoading(false);
    })();
  }, []);

  const selectedService = useMemo(
    () => services.find((s) => s.id === Number(form.service_id)),
    [services, form.service_id],
  );

  const events: EventInput[] = useMemo(
    () =>
      appointments.map((a) => ({
        id: String(a.id),
        title: `${a.customer?.name ?? 'Müşteri'} — ${a.service?.name ?? 'Hizmet'}`,
        start: a.starts_at,
        end: a.ends_at,
        backgroundColor: STATUS_COLORS[a.status],
        borderColor: STATUS_COLORS[a.status],
      })),
    [appointments],
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!selectedService) {
      setError('Lütfen bir hizmet seç.');
      return;
    }

    const startsAt = new Date(`${form.date}T${form.time}`);
    const endsAt = new Date(startsAt.getTime() + selectedService.duration_minutes * 60_000);

    setIsSaving(true);
    try {
      const created = await createAppointment({
        customer_id: Number(form.customer_id),
        service_id: Number(form.service_id),
        starts_at: formatForApi(startsAt),
        ends_at: formatForApi(endsAt),
        note: form.note || undefined,
      });
      setAppointments((prev) => [...prev, created]);
      setForm({ customer_id: '', service_id: '', date: '', time: '', note: '' });
      setToast(
        created.sms_sent
          ? { message: 'Randevu oluşturuldu, bilgilendirme SMS\'i gönderildi.', tone: 'success' }
          : { message: 'Randevu oluşturuldu, ancak SMS gönderilemedi.', tone: 'error' },
      );
    } catch (err) {
      const resp = (err as { response?: { status?: number; data?: { message?: string } } })?.response;
      const status = resp?.status;
      const backendMsg = resp?.data?.message;
      if (status === 409) {
        setError('Bu zaman aralığında zaten bir randevu var. Başka bir saat seç.');
      } else if (status === 422 && backendMsg) {
        // Çalışma saati validation'ı tetiklendi (gün kapalı, aralık dışı, mola vs.)
        setError(backendMsg);
      } else {
        setError('Randevu oluşturulamadı. Bilgileri kontrol et.');
      }
    } finally {
      setIsSaving(false);
    }
  }

  function handleEventClick(clickInfo: EventClickArg) {
    const appt = appointments.find((a) => String(a.id) === clickInfo.event.id);
    if (appt) setSelectedAppointment(appt);
  }

  // Randevu takvimde sürüklenip bırakıldığında (drag-and-drop) veya
  // kenarından çekilip süresi uzatıldığında backend'i güncelliyoruz.
  // Backend çakışma verirse (409) event'i eski yerine geri alıyoruz.
  async function handleEventUpdate(arg: EventDropArg | EventResizeDoneArg) {
    const id = Number(arg.event.id);
    const start = arg.event.start;
    const end = arg.event.end;
    if (!start || !end) return;

    // İyimser güncelleme - önce UI'da göster, sonra backend'e yaz
    const prev = appointments;
    setAppointments((list) =>
      list.map((a) =>
        a.id === id
          ? { ...a, starts_at: formatForApi(start), ends_at: formatForApi(end) }
          : a,
      ),
    );

    try {
      await updateAppointment(id, {
        starts_at: formatForApi(start),
        ends_at: formatForApi(end),
      });
      setToast({ message: 'Randevu güncellendi.', tone: 'success' });
    } catch (err) {
      // Hata varsa iyimser değişikliği geri al + takvimdeki event'i eski konumuna çevir
      setAppointments(prev);
      arg.revert();
      const resp = (err as { response?: { status?: number; data?: { message?: string } } })?.response;
      const status = resp?.status;
      const backendMsg = resp?.data?.message;
      let message: string;
      if (status === 409) {
        message = 'Bu zaman aralığında başka bir randevu var.';
      } else if (status === 422 && backendMsg) {
        message = backendMsg;
      } else {
        message = 'Randevu güncellenemedi.';
      }
      setToast({ message, tone: 'error' });
    }
  }

  // Modal içindeki "Durumu değiştir" butonlarından çağrılır.
  async function changeStatus(id: number, newStatus: AppointmentStatus) {
    const prev = appointments;
    setAppointments((list) => list.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
    setSelectedAppointment((cur) => (cur && cur.id === id ? { ...cur, status: newStatus } : cur));
    try {
      await updateAppointment(id, { status: newStatus });
      setToast({ message: 'Randevu durumu güncellendi.', tone: 'success' });
    } catch {
      setAppointments(prev);
      setToast({ message: 'Durum güncellenemedi.', tone: 'error' });
    }
  }

  // Modal'dan silme.
  async function removeAppointment(id: number) {
    const prev = appointments;
    setAppointments((list) => list.filter((a) => a.id !== id));
    setSelectedAppointment(null);
    try {
      await deleteAppointment(id);
      setToast({ message: 'Randevu silindi.', tone: 'success' });
    } catch {
      setAppointments(prev);
      setToast({ message: 'Randevu silinemedi.', tone: 'error' });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CalendarClock}
        title="Randevular"
        subtitle={`${appointments.length} toplam randevu`}
      />

      {/* Yeni randevu formu */}
      <div className="relative">
        <form onSubmit={handleSubmit} className="surface-card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold">
            <Plus className="h-4 w-4 text-brand-teal" />
            Yeni randevu oluştur
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/40 dark:text-slate-500" />
              <select
                required
                value={form.customer_id}
                onChange={(e) => setForm((f) => ({ ...f, customer_id: e.target.value }))}
                className={iconInputClasses}
              >
                <option value="">Müşteri seç</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Scissors className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/40 dark:text-slate-500" />
              <select
                required
                value={form.service_id}
                onChange={(e) => setForm((f) => ({ ...f, service_id: e.target.value }))}
                className={iconInputClasses}
              >
                <option value="">Hizmet seç</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.duration_minutes} dk)
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/40 dark:text-slate-500" />
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className={iconInputClasses}
              />
            </div>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/40 dark:text-slate-500" />
              <input
                type="time"
                required
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className={iconInputClasses}
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand-teal/25 transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              Oluştur
            </button>
          </div>

          {selectedService && form.date && form.time && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-teal/10 px-3 py-1 text-xs font-medium text-brand-teal">
              <Clock className="h-3 w-3" />
              Tahmini bitiş: {computeEndPreview(form.date, form.time, selectedService.duration_minutes)}
            </p>
          )}

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </p>
          )}
        </form>

        {isSaving && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm dark:bg-surface-dark/70">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Spinner />
              Kaydediliyor...
            </div>
          </div>
        )}
      </div>

      {/* Durum rengi göstergesi */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl bg-brand-mist/60 px-4 py-2.5 text-xs dark:bg-white/[0.03]">
        <span className="font-medium text-brand-ink/60 dark:text-slate-400">Durumlar:</span>
        {(Object.keys(STATUS_COLORS) as AppointmentStatus[]).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: STATUS_COLORS[k] }}
            />
            {STATUS_LABEL[k]}
          </span>
        ))}
      </div>

      {/* Takvim */}
      <div className="surface-card p-4 sm:p-5">
        {isLoading ? (
          <div className="flex items-center gap-2 p-6 text-sm text-brand-ink/60 dark:text-slate-400">
            <Spinner className="h-4 w-4" />
            Yükleniyor...
          </div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            locale="tr"
            firstDay={1}
            slotMinTime="08:00:00"
            slotMaxTime="20:00:00"
            height="auto"
            events={events}
            eventClick={handleEventClick}
            editable
            eventDrop={handleEventUpdate}
            eventResize={handleEventUpdate}
            nowIndicator
            buttonText={{ today: 'Bugün', month: 'Ay', week: 'Hafta', day: 'Gün' }}
          />
        )}
      </div>

      {/* Randevu detay modal */}
      {selectedAppointment && (
        <AppointmentDetail
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onChangeStatus={(s) => changeStatus(selectedAppointment.id, s)}
          onDelete={() => removeAppointment(selectedAppointment.id)}
        />
      )}

      {toast && (
        <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

// --- Yardımcı: bitiş önizlemesi ---
function computeEndPreview(date: string, time: string, minutes: number): string {
  const start = new Date(`${date}T${time}`);
  const end = new Date(start.getTime() + minutes * 60_000);
  return end.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

// --- Yardımcı: API formatı ---
function formatForApi(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

// --- Randevu detayı modal (alert yerine) ---
function AppointmentDetail({
  appointment,
  onClose,
  onChangeStatus,
  onDelete,
}: {
  appointment: Appointment;
  onClose: () => void;
  onChangeStatus: (s: AppointmentStatus) => void;
  onDelete: () => void;
}) {
  const meta = STATUS_LABEL[appointment.status];
  const color = STATUS_COLORS[appointment.status];

  // Şu anki duruma göre önerilen sonraki eylemler.
  // Ör. "pending" iken "Onayla" ve "İptal et" mantıklı; "cancelled" tekrar
  // "Beklemede" yapılabilir; "completed" ise nihayet, sadece silinebilir.
  const nextActions: { status: AppointmentStatus; label: string; icon: typeof CheckCircle2; tone: 'primary' | 'muted' | 'danger' }[] = [];
  if (appointment.status === 'pending') {
    nextActions.push({ status: 'confirmed', label: 'Onayla', icon: CheckCircle2, tone: 'primary' });
    nextActions.push({ status: 'cancelled', label: 'İptal et', icon: XCircle, tone: 'danger' });
  } else if (appointment.status === 'confirmed') {
    nextActions.push({ status: 'completed', label: 'Tamamlandı işaretle', icon: CheckCircle2, tone: 'primary' });
    nextActions.push({ status: 'cancelled', label: 'İptal et', icon: XCircle, tone: 'danger' });
  } else if (appointment.status === 'cancelled') {
    nextActions.push({ status: 'pending', label: 'Yeniden aç (beklemede)', icon: CircleDashed, tone: 'muted' });
  } else if (appointment.status === 'completed') {
    // Tamamlanmış - durumu geri alma yok, sadece silme kaldı.
  }

  return (
    <div
      className="animate-fade-in-up fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-surface-dark-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="grid h-11 w-11 place-items-center rounded-xl text-white"
              style={{ background: color }}
            >
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">Randevu detayı</h3>
              <span
                className="mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ background: `${color}22`, color }}
              >
                {meta}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-brand-ink/50 hover:bg-brand-mist dark:text-slate-400 dark:hover:bg-white/5"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <dl className="mt-5 space-y-3 text-sm">
          <Row icon={User} label="Müşteri">
            {appointment.customer?.name ?? '—'}
          </Row>
          <Row icon={Scissors} label="Hizmet">
            {appointment.service?.name ?? '—'}
          </Row>
          <Row icon={CalendarDays} label="Tarih">
            {new Date(appointment.starts_at).toLocaleDateString('tr-TR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Row>
          <Row icon={Clock} label="Saat">
            {new Date(appointment.starts_at).toLocaleTimeString('tr-TR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
            {' — '}
            {new Date(appointment.ends_at).toLocaleTimeString('tr-TR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Row>
          {appointment.note && (
            <div className="rounded-xl border border-brand-line bg-brand-mist/60 p-3 text-sm dark:border-line-dark dark:bg-white/[0.03]">
              <p className="text-xs font-medium uppercase tracking-wider text-brand-ink/50 dark:text-slate-500">
                Not
              </p>
              <p className="mt-1">{appointment.note}</p>
            </div>
          )}
        </dl>

        {/* Aksiyon butonları - durumu değiştir + sil */}
        <div className="mt-6 space-y-2 border-t border-brand-line/60 pt-4 dark:border-line-dark">
          {nextActions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {nextActions.map((a) => {
                const Icon = a.icon;
                const tone =
                  a.tone === 'primary'
                    ? 'bg-brand-gradient text-white shadow-lg shadow-brand-teal/25 hover:-translate-y-0.5'
                    : a.tone === 'danger'
                    ? 'border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10'
                    : 'border border-brand-line text-brand-ink/70 hover:bg-brand-mist dark:border-line-dark dark:text-slate-300 dark:hover:bg-white/5';
                return (
                  <button
                    key={a.status}
                    onClick={() => onChangeStatus(a.status)}
                    className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${tone}`}
                  >
                    <Icon className="h-4 w-4" />
                    {a.label}
                  </button>
                );
              })}
            </div>
          )}

          <button
            onClick={onDelete}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
            Randevuyu sil
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof User;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-brand-ink/40 dark:text-slate-500" />
      <div className="flex-1">
        <p className="text-xs text-brand-ink/50 dark:text-slate-500">{label}</p>
        <p className="font-medium">{children}</p>
      </div>
    </div>
  );
}

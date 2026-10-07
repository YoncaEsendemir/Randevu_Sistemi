import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Scissors,
  CalendarDays,
  TrendingUp,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Circle,
  XCircle,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getCustomers } from '../api/customers';
import { getServices } from '../api/services';
import { getAppointments } from '../api/appointments';
import type { Appointment, AppointmentStatus } from '../types';
import Spinner from '../components/Spinner';
import { useCountUp } from '../hooks/useCountUp';

// Randevu durum meta bilgisi - takvim renklerinden bağımsız, kartlarda
// kullanılacak yumuşak arka plan + ikon eşleşmesi.
const STATUS_META: Record<AppointmentStatus, { label: string; color: string; icon: typeof Circle }> = {
  pending: { label: 'Beklemede', color: '#e8b876', icon: Clock },
  confirmed: { label: 'Onaylı', color: '#0f9c8a', icon: CheckCircle2 },
  completed: { label: 'Tamamlandı', color: '#1d6fa8', icon: CheckCircle2 },
  cancelled: { label: 'İptal', color: '#94a3b8', icon: XCircle },
};

// Küçük yardımcı: bir gün için ISO tarih anahtarı (YYYY-MM-DD)
function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [customerCount, setCustomerCount] = useState(0);
  const [serviceCount, setServiceCount] = useState(0);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const [customers, services, appts] = await Promise.all([
        getCustomers(),
        getServices(),
        getAppointments(),
      ]);
      setCustomerCount(customers.length);
      setServiceCount(services.length);
      setAppointments(appts);
      setIsLoading(false);
    })();
  }, []);

  // "Bugünün randevuları" - şimdiden itibaren, saatine göre sıralanmış
  const todaysAppointments = useMemo(() => {
    const today = new Date().toDateString();
    return appointments
      .filter((a) => new Date(a.starts_at).toDateString() === today)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [appointments]);

  // Son 7 günün günlük randevu sayısı - AreaChart için
  const weeklyTrend = useMemo(() => {
    const buckets = new Map<string, number>();
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      buckets.set(dayKey(d), 0);
    }
    appointments.forEach((a) => {
      const k = dayKey(new Date(a.starts_at));
      if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + 1);
    });
    return Array.from(buckets.entries()).map(([k, v]) => {
      const d = new Date(k);
      return {
        day: d.toLocaleDateString('tr-TR', { weekday: 'short' }),
        date: k,
        count: v,
      };
    });
  }, [appointments]);

  // Hizmet bazlı dağılım - pasta grafik için
  const serviceBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    appointments.forEach((a) => {
      const name = a.service?.name ?? 'Diğer';
      map.set(name, (map.get(name) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [appointments]);

  // Bu ay tahmini gelir - status "cancelled" olmayanların hizmet fiyatı toplamı
  const monthlyRevenue = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return appointments
      .filter((a) => {
        const d = new Date(a.starts_at);
        return d.getFullYear() === y && d.getMonth() === m && a.status !== 'cancelled';
      })
      .reduce((sum, a) => sum + Number(a.service?.price ?? 0), 0);
  }, [appointments]);

  const totalAppointments = appointments.length;

  const pieColors = ['#0f9c8a', '#1d6fa8', '#22b573', '#e8b876', '#94a3b8'];

  return (
    <div className="space-y-6">
      {/* Karşılama başlığı */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-brand-ink/50 dark:text-slate-400">
            {new Date().toLocaleDateString('tr-TR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">
            Merhaba, <span className="text-brand-gradient">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="mt-2 text-sm text-brand-ink/60 dark:text-slate-400">
            İşletmenin bugünkü nabzına buradan hızlıca göz atabilirsin.
          </p>
        </div>
        <Link
          to="/randevular"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand-teal/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-teal/30"
        >
          <CalendarDays className="h-4 w-4" />
          Yeni randevu oluştur
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Özet kartları */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Toplam Müşteri"
          value={customerCount}
          icon={Users}
          tint="blue"
          loading={isLoading}
        />
        <StatCard
          label="Toplam Hizmet"
          value={serviceCount}
          icon={Scissors}
          tint="teal"
          loading={isLoading}
        />
        <StatCard
          label="Bugünkü Randevu"
          value={todaysAppointments.length}
          icon={CalendarDays}
          tint="green"
          loading={isLoading}
        />
        <StatCard
          label="Bu Ay Tahmini Ciro"
          value={monthlyRevenue}
          suffix=" ₺"
          icon={TrendingUp}
          tint="amber"
          loading={isLoading}
        />
      </div>

      {/* Grafikler */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Haftalık trend - 2/3 genişlik */}
        <div className="surface-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">Son 7 gün</h2>
              <p className="text-xs text-brand-ink/50 dark:text-slate-400">
                Günlük randevu sayısı
              </p>
            </div>
            <span className="rounded-full bg-brand-teal/10 px-3 py-1 text-xs font-medium text-brand-teal">
              {totalAppointments} toplam randevu
            </span>
          </div>
          <div className="mt-4 h-64">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Spinner />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0f9c8a" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#0f9c8a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.2)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'currentColor' }} stroke="rgb(148 163 184 / 0.4)" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'currentColor' }} stroke="rgb(148 163 184 / 0.4)" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid rgb(148 163 184 / 0.3)',
                      background: 'rgb(255 255 255 / 0.95)',
                      color: '#0f1f1c',
                    }}
                    labelStyle={{ fontWeight: 600 }}
                    formatter={(value) => [`${value} randevu`, '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#0f9c8a"
                    strokeWidth={2.5}
                    fill="url(#areaFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Hizmet dağılımı - pasta */}
        <div className="surface-card p-5">
          <h2 className="font-display text-lg font-semibold">Popüler hizmetler</h2>
          <p className="text-xs text-brand-ink/50 dark:text-slate-400">
            En çok tercih edilen 5 hizmet
          </p>
          <div className="mt-4 h-64">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Spinner />
              </div>
            ) : serviceBreakdown.length === 0 ? (
              <EmptyMini text="Henüz randevu verisi yok." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {serviceBreakdown.map((_, i) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid rgb(148 163 184 / 0.3)',
                      background: 'rgb(255 255 255 / 0.95)',
                      color: '#0f1f1c',
                    }}
                    formatter={(value) => [`${value} randevu`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {serviceBreakdown.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {serviceBreakdown.map((s, i) => (
                <li key={s.name} className="flex items-center gap-2 text-xs">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: pieColors[i % pieColors.length] }}
                  />
                  <span className="flex-1 truncate text-brand-ink/70 dark:text-slate-300">
                    {s.name}
                  </span>
                  <span className="font-medium">{s.value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Bugünün randevuları */}
      <div className="surface-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">Bugünün randevuları</h2>
            <p className="text-xs text-brand-ink/50 dark:text-slate-400">
              Saatine göre sıralı
            </p>
          </div>
          <Link
            to="/randevular"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-teal hover:underline"
          >
            Takvim
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-brand-ink/60 dark:text-slate-400">
              <Spinner className="h-4 w-4" />
              Yükleniyor...
            </div>
          ) : todaysAppointments.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="divide-y divide-brand-line dark:divide-line-dark">
              {todaysAppointments.map((a) => {
                const meta = STATUS_META[a.status];
                const Icon = meta.icon;
                return (
                  <li
                    key={a.id}
                    className="flex items-center gap-4 py-3 text-sm transition hover:bg-brand-mist/40 dark:hover:bg-white/[0.02]"
                  >
                    <div
                      className="grid h-10 w-10 place-items-center rounded-xl text-white"
                      style={{ background: meta.color }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {new Date(a.starts_at).toLocaleTimeString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {' — '}
                        {a.customer?.name ?? 'Müşteri'}
                      </p>
                      <p className="text-xs text-brand-ink/60 dark:text-slate-400">
                        {a.service?.name}
                      </p>
                    </div>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{ background: `${meta.color}22`, color: meta.color }}
                    >
                      {meta.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Hızlı erişim kısayolları */}
      <div className="grid gap-4 sm:grid-cols-3">
        <QuickLink to="/musteriler" title="Müşteriler" desc="Ekle, listele, düzenle" icon={Users} />
        <QuickLink to="/hizmetler" title="Hizmetler" desc="Fiyat ve süreleri yönet" icon={Scissors} />
        <QuickLink to="/randevular" title="Randevular" desc="Takvimi gör, planla" icon={CalendarDays} />
      </div>
    </div>
  );
}

// --- Alt bileşenler ---

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  icon: typeof Users;
  tint: 'blue' | 'teal' | 'green' | 'amber';
  loading: boolean;
}

const TINTS = {
  blue: {
    bg: 'from-brand-blue/15 to-brand-blue/0',
    icon: 'bg-brand-blue/15 text-brand-blue',
    blob: 'bg-brand-blue/30',
  },
  teal: {
    bg: 'from-brand-teal/15 to-brand-teal/0',
    icon: 'bg-brand-teal/15 text-brand-teal',
    blob: 'bg-brand-teal/30',
  },
  green: {
    bg: 'from-brand-green/15 to-brand-green/0',
    icon: 'bg-brand-green/15 text-brand-green',
    blob: 'bg-brand-green/30',
  },
  amber: {
    bg: 'from-brand-amber/20 to-brand-amber/0',
    icon: 'bg-brand-amber/20 text-brand-amber',
    blob: 'bg-brand-amber/40',
  },
};

function StatCard({ label, value, suffix, icon: Icon, tint, loading }: StatCardProps) {
  const t = TINTS[tint];
  // Yüklenirken sayıya 0'dan başlatıyoruz; veri gelince target = value olur ve
  // hook 0 -> value arasında yumuşak bir count-up oynar.
  const animated = useCountUp(loading ? 0 : value);
  const display = Math.round(animated);
  return (
    <div className={`surface-card relative overflow-hidden bg-linear-to-br p-5 ${t.bg}`}>
      {/* Sağ üstte hafif parlayan blob - kartların "canlı" hissi için */}
      <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl ${t.blob}`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-brand-ink/50 dark:text-slate-400">
            {label}
          </p>
          <div className="mt-2 font-display text-3xl font-bold tabular-nums">
            {loading ? (
              <Spinner className="h-6 w-6" />
            ) : (
              <>
                {display.toLocaleString('tr-TR')}
                {suffix && <span className="ml-0.5 text-lg font-semibold">{suffix}</span>}
              </>
            )}
          </div>
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${t.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

interface QuickLinkProps {
  to: string;
  title: string;
  desc: string;
  icon: typeof Users;
}

function QuickLink({ to, title, desc, icon: Icon }: QuickLinkProps) {
  return (
    <Link
      to={to}
      className="group surface-card flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-teal/10"
    >
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-gradient text-white transition group-hover:scale-105">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        <p className="truncate text-xs text-brand-ink/60 dark:text-slate-400">{desc}</p>
      </div>
      <ArrowUpRight className="h-4 w-4 text-brand-ink/40 transition group-hover:text-brand-teal dark:text-slate-500" />
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-brand-line py-10 text-center dark:border-line-dark">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-teal/10 text-brand-teal">
        <CalendarDays className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium">Bugün için planlanmış randevu yok.</p>
      <Link to="/randevular" className="text-xs font-medium text-brand-teal hover:underline">
        Yeni randevu oluştur →
      </Link>
    </div>
  );
}

function EmptyMini({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center text-xs text-brand-ink/50 dark:text-slate-500">
      {text}
    </div>
  );
}

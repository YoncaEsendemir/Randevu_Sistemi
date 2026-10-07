import type { ReactNode } from 'react';
import { Sparkles, CalendarClock, Users, TrendingUp, CalendarCheck2, ShieldCheck } from 'lucide-react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sol panel: marka/gradyan alanı - grid pattern + cam efekti + hareketli daireler */}
      <div className="relative flex items-center justify-center overflow-hidden bg-brand-gradient px-8 py-12 md:w-1/2 md:py-0">
        {/* Geometrik grid pattern - gradyana derinlik katıyor */}
        <div className="pointer-events-none absolute inset-0 grid-pattern opacity-60" />

        {/* Yumuşak hareketli daireler */}
        <div className="animate-float-slow pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div
          className="animate-float-slow pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-white/10 blur-3xl"
          style={{ animationDelay: '3s' }}
        />

        <div className="relative z-10 flex max-w-md flex-col text-white">
          {/* Logo mark - gradyan üstünde beyaz cam, randevu temalı ikon */}
          <div className="mb-10 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur ring-1 ring-white/25">
              <CalendarCheck2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-base font-semibold leading-none">Randevu Sistemi</p>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-white/70">
                Pro Panel
              </p>
            </div>
          </div>

          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur ring-1 ring-white/15">
            <Sparkles className="h-3.5 w-3.5" />
            Küçük işletmeler için
          </div>

          <h1 className="font-display text-4xl font-semibold leading-tight">
            Randevularınızı tek yerden yönetin.
          </h1>
          <p className="mt-4 text-white/85">
            Müşteri, hizmet ve takvim akışını birlikte tutan sade bir çalışma alanı.
            Çakışmaları önler, SMS ile hatırlatır.
          </p>

          <ul className="mt-10 space-y-4">
            <FeatureRow icon={CalendarClock} title="Otomatik çakışma kontrolü">
              Aynı saate iki randevu almanız imkânsız.
            </FeatureRow>
            <FeatureRow icon={Users} title="Müşteri geçmişi elinizin altında">
              Kim, ne zaman, hangi hizmet — hepsi kayıtlı.
            </FeatureRow>
            <FeatureRow icon={TrendingUp} title="Basit ve net analitik">
              Haftalık trend, popüler hizmet, aylık ciro.
            </FeatureRow>
          </ul>

          {/* Alt kart: sosyal kanıt / güven */}
          <div className="mt-10 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 p-3 backdrop-blur">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/15">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="text-sm">
              <p className="font-medium leading-tight">Verileriniz güvende</p>
              <p className="text-white/70">SSL ile şifreli, günlük yedekli altyapı.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sağ panel: form alanı */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 md:w-1/2">
        <div className="w-full max-w-sm animate-fade-in-up">
          <h2 className="font-display text-2xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-brand-ink/60 dark:text-slate-400">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof CalendarClock;
  title: string;
  children: ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/15 backdrop-blur">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-white/75">{children}</p>
      </div>
    </li>
  );
}

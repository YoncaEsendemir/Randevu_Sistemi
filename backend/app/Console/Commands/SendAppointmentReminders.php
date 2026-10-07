<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use App\Services\SmsService;
use Carbon\Carbon;
use Illuminate\Console\Command;

/**
 * Yaklaşan randevular için hatırlatma SMS'i gönderir.
 *
 * Mantık:
 *   - starts_at tam 24 saat sonra olan (±15 dk pencere) randevular hedef
 *   - Sadece status in [pending, confirmed] olanlar (iptal/tamamlanmış atlanır)
 *   - reminder_sent_at NULL olmalı (daha önce hatırlatma gönderilmemiş)
 *   - Scheduler her 15 dk'da bir tetikler, pencere 15 dk - kaçırma olmaz
 *
 * Çalıştırma: php artisan app:send-appointment-reminders
 */
class SendAppointmentReminders extends Command
{
    protected $signature = 'app:send-appointment-reminders';
    protected $description = 'Yaklaşan randevular için hatırlatma SMS\'i gönderir (24 saat öncesi).';

    public function handle(SmsService $sms): int
    {
        // 24 saat sonrasının başlangıcı (şimdi + 23:52:30) ile bitişi (+24:07:30)
        // arası 15 dk pencere. Scheduler her 15 dk tetiklendiği için
        // bu pencere kayma yapmaz, randevu kaçırılmaz.
        $windowStart = Carbon::now()->addHours(24)->subMinutes(8);
        $windowEnd = Carbon::now()->addHours(24)->addMinutes(7);

        $appointments = Appointment::with(['customer', 'service'])
            ->whereIn('status', ['pending', 'confirmed'])
            ->whereNull('reminder_sent_at')
            ->whereBetween('starts_at', [$windowStart, $windowEnd])
            ->get();

        if ($appointments->isEmpty()) {
            $this->info('Hatırlatma gönderilecek randevu yok.');
            return self::SUCCESS;
        }

        $this->info("{$appointments->count()} randevu için hatırlatma denenecek.");

        $sent = 0;
        $failed = 0;

        foreach ($appointments as $appointment) {
            $phone = $appointment->customer?->phone;
            if (! $phone) {
                $this->warn("Appointment #{$appointment->id}: müşteri telefonu yok, atlandı.");
                continue;
            }

            $message = sprintf(
                'Hatırlatma: Yarın %s saatinde %s hizmeti için randevunuz var. İyi günler!',
                $appointment->starts_at->format('H:i'),
                $appointment->service?->name ?? 'randevu',
            );

            $ok = $sms->send($phone, $message);

            if ($ok) {
                // İkinci kez göndermemek için işaretle
                $appointment->update(['reminder_sent_at' => now()]);
                $sent++;
            } else {
                $failed++;
                $this->warn("Appointment #{$appointment->id}: SMS gönderilemedi.");
            }
        }

        $this->info("Tamamlandı. Gönderilen: {$sent}, Başarısız: {$failed}");
        return self::SUCCESS;
    }
}

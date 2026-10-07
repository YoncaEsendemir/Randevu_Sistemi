<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Service;
use App\Models\User;
use App\Services\SmsService;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Müşterinin giriş yapmadan randevu alabildiği uç noktalar.
 * URL kalıbı: /api/public/{slug}/...
 *
 * Güvenlik notları:
 *   - routes/api.php'de bu grup token GEREKTİRMEZ ama throttle sıkıdır.
 *   - Slug ile User bulunur; o işletmenin çalışma saatleri + çakışma kuralları
 *     uygulanır (admin paneliyle aynı mantık).
 *   - Sadece o işletmeye ait (user_id) aktif hizmetler sunulur.
 *   - Müşteri, o işletme içinde telefona göre bulunur veya oluşturulur.
 */
class PublicBookingController extends Controller
{
    public function __construct(private SmsService $smsService)
    {
    }

    /**
     * İşletme bilgisi + aktif hizmetleri + çalışma saatleri.
     * GET /api/public/{slug}
     */
    public function show(string $slug)
    {
        $business = $this->findBusiness($slug);

        return response()->json([
            'business' => [
                'name' => $business->name,
                'slug' => $business->slug,
                'business_hours' => $business->business_hours,
            ],
            'services' => Service::where('user_id', $business->id)
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'duration_minutes', 'price']),
        ]);
    }

    /**
     * Belirli bir gün + hizmet için müsait başlangıç saatlerini üretir.
     * GET /api/public/{slug}/available-slots?date=2026-10-07&service_id=3
     *
     * 15 dk aralıklarla gün içindeki tüm olası başlangıçları tarar;
     * çalışma saati + mola + mevcut randevu çakışmalarını dışlar.
     */
    public function availableSlots(Request $request, string $slug)
    {
        $business = $this->findBusiness($slug);

        $validated = $request->validate([
            'date' => 'required|date_format:Y-m-d',
            // Hizmet bu işletmeye ait olmalı.
            'service_id' => ['required', Rule::exists('services', 'id')->where('user_id', $business->id)],
        ]);

        $service = Service::where('user_id', $business->id)->findOrFail($validated['service_id']);
        $duration = (int) $service->duration_minutes;
        $date = Carbon::parse($validated['date'])->startOfDay();

        // Geçmiş gün için boş döndür
        if ($date->isPast() && ! $date->isToday()) {
            return response()->json(['slots' => []]);
        }

        $dayKey = strtolower($date->format('D'));
        $day = $business->business_hours[$dayKey] ?? null;
        if (! $day || empty($day['is_open'])) {
            return response()->json(['slots' => []]);
        }

        [$startH, $startM] = explode(':', $day['start']);
        [$endH, $endM] = explode(':', $day['end']);
        $openAt = $date->copy()->setTime((int) $startH, (int) $startM);
        $closeAt = $date->copy()->setTime((int) $endH, (int) $endM);

        // 15 dk aralıklı tüm olası başlangıç saatleri
        $candidates = CarbonPeriod::create($openAt, '15 minutes', $closeAt->copy()->subMinutes($duration));

        // O gün rezerve olmayan randevular (iptal hariç)
        $existing = Appointment::where('user_id', $business->id)
            ->whereDate('starts_at', $date->toDateString())
            ->whereIn('status', ['pending', 'confirmed', 'completed'])
            ->get(['starts_at', 'ends_at']);

        $slots = [];
        $now = Carbon::now();

        foreach ($candidates as $slotStart) {
            $slotEnd = $slotStart->copy()->addMinutes($duration);

            // Bugünse: geçmiş saatleri atla + şu andan en az 30 dk sonra olmalı
            if ($slotStart->lte($now->copy()->addMinutes(30))) {
                continue;
            }

            // Mola saatine çakışıyor mu?
            if (! empty($day['break_start']) && ! empty($day['break_end'])) {
                [$bsH, $bsM] = explode(':', $day['break_start']);
                [$beH, $beM] = explode(':', $day['break_end']);
                $breakStart = $date->copy()->setTime((int) $bsH, (int) $bsM);
                $breakEnd = $date->copy()->setTime((int) $beH, (int) $beM);
                if ($slotStart->lt($breakEnd) && $slotEnd->gt($breakStart)) {
                    continue;
                }
            }

            // Mevcut randevularla çakışıyor mu?
            $conflicts = $existing->contains(function ($a) use ($slotStart, $slotEnd) {
                return Carbon::parse($a->starts_at)->lt($slotEnd)
                    && Carbon::parse($a->ends_at)->gt($slotStart);
            });
            if ($conflicts) {
                continue;
            }

            $slots[] = $slotStart->format('H:i');
        }

        return response()->json(['slots' => $slots]);
    }

    /**
     * Yeni randevu oluşturur. Müşteri telefona göre bul-oluştur mantığıyla
     * kaydedilir (aynı numarayla ikinci kayıt açılmaz).
     *
     * POST /api/public/{slug}/book
     */
    public function book(Request $request, string $slug)
    {
        $business = $this->findBusiness($slug);

        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_phone' => ['required', 'string', 'regex:/^[0-9+()\s-]{10,20}$/'],
            'customer_email' => 'nullable|email|max:255',
            // Hizmet bu işletmeye ait ve aktif olmalı.
            'service_id' => [
                'required',
                Rule::exists('services', 'id')->where('user_id', $business->id)->where('is_active', 1),
            ],
            'starts_at' => 'required|date|after:now',
            'note' => 'nullable|string|max:500',
        ]);

        $service = Service::where('user_id', $business->id)->findOrFail($validated['service_id']);
        $startsAt = Carbon::parse($validated['starts_at']);
        $endsAt = $startsAt->copy()->addMinutes((int) $service->duration_minutes);

        // Çalışma saati kontrolü (admin paneliyle aynı mantık)
        $error = $this->checkBusinessHours($business, $startsAt, $endsAt);
        if ($error) {
            return response()->json(['message' => $error], 422);
        }

        // Çakışma kontrolü
        $conflict = Appointment::where('user_id', $business->id)
            ->whereIn('status', ['pending', 'confirmed', 'completed'])
            ->where('starts_at', '<', $endsAt)
            ->where('ends_at', '>', $startsAt)
            ->exists();
        if ($conflict) {
            return response()->json([
                'message' => 'Seçtiğiniz saat az önce doldu. Lütfen başka bir saat seçin.',
            ], 409);
        }

        // Müşteriyi telefon ile bu işletme içinde bul veya oluştur (duplicate yok).
        $normalized = preg_replace('/\D/', '', $validated['customer_phone']);
        $customer = Customer::where('user_id', $business->id)->where('phone', $normalized)->first()
            ?? Customer::create([
                'user_id' => $business->id,
                'name' => $validated['customer_name'],
                'phone' => $normalized,
                'email' => $validated['customer_email'] ?? null,
            ]);

        $appointment = Appointment::create([
            'customer_id' => $customer->id,
            'service_id' => $service->id,
            'user_id' => $business->id,
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'status' => 'pending',
            'note' => $validated['note'] ?? null,
        ]);

        // Onay SMS'i (best-effort). NetGSM tanımlı değilse send() false döner;
        // bu durumda kullanıcıya "SMS gönderildi" demeyiz (yanıltıcı olmasın).
        $smsSent = $this->smsService->send(
            $customer->phone,
            sprintf(
                '%s tarihinde %s hizmeti için randevunuz alındı. İyi günler!',
                $startsAt->format('d.m.Y H:i'),
                $service->name,
            ),
        );

        return response()->json([
            'message' => $smsSent
                ? 'Randevunuz alındı. Onay SMS\'i gönderildi.'
                : 'Randevunuz alındı.',
            'sms_sent' => $smsSent,
            'appointment' => [
                'starts_at' => $appointment->starts_at->toIso8601String(),
                'ends_at' => $appointment->ends_at->toIso8601String(),
                'service' => $service->name,
            ],
        ], 201);
    }

    /** Admin olmayan + slug bulunamazsa 404. */
    private function findBusiness(string $slug): User
    {
        return User::where('slug', $slug)->where('role', 'admin')->firstOrFail();
    }

    /**
     * AppointmentController@checkBusinessHours ile aynı mantık - oradaki kodu
     * bir trait'e çıkarmak düşünülebilir, şimdilik tekrarı net tutuyoruz.
     */
    private function checkBusinessHours(User $owner, Carbon $startsAt, Carbon $endsAt): ?string
    {
        if ($startsAt->toDateString() !== $endsAt->toDateString()) {
            return 'Randevu aynı gün içinde başlayıp bitmelidir.';
        }

        $bh = $owner->business_hours;
        $dayKey = strtolower($startsAt->format('D'));
        $day = $bh[$dayKey] ?? null;

        if (! $day || empty($day['is_open'])) {
            return 'Seçilen gün işletme kapalı.';
        }

        $toMin = fn(string $hhmm) => (int) explode(':', $hhmm)[0] * 60 + (int) explode(':', $hhmm)[1];
        $openMin = $toMin($day['start']);
        $closeMin = $toMin($day['end']);
        $startMin = $startsAt->hour * 60 + $startsAt->minute;
        $endMin = $endsAt->hour * 60 + $endsAt->minute;

        if ($startMin < $openMin || $endMin > $closeMin) {
            return sprintf('Randevu çalışma saatleri (%s–%s) dışında.', $day['start'], $day['end']);
        }

        if (! empty($day['break_start']) && ! empty($day['break_end'])) {
            $bs = $toMin($day['break_start']);
            $be = $toMin($day['break_end']);
            if ($startMin < $be && $endMin > $bs) {
                return sprintf('Randevu mola saatine (%s–%s) denk geliyor.', $day['break_start'], $day['break_end']);
            }
        }

        return null;
    }
}

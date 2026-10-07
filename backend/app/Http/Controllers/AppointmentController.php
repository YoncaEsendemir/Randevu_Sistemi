<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\User;
use App\Services\SmsService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AppointmentController extends Controller
{
    public function __construct(private SmsService $smsService)
    {
    }

    /**
     * Giriş yapan işletmenin randevularını listele.
     * Multi-tenant: her işletme yalnızca kendi randevularını görür.
     */
    public function index(Request $request)
    {
        $appointments = Appointment::with(['customer', 'service'])
            ->where('user_id', $request->user()->id)
            ->orderBy('starts_at')
            ->get();

        return response()->json($appointments);
    }

    /**
     * Yeni bir randevu oluştur. Önce çalışma saati kontrolü, sonra çakışma kontrolü.
     */
    public function store(Request $request)
    {
        $userId = $request->user()->id;

        $validated = $request->validate([
            // Müşteri ve hizmet, yalnızca giriş yapan işletmeye ait olabilir.
            'customer_id' => ['required', Rule::exists('customers', 'id')->where('user_id', $userId)],
            'service_id' => ['required', Rule::exists('services', 'id')->where('user_id', $userId)],
            'starts_at' => 'required|date',
            'ends_at' => 'required|date|after:starts_at',
            'note' => 'nullable|string',
        ]);

        // Çalışma saati kontrolü (gün kapalı mı, aralık dışı mı, molaya denk mi).
        $bhError = $this->checkBusinessHours($request->user(), $validated['starts_at'], $validated['ends_at']);
        if ($bhError) {
            return response()->json(['message' => $bhError], 422);
        }

        // Çakışma kontrolü - aynı kullanıcının aynı aralıkta iptal edilmemiş randevusu.
        if ($this->hasConflict($userId, $validated['starts_at'], $validated['ends_at'])) {
            return response()->json([
                'message' => 'Bu zaman aralığında zaten bir randevu var.',
            ], 409);
        }

        $appointment = Appointment::create([
            ...$validated,
            'user_id' => $userId,
            'status' => 'pending',
        ]);

        $appointment->load(['customer', 'service']);

        // SMS gönderimi best-effort - hata olsa randevu yine kaydedildi.
        $smsSent = $this->smsService->send(
            $appointment->customer->phone,
            sprintf(
                'Sayın %s, %s tarihinde %s hizmeti için randevunuz oluşturuldu.',
                $appointment->customer->name,
                $appointment->starts_at->format('d.m.Y H:i'),
                $appointment->service->name,
            ),
        );

        return response()->json([
            ...$appointment->toArray(),
            'sms_sent' => $smsSent,
        ], 201);
    }

    public function show(Request $request, Appointment $appointment)
    {
        $this->authorizeAccess($request, $appointment);

        return response()->json($appointment->load(['customer', 'service']));
    }

    public function update(Request $request, Appointment $appointment)
    {
        $this->authorizeAccess($request, $appointment);

        $userId = $request->user()->id;

        $validated = $request->validate([
            'customer_id' => ['sometimes', 'required', Rule::exists('customers', 'id')->where('user_id', $userId)],
            'service_id' => ['sometimes', 'required', Rule::exists('services', 'id')->where('user_id', $userId)],
            'starts_at' => 'sometimes|required|date',
            'ends_at' => 'sometimes|required|date|after:starts_at',
            'status' => 'sometimes|required|in:pending,confirmed,cancelled,completed',
            'note' => 'nullable|string',
        ]);

        // Zaman değişiyorsa çalışma saati tekrar kontrol edilmeli.
        if (isset($validated['starts_at']) || isset($validated['ends_at'])) {
            $starts = $validated['starts_at'] ?? $appointment->starts_at;
            $ends = $validated['ends_at'] ?? $appointment->ends_at;
            $owner = $appointment->user ?? $request->user();

            $bhError = $this->checkBusinessHours($owner, $starts, $ends);
            if ($bhError) {
                return response()->json(['message' => $bhError], 422);
            }

            // Yeni saatte başka bir randevuyla çakışma var mı? (kendi kaydı hariç)
            if ($this->hasConflict($appointment->user_id, $starts, $ends, $appointment->id)) {
                return response()->json([
                    'message' => 'Bu zaman aralığında zaten bir randevu var.',
                ], 409);
            }
        }

        $appointment->update($validated);

        return response()->json($appointment->load(['customer', 'service']));
    }

    public function destroy(Request $request, Appointment $appointment)
    {
        $this->authorizeAccess($request, $appointment);

        $appointment->delete();

        return response()->json(null, 204);
    }

    /**
     * Çakışma kontrolü - $ignoreId verilirse o randevu dahil edilmez (update senaryosu).
     */
    private function hasConflict(int $userId, $starts, $ends, ?int $ignoreId = null): bool
    {
        $query = Appointment::where('user_id', $userId)
            ->where('status', '!=', 'cancelled')
            ->where(function ($q) use ($starts, $ends) {
                $q->where('starts_at', '<', $ends)
                    ->where('ends_at', '>', $starts);
            });

        if ($ignoreId) {
            $query->where('id', '!=', $ignoreId);
        }

        return $query->exists();
    }

    /**
     * Randevu çalışma saatleri içinde mi?
     * Döndürür: null = sorun yok, string = hata mesajı (frontend göstermek üzere).
     *
     * Kurallar:
     *   1) Randevu gününde işletme açık olmalı
     *   2) starts_at >= gün_start ve ends_at <= gün_end
     *   3) Mola saati tanımlıysa [starts_at, ends_at] molayla kesişmemeli
     *   4) Randevu aynı gün içinde kalmalı (gece yarısını geçmemeli)
     */
    private function checkBusinessHours(User $owner, $starts, $ends): ?string
    {
        $startsAt = Carbon::parse($starts);
        $endsAt = Carbon::parse($ends);

        // Gün yılı sarması/gece yarısı aşımı engeli
        if ($startsAt->toDateString() !== $endsAt->toDateString()) {
            return 'Randevu aynı gün içinde başlayıp bitmelidir.';
        }

        $bh = $owner->business_hours;
        // Carbon'un ingilizce kısaltması "Mon" vs. - lowercase'e çevirip anahtarla eşle
        $dayKey = strtolower($startsAt->format('D')); // mon, tue, ...

        $day = $bh[$dayKey] ?? null;
        if (!$day || empty($day['is_open'])) {
            return 'Bu gün işletme kapalı. Lütfen başka bir gün seçin.';
        }

        $toMinutes = fn(string $hhmm) => (int) explode(':', $hhmm)[0] * 60 + (int) explode(':', $hhmm)[1];

        $openMin = $toMinutes($day['start']);
        $closeMin = $toMinutes($day['end']);
        $startMin = $startsAt->hour * 60 + $startsAt->minute;
        $endMin = $endsAt->hour * 60 + $endsAt->minute;

        if ($startMin < $openMin || $endMin > $closeMin) {
            return sprintf(
                'Randevu çalışma saatleri (%s–%s) dışında.',
                $day['start'],
                $day['end']
            );
        }

        // Mola kontrolü - [start, end) molayla kesişiyor mu?
        if (!empty($day['break_start']) && !empty($day['break_end'])) {
            $breakStart = $toMinutes($day['break_start']);
            $breakEnd = $toMinutes($day['break_end']);

            // Kesişim: startMin < breakEnd  AND  endMin > breakStart
            if ($startMin < $breakEnd && $endMin > $breakStart) {
                return sprintf(
                    'Randevu mola saatine (%s–%s) denk geliyor.',
                    $day['break_start'],
                    $day['break_end']
                );
            }
        }

        return null;
    }

    /**
     * Multi-tenant: bir işletme yalnızca kendi randevusuna erişebilir.
     * Başka işletmenin randevusu için 404 (varlığını sızdırmamak için).
     */
    private function authorizeAccess(Request $request, Appointment $appointment): void
    {
        if ($appointment->user_id !== $request->user()->id) {
            abort(404);
        }
    }
}

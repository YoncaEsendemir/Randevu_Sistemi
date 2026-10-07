<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    /**
     * Bir telefon numarasına SMS gönderir.
     *
     * @param  string  $phone  Herhangi bir formatta gelebilir (0555..., +90555..., 555...)
     * @param  string  $message  Gönderilecek metin
     * @return bool  Gönderim NetGSM tarafından kabul edildiyse true, aksi halde false
     */
    public function send(string $phone, string $message): bool
    {
        $userCode = config('services.netgsm.usercode');
        $password = config('services.netgsm.password');
        $header = config('services.netgsm.header');

        // Kimlik bilgileri .env'de tanımlı değilse (örn. henüz NetGSM hesabı
        // açılmadıysa) SMS göndermeyi dene bile - sessizce logla ve devam et.
        // Bu sayede SMS ayarlanmamışken bile randevu oluşturma bozulmaz.
        if (! $userCode || ! $password || ! $header) {
            Log::warning('SMS gönderilemedi: NetGSM kimlik bilgileri .env dosyasında tanımlı değil.');

            return false;
        }

        try {
            $response = Http::withBasicAuth($userCode, $password)
                ->post('https://api.netgsm.com.tr/sms/rest/v2/send', [
                    'msgheader' => $header,
                    // 'TR' -> Türkçe karakterleri (ş, ğ, ı gibi) doğru gönderir.
                    'encoding' => 'TR',
                    'messages' => [
                        [
                            'msg' => $message,
                            'no' => $this->normalizePhone($phone),
                        ],
                    ],
                ]);

            $code = $response->json('code');

            // NetGSM başarı durumunda "00", "01" veya "02" kodu döner.
            // Bunların dışındaki her kod bir hata anlamına gelir.
            if (in_array($code, ['00', '01', '02'], true)) {
                return true;
            }

            Log::warning('NetGSM SMS gönderimi reddetti.', [
                'code' => $code,
                'description' => $response->json('description'),
            ]);

            return false;
        } catch (\Throwable $e) {
            // Ağ hatası, zaman aşımı vb. - SMS gönderilemedi ama uygulamanın
            // geri kalanı (randevu kaydı) etkilenmesin diye burada durduruyoruz.
            Log::error('NetGSM SMS gönderimi sırasında hata: ' . $e->getMessage());

            return false;
        }
    }

    /**
     * "0555 123 45 67", "+90 555 123 45 67" gibi farklı yazımları
     * NetGSM'in beklediği "5551234567" (10 haneli, baştaki 0/90 olmadan) haline getirir.
     */
    private function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\D/', '', $phone); // sadece rakamları bırak
        // Sondan 10 haneyi al - ülke kodu veya baştaki 0 ne olursa olsun işe yarar.
        return substr($digits, -10);
    }
}
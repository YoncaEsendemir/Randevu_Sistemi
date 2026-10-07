# Güvenlik

[← README'ye dön](../README.md)

- Sanctum Bearer token ile kimlik doğrulama
- **Token süresi (TTL):** varsayılan 24 saat (`SANCTUM_EXPIRATION` env ile değiştirilebilir, prod'da 480 dk önerilir)
- **Global API hız sınırı:** token/IP başına dakikada 60 istek (`throttle:60,1`)
- **Login/register ekstra sınırı:** aynı IP'den dakikada 5 deneme (`throttle:5,1`) — brute-force'u zorlaştırır
- **Public booking hız sınırı:** okuma 30/dk, randevu oluşturma (book) 3/dk — spam randevuyu zorlaştırır
- Güçlü şifre zorunluluğu (en az 8 karakter, harf + rakam)
- **CORS whitelist:** `FRONTEND_URL` env'inde tanımlı origin(ler) dışında istek reddedilir (joker `*` yok)
- Randevularda sahiplik kontrolü (başkasının randevusuna erişim engellenir)
- Nginx seviyesinde `.env` / `.git` gibi gizli dosyalara erişim engeli
- Mass assignment koruması (`$fillable`) ve Eloquent ORM ile SQL enjeksiyonuna karşı doğal koruma
- Frontend axios interceptor'ı: 401 → otomatik logout (döngü koruması), 429 → kullanıcı dostu uyarı mesajı

## Prod'a geçerken `.env`'de değişmesi gerekenler

```env
APP_ENV=production
APP_DEBUG=false          # kritik: true iken hata ekranı DB şifresi gibi gizli bilgileri sızdırır
APP_URL=https://...      # HTTPS adresi
LOG_LEVEL=warning
SANCTUM_EXPIRATION=480   # 8 saat
FRONTEND_URL=https://randevu.senin-domain.com
```

Ayrıca prod'da:
- `php artisan config:cache && php artisan route:cache` ile config/route cache aç
- Nginx önüne Let's Encrypt sertifikası kur (HTTPS)
- `AppServiceProvider::boot()` içinde `URL::forceScheme('https')` eklemeyi düşün
- NetGSM bilgilerini (`.env`) doldur, aksi halde SMS sessizce atlanır (sistem bozulmaz)

# Randevu Sistemi

Küçük ölçekli işletmeler (kuaför, klinik, güzellik salonu, oto servis vb.) için
geliştirilen, müşteri / hizmet / randevu yönetimini tek bir panelden yapmayı
sağlayan bir randevu takip sistemi. Müşteriler ayrıca paylaşılabilir bir linkten
giriş yapmadan **online randevu** alabilir. Backend ve frontend tamamen ayrı
birer uygulama olarak, Docker üzerinde birlikte çalışacak şekilde tasarlandı.

## Hızlı başlangıç

```bash
docker compose up -d
```

Sonra tarayıcıda **http://localhost:5173** adresini aç. (API `:8000`, phpMyAdmin `:8090`.)
Detay için → [Kurulum ve Günlük Kullanım](docs/07-kurulum.md)

## Dokümanlar

| Başlık | İçerik |
|---|---|
| [01 — Özellikler](docs/01-ozellikler.md) | Sistemin yaptıkları |
| [02 — Teknolojiler](docs/02-teknolojiler.md) | Backend / frontend / altyapı stack'i |
| [03 — Mimari ve Klasör Yapısı](docs/03-mimari.md) | 6 servisli Docker mimarisi + dizinler |
| [04 — Veritabanı Şeması](docs/04-veritabani.md) | Tablolar, ilişkiler, migration'lar |
| [05 — API Uçları](docs/05-api.md) | Korunan + herkese açık uçlar |
| [06 — Güvenlik](docs/06-guvenlik.md) | Kimlik doğrulama, rate limit, prod .env |
| [07 — Kurulum ve Günlük Kullanım](docs/07-kurulum.md) | Komutlar, port tablosu, sık hatalar |
| [08 — Yol Haritası](docs/08-yol-haritasi.md) | Tamamlananlar + sıradakiler |

## Özet

- **Stack:** Laravel (PHP 8.4) + Sanctum + MySQL 8.4 · React 19 + TypeScript + Vite + Tailwind v4
- **Altyapı:** Docker Compose — 6 servis (frontend, webserver, app, db, phpmyadmin, scheduler)
- **Durum:** MVP tamam — çalışma saatleri, hatırlatma SMS'i ve public booking dahil

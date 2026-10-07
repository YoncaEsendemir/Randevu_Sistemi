# Kurulum ve Günlük Kullanım

[← README'ye dön](../README.md)

## İlk kurulum (tek sefer)

```bash
# 1) Servisleri başlat (ilk sefer imaj indirir/kurar)
docker compose up -d --build

# 2) Veritabanını hazırla
docker compose exec app php artisan migrate

# 3) Frontend bağımlılıklarını kur
docker compose exec frontend npm install
```

`.env` dosyasında veritabanı ve (varsa) NetGSM bilgilerinin doldurulmuş olması gerekir.

## Her gün projeye başlarken

Sadece **tek komut** — container'ları ayağa kaldırır:

```bash
docker compose up -d
```

İşin bitince (opsiyonel) durdurmak için:

```bash
docker compose stop
```

> `migrate`, `npm install`, `tinker`, `route:list` gibi komutlar **her açılışta gerekmez** —
> onlar sadece ilk kurulumda veya bir sorunu incelerken çalıştırılır.

## Adresler — hangi port ne?

| Port | Ne | Ne zaman açarsın |
|---|---|---|
| **http://localhost:5173** | **React uygulaması (tüm sayfalar)** | **Her zaman** — panel, login, `/randevu-al/<slug>` |
| http://localhost:8000 | Laravel **API** (sayfa yok) | Açmazsın; sayfalar arka planda buraya istek atar |
| http://localhost:8090 | phpMyAdmin (veritabanı) | Sadece DB'ye bakmak istersen |

> ⚠️ **Sık yapılan hata:** Panel/sayfalar `:5173`'tedir, `:8000` değil.
> `:8000/randevu-al/...` açarsan **404** alırsın çünkü orada sadece API var.

## İşe yarayan komutlar (gerekince)

```bash
# Container durumu
docker compose ps

# Logları izle (ör. scheduler)
docker compose logs scheduler -f

# Laravel
docker compose exec app php artisan migrate:status
docker compose exec app php artisan optimize:clear
docker compose exec app php artisan route:list

# Hatırlatma SMS'ini elle tetikle (test)
docker compose exec app php artisan app:send-appointment-reminders
```

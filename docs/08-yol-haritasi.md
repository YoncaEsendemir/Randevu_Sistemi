# Yol Haritası

[← README'ye dön](../README.md)

## Tamamlananlar

- [x] Temel CRUD: müşteri, hizmet, randevu + çakışma kontrolü
- [x] Kimlik doğrulama (Sanctum) + rol bazlı yetki (admin/staff)
- [x] Dashboard (grafikler) + takvim (FullCalendar sürükle-bırak)
- [x] Frontend modernizasyonu (dark mode, Command Palette, animasyonlar)
- [x] Üretim sertleştirmesi: Sanctum TTL, global rate limit, CORS whitelist, prod .env rehberi
- [x] İşletmeye özel **çalışma saatleri** (Ayarlar sayfası + `business_hours` JSON + appointment validation)
- [x] Zamanlanmış **hatırlatma SMS'leri** (Laravel scheduler + `reminder_sent_at`)
- [x] **Public booking** sayfası (`/randevu-al/<slug>`)

## Sırada (öncelik sırasıyla)

- [ ] **Multi-tenant desteği** ⭐ (SaaS olarak satmak için)
  - `businesses` tablosu + `users.business_id`
  - Services / Customers / Appointments sorgularına `business_id` filtresi
  - Rol: `owner` + `staff`
- [ ] **Sunucu tarafı sayfalama** (`->paginate(10)`) — 500+ kayıtta performans
- [ ] **PHPUnit/Pest testleri** — auth, çakışma, çalışma saati, public booking
- [ ] **HTTPS deployment** — Nginx + Let's Encrypt (kod hazır)

## Not: Versiyon kontrolü

Bu proje şu an **git ile takip edilmiyor** (ana klasörde `C:/Users/esend`
seviyesinde bir repo var ama `randevuSistemi` oraya dahil değil). Üretime
geçmeden önce proje için **kendi git deposu** açılması önerilir:

```bash
cd randevuSistemi
git init
# .gitignore'a vendor/, node_modules/, .env eklenmeli
git add .
git commit -m "İlk sürüm: MVP tamamlandı"
```

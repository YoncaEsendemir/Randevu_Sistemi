# Veritabanı Şeması

[← README'ye dön](../README.md)

4 ana tablo ve aralarındaki ilişkiler:

- **users** — işletme sahibi/çalışan hesapları
  - `role`: admin / staff
  - `business_hours` (JSON) — her gün için açık/kapalı + saat + opsiyonel mola
  - `slug` (unique) — public booking linki için (`/randevu-al/<slug>`)
- **customers** — müşteriler
- **services** — sunulan hizmetler (`duration_minutes`, `price`, `is_active`)
- **appointments** — randevular
  - `customer_id`, `service_id`, `user_id` foreign key'leriyle üç tabloyu bağlar
  - `reminder_sent_at` (nullable timestamp) — hatırlatma SMS'i çift gönderilmesin diye
  - durum: beklemede / onaylı / tamamlandı / iptal

Altyapı tabloları: `personal_access_tokens` (Sanctum), `cache` / `cache_locks`
(hız sınırlama), `password_reset_tokens`, `sessions`, `jobs` (şu an kullanılmıyor).

## İlgili migration'lar (sonradan eklenenler)

| Migration | Ne ekler |
|---|---|
| `add_role_to_users_table` | `users.role` |
| `add_business_hours_to_users_table` | `users.business_hours` (JSON) |
| `add_reminder_sent_at_to_appointments_table` | `appointments.reminder_sent_at` |
| `add_slug_to_users_table` | `users.slug` (unique) + mevcut kayıtlara otomatik slug |

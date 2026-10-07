# API Uçları

[← README'ye dön](../README.md)

Tüm uçların öneki: `/api`

## Korunan uçlar (token gerekli)

| Metod | Adres | Açıklama |
|---|---|---|
| POST | `/logout` | Çıkış yap |
| GET | `/me` | Giriş yapan kullanıcıyı getir |
| GET/POST/PUT/DELETE | `/customers`, `/customers/{id}` | Müşteri CRUD |
| GET/POST/PUT/DELETE | `/services`, `/services/{id}` | Hizmet CRUD |
| GET/POST/PUT/DELETE | `/appointments`, `/appointments/{id}` | Randevu CRUD + çakışma + çalışma saati kontrolü |
| GET | `/settings/business-hours` | Çalışma saatlerini oku (staff okuyabilir) |
| PUT | `/settings/business-hours` | Çalışma saatlerini güncelle (sadece admin) |

`POST /appointments` cevabına ayrıca `sms_sent` (true/false) alanı eklenir —
frontend bunu kullanıcıya bildirim olarak gösterir.

## Herkese açık uçlar

| Metod | Adres | Açıklama | Hız sınırı |
|---|---|---|---|
| POST | `/register` | Kayıt ol (otomatik slug üretir) | 5/dk |
| POST | `/login` | Giriş yap | 5/dk |
| GET | `/public/{slug}` | İşletme + aktif hizmetleri getir | 30/dk |
| GET | `/public/{slug}/available-slots` | Seçilen gün için müsait saat slotları | 30/dk |
| POST | `/public/{slug}/book` | Online randevu oluştur (müşteri bul/oluştur) | 3/dk |

**Not:** Public booking uçları token gerektirmez; `book` çağrısı çalışma saati +
çakışma kontrolü yapar, müşteriyi telefona göre bulur veya oluşturur.

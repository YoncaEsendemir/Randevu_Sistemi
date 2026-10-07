# Sonraki Oturum için Hatırlatma

**Son oturum tarihi:** 2026-10-07
**Durum:** SMS + Public Booking test edildi, Multi-tenant yapıldı ✅

---

## 📍 Nerede Kaldık

### 2026-10-05 — Backend sertleştirme + çalışma saatleri
Sanctum TTL, CORS whitelist, rate limit 60/dk, frontend 401/429 koruması, çalışma
saatleri sistemi (`business_hours` JSON + `/ayarlar` + validation).

### 2026-10-06 — Hatırlatma SMS + Public Booking
Scheduler container, `app:send-appointment-reminders` (24s öncesi), public booking
(`/randevu-al/<slug>`, 3 adım), admin ayarlarında paylaşılabilir link kartı.

### 2026-10-07 — Testler + Multi-tenant (BUGÜN)
- ✅ **Testler geçti:** online randevu alma, çakışma kontrolü, kapalı gün/saat
  reddi, admin panelde anında görünme.
- ⚠️ **SMS gerçekten gitmiyor:** NetGSM `.env`'de boş. Kod doğru (gidemeyince
  sessizce atlıyor, log'a uyarı). NetGSM ücretli; şimdilik SMS kapalı kalacak.
- ✅ **Yanıltıcı mesaj düzeltildi:** Eskiden hep "onay SMS'i gönderildi" diyordu.
  Artık SMS gerçekten gitmezse sadece **"Randevunuz alındı."** yazıyor
  (`PublicBookingController@book` → `sms_sent` döner, frontend ona göre gösterir).
- ✅ **Multi-tenant yapıldı** (aşağıda detay). İki işletme artık tamamen ayrı.
- ✅ **README `docs/` altına bölündü** (01-08 başlık dosyaları).

---

## 🏢 Multi-tenant — ne değişti

**Yaklaşım:** Her işletme = bir admin kullanıcı. `services` ve `customers`'a
`user_id` (sahip işletme) eklendi; tüm sorgular işletmeye göre filtreleniyor.
(Randevularda `user_id` zaten vardı.) Ayrı bir `businesses` tablosu YOK.

- Migration: `2026_10_07_140000_add_user_id_to_services_and_customers`
  - `services.user_id`, `customers.user_id` (FK) + mevcut kayıtlar user 1'e bağlandı
  - `customers.phone` global unique → `(user_id, phone)` birleşik unique
- `ServiceController` / `CustomerController`: liste + erişim + benzersizlik işletme bazında
- `AppointmentController`: herkes sadece kendi işletmesini görür; randevuda
  hizmet/müşteri aynı işletmeden olmalı; admin artık başka işletmeye erişemez
- `PublicBookingController`: public sayfa sadece o işletmenin hizmetlerini gösterir

**Test hesapları:**
| İşletme | Giriş | slug | Hizmet |
|---|---|---|---|
| Test İşletme (kuaför) | test@example.com | `test-isletme` | Saç Kesimi, ağda, saç boyama |
| Hiz Oto Servis | oto@example.com / `parola123` | `hiz-oto-servis` | Yağ Değişimi |

> ⚠️ **Eksik:** staff'ın bir işletmeye bağlanması (çoklu kullanıcı/işletme) yok.
> Gerçek staff istenirse `businesses` tablosu + `users.business_id` gerekir.

---

## 🌐 Adresler — hangi port ne? (ÖNEMLİ)

| Port | Ne | Not |
|---|---|---|
| **http://localhost:5173** | React (tüm sayfalar) | **Panel, login, /randevu-al burada** |
| http://localhost:8000 | Laravel API | Sayfa YOK — burada açarsan **404** |
| http://localhost:8090 | phpMyAdmin | Sadece DB |

---

## ⚡ Hızlı Komutlar

```bash
docker compose up -d                 # projeye başlarken TEK gerekli komut
docker compose stop                  # işin bitince (opsiyonel)
docker compose ps                    # durum
docker compose logs scheduler -f     # scheduler log
docker compose exec app php artisan migrate
docker compose exec app php artisan app:send-appointment-reminders
```

> `migrate`, `tinker`, `route:list` HER AÇILIŞTA gerekmez — sadece kurulumda / sorun incelerken.

---

## 🎯 Sıradaki Yol Haritası

1. ⭐ **`git init`** — proje git ile takip EDİLMİYOR! (git kökü `C:/Users/esend`,
   randevuSistemi dahil değil). `cd randevuSistemi && git init` + `.gitignore`
   (vendor/, node_modules/, .env) + ilk commit.
2. **Sunucu tarafı pagination** (`->paginate(10)`) — ~30 dk
3. **PHPUnit/Pest testleri** — auth, çakışma, çalışma saati, public booking, multi-tenant
4. **HTTPS deployment** — Nginx + Let's Encrypt (kod hazır)
5. (opsiyonel) Tam multi-tenant: `businesses` tablosu + staff-per-business

---

## 🧹 Test artığı veri (istenirse temizlenir)

Bugünkü testlerden kalan: "Hiz Oto Servis" işletmesi, birkaç test randevusu
(8-9 Ekim), "Test Doğrulama" / "Oto Müşteri" müşterileri. Üretim verisi değil.

---

## 🤖 Yeni sohbete başlarken

> "Randevu Sistemi projesindeyim, SONRAKI-OTURUM.md oku, kaldığım yerden devam edelim."

Memory [project-randevu-sistemi.md] da güncel; bu dosya ekstra yedek.

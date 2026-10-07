# Özellikler

[← README'ye dön](../README.md)

- **Kimlik doğrulama** — token tabanlı kayıt, giriş, çıkış (Laravel Sanctum)
- **Müşteri yönetimi** — müşteri ekleme, listeleme, silme (modern onay penceresiyle)
- **Hizmet yönetimi** — hizmet adı, süresi ve fiyatı ile tanımlama
- **Randevu yönetimi**
  - Müşteri + hizmet seçilerek randevu oluşturma
  - Bitiş saatinin, seçilen hizmetin süresine göre otomatik hesaplanması
  - **Çakışma kontrolü** — aynı zaman aralığına ikinci bir randevu alınamaz
  - Haftalık / aylık **takvim görünümü** (FullCalendar) — sürükle-bırak + yeniden boyutlandırma
  - Randevu durumları: beklemede, onaylı, tamamlandı, iptal
- **Çalışma saatleri** — işletme her gün için açık/kapalı + saat aralığı + opsiyonel mola tanımlar; randevular bu saatlere göre doğrulanır
- **SMS bildirimi (NetGSM)**
  - Randevu oluşturulunca müşteriye otomatik bilgilendirme SMS'i
  - **Hatırlatma SMS'i** — randevudan 24 saat önce otomatik (zamanlayıcı / scheduler ile), çift gönderim koruması
- **Public Booking (online randevu)** — müşteri, işletmenin paylaşılabilir linkinden (`/randevu-al/<slug>`) giriş yapmadan kendi randevusunu alır (hizmet → tarih/saat → kişi bilgisi)
- **Rol bazlı yetkilendirme** — admin tüm randevuları, çalışan (staff) sadece kendi randevularını görür
- **Gösterge paneli (dashboard)** — toplam müşteri/hizmet sayısı, günün randevuları, haftalık trend grafiği, popüler hizmetler, tahmini aylık ciro
- **Modern arayüz** — dark mode, Command Palette (⌘K), animasyonlu kartlar, duyarlı (responsive) tasarım; yükleme spinner'ları, onay pencereleri, toast bildirimleri

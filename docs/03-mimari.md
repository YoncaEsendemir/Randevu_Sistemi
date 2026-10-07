# Mimari ve Klasör Yapısı

[← README'ye dön](../README.md)

## Mimari

Proje, Docker Compose ile yönetilen **6 ayrı servisten** oluşur:

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  frontend   │      │  webserver  │─────▶│     app     │
│  (Vite/     │─────▶│  (Nginx)    │      │  (Laravel/  │
│   React)    │ HTTP │  :8000      │ PHP  │   PHP-FPM)  │
│  :5173      │      └─────────────┘      └──────┬──────┘
└─────────────┘                                  │
                          ┌──────────────┐       │
                          │  scheduler   │       │   (aynı Laravel image'ı,
                          │ (schedule:   │───────┤    "php artisan schedule:work"
                          │   work)      │       │    çalıştırır — hatırlatma SMS)
                          └──────────────┘       │
                                           ┌──────▼──────┐      ┌──────────────┐
                                           │     db      │◀────▶│  phpmyadmin  │
                                           │  (MySQL)    │      │    :8090     │
                                           │  :3309      │      └──────────────┘
                                           └─────────────┘
```

Frontend, backend'e sadece HTTP üzerinden (REST API) konuşur; ikisi arasında
doğrudan bir bağımlılık yoktur. `scheduler` servisi `app` ile aynı image'ı
kullanır ama web isteği karşılamaz — sadece zamanlanmış görevleri çalıştırır.

## Klasör Yapısı

```
randevuSistemi/
├── compose.yaml                   (6 servis)
├── docker/
│   ├── php/Dockerfile
│   └── nginx/default.conf
├── docs/                          (bu dokümanlar)
├── backend/                       (Laravel)
│   ├── app/
│   │   ├── Http/Controllers/      Auth, Customer, Service, Appointment,
│   │   │                          Settings, PublicBooking
│   │   ├── Console/Commands/      SendAppointmentReminders.php
│   │   ├── Models/                User, Customer, Service, Appointment
│   │   └── Services/SmsService.php
│   ├── database/migrations/
│   ├── routes/api.php             (korunan + public uçlar)
│   ├── routes/console.php         (scheduler kaydı)
│   └── config/services.php        (NetGSM ayarları), config/cors.php
└── frontend/                       (React + TypeScript)
    └── src/
        ├── api/                   client, customers, services, appointments,
        │                          settings, publicBooking
        ├── components/            Spinner, ConfirmDialog, Toast,
        │                          ProtectedRoute, layout/
        ├── context/AuthContext.tsx
        ├── pages/                 Login, Register, Dashboard, Customers,
        │                          Services, Appointments, Settings,
        │                          PublicBooking
        ├── types/index.ts
        └── App.tsx
```

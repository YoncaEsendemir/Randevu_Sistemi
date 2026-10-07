<?php

use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\PublicBookingController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\SettingsController;
use Illuminate\Support\Facades\Route;

// Herkese açık uçlar (token gerektirmez)
// throttle:5,1 = aynı IP'den dakikada en fazla 5 deneme yapılabilir.
// Bu, birinin şifreleri art arda deneyerek (brute-force) hesap ele
// geçirmeye çalışmasını zorlaştırır.
Route::middleware('throttle:5,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// --- Public booking (müşteri tarafı, giriş gerektirmez) ---
// Okuma uçları daha gevşek (30/dk), book daha sıkı (3/dk) - spam randevuyu zorlaştırır.
Route::prefix('public')->group(function () {
    Route::middleware('throttle:30,1')->group(function () {
        Route::get('/{slug}', [PublicBookingController::class, 'show']);
        Route::get('/{slug}/available-slots', [PublicBookingController::class, 'availableSlots']);
    });
    Route::middleware('throttle:3,1')->group(function () {
        Route::post('/{slug}/book', [PublicBookingController::class, 'book']);
    });
});

// Sanctum token'ı ile korunan uçlar - buraya eklenen her şeyin
// isteğinde "Authorization: Bearer <token>" header'ı olmak zorunda,
// yoksa Laravel otomatik olarak 401 (yetkisiz) hatası döner.
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // apiResource, tek satırda şu 5 route'u otomatik oluşturur:
    // GET /customers (index), POST /customers (store),
    // GET /customers/{id} (show), PUT/PATCH /customers/{id} (update),
    // DELETE /customers/{id} (destroy)
    Route::apiResource('customers', CustomerController::class);
    Route::apiResource('services', ServiceController::class);
    Route::apiResource('appointments', AppointmentController::class);

    // Ayarlar - çalışma saatleri
    // GET: herkes okur (staff bilgi amaçlı)
    // PUT: sadece admin düzenler (controller içinde role kontrolü)
    Route::get('/settings/business-hours', [SettingsController::class, 'getBusinessHours']);
    Route::put('/settings/business-hours', [SettingsController::class, 'updateBusinessHours']);
});
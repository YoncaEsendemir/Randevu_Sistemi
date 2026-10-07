<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'business_hours',
        'slug',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            // JSON <-> PHP array dönüşümü otomatik.
            'business_hours' => 'array',
        ];
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    /**
     * Çalışma saatlerinin varsayılan şablonu (DB null ise bu kullanılır).
     * Format AppointmentController ve SettingsController tarafından paylaşılır.
     */
    public static function defaultBusinessHours(): array
    {
        $weekdays = [
            'mon' => true,  'tue' => true, 'wed' => true,
            'thu' => true,  'fri' => true,
            'sat' => false, 'sun' => false,
        ];

        $hours = [];
        foreach ($weekdays as $day => $isOpen) {
            $hours[$day] = [
                'is_open' => $isOpen,
                'start' => '09:00',
                'end' => '18:00',
                'break_start' => null,
                'break_end' => null,
            ];
        }
        return $hours;
    }

    /**
     * business_hours accessor: DB'de null veya eksikse default döner,
     * böylece controller'lar her yerde ?? kontrolü yapmak zorunda kalmaz.
     */
    public function getBusinessHoursAttribute($value): array
    {
        $stored = $value ? json_decode($value, true) : [];
        $default = self::defaultBusinessHours();

        // Default + stored merge - stored'daki alanlar default'u ezer,
        // yeni bir alan eklediğimizde eski kayıtlar kırılmaz.
        $merged = [];
        foreach ($default as $day => $defaults) {
            $merged[$day] = array_merge($defaults, $stored[$day] ?? []);
        }
        return $merged;
    }
}

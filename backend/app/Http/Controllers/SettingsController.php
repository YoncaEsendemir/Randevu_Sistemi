<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * İşletme ayarları (şimdilik sadece çalışma saatleri).
 * GET  /api/settings/business-hours - oturumdaki kullanıcının saatlerini döner
 *                                     (staff admin'in saatlerini görür)
 * PUT  /api/settings/business-hours - sadece admin düzenleyebilir
 */
class SettingsController extends Controller
{
    private const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

    public function getBusinessHours(Request $request)
    {
        $user = $request->user();

        // Staff kendi hesabı yerine ait olduğu işletmenin (admin) saatlerini okur.
        // Multi-tenant olmadığı için şimdilik: staff ise ilk admin'i bul.
        if ($user->role !== 'admin') {
            $admin = User::where('role', 'admin')->first();
            return response()->json([
                'business_hours' => $admin ? $admin->business_hours : User::defaultBusinessHours(),
                'editable' => false,
            ]);
        }

        return response()->json([
            'business_hours' => $user->business_hours,
            'editable' => true,
        ]);
    }

    public function updateBusinessHours(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'admin') {
            abort(403, 'Sadece yönetici çalışma saatlerini değiştirebilir.');
        }

        // Her gün için ayrı ayrı doğrulama kuralı.
        $rules = [];
        foreach (self::DAYS as $day) {
            $rules["business_hours.$day"] = 'required|array';
            $rules["business_hours.$day.is_open"] = 'required|boolean';
            $rules["business_hours.$day.start"] = ['required', 'string', 'regex:/^\d{2}:\d{2}$/'];
            $rules["business_hours.$day.end"] = ['required', 'string', 'regex:/^\d{2}:\d{2}$/'];
            $rules["business_hours.$day.break_start"] = ['nullable', 'string', 'regex:/^\d{2}:\d{2}$/'];
            $rules["business_hours.$day.break_end"] = ['nullable', 'string', 'regex:/^\d{2}:\d{2}$/'];
        }
        $rules['business_hours'] = ['required', 'array', Rule::in([self::DAYS])];

        $validated = $request->validate(array_merge($rules, [
            'business_hours' => 'required|array',
        ]));

        // Mantıksal tutarlılık kontrolleri (end > start, mola aralık içinde).
        foreach (self::DAYS as $day) {
            $data = $validated['business_hours'][$day];
            if ($data['start'] >= $data['end']) {
                abort(422, "$day: bitiş saati başlangıçtan sonra olmalı.");
            }
            if ($data['break_start'] && $data['break_end']) {
                if ($data['break_start'] >= $data['break_end']) {
                    abort(422, "$day: mola bitişi mola başlangıcından sonra olmalı.");
                }
                if ($data['break_start'] < $data['start'] || $data['break_end'] > $data['end']) {
                    abort(422, "$day: mola, çalışma saatleri içinde olmalı.");
                }
            }
        }

        $user->business_hours = $validated['business_hours'];
        $user->save();

        return response()->json([
            'business_hours' => $user->business_hours,
            'editable' => true,
        ]);
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Her işletme (user/tenant) kendi çalışma saatlerini tanımlayabilsin diye
 * users tablosuna JSON kolonu ekliyoruz. Ayrı tablo kurmak yerine JSON
 * tercih ettik çünkü:
 *   - Kullanıcı başına 1 kayıt (7 gün + mola) - ilişkisel sorgu ihtiyacı yok
 *   - Model tarafında ->casts()['business_hours' => 'array'] ile şeffaf
 *   - UI tek PUT isteğiyle hepsini güncelliyor
 *
 * Format (User modelindeki default ile aynı):
 *   {
 *     "mon": {"is_open": true,  "start": "09:00", "end": "18:00",
 *             "break_start": null, "break_end": null},
 *     ...
 *     "sun": {"is_open": false, ...}
 *   }
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // nullable - mevcut kullanıcılarda null kalır, model default'u devreye girer.
            $table->json('business_hours')->nullable()->after('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('business_hours');
        });
    }
};

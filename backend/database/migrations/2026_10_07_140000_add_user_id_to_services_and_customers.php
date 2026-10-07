<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Multi-tenant: hizmetler ve müşteriler artık bir işletmeye (user) ait.
 * - services.user_id, customers.user_id eklenir (sahip işletme).
 * - Mevcut kayıtlar ilk admin işletmeye bağlanır (veri kaybı olmaz).
 * - customers.phone global unique yerine (user_id, phone) birleşik unique olur:
 *   aynı telefon numarası farklı işletmelerde ayrı müşteri olabilir.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
        });

        Schema::table('customers', function (Blueprint $table) {
            // Önce global unique index'i kaldır (customers_phone_unique).
            $table->dropUnique(['phone']);
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
        });

        // Mevcut (sahipsiz) kayıtları en eski admin işletmeye bağla.
        $firstAdminId = DB::table('users')->where('role', 'admin')->orderBy('id')->value('id');
        if ($firstAdminId) {
            DB::table('services')->whereNull('user_id')->update(['user_id' => $firstAdminId]);
            DB::table('customers')->whereNull('user_id')->update(['user_id' => $firstAdminId]);
        }

        // Telefon benzersizliği artık işletme bazında.
        Schema::table('customers', function (Blueprint $table) {
            $table->unique(['user_id', 'phone']);
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'phone']);
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
            $table->unique('phone');
        });
    }
};

<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * İşletme sayfasının public URL'inde (`/randevu-al/<slug>`) kullanılacak
 * benzersiz slug. Admin kayıt olurken name'den otomatik türetilir,
 * sonradan Ayarlar sayfasından değiştirilebilir.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('slug')->nullable()->unique()->after('role');
        });

        // Mevcut admin kullanıcılar için otomatik slug üret.
        User::whereNull('slug')->get()->each(function (User $user) {
            $base = Str::slug($user->name) ?: 'isletme';
            $slug = $base;
            $i = 2;
            while (User::where('slug', $slug)->exists()) {
                $slug = "{$base}-{$i}";
                $i++;
            }
            $user->update(['slug' => $slug]);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn('slug');
        });
    }
};

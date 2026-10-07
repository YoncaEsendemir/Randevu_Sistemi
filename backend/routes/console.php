<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
 * Her 15 dakikada bir yaklaşan randevular için hatırlatma SMS'i gönder.
 * Command içindeki 15 dk pencere + 15 dk tetikleme = kayma yapmaz.
 * withoutOverlapping: önceki çalışma hâlâ sürüyorsa yenisi başlatılmasın.
 */
Schedule::command('app:send-appointment-reminders')
    ->everyFifteenMinutes()
    ->withoutOverlapping()
    ->runInBackground();

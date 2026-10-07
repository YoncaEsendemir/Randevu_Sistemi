<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // API grubunun tamamına global hız sınırı.
        // throttle:60,1 = token/IP başına dakikada 60 istek.
        // Routes/api.php'de bazı uçlarda ayrıca throttle:5,1 var (login/register) -
        // bu ikisi birlikte çalışır: en sıkı olan geçerli olur.
        $middleware->api(append: [
            'throttle:60,1',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();

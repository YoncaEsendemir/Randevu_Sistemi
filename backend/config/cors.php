<?php

/*
 * Cross-Origin Resource Sharing (CORS) config.
 *
 * Varsayılanda Laravel tüm origin'lere izin verir (* joker).
 * Bu dosya ile sadece frontend adres(ler)ine izin veriyoruz.
 *
 * FRONTEND_URL env'inden okur; birden fazla origin için virgülle ayır
 * (örn. "https://randevu.site, https://admin.randevu.site").
 */

$frontendUrls = array_filter(array_map(
    'trim',
    explode(',', env('FRONTEND_URL', 'http://localhost:5173'))
));

return [

    // CORS'un uygulanacağı yollar - sadece API ve Sanctum uçları.
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    // İzin verilen HTTP metodları.
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    // İzin verilen origin'ler. Jokersiz (* yok) - sadece tanımlı frontend(ler).
    'allowed_origins' => $frontendUrls,

    // Regex desteği (ör. subdomain joker) - şu an gerek yok.
    'allowed_origins_patterns' => [],

    // İzin verilen header'lar - Bearer token için Authorization şart.
    'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],

    // Response'da frontend'in okuyabileceği header'lar.
    'exposed_headers' => [],

    // Preflight cache süresi (saniye). 0 = cache yok, her OPTIONS tekrar sorulur.
    'max_age' => 7200,

    // Bearer token kullandığımız için cookie/session gerekmiyor.
    // SPA + Sanctum stateful akışına geçersen true yap.
    'supports_credentials' => false,

];

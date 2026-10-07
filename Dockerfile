FROM php:8.4-fpm

RUN apt-get update && apt-get install -y --no-install-recommends \
        git curl libpng-dev libjpeg62-turbo-dev libfreetype6-dev libonig-dev libxml2-dev zip unzip libzip-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY ./backend /var/www

RUN composer install --no-interaction --optimize-autoloader || true

CMD ["php-fpm"]
# Dockerfile multi-stage pour Laravel avec Node.js
FROM node:20-alpine AS node-builder

# Installer les dépendances Node.js et construire les assets
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM php:8.2-fpm-alpine AS php-base

# Installer les extensions PHP requises
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libxml2-dev \
    zip \
    unzip \
    postgresql-dev \
    redis \
    nginx \
    supervisor \
    && docker-php-ext-install \
    pdo \
    pdo_pgsql \
    pgsql \
    gd \
    xml \
    && pecl install redis \
    && docker-php-ext-enable redis

# Installer Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Créer le user et groupe www
RUN addgroup -g 1000 -S www && \
    adduser -u 1000 -S www -G www

# Configuration de travail
WORKDIR /var/www/html

# Copier les fichiers de configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/php-fpm.conf /usr/local/etc/php-fpm.d/www.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/php.ini /usr/local/etc/php/conf.d/local.ini

# Copier les fichiers de l'application
COPY --chown=www:www . /var/www/html

# Copier les assets buildés depuis le stage Node.js
COPY --from=node-builder --chown=www:www /app/public/build /var/www/html/public/build

# Installer les dépendances PHP
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Créer les répertoires nécessaires
RUN mkdir -p /var/www/html/storage/logs \
    /var/www/html/storage/framework/cache \
    /var/www/html/storage/framework/sessions \
    /var/www/html/storage/framework/views \
    /var/www/html/bootstrap/cache \
    /var/run/nginx \
    && chown -R www:www /var/www/html/storage \
    && chown -R www:www /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage \
    && chmod -R 775 /var/www/html/bootstrap/cache

# Configuration des permissions
RUN chown -R www:www /var/www/html
USER www

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
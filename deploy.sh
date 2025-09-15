#!/bin/bash

echo "🚀 Déploiement LiveCompetition Production"

# Variables
PROJECT_PATH="/var/www/reveilartist"
WEBSOCKET_SERVICE="websocket"

# Mise à jour du code
echo "📥 Mise à jour du code..."
cd $PROJECT_PATH
git pull origin main

# Installation des dépendances
echo "📦 Installation dépendances PHP..."
composer install --no-dev --optimize-autoloader

echo "📦 Installation dépendances Node.js..."
npm install --production

# Build des assets
echo "🏗️ Build des assets..."
npm run build

# Configuration Laravel
echo "⚙️ Configuration Laravel..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate --force

# Permissions
echo "🔐 Configuration des permissions..."
chown -R www-data:www-data $PROJECT_PATH
chmod -R 755 $PROJECT_PATH/storage
chmod -R 755 $PROJECT_PATH/bootstrap/cache

# Redémarrage des services
echo "🔄 Redémarrage des services..."
systemctl restart nginx
systemctl restart php8.2-fpm
systemctl restart $WEBSOCKET_SERVICE

echo "✅ Déploiement terminé !"
echo "🌐 Site disponible à l'adresse configurée"
echo "🎵 WebSocket actif sur le port 8080"

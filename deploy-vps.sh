#!/bin/bash

# Script de déploiement automatique pour VibeStore237 sur VPS Hostinger
# Usage: ./deploy-vps.sh

set -e

echo "🚀 Début du déploiement VibeStore237..."

# Variables (à configurer)
DOMAIN="vibestordistr.com"
DB_NAME="vibestore237"
DB_USER="vibestore_user"
APP_DIR="/var/www/vibestore"
NGINX_CONFIG="/etc/nginx/sites-available/vibestore"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Fonction pour créer la base de données
setup_database() {
    log_info "Configuration de la base de données PostgreSQL..."
    
    # Générer un mot de passe aléatooire
    DB_PASSWORD=$(openssl rand -base64 32)
    
    sudo -u postgres psql << EOF
CREATE DATABASE ${DB_NAME};
CREATE USER ${DB_USER} WITH ENCRYPTED PASSWORD '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
ALTER USER ${DB_USER} CREATEDB;
\q
EOF
    
    log_success "Base de données créée avec succès"
    echo "Mot de passe DB: ${DB_PASSWORD}" >> /tmp/vibestore_credentials.txt
}

# Fonction pour cloner et configurer l'application
setup_application() {
    log_info "Configuration de l'application..."
    
    # Cloner le repository (remplacer par votre URL)
    if [ ! -d "${APP_DIR}" ]; then
        sudo git clone https://github.com/votre-username/vibestore.git ${APP_DIR}
    else
        cd ${APP_DIR}
        sudo git pull origin main
    fi
    
    cd ${APP_DIR}
    
    # Permissions
    sudo chown -R www-data:www-data ${APP_DIR}
    sudo chmod -R 755 ${APP_DIR}
    sudo chmod -R 775 ${APP_DIR}/storage
    sudo chmod -R 775 ${APP_DIR}/bootstrap/cache
    
    # Copier et configurer .env
    if [ ! -f ".env" ]; then
        sudo cp .env.example .env
        sudo chown www-data:www-data .env
    fi
    
    # Configuration .env
    APP_KEY=$(php artisan key:generate --show)
    DB_PASSWORD=$(cat /tmp/vibestore_credentials.txt | grep "Mot de passe DB:" | cut -d' ' -f4)
    
    sudo sed -i "s/APP_NAME=Laravel/APP_NAME=VibeStore237/" .env
    sudo sed -i "s/APP_ENV=local/APP_ENV=production/" .env
    sudo sed -i "s/APP_DEBUG=true/APP_DEBUG=false/" .env
    sudo sed -i "s|APP_URL=http://localhost|APP_URL=https://${DOMAIN}|" .env
    sudo sed -i "s/APP_KEY=/APP_KEY=${APP_KEY}/" .env
    sudo sed -i "s/DB_DATABASE=reveilartist/DB_DATABASE=${DB_NAME}/" .env
    sudo sed -i "s/DB_USERNAME=root/DB_USERNAME=${DB_USER}/" .env
    sudo sed -i "s/DB_PASSWORD=/DB_PASSWORD=${DB_PASSWORD}/" .env
    sudo sed -i "s/QUEUE_CONNECTION=database/QUEUE_CONNECTION=redis/" .env
    sudo sed -i "s/CACHE_STORE=database/CACHE_STORE=redis/" .env
    
    log_success "Application configurée"
}

# Fonction pour installer les dépendances
install_dependencies() {
    log_info "Installation des dépendances..."
    
    cd ${APP_DIR}
    
    # Dépendances PHP
    sudo -u www-data composer install --no-dev --optimize-autoloader --no-interaction
    
    # Dépendances Node.js
    sudo -u www-data npm ci --only=production
    
    # Build des assets
    sudo -u www-data npm run build
    
    log_success "Dépendances installées"
}

# Fonction pour migrer la base de données
migrate_database() {
    log_info "Migration de la base de données..."
    
    cd ${APP_DIR}
    sudo -u www-data php artisan migrate --force
    sudo -u www-data php artisan db:seed --force
    
    log_success "Base de données migrée"
}

# Fonction pour configurer Nginx
setup_nginx() {
    log_info "Configuration de Nginx..."
    
    sudo tee ${NGINX_CONFIG} > /dev/null << EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    root ${APP_DIR}/public;
    
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    
    index index.php;
    
    charset utf-8;
    
    # Gestion des fichiers statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Upload de fichiers volumineux
    client_max_body_size 100M;
    
    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }
    
    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }
    
    error_page 404 /index.php;
    
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        include fastcgi_params;
        
        # Optimisations FastCGI
        fastcgi_buffer_size 128k;
        fastcgi_buffers 4 256k;
        fastcgi_busy_buffers_size 256k;
        fastcgi_read_timeout 300;
    }
    
    location ~ /\.(?!well-known).* {
        deny all;
    }
}
EOF
    
    # Activer le site
    sudo ln -sf ${NGINX_CONFIG} /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl reload nginx
    
    log_success "Nginx configuré"
}

# Fonction pour configurer SSL
setup_ssl() {
    log_info "Configuration SSL avec Let's Encrypt..."
    
    sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN}
    
    log_success "SSL configuré"
}

# Fonction pour optimiser Laravel
optimize_laravel() {
    log_info "Optimisation de Laravel..."
    
    cd ${APP_DIR}
    sudo -u www-data php artisan config:cache
    sudo -u www-data php artisan route:cache
    sudo -u www-data php artisan view:cache
    sudo -u www-data php artisan event:cache
    
    log_success "Laravel optimisé"
}

# Fonction pour configurer les services
setup_services() {
    log_info "Configuration des services systemd..."
    
    # Service pour Laravel Queue Worker
    sudo tee /etc/systemd/system/vibestore-worker.service > /dev/null << EOF
[Unit]
Description=VibeStore237 Queue Worker
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
Restart=always
ExecStart=/usr/bin/php ${APP_DIR}/artisan queue:work --sleep=3 --tries=3 --max-time=3600
WorkingDirectory=${APP_DIR}

[Install]
WantedBy=multi-user.target
EOF
    
    # Service pour WebSocket (si utilisé)
    if [ -f "${APP_DIR}/websocket-server.php" ]; then
        sudo tee /etc/systemd/system/vibestore-websocket.service > /dev/null << EOF
[Unit]
Description=VibeStore237 WebSocket Server
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
Restart=always
ExecStart=/usr/bin/php ${APP_DIR}/websocket-server.php
WorkingDirectory=${APP_DIR}

[Install]
WantedBy=multi-user.target
EOF
        
        sudo systemctl enable vibestore-websocket
        sudo systemctl start vibestore-websocket
    fi
    
    # Activer les services
    sudo systemctl enable vibestore-worker
    sudo systemctl start vibestore-worker
    
    log_success "Services configurés"
}

# Fonction pour configurer les tâches cron
setup_cron() {
    log_info "Configuration des tâches cron..."
    
    # Ajouter la tâche Laravel Scheduler
    (crontab -u www-data -l 2>/dev/null; echo "* * * * * cd ${APP_DIR} && php artisan schedule:run >> /dev/null 2>&1") | crontab -u www-data -
    
    log_success "Tâches cron configurées"
}

# Fonction principale
main() {
    log_info "Début de l'installation de VibeStore237..."
    
    # Vérifier les prérequis
    if ! command -v nginx &> /dev/null; then
        log_error "Nginx n'est pas installé. Veuillez d'abord installer les dépendances."
        exit 1
    fi
    
    # Demander le nom de domaine
    read -p "Entrez votre nom de domaine (ex: vibestore237.com): " DOMAIN
    if [ -z "$DOMAIN" ]; then
        log_error "Le nom de domaine est requis"
        exit 1
    fi
    
    # Exécuter les étapes
    setup_database
    setup_application
    install_dependencies
    migrate_database
    setup_nginx
    optimize_laravel
    setup_services
    setup_cron
    
    log_warning "Avant de configurer SSL, assurez-vous que votre domaine pointe vers ce serveur"
    read -p "Voulez-vous configurer SSL maintenant? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_ssl
    fi
    
    log_success "🎉 Déploiement terminé avec succès!"
    echo
    echo "📝 Informations importantes:"
    echo "   - URL: https://${DOMAIN}"
    echo "   - Répertoire: ${APP_DIR}"
    echo "   - Logs Nginx: /var/log/nginx/"
    echo "   - Logs Laravel: ${APP_DIR}/storage/logs/"
    echo "   - Credentials: /tmp/vibestore_credentials.txt"
    echo
    echo "🔧 Commandes utiles:"
    echo "   - Redémarrer services: sudo systemctl restart nginx php8.2-fpm vibestore-worker"
    echo "   - Voir logs worker: sudo journalctl -u vibestore-worker -f"
    echo "   - Mettre à jour: cd ${APP_DIR} && git pull && composer install --no-dev && npm run build && php artisan migrate"
}

# Exécution
main "$@"
#!/bin/bash

# Script d'installation Nginx simplifié pour VibeStore
# Usage: sudo ./nginx/install-nginx-simple.sh

set -e

# Variables
DOMAIN="vibestordistr.com"
APP_DIR="/var/www/vibestore"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérification root
if [[ $EUID -ne 0 ]]; then
    log_error "Ce script doit être exécuté en tant que root"
    exit 1
fi

log_info "🔧 Installation Nginx pour VibeStore..."

# Arrêter Nginx s'il tourne
systemctl stop nginx 2>/dev/null || true

# Backup de la configuration existante
if [ -f "/etc/nginx/nginx.conf" ]; then
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
    log_info "Configuration existante sauvegardée"
fi

# Copier la configuration principale
log_info "Installation de la configuration principale..."
cp nginx/nginx-main.conf /etc/nginx/nginx.conf

# Créer les répertoires de cache
log_info "Création des répertoires de cache..."
mkdir -p /var/cache/nginx/vibestore
mkdir -p /var/cache/nginx/vibestore_api
mkdir -p /var/cache/nginx/vibestore_static
mkdir -p /var/cache/nginx/vibestore_thumbnails
chown -R www-data:www-data /var/cache/nginx/

# Installer la configuration du site
log_info "Installation de la configuration du site..."
cp nginx/vibestore-final.conf /etc/nginx/sites-available/vibestore

# Désactiver le site par défaut
rm -f /etc/nginx/sites-enabled/default

# Activer le site VibeStore
ln -sf /etc/nginx/sites-available/vibestore /etc/nginx/sites-enabled/

# Créer les répertoires de logs
mkdir -p /var/log/nginx

# Tester la configuration
log_info "Test de la configuration..."
if nginx -t; then
    log_success "Configuration Nginx valide"
else
    log_error "Erreur dans la configuration Nginx"
    # Restaurer la sauvegarde
    if [ -f "/etc/nginx/nginx.conf.backup" ]; then
        cp /etc/nginx/nginx.conf.backup /etc/nginx/nginx.conf
        log_info "Configuration restaurée"
    fi
    exit 1
fi

# Permissions pour l'application
log_info "Configuration des permissions..."
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR
chmod -R 775 $APP_DIR/storage $APP_DIR/bootstrap/cache

# Démarrer Nginx
log_info "Démarrage de Nginx..."
systemctl enable nginx
systemctl start nginx

# Vérifier le statut
if systemctl is-active --quiet nginx; then
    log_success "🎉 Nginx démarré avec succès!"
    log_info "Site accessible sur: http://$DOMAIN"
    log_info "Pour SSL: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
else
    log_error "Échec du démarrage de Nginx"
    systemctl status nginx
    exit 1
fi

log_success "✅ Installation Nginx terminée!"
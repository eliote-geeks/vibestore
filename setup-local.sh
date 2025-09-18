#!/bin/bash

# Script de setup pour développement local WSL Ubuntu
# Usage: ./setup-local.sh

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
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

log_info "🚀 Configuration VibeStore pour développement local WSL..."

# Vérifier les prérequis
log_info "Vérification des prérequis..."
if ! command -v php &> /dev/null; then
    log_error "PHP n'est pas installé. Installez avec: sudo apt install php8.2 php8.2-fpm php8.2-sqlite3 php8.2-gd php8.2-curl php8.2-mbstring php8.2-xml php8.2-zip"
    exit 1
fi

if ! command -v composer &> /dev/null; then
    log_error "Composer n'est pas installé. Installez depuis: https://getcomposer.org/"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    log_error "Node.js/npm n'est pas installé. Installez avec: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
    exit 1
fi

# Configuration environnement
log_info "Configuration de l'environnement local..."
cp .env.local .env
log_success "Fichier .env configuré pour développement local"

# Installation des dépendances
log_info "Installation des dépendances PHP..."
composer install

log_info "Installation des dépendances JavaScript..."
npm install

# Configuration base de données
log_info "Configuration de la base de données..."
if [ ! -f "database/database.sqlite" ]; then
    touch database/database.sqlite
    log_success "Base de données SQLite créée"
fi

# Génération de la clé d'application
log_info "Génération de la clé d'application..."
php artisan key:generate

# Migrations
log_info "Exécution des migrations..."
php artisan migrate --force

# Permissions de stockage
log_info "Configuration des permissions..."
chmod -R 775 storage bootstrap/cache

# Build des assets
log_info "Build des assets pour développement..."
npm run build

log_success "🎉 Configuration terminée !"
log_info "Commandes utiles :"
echo "  - php artisan serve              # Démarrer le serveur de développement"
echo "  - npm run dev                   # Démarrage Vite en mode watch"
echo "  - php artisan queue:work        # Worker de queue en développement"
echo "  - php artisan migrate:fresh     # Reset de la base de données"
#!/bin/bash

# Script de déploiement pour VPS en production avec Docker
# Usage: ./deploy-production.sh

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

log_info "🚀 Déploiement VibeStore en production Docker..."

# Vérifier qu'on est sur le serveur
if [ ! -f "/var/www/vibestore/docker-compose.prod.yml" ]; then
    log_error "Ce script doit être exécuté sur le serveur VPS dans /var/www/vibestore"
    exit 1
fi

# Configuration environnement production
log_info "Configuration environnement production..."
cp .env.docker .env
log_success "Configuration Docker activée"

# Arrêt des conteneurs existants
log_info "Arrêt des conteneurs existants..."
docker-compose -f docker-compose.prod.yml down

# Pull des dernières modifications
log_info "Récupération des dernières modifications..."
git pull origin main

# Build et démarrage des conteneurs
log_info "Build et démarrage des conteneurs Docker..."
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Attendre que les conteneurs démarrent
log_info "Attente du démarrage des conteneurs..."
sleep 30

# Exécution des migrations
log_info "Exécution des migrations..."
docker exec vibestore_app php artisan migrate --force

# Nettoyage du cache
log_info "Nettoyage du cache..."
docker exec vibestore_app php artisan config:cache
docker exec vibestore_app php artisan route:cache
docker exec vibestore_app php artisan view:cache

# Vérification de l'état
log_info "Vérification de l'état des conteneurs..."
docker-compose -f docker-compose.prod.yml ps

# Test de l'application
log_info "Test de l'application..."
if curl -f -s -H "Host: vibestordistr.com" http://localhost > /dev/null; then
    log_success "🎉 Déploiement réussi ! Application accessible"
else
    log_error "Problème détecté avec l'application"
    docker-compose -f docker-compose.prod.yml logs --tail=20
fi

log_success "Déploiement terminé !"
log_info "URLs :"
echo "  - http://vibestordistr.com     # Site principal"
echo "  - https://vibestordistr.com    # HTTPS (si SSL configuré)"
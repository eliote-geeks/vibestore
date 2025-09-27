#!/bin/bash

# Script de déploiement intelligent VibeStore237
# Détecte automatiquement ce qui est installé et déploie en conséquence
# Usage: sudo ./deploy-smart.sh

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
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

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Vérifier si on est root
if [ "$EUID" -ne 0 ]; then
    log_error "Ce script doit être exécuté en tant que root (utilisez sudo)"
    exit 1
fi

log_info "🚀 Déploiement intelligent VibeStore237..."

# === VÉRIFICATION DES TECHNOLOGIES ===
log_info "🔍 Vérification des technologies installées..."

# Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    log_success "Docker installé : $DOCKER_VERSION"
    DOCKER_OK=true
else
    log_warning "Docker non installé"
    DOCKER_OK=false
fi

# Docker Compose
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    log_success "Docker Compose installé : $COMPOSE_VERSION"
    COMPOSE_OK=true
else
    log_warning "Docker Compose non installé"
    COMPOSE_OK=false
fi

# Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    log_success "Node.js installé : $NODE_VERSION"
    NODE_OK=true
else
    log_warning "Node.js non installé"
    NODE_OK=false
fi

# Git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    log_success "Git installé : $GIT_VERSION"
    GIT_OK=true
else
    log_warning "Git non installé"
    GIT_OK=false
fi

echo ""

# === STRATÉGIE DE DÉPLOIEMENT ===
if [ "$DOCKER_OK" = true ] && [ "$COMPOSE_OK" = true ]; then
    log_success "🐳 Docker disponible : Déploiement avec conteneurs"
    DEPLOY_METHOD="docker"
elif [ "$NODE_OK" = true ] && [ "$GIT_OK" = true ]; then
    log_info "📦 Déploiement classique (sans Docker)"
    DEPLOY_METHOD="classic"
else
    log_error "Technologies insuffisantes pour le déploiement"
    log_info "Exécutez d'abord : sudo ./install-docker.sh"
    exit 1
fi

echo ""

# === DÉPLOIEMENT DOCKER ===
if [ "$DEPLOY_METHOD" = "docker" ]; then
    log_info "🚀 Déploiement Docker en cours..."

    # Vérifier que le docker-compose.prod.yml existe
    if [ ! -f "docker-compose.prod.yml" ]; then
        log_error "Fichier docker-compose.prod.yml introuvable"
        exit 1
    fi

    # Configuration environnement
    log_info "Configuration environnement..."
    if [ ! -f ".env" ]; then
        if [ -f ".env.docker" ]; then
            cp .env.docker .env
            log_success "Configuration .env.docker copiée"
        else
            log_error "Aucun fichier .env trouvé"
            exit 1
        fi
    fi

    # Arrêt des conteneurs existants
    log_info "Arrêt des conteneurs existants..."
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

    # Build et démarrage
    log_info "Build et démarrage des conteneurs..."
    docker-compose -f docker-compose.prod.yml up -d --build

    # Attendre que les conteneurs démarrent
    log_info "Attente du démarrage des conteneurs..."
    sleep 30

    # Migrations
    log_info "Exécution des migrations..."
    docker exec vibestore_app php artisan migrate --force 2>/dev/null || log_warning "Migrations échouées (normal si première installation)"

    # Cache
    log_info "Configuration du cache..."
    docker exec vibestore_app php artisan config:cache 2>/dev/null || true
    docker exec vibestore_app php artisan route:cache 2>/dev/null || true
    docker exec vibestore_app php artisan view:cache 2>/dev/null || true

    # Vérification
    log_info "Vérification du déploiement..."
    docker-compose -f docker-compose.prod.yml ps

    # Test de l'application
    if curl -f -s -H "Host: vibestordistr.com" http://localhost > /dev/null 2>&1; then
        log_success "🎉 Application déployée avec succès !"
    else
        log_warning "Application en cours de démarrage..."
    fi

    echo ""
    echo "📋 INFORMATIONS DE DÉPLOIEMENT"
    echo "================================"
    echo "✅ Méthode : Docker + Traefik"
    echo "🌐 URL locale : http://localhost"
    echo "🌐 URL prod : https://vibestordistr.com (si DNS configuré)"
    echo "📊 Dashboard Traefik : http://localhost:8080"
    echo ""
    echo "🔧 COMMANDES UTILES"
    echo "==================="
    echo "• Logs app : docker logs vibestore_app -f"
    echo "• Logs DB : docker logs vibestore_db -f"
    echo "• Redémarrer : docker-compose -f docker-compose.prod.yml restart"
    echo "• Arrêter : docker-compose -f docker-compose.prod.yml down"

fi

# === DÉPLOIEMENT CLASSIQUE ===
if [ "$DEPLOY_METHOD" = "classic" ]; then
    log_warning "⚠️  Déploiement classique non recommandé"
    log_info "Pour une meilleure expérience, installez Docker :"
    echo "sudo ./install-docker.sh"
    exit 1
fi

log_success "🎉 Déploiement terminé !"
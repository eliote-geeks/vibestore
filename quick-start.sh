#!/bin/bash

# Script de démarrage rapide pour VibeStore
# Usage: ./quick-start.sh [action]

set -e

# Variables
APP_DIR="/var/www/vibestore"
DOMAIN="vibestordistr.com"
CURRENT_DIR="$(pwd)"

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

# Vérifier qu'on est dans le bon répertoire
check_directory() {
    if [ "$(basename "$CURRENT_DIR")" != "vibestore" ]; then
        log_error "Ce script doit être exécuté depuis /var/www/vibestore"
        log_info "Répertoire actuel: $CURRENT_DIR"
        exit 1
    fi
    
    if [ "$CURRENT_DIR" != "$APP_DIR" ]; then
        log_warning "Attention: Vous n'êtes pas dans $APP_DIR"
        log_info "Répertoire actuel: $CURRENT_DIR"
        read -p "Continuer quand même? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Installation complète
install_full() {
    log_info "🚀 Installation complète de VibeStore..."
    
    # Vérifier les prérequis
    if [[ $EUID -ne 0 ]]; then
        log_error "L'installation complète nécessite les droits root"
        log_info "Utilisez: sudo ./quick-start.sh install"
        exit 1
    fi
    
    # Installer Nginx
    log_info "Installation de Nginx..."
    ./nginx/install-nginx.sh "$DOMAIN"
    
    # Déployer l'application
    log_info "Déploiement de l'application..."
    ./deploy-vps.sh
    
    log_success "🎉 Installation complète terminée!"
    log_info "Votre site est accessible sur: https://$DOMAIN"
}

# Déploiement simple
deploy_simple() {
    log_info "📦 Déploiement simple de VibeStore..."
    
    if [[ $EUID -ne 0 ]]; then
        log_error "Le déploiement nécessite les droits root"
        log_info "Utilisez: sudo ./quick-start.sh deploy"
        exit 1
    fi
    
    ./deploy-vps.sh
    log_success "Déploiement terminé!"
}

# Configuration Nginx seulement
configure_nginx() {
    log_info "🔧 Configuration Nginx seulement..."
    
    if [[ $EUID -ne 0 ]]; then
        log_error "La configuration Nginx nécessite les droits root"
        log_info "Utilisez: sudo ./quick-start.sh nginx"
        exit 1
    fi
    
    ./nginx/install-nginx.sh "$DOMAIN"
    log_success "Nginx configuré!"
}

# Installation monitoring
install_monitoring() {
    log_info "📊 Installation du monitoring..."
    
    if [[ $EUID -ne 0 ]]; then
        log_error "L'installation du monitoring nécessite les droits root"
        log_info "Utilisez: sudo ./quick-start.sh monitoring"
        exit 1
    fi
    
    ./monitoring-setup.sh
    log_success "Monitoring installé!"
}

# Développement local
dev_setup() {
    log_info "💻 Configuration pour développement local..."
    
    # Vérifier Composer
    if ! command -v composer &> /dev/null; then
        log_error "Composer n'est pas installé"
        exit 1
    fi
    
    # Vérifier Node.js
    if ! command -v npm &> /dev/null; then
        log_error "Node.js/NPM n'est pas installé"
        exit 1
    fi
    
    # Vérifier PHP
    if ! command -v php &> /dev/null; then
        log_error "PHP n'est pas installé"
        exit 1
    fi
    
    # Installation des dépendances
    log_info "Installation des dépendances PHP..."
    composer install
    
    log_info "Installation des dépendances JavaScript..."
    npm install
    
    # Configuration .env
    if [ ! -f ".env" ]; then
        log_info "Création du fichier .env..."
        cp .env.example .env
        php artisan key:generate
    fi
    
    # Build des assets
    log_info "Build des assets..."
    npm run build
    
    log_success "🎉 Environnement de développement prêt!"
    log_info "Commandes utiles:"
    echo "   - php artisan serve     # Démarrer le serveur Laravel"
    echo "   - npm run dev          # Développement avec Vite"
    echo "   - php artisan migrate  # Migrer la base de données"
}

# Tests de l'application
run_tests() {
    log_info "🧪 Exécution des tests..."
    
    # Tests PHP
    if [ -f "vendor/bin/pest" ]; then
        log_info "Tests PHP (Pest)..."
        php artisan test
    elif [ -f "vendor/bin/phpunit" ]; then
        log_info "Tests PHP (PHPUnit)..."
        vendor/bin/phpunit
    else
        log_warning "Aucun framework de test PHP trouvé"
    fi
    
    # Tests JavaScript (si configurés)
    if [ -f "package.json" ] && npm run | grep -q "test"; then
        log_info "Tests JavaScript..."
        npm test
    fi
    
    log_success "Tests terminés!"
}

# Nettoyage des caches
clear_caches() {
    log_info "🧹 Nettoyage des caches..."
    
    # Caches Laravel
    if [ -f "artisan" ]; then
        php artisan cache:clear
        php artisan config:clear
        php artisan route:clear
        php artisan view:clear
        log_info "Caches Laravel nettoyés"
    fi
    
    # Cache Nginx (si root)
    if [[ $EUID -eq 0 ]] && [ -d "/var/cache/nginx" ]; then
        rm -rf /var/cache/nginx/vibestore*
        systemctl reload nginx
        log_info "Cache Nginx nettoyé"
    fi
    
    # Cache Composer
    if command -v composer &> /dev/null; then
        composer clear-cache
        log_info "Cache Composer nettoyé"
    fi
    
    # Cache NPM
    if command -v npm &> /dev/null; then
        npm cache clean --force
        log_info "Cache NPM nettoyé"
    fi
    
    log_success "Nettoyage terminé!"
}

# Status des services
check_status() {
    log_info "📊 Status des services VibeStore..."
    
    echo
    echo "=== Services système ==="
    
    # Nginx
    if systemctl is-active --quiet nginx 2>/dev/null; then
        echo -e "Nginx: ${GREEN}✅ Actif${NC}"
    else
        echo -e "Nginx: ${RED}❌ Inactif${NC}"
    fi
    
    # PHP-FPM
    if systemctl is-active --quiet php8.2-fpm 2>/dev/null; then
        echo -e "PHP-FPM: ${GREEN}✅ Actif${NC}"
    else
        echo -e "PHP-FPM: ${RED}❌ Inactif${NC}"
    fi
    
    # Base de données
    if systemctl is-active --quiet postgresql 2>/dev/null; then
        echo -e "PostgreSQL: ${GREEN}✅ Actif${NC}"
    elif systemctl is-active --quiet mysql 2>/dev/null; then
        echo -e "MySQL: ${GREEN}✅ Actif${NC}"
    else
        echo -e "Base de données: ${RED}❌ Inactif${NC}"
    fi
    
    # Redis
    if systemctl is-active --quiet redis-server 2>/dev/null; then
        echo -e "Redis: ${GREEN}✅ Actif${NC}"
    else
        echo -e "Redis: ${RED}❌ Inactif${NC}"
    fi
    
    echo
    echo "=== Services VibeStore ==="
    
    # Worker Laravel
    if systemctl is-active --quiet vibestore-worker 2>/dev/null; then
        echo -e "Queue Worker: ${GREEN}✅ Actif${NC}"
    else
        echo -e "Queue Worker: ${RED}❌ Inactif${NC}"
    fi
    
    # WebSocket (si configuré)
    if systemctl is-active --quiet vibestore-websocket 2>/dev/null; then
        echo -e "WebSocket: ${GREEN}✅ Actif${NC}"
    else
        echo -e "WebSocket: ${YELLOW}⚠️ Non configuré${NC}"
    fi
    
    echo
    echo "=== Monitoring (optionnel) ==="
    
    # Prometheus
    if systemctl is-active --quiet prometheus 2>/dev/null; then
        echo -e "Prometheus: ${GREEN}✅ Actif${NC}"
    else
        echo -e "Prometheus: ${YELLOW}⚠️ Non installé${NC}"
    fi
    
    # Grafana
    if systemctl is-active --quiet grafana-server 2>/dev/null; then
        echo -e "Grafana: ${GREEN}✅ Actif${NC}"
    else
        echo -e "Grafana: ${YELLOW}⚠️ Non installé${NC}"
    fi
    
    echo
    echo "=== Informations réseau ==="
    echo "Domaine: $DOMAIN"
    if command -v curl &> /dev/null; then
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost 2>/dev/null || echo "000")
        if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "302" ]; then
            echo -e "Site local: ${GREEN}✅ Accessible (HTTP $HTTP_STATUS)${NC}"
        else
            echo -e "Site local: ${RED}❌ Non accessible (HTTP $HTTP_STATUS)${NC}"
        fi
    fi
}

# Affichage de l'aide
show_help() {
    echo "🎵 VibeStore - Script de démarrage rapide"
    echo
    echo "Usage: ./quick-start.sh [action]"
    echo
    echo "Actions disponibles:"
    echo "  install     Installation complète (Nginx + Application)"
    echo "  deploy      Déploiement de l'application uniquement"
    echo "  nginx       Configuration Nginx uniquement"
    echo "  monitoring  Installation du monitoring (Prometheus/Grafana)"
    echo "  dev         Configuration pour développement local"
    echo "  test        Exécution des tests"
    echo "  clear       Nettoyage des caches"
    echo "  status      Status des services"
    echo "  help        Afficher cette aide"
    echo
    echo "Exemples:"
    echo "  sudo ./quick-start.sh install    # Installation complète"
    echo "  ./quick-start.sh dev            # Setup développement"
    echo "  ./quick-start.sh status         # Vérifier les services"
    echo
    echo "Variables:"
    echo "  Domaine: $DOMAIN"
    echo "  Répertoire: $APP_DIR"
    echo "  Répertoire actuel: $CURRENT_DIR"
}

# Fonction principale
main() {
    check_directory
    
    case "${1:-help}" in
        "install")
            install_full
            ;;
        "deploy")
            deploy_simple
            ;;
        "nginx")
            configure_nginx
            ;;
        "monitoring")
            install_monitoring
            ;;
        "dev")
            dev_setup
            ;;
        "test")
            run_tests
            ;;
        "clear")
            clear_caches
            ;;
        "status")
            check_status
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            log_error "Action inconnue: $1"
            echo
            show_help
            exit 1
            ;;
    esac
}

# Exécution
main "$@"
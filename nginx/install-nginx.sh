#!/bin/bash

# Script d'installation et configuration Nginx pour VibeStore237
# Usage: sudo ./install-nginx.sh [domain]

set -e

# Variables
DOMAIN=${1:-"vibestordistr.com"}
APP_DIR="/var/www/vibestore"
NGINX_DIR="/etc/nginx"
SITES_AVAILABLE="$NGINX_DIR/sites-available"
SITES_ENABLED="$NGINX_DIR/sites-enabled"
CONFIG_DIR="/var/www/vibestore/nginx"

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

# Vérification des prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    # Vérifier que le script est exécuté en tant que root
    if [[ $EUID -ne 0 ]]; then
        log_error "Ce script doit être exécuté en tant que root"
        exit 1
    fi
    
    # Vérifier la distribution
    if ! command -v apt-get &> /dev/null; then
        log_error "Ce script est conçu pour les distributions basées sur Debian/Ubuntu"
        exit 1
    fi
    
    # Vérifier que l'application existe
    if [ ! -d "$APP_DIR" ]; then
        log_warning "Répertoire de l'application non trouvé: $APP_DIR"
        log_info "L'application sera déployée plus tard"
    fi
    
    log_success "Prérequis vérifiés"
}

# Installation de Nginx
install_nginx() {
    log_info "Installation de Nginx..."
    
    # Mise à jour des paquets
    apt-get update
    
    # Installation de Nginx
    apt-get install -y nginx
    
    # Installation des modules additionnels
    apt-get install -y nginx-module-geoip2 nginx-module-image-filter nginx-module-xslt
    
    # Activation des modules
    echo "load_module modules/ngx_http_geoip2_module.so;" > /etc/nginx/modules-enabled/50-mod-geoip2.conf
    echo "load_module modules/ngx_http_image_filter_module.so;" > /etc/nginx/modules-enabled/50-mod-image-filter.conf
    
    # Arrêter Nginx pour la configuration
    systemctl stop nginx
    
    log_success "Nginx installé avec succès"
}

# Sauvegarde de la configuration existante
backup_existing_config() {
    log_info "Sauvegarde de la configuration existante..."
    
    BACKUP_DIR="/etc/nginx/backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    if [ -f "$NGINX_DIR/nginx.conf" ]; then
        cp -r "$NGINX_DIR/"* "$BACKUP_DIR/"
        log_success "Configuration sauvegardée dans $BACKUP_DIR"
    fi
}

# Configuration Nginx principale
configure_nginx_main() {
    log_info "Configuration Nginx principale..."
    
    # Créer la configuration principale optimisée
    cat > "$NGINX_DIR/nginx.conf" << 'EOF'
user www-data;
worker_processes auto;
worker_rlimit_nofile 65535;
pid /run/nginx.pid;

# Modules
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    # Types MIME
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Charset
    charset utf-8;
    
    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                   '$status $body_bytes_sent "$http_referer" '
                   '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main buffer=16k flush=5m;
    error_log /var/log/nginx/error.log warn;
    
    # Performance de base
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;
    
    # Buffers
    client_body_buffer_size 128k;
    client_max_body_size 500M;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 4k;
    
    # Timeouts
    client_body_timeout 60s;
    client_header_timeout 60s;
    send_timeout 60s;
    
    # Compression Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private must-revalidate;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        image/svg+xml;
    
    # Sécurité de base
    server_names_hash_bucket_size 64;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Inclusion des configurations
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
EOF

    log_success "Configuration principale créée"
}

# Installation des configurations VibeStore237
install_vibestore_configs() {
    log_info "Installation des configurations VibeStore237..."
    
    # Créer les répertoires de cache
    mkdir -p /var/cache/nginx/vibestore
    mkdir -p /var/cache/nginx/vibestore_api
    mkdir -p /var/cache/nginx/vibestore_static
    mkdir -p /var/cache/nginx/vibestore_thumbnails
    mkdir -p /var/cache/nginx/vibestore_fcgi
    chown -R www-data:www-data /var/cache/nginx/
    
    # Copier les configurations personnalisées
    if [ -f "$CONFIG_DIR/vibestore.conf" ]; then
        # Remplacer le domaine dans la configuration
        sed "s/vibestore\.com/$DOMAIN/g" "$CONFIG_DIR/vibestore.conf" > "$SITES_AVAILABLE/vibestore"
        log_success "Configuration principale copiée"
    else
        log_error "Fichier de configuration principal non trouvé"
        exit 1
    fi
    
    # Copier les configurations additionnelles
    if [ -f "$CONFIG_DIR/security-performance.conf" ]; then
        cp "$CONFIG_DIR/security-performance.conf" "$NGINX_DIR/conf.d/"
        log_success "Configuration sécurité/performance copiée"
    fi
    
    if [ -f "$CONFIG_DIR/media-streaming.conf" ]; then
        cp "$CONFIG_DIR/media-streaming.conf" "$NGINX_DIR/conf.d/"
        log_success "Configuration streaming média copiée"
    fi
    
    # Activer le site
    ln -sf "$SITES_AVAILABLE/vibestore" "$SITES_ENABLED/"
    
    # Désactiver le site par défaut
    if [ -L "$SITES_ENABLED/default" ]; then
        rm "$SITES_ENABLED/default"
        log_info "Site par défaut désactivé"
    fi
}

# Configuration des répertoires de logs
setup_logging() {
    log_info "Configuration des logs..."
    
    # Créer les répertoires de logs spécialisés
    mkdir -p /var/log/nginx/vibestore
    
    # Configuration de logrotate pour VibeStore237
    cat > /etc/logrotate.d/nginx-vibestore << EOF
/var/log/nginx/vibestore_*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 www-data adm
    sharedscripts
    prerotate
        if [ -d /etc/logrotate.d/httpd-prerotate ]; then \\
            run-parts /etc/logrotate.d/httpd-prerotate; \\
        fi
    endscript
    postrotate
        invoke-rc.d nginx reload >/dev/null 2>&1
    endscript
}
EOF

    log_success "Configuration des logs terminée"
}

# Configuration des certificats SSL
setup_ssl() {
    log_info "Configuration SSL avec Let's Encrypt..."
    
    # Installer Certbot
    apt-get install -y snapd
    snap install --classic certbot
    ln -sf /snap/bin/certbot /usr/bin/certbot
    
    # Démarrer Nginx temporairement pour la validation
    systemctl start nginx
    
    # Obtenir le certificat SSL
    if certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "admin@$DOMAIN"; then
        log_success "Certificat SSL obtenu avec succès"
    else
        log_warning "Échec de l'obtention du certificat SSL - configuration HTTP uniquement"
        # Modifier la configuration pour HTTP uniquement
        sed -i '/listen 443/,/}/d' "$SITES_AVAILABLE/vibestore"
        sed -i 's/return 301 https:/return 301 http:/' "$SITES_AVAILABLE/vibestore"
    fi
    
    # Configuration du renouvellement automatique
    cat > /etc/systemd/system/certbot-renewal.service << EOF
[Unit]
Description=Certbot Renewal
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/bin/certbot renew --quiet
EOF

    cat > /etc/systemd/system/certbot-renewal.timer << EOF
[Unit]
Description=Run certbot renewal twice daily
Requires=certbot-renewal.service

[Timer]
OnCalendar=*-*-* 00,12:00:00
RandomizedDelaySec=3600
Persistent=true

[Install]
WantedBy=timers.target
EOF

    systemctl enable certbot-renewal.timer
    systemctl start certbot-renewal.timer
    
    log_success "Renouvellement automatique SSL configuré"
}

# Configuration du firewall
setup_firewall() {
    log_info "Configuration du firewall..."
    
    # Installer UFW si pas déjà installé
    apt-get install -y ufw
    
    # Configuration de base
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    
    # Autoriser SSH
    ufw allow ssh
    
    # Autoriser HTTP et HTTPS
    ufw allow 'Nginx Full'
    
    # Autoriser le monitoring (optionnel)
    ufw allow 3000/tcp comment "Grafana"
    ufw allow 9090/tcp comment "Prometheus"
    
    # Activer le firewall
    ufw --force enable
    
    log_success "Firewall configuré"
}

# Optimisations système
optimize_system() {
    log_info "Optimisations système..."
    
    # Optimisations réseau
    cat >> /etc/sysctl.conf << EOF

# Optimisations pour VibeStore237
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.ipv4.tcp_rmem = 4096 87380 134217728
net.ipv4.tcp_wmem = 4096 65536 134217728
net.ipv4.tcp_congestion_control = bbr
net.core.default_qdisc = fq
net.ipv4.tcp_slow_start_after_idle = 0
fs.file-max = 2097152
EOF

    sysctl -p
    
    # Limites système pour www-data
    cat >> /etc/security/limits.conf << EOF
www-data soft nofile 65535
www-data hard nofile 65535
EOF

    log_success "Optimisations système appliquées"
}

# Tests de configuration
test_configuration() {
    log_info "Test de la configuration Nginx..."
    
    # Test de syntaxe
    if nginx -t; then
        log_success "Configuration Nginx valide"
    else
        log_error "Erreur dans la configuration Nginx"
        exit 1
    fi
    
    # Vérifier les permissions
    chown -R www-data:www-data /var/www/vibestore 2>/dev/null || true
    
    # Test des répertoires de cache
    if [ ! -d "/var/cache/nginx/vibestore" ]; then
        log_error "Répertoires de cache non créés"
        exit 1
    fi
    
    log_success "Tests de configuration réussis"
}

# Démarrage des services
start_services() {
    log_info "Démarrage des services..."
    
    # Recharger la configuration systemd
    systemctl daemon-reload
    
    # Activer Nginx au démarrage
    systemctl enable nginx
    
    # Redémarrer Nginx
    systemctl restart nginx
    
    # Vérifier le statut
    if systemctl is-active --quiet nginx; then
        log_success "Nginx démarré avec succès"
    else
        log_error "Échec du démarrage de Nginx"
        systemctl status nginx
        exit 1
    fi
}

# Création des scripts utilitaires
create_utility_scripts() {
    log_info "Création des scripts utilitaires..."
    
    # Script de gestion des logs
    cat > /usr/local/bin/vibestore-logs << 'EOF'
#!/bin/bash
case "$1" in
    access) tail -f /var/log/nginx/vibestore_access.log ;;
    error) tail -f /var/log/nginx/vibestore_error.log ;;
    audio) tail -f /var/log/nginx/vibestore_audio_access.log ;;
    video) tail -f /var/log/nginx/vibestore_video_access.log ;;
    downloads) tail -f /var/log/nginx/vibestore_downloads.log ;;
    *) echo "Usage: $0 {access|error|audio|video|downloads}" ;;
esac
EOF
    chmod +x /usr/local/bin/vibestore-logs
    
    # Script de statistiques
    cat > /usr/local/bin/vibestore-stats << 'EOF'
#!/bin/bash
echo "=== Statistiques VibeStore237 ==="
echo "Connexions actives: $(ss -tuln | grep :80 | wc -l)"
echo "Requêtes dernière heure: $(grep "$(date -d '1 hour ago' '+%d/%b/%Y:%H')" /var/log/nginx/vibestore_access.log | wc -l)"
echo "Erreurs 5xx dernière heure: $(grep "$(date -d '1 hour ago' '+%d/%b/%Y:%H')" /var/log/nginx/vibestore_access.log | grep " 5[0-9][0-9] " | wc -l)"
echo "Top 5 des IP: "
grep "$(date '+%d/%b/%Y')" /var/log/nginx/vibestore_access.log | awk '{print $1}' | sort | uniq -c | sort -nr | head -5
EOF
    chmod +x /usr/local/bin/vibestore-stats
    
    # Script de maintenance
    cat > /usr/local/bin/vibestore-maintenance << 'EOF'
#!/bin/bash
case "$1" in
    on)
        touch /var/www/vibestore/maintenance.html
        echo "Mode maintenance activé"
        ;;
    off)
        rm -f /var/www/vibestore/maintenance.html
        echo "Mode maintenance désactivé"
        ;;
    reload)
        nginx -s reload
        echo "Configuration Nginx rechargée"
        ;;
    *)
        echo "Usage: $0 {on|off|reload}"
        ;;
esac
EOF
    chmod +x /usr/local/bin/vibestore-maintenance
    
    log_success "Scripts utilitaires créés"
}

# Fonction principale
main() {
    log_info "🚀 Installation Nginx pour VibeStore237..."
    echo "Domaine: $DOMAIN"
    echo "Répertoire app: $APP_DIR"
    echo
    
    check_prerequisites
    backup_existing_config
    install_nginx
    configure_nginx_main
    install_vibestore_configs
    setup_logging
    optimize_system
    test_configuration
    start_services
    setup_firewall
    setup_ssl
    create_utility_scripts
    
    log_success "🎉 Installation Nginx terminée avec succès!"
    echo
    echo "📋 Informations:"
    echo "   - Configuration: /etc/nginx/sites-available/vibestore"
    echo "   - Logs: /var/log/nginx/vibestore_*.log"
    echo "   - Cache: /var/cache/nginx/vibestore*"
    echo
    echo "🔧 Commandes utiles:"
    echo "   - vibestore-logs access      # Voir les logs d'accès"
    echo "   - vibestore-stats            # Statistiques en temps réel"
    echo "   - vibestore-maintenance on   # Activer la maintenance"
    echo "   - nginx -s reload           # Recharger la configuration"
    echo
    echo "🌐 Votre site est accessible sur:"
    echo "   - http://$DOMAIN"
    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        echo "   - https://$DOMAIN"
    fi
}

# Exécution
main "$@"
# 🔧 Guide Configuration Nginx pour VibeStore237

## 📋 Vue d'ensemble

Configuration Nginx optimisée pour VibeStore237, une plateforme musicale camerounaise avec gestion avancée des médias audio/vidéo, streaming sécurisé et performance haute.

## 🚀 Installation Rapide

```bash
# 1. Rendre le script exécutable
chmod +x nginx/install-nginx.sh

# 2. Exécuter l'installation (remplacer par votre domaine)
sudo ./nginx/install-nginx.sh votre-domaine.com

# 3. Vérifier le statut
sudo systemctl status nginx
```

## 📁 Structure des Fichiers

```
nginx/
├── vibestore237.conf           # Configuration principale
├── media-streaming.conf        # Configuration streaming audio/vidéo
├── security-performance.conf   # Optimisations sécurité/performance
├── install-nginx.sh           # Script d'installation automatique
├── maintenance.html           # Page de maintenance
└── NGINX_GUIDE.md            # Ce guide
```

## ⚙️ Fonctionnalités Principales

### 🎵 Gestion Audio/Vidéo
- **Streaming progressif** avec support HTTP Range
- **Protection anti-hotlinking** pour les fichiers média
- **Rate limiting spécialisé** pour audio/vidéo
- **Authentification** pour contenus premium
- **Logging séparé** pour audit des téléchargements

### 🔒 Sécurité Avancée
- **Headers de sécurité** modernes (HSTS, CSP, etc.)
- **Rate limiting multi-zones** (API, login, média)
- **Protection DDoS** avec limitation de connexions
- **Détection bots malveillants**
- **Authentification admin** renforcée

### ⚡ Performance
- **Cache intelligent** (API, assets, thumbnails)
- **Compression Gzip** optimisée
- **SSL/TLS** avec protocoles modernes
- **Optimisations FastCGI** pour Laravel
- **Cache FastCGI** pour performance PHP

## 🎛️ Configuration Détaillée

### Rate Limiting Zones

```nginx
# Protection globale
limit_req_zone $binary_remote_addr zone=global:10m rate=100r/m;

# Protection API
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;

# Protection authentification
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

# Protection média
limit_req_zone $binary_remote_addr zone=media:10m rate=10r/s;
```

### Gestion des Fichiers Audio

```nginx
location ~* \.(mp3|wav|ogg|m4a|aac|flac)$ {
    # Rate limiting
    limit_req zone=media burst=5 nodelay;
    
    # Support streaming
    add_header Accept-Ranges bytes;
    
    # Protection hotlinking
    valid_referers none blocked server_names *.vibestore237.com;
    if ($invalid_referer) {
        return 403;
    }
    
    # Cache côté client
    expires 7d;
    add_header Cache-Control "public, no-transform";
}
```

### Streaming Sécurisé

```nginx
location /stream/audio/ {
    # Authentification obligatoire
    auth_request /auth-check;
    
    # Headers streaming
    add_header Accept-Ranges bytes;
    add_header Content-Type audio/mpeg;
    
    # Servir fichiers protégés
    alias /var/www/vibestore237/storage/app/private/audio/;
}
```

## 🛡️ Sécurité

### Headers de Sécurité

```nginx
# HSTS
add_header Strict-Transport-Security "max-age=63072000" always;

# Clickjacking
add_header X-Frame-Options "SAMEORIGIN" always;

# XSS Protection
add_header X-XSS-Protection "1; mode=block" always;

# Content Type
add_header X-Content-Type-Options "nosniff" always;

# CSP
add_header Content-Security-Policy "default-src 'self'" always;
```

### Protection Anti-Bot

```nginx
map $http_user_agent $bad_bot {
    default 0;
    ~*^$ 1;  # User agent vide
    ~*(bot|crawler|spider|scraper) 1;
    ~*(scan|hack|exploit|attack) 1;
}

# Blocage dans les locations
if ($bad_bot) {
    return 403 "Bot non autorisé";
}
```

## 📊 Monitoring et Logs

### Logs Spécialisés

```bash
# Logs d'accès généraux
/var/log/nginx/vibestore237_access.log

# Logs d'erreurs
/var/log/nginx/vibestore237_error.log

# Logs audio/vidéo
/var/log/nginx/vibestore237_audio_access.log
/var/log/nginx/vibestore237_video_access.log

# Logs téléchargements
/var/log/nginx/vibestore237_downloads.log

# Logs streaming
/var/log/nginx/vibestore237_audio_stream.log
```

### Commandes Utilitaires

```bash
# Voir les logs en temps réel
vibestore-logs access    # Logs d'accès
vibestore-logs error     # Logs d'erreurs
vibestore-logs audio     # Logs audio
vibestore-logs downloads # Logs téléchargements

# Statistiques
vibestore-stats

# Maintenance
vibestore-maintenance on   # Activer
vibestore-maintenance off  # Désactiver
```

## 🔧 Optimisations

### Cache Configuration

```nginx
# Cache API
proxy_cache_path /var/cache/nginx/vibestore_api 
    levels=1:2 keys_zone=api_cache:100m 
    max_size=1g inactive=60m;

# Cache assets statiques
proxy_cache_path /var/cache/nginx/vibestore_static 
    levels=1:2 keys_zone=static_cache:100m 
    max_size=2g inactive=7d;
```

### Optimisations System

```bash
# Limites fichiers
fs.file-max = 2097152

# TCP optimisations
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.ipv4.tcp_congestion_control = bbr
```

## 🎯 Endpoints Spécialisés

### API avec Rate Limiting

```nginx
location /api/ {
    limit_req zone=api_protection burst=20 nodelay;
    
    # Headers CORS
    add_header Access-Control-Allow-Origin "https://vibestore237.com";
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE";
}
```

### Administration Sécurisée

```nginx
location /admin {
    # Rate limiting strict
    limit_req zone=login_protection burst=2 nodelay;
    
    # Restriction géographique (optionnel)
    # if ($geoip2_data_country_code !~ ^(FR|CM|CA)$) {
    #     return 403;
    # }
    
    # Auth HTTP additionnelle
    # auth_basic "Admin VibeStore237";
    # auth_basic_user_file /etc/nginx/.htpasswd;
}
```

### Téléchargements Protégés

```nginx
location /download/ {
    # Authentification obligatoire
    auth_request /auth-check;
    
    # Headers anti-piratage
    add_header X-Robots-Tag "noindex, nofollow";
    add_header Content-Disposition "attachment";
    
    # Logging audit
    access_log /var/log/nginx/vibestore237_downloads_audit.log;
}
```

## 🚨 Mode Maintenance

### Activation

```bash
# Activer la maintenance
vibestore-maintenance on

# Désactiver la maintenance
vibestore-maintenance off
```

### Page Personnalisée

La page de maintenance (`maintenance.html`) inclut :
- **Design responsive** avec thème VibeStore237
- **Auto-refresh** toutes les 30 secondes
- **Vérification automatique** du retour du service
- **Barre de progression animée**
- **Liens sociaux** et informations de contact

## 🔍 SSL/TLS

### Configuration Automatique

```bash
# Le script installe automatiquement Let's Encrypt
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
```

### Renouvellement Automatique

```bash
# Service de renouvellement configuré automatiquement
systemctl status certbot-renewal.timer
```

## 📈 Performance

### Métriques Monitoring

```nginx
# Endpoint métriques Prometheus
location /stub_status {
    stub_status on;
    allow 127.0.0.1;
    deny all;
}

# Health check
location /health {
    return 200 "healthy\n";
    add_header Content-Type text/plain;
}
```

### Optimisations JavaScript/CSS

```nginx
location ~* \.(js|css)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    
    # Préchargement ressources critiques
    add_header Link "</css/app.css>; rel=preload; as=style";
    add_header Link "</js/app.js>; rel=preload; as=script";
}
```

## 🆘 Troubleshooting

### Commandes de Debug

```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo nginx -s reload

# Vérifier les logs d'erreur
sudo tail -f /var/log/nginx/error.log

# Statistiques en temps réel
vibestore-stats

# Status des services
sudo systemctl status nginx
```

### Problèmes Courants

1. **Erreur 502** : Vérifier PHP-FPM
```bash
sudo systemctl status php8.2-fpm
```

2. **Certificat SSL** : Renouveler manuellement
```bash
sudo certbot renew
```

3. **Cache plein** : Nettoyer les caches
```bash
sudo rm -rf /var/cache/nginx/vibestore*
sudo nginx -s reload
```

## 🎵 Spécificités VibeStore237

### Support Multi-Format Audio

- **MP3, WAV, OGG, M4A, AAC, FLAC**
- **Streaming progressif** avec Range requests
- **Prévisualisation** sans authentification
- **Téléchargement** avec DRM

### Protection Contenu

- **Anti-hotlinking** avancé
- **Authentification** par tokens
- **Watermarking** (module externe)
- **Audit logging** complet

### Optimisations Cameroun

- **Géolocalisation** pour restrictions régionales
- **CDN ready** pour distribution
- **Mobile optimized** pour connexions 3G/4G
- **Compression** adaptative

---

**VibeStore237** - Configuration Nginx optimisée pour la musique camerounaise 🇨🇲
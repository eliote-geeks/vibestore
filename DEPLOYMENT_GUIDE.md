# 🚀 Guide de Déploiement VibeStore237 sur Hostinger VPS

## 📋 Prérequis

### 1. Configuration du VPS Hostinger
- **RAM**: Minimum 2GB (recommandé 4GB)
- **CPU**: 2 vCores minimum
- **Stockage**: 50GB SSD minimum
- **OS**: Ubuntu 22.04 LTS

### 2. Nom de domaine
- Domaine pointant vers votre VPS
- Accès aux DNS pour configuration

## 🛠️ Installation Initiale

### 1. Connexion au VPS
```bash
ssh root@votre-ip-vps
```

### 2. Installation des dépendances système
```bash
# Exécuter le script d'installation
chmod +x deploy-vps.sh
./deploy-vps.sh
```

## 🔧 Configuration GitHub Actions

### 1. Secrets GitHub requis
Dans GitHub > Settings > Secrets and variables > Actions, ajouter :

```
VPS_SSH_KEY         # Clé privée SSH pour accéder au VPS
VPS_HOST            # IP ou hostname du VPS
VPS_USER            # Utilisateur SSH (généralement root)
VPS_DOMAIN          # Votre nom de domaine (ex: vibestore237.com)
```

### 2. Génération de la clé SSH
```bash
# Sur votre machine locale
ssh-keygen -t ed25519 -C "github-actions@vibestore237.com"

# Copier la clé publique sur le VPS
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@votre-ip-vps

# Copier la clé privée dans les secrets GitHub
cat ~/.ssh/id_ed25519
```

## 📁 Structure de Déploiement

```
/var/www/vibestore237/          # Application principale
/var/backups/vibestore237/      # Backups automatiques
/etc/nginx/sites-available/     # Configuration Nginx
/etc/systemd/system/            # Services systemd
```

## 🔄 Processus de Déploiement Automatique

### Déclencheurs
- **Push sur main** : Déploiement automatique
- **Pull Request** : Tests uniquement
- **Manuel** : Via workflow_dispatch

### Étapes du déploiement
1. **Tests & Quality Check**
   - Tests PHP (PHPUnit/Pest)
   - Code quality (Laravel Pint)
   - Build des assets

2. **Déploiement**
   - Backup de l'application actuelle
   - Mode maintenance
   - Mise à jour du code
   - Installation des dépendances
   - Migration DB
   - Optimisation Laravel
   - Redémarrage des services

3. **Vérification**
   - Health check HTTP
   - Notification (optionnel)

4. **Rollback automatique**
   - En cas d'échec du déploiement
   - Restauration du dernier backup

## 🛡️ Sécurité et Monitoring

### Configuration Nginx
- Headers de sécurité
- Rate limiting
- SSL/TLS (Let's Encrypt)
- Gzip compression

### Services Systemd
```bash
# Worker Laravel Queue
sudo systemctl status vibestore-worker

# WebSocket Server (si utilisé)
sudo systemctl status vibestore-websocket

# Logs en temps réel
sudo journalctl -u vibestore-worker -f
```

### Backups
- Backup automatique avant chaque déploiement
- Rétention : 5 derniers backups
- Emplacement : `/var/backups/vibestore237/`

## 📊 Monitoring et Logs

### Logs de l'application
```bash
# Logs Laravel
tail -f /var/www/vibestore237/storage/logs/laravel.log

# Logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs PHP-FPM
sudo tail -f /var/log/php8.2-fpm.log
```

### Métriques système
```bash
# CPU et mémoire
htop

# Espace disque
df -h

# Connexions réseau
ss -tulpn
```

## ⚡ Optimisations Performance

### 1. Cache Redis
- Configuration automatique
- Cache de sessions
- Cache de l'application

### 2. Optimisations Laravel
```bash
cd /var/www/vibestore237
sudo -u www-data php artisan config:cache
sudo -u www-data php artisan route:cache
sudo -u www-data php artisan view:cache
sudo -u www-data php artisan event:cache
```

### 3. Optimisations Nginx
- Compression Gzip
- Cache des fichiers statiques
- Buffers FastCGI optimisés

### 4. Optimisations PHP
- OPcache activé
- Memory limit adapté
- Upload size configuré

## 🔧 Commandes Utiles

### Déploiement manuel
```bash
cd /var/www/vibestore237
git pull origin main
composer install --no-dev --optimize-autoloader
npm ci --only=production && npm run build
php artisan migrate --force
php artisan optimize
sudo systemctl restart php8.2-fpm nginx
```

### Maintenance
```bash
# Mode maintenance
php artisan down --retry=60

# Sortir du mode maintenance
php artisan up

# Nettoyer les caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Debugging
```bash
# Vérifier la configuration
php artisan config:show

# Tester la base de données
php artisan migrate:status

# Vérifier les queues
php artisan queue:monitor

# Tests de l'application
php artisan test
```

## 🆘 Résolution de Problèmes

### Erreur 500
```bash
# Vérifier les logs
tail -f /var/www/vibestore237/storage/logs/laravel.log

# Permissions
sudo chown -R www-data:www-data /var/www/vibestore237
sudo chmod -R 775 /var/www/vibestore237/storage
sudo chmod -R 775 /var/www/vibestore237/bootstrap/cache
```

### Base de données
```bash
# Vérifier la connexion
php artisan tinker
DB::connection()->getPdo();

# Reset des migrations
php artisan migrate:fresh --seed
```

### Services non fonctionnels
```bash
# Redémarrer tous les services
sudo systemctl restart nginx php8.2-fpm postgresql redis-server vibestore-worker
```

## 📱 Intégrations Optionnelles

### Notifications Discord/Slack
Modifier le workflow GitHub Actions pour ajouter vos webhooks.

### Monitoring externe
- Uptime Robot
- New Relic
- Sentry pour le monitoring d'erreurs

### CDN
- Cloudflare pour les performances
- AWS CloudFront

## 🔄 Mise à jour et Maintenance

### Mises à jour de sécurité
```bash
# Système
sudo apt update && sudo apt upgrade -y

# Dépendances PHP
composer update --no-dev

# Dépendances Node.js
npm audit fix
```

### Sauvegarde manuelle
```bash
# Base de données
sudo -u postgres pg_dump vibestore237 > backup_$(date +%Y%m%d).sql

# Application
sudo tar -czf vibestore_backup_$(date +%Y%m%d).tar.gz /var/www/vibestore237
```

## 📞 Support

Pour toute question ou problème :
1. Vérifier les logs d'application et système
2. Consulter la documentation Laravel
3. Vérifier les issues GitHub du projet

---
**VibeStore237** - Plateforme musicale camerounaise 🇨🇲
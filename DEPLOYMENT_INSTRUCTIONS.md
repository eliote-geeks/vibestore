# 🚀 Instructions de Déploiement VibeStore237

## Prérequis

Votre projet **VibeStore237** est déjà complètement configuré pour Docker !

### Architecture du projet :
- **Backend** : Laravel 12 + PHP 8.2
- **Frontend** : React + TypeScript + Vite
- **Base de données** : PostgreSQL 15
- **Cache/Sessions** : Redis 7
- **Queue worker** : Laravel Queue + Redis
- **WebSockets** : Server WebSocket PHP custom
- **Proxy** : Traefik avec SSL automatique (Let's Encrypt)

## 📋 Étapes de déploiement

### 1. Installer Docker et Docker Compose

```bash
sudo ./install-docker.sh
```

Puis redémarrez votre session ou exécutez :
```bash
newgrp docker
```

### 2. Configuration pour production

Créez un fichier `.env.production` basé sur `.env.docker` :
```bash
cp .env.docker .env.production
```

**Modifiez les variables importantes** dans `.env.production` :
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://votre-domaine.com

# Base de données (générez un mot de passe fort)
DB_PASSWORD=votre_mot_de_passe_securise

# Email (configurez avec vos identifiants)
MAIL_USERNAME=votre_email@gmail.com
MAIL_PASSWORD=votre_mot_de_passe_email

# SSL/Sécurité
SANCTUM_STATEFUL_DOMAINS=votre-domaine.com,www.votre-domaine.com
SESSION_DOMAIN=.votre-domaine.com
```

### 3. Déploiement avec Docker

**Option A : Déploiement simple (recommandé)**
```bash
sudo ./deploy-production.sh
```

**Option B : Déploiement manuel**
```bash
# Copier la config production
cp .env.production .env

# Build et démarrage
docker-compose -f docker-compose.prod.yml up -d --build

# Migrations
docker exec vibestore_app php artisan migrate --force

# Cache
docker exec vibestore_app php artisan config:cache
docker exec vibestore_app php artisan route:cache
docker exec vibestore_app php artisan view:cache
```

## 🌐 Configuration DNS

Pointez votre domaine vers l'IP de votre VPS :
```
A    votre-domaine.com     IP_DE_VOTRE_VPS
A    www.votre-domaine.com IP_DE_VOTRE_VPS
```

## 🔧 Services déployés

Après le déploiement, ces services seront accessibles :

| Service | URL | Port |
|---------|-----|------|
| Application principale | https://votre-domaine.com | 80/443 |
| Dashboard Traefik | https://traefik.votre-domaine.com:8080 | 8080 |
| Base de données | localhost | 5432 |
| Redis | localhost | 6379 |

## 🔍 Monitoring et logs

**Voir l'état des conteneurs :**
```bash
docker-compose -f docker-compose.prod.yml ps
```

**Logs de l'application :**
```bash
docker logs vibestore_app -f
```

**Logs de la base de données :**
```bash
docker logs vibestore_db -f
```

**Logs de Traefik :**
```bash
docker logs vibestore_traefik -f
```

## 🛠️ Maintenance

**Mise à jour du code :**
```bash
git pull origin main
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
docker exec vibestore_app php artisan migrate --force
```

**Backup de la base de données :**
```bash
docker exec vibestore_db pg_dump -U vibestore_user vibestore > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Restauration :**
```bash
docker exec -i vibestore_db psql -U vibestore_user vibestore < backup_file.sql
```

## 🚨 Troubleshooting

**Problème de permissions :**
```bash
sudo chown -R 1000:1000 storage/
sudo chmod -R 775 storage/
```

**Reconstruire complètement :**
```bash
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d --build
```

**SSL non configuré automatiquement :**
- Vérifiez que votre domaine pointe bien vers le serveur
- Traefik gère automatiquement Let's Encrypt

## 📞 Support

- **Logs Laravel** : `storage/logs/`
- **Logs Nginx** : `docker logs vibestore_traefik`
- **Logs Queue** : `docker logs vibestore_queue`

## ✅ Checklist de déploiement

- [ ] Docker et Docker Compose installés
- [ ] Fichier `.env.production` configuré
- [ ] DNS pointé vers le serveur
- [ ] Script de déploiement exécuté
- [ ] Application accessible via HTTPS
- [ ] Queue worker fonctionnel
- [ ] WebSocket server démarré (si nécessaire)
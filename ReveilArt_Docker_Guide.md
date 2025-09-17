# 🎵 ReveilArt - Guide Docker Complet

## 📋 Commandes Docker Essentielles

### Installation et Démarrage
```bash
# Installation complète (première fois)
make install

# Démarrage rapide
make start
./docker-start.sh

# Démarrage avec outils de développement
make tools
```

### Gestion quotidienne
```bash
# Arrêter tous les services
make stop
./docker-stop.sh

# Redémarrer tous les services
make restart

# Voir les logs en temps réel
make logs

# Accéder au conteneur Laravel
make shell
docker-compose exec app bash
```

### Base de données
```bash
# Exécuter les migrations
make migrate
docker-compose exec app php artisan migrate

# Exécuter les seeders
make seed
docker-compose exec app php artisan db:seed

# Reset complet (migrations + seeders)
make fresh
docker-compose exec app php artisan migrate:fresh --seed
```

### Développement
```bash
# Exécuter les tests
make test
docker-compose exec app php artisan test

# Reconstruire les images
make build
docker-compose build --no-cache

# Nettoyer le système
make clean
```

### Vérification des services
```bash
# Voir l'état des conteneurs
docker-compose ps

# Voir les logs d'un service spécifique
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f redis

# Redémarrer un service spécifique
docker-compose restart app
docker-compose restart postgres
```

## 🌐 URLs d'accès

- **Application principale** : http://localhost:8000
- **Base de données PostgreSQL** : localhost:5432
- **Redis** : localhost:6379
- **WebSocket (compétitions live)** : ws://localhost:8080
- **pgAdmin** : http://localhost:5050
- **Redis Commander** : http://localhost:8081

## 🚀 Déploiement sur VPS Hostinger

### Prérequis VPS
- **OS** : Ubuntu 20.04/22.04 LTS
- **RAM** : Minimum 2GB (recommandé 4GB+)
- **Stockage** : Minimum 20GB SSD
- **CPU** : 2 vCPU minimum

### 1. Préparation du serveur

#### Connexion SSH
```bash
ssh root@votre-ip-vps
```

#### Mise à jour du système
```bash
apt update && apt upgrade -y
apt install curl wget git nano -y
```

#### Installation Docker
```bash
# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Installer Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Vérifier l'installation
docker --version
docker-compose --version
```

#### Configuration utilisateur
```bash
# Créer un utilisateur pour l'application
adduser reveilart
usermod -aG docker reveilart
su - reveilart
```

### 2. Déploiement de l'application

#### Cloner le projet
```bash
# Via Git (recommandé)
git clone https://github.com/votre-repo/reveilart.git
cd reveilart

# Ou upload via SCP/SFTP
```

#### Configuration production
```bash
# Copier et modifier le fichier d'environnement
cp .env.docker .env
nano .env
```

#### Variables d'environnement production
```env
APP_NAME="ReveilArt"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://votre-domaine.com

# Base de données
DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=REVEIL4ARTISTS
DB_USERNAME=postgres
DB_PASSWORD=VOTRE_MOT_DE_PASSE_SECURISE

# Redis
REDIS_HOST=redis
REDIS_PASSWORD=VOTRE_MOT_DE_PASSE_REDIS

# Mail (configurer selon vos besoins)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=votre-email@gmail.com
MAIL_PASSWORD=votre-mot-de-passe-app
```

#### Modifier docker-compose pour production
```bash
nano docker-compose.yml
```

Modifications nécessaires :
```yaml
# Changer les mots de passe
environment:
  POSTGRES_PASSWORD: VOTRE_MOT_DE_PASSE_SECURISE

# Exposer seulement les ports nécessaires
ports:
  - "80:80"    # Pour Nginx
  - "443:443"  # Pour HTTPS
  # Supprimer les autres ports exposés
```

### 3. Configuration SSL avec Nginx

#### Installer Certbot
```bash
sudo apt install snapd
sudo snap install --classic certbot
```

#### Créer configuration Nginx pour le domaine
```bash
sudo nano /etc/nginx/sites-available/reveilart
```

```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Activer le site et obtenir SSL
```bash
sudo ln -s /etc/nginx/sites-available/reveilart /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
```

### 4. Démarrage production

#### Construire et démarrer
```bash
# Construction des images
docker-compose build --no-cache

# Démarrage des services
docker-compose up -d

# Vérifier que tout fonctionne
docker-compose ps
```

#### Première installation
```bash
# Exécuter les migrations
docker-compose exec app php artisan migrate --force

# Créer un utilisateur admin
docker-compose exec app php artisan create:admin

# Optimiser pour la production
docker-compose exec app php artisan config:cache
docker-compose exec app php artisan route:cache
docker-compose exec app php artisan view:cache
```

### 5. Surveillance et maintenance

#### Scripts de surveillance
```bash
# Créer un script de monitoring
nano /home/reveilart/monitor.sh
```

```bash
#!/bin/bash
cd /home/reveilart/reveilart

# Vérifier que les services tournent
if ! docker-compose ps | grep -q "Up"; then
    echo "$(date): Services down, restarting..." >> monitor.log
    docker-compose up -d
fi

# Vérifier l'espace disque
df -h | awk '$5 > 85 {print "$(date): Disk space warning: " $0}' >> monitor.log
```

#### Automatisation avec cron
```bash
crontab -e
```

```cron
# Vérification toutes les 5 minutes
*/5 * * * * /home/reveilart/monitor.sh

# Sauvegarde quotidienne à 3h du matin
0 3 * * * cd /home/reveilart/reveilart && docker-compose exec -T postgres pg_dump -U postgres REVEIL4ARTISTS > backup_$(date +\%Y\%m\%d).sql

# Nettoyage des logs hebdomadaire
0 2 * * 0 docker system prune -f
```

### 6. Sauvegarde et restauration

#### Sauvegarde automatique
```bash
#!/bin/bash
# backup.sh
cd /home/reveilart/reveilart

# Sauvegarde base de données
docker-compose exec -T postgres pg_dump -U postgres REVEIL4ARTISTS > /home/reveilart/backups/db_$(date +%Y%m%d_%H%M%S).sql

# Sauvegarde fichiers média
tar -czf /home/reveilart/backups/media_$(date +%Y%m%d_%H%M%S).tar.gz public/music public/video public/images

# Garder seulement les 7 dernières sauvegardes
find /home/reveilart/backups -name "*.sql" -mtime +7 -delete
find /home/reveilart/backups -name "*.tar.gz" -mtime +7 -delete
```

#### Restauration
```bash
# Restaurer base de données
cat backup_20241215_030000.sql | docker-compose exec -T postgres psql -U postgres REVEIL4ARTISTS

# Restaurer fichiers média
tar -xzf media_20241215_030000.tar.gz
```

### 7. Optimisations performance

#### Configuration système
```bash
# Augmenter les limites de fichiers
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# Optimiser TCP
echo "net.core.somaxconn = 65536" >> /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65536" >> /etc/sysctl.conf
sysctl -p
```

#### Monitoring avec htop
```bash
apt install htop
htop
```

### 8. Mise à jour de l'application

#### Script de mise à jour
```bash
#!/bin/bash
# update.sh
cd /home/reveilart/reveilart

echo "Mise à jour ReveilArt..."

# Sauvegarder avant mise à jour
./backup.sh

# Récupérer les dernières modifications
git pull origin main

# Reconstruire et redémarrer
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Attendre que les services soient prêts
sleep 30

# Exécuter les migrations
docker-compose exec app php artisan migrate --force

# Optimiser
docker-compose exec app php artisan config:cache
docker-compose exec app php artisan route:cache
docker-compose exec app php artisan view:cache

echo "Mise à jour terminée!"
```

## 🔧 Dépannage VPS

### Vérifications essentielles
```bash
# Vérifier l'état des services
systemctl status docker
systemctl status nginx

# Vérifier les ports ouverts
netstat -tlnp | grep :80
netstat -tlnp | grep :443

# Vérifier l'espace disque
df -h

# Vérifier la mémoire
free -h

# Vérifier les logs Docker
docker-compose logs -f app --tail=50
```

### Problèmes courants

#### Service ne démarre pas
```bash
# Vérifier les logs
docker-compose logs app

# Redémarrer complètement
docker-compose down
docker-compose up -d
```

#### Performance lente
```bash
# Vérifier la RAM
free -h

# Optimiser Docker
docker system prune -a -f

# Redémarrer les services
docker-compose restart
```

#### Base de données inaccessible
```bash
# Vérifier PostgreSQL
docker-compose exec postgres psql -U postgres -c "SELECT version();"

# Recréer si nécessaire
docker-compose down -v postgres
docker-compose up -d postgres
```

## 📊 Coûts Hostinger VPS

### Plans recommandés
- **VPS 1** : 2 vCPU, 4GB RAM, 80GB SSD - ~15€/mois
- **VPS 2** : 3 vCPU, 8GB RAM, 160GB SSD - ~25€/mois
- **VPS 3** : 4 vCPU, 16GB RAM, 320GB SSD - ~45€/mois

### Optimisations coûts
- Commencer avec VPS 1 pour tester
- Monitorer l'usage et upgrader si nécessaire
- Utiliser des sauvegardes externes (moins chères)
- Optimiser les images Docker pour réduire l'usage

La configuration Docker est maintenant prête pour la production sur votre VPS Hostinger !
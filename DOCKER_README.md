# 🐳 ReveilArt - Configuration Docker

## Vue d'ensemble

Cette configuration Docker containerise complètement l'application ReveilArt avec tous ses services :

- **App Laravel** : Application principal avec PHP 8.2 + Nginx
- **PostgreSQL** : Base de données principale  
- **Redis** : Cache, sessions et queues
- **Queue Worker** : Traitement des tâches en arrière-plan
- **WebSocket Server** : Pour les compétitions en direct
- **Outils optionnels** : pgAdmin et Redis Commander

## 🚀 Démarrage rapide

### 1. Installation (première fois)
```bash
make install
```

### 2. Démarrage normal
```bash
make start
# ou
./docker-start.sh
```

### 3. Accès à l'application
- **Application** : http://localhost:8000
- **WebSocket** : ws://localhost:8080

## 📋 Commandes principales

```bash
# Gestion des services
make start          # Démarrer tous les services
make stop           # Arrêter tous les services  
make restart        # Redémarrer
make logs           # Voir les logs en temps réel

# Développement
make shell          # Accéder au conteneur Laravel
make migrate        # Exécuter les migrations
make seed           # Exécuter les seeders
make fresh          # Reset DB + migrations + seeders
make test           # Exécuter les tests

# Outils de développement
make tools          # Démarrer pgAdmin + Redis Commander
```

## 🛠️ Services disponibles

| Service | Port Local | URL/Accès |
|---------|------------|-----------|
| Application Laravel | 8000 | http://localhost:8000 |
| PostgreSQL | 5432 | `psql -h localhost -U postgres -d REVEIL4ARTISTS` |
| Redis | 6379 | `redis-cli -h localhost` |
| WebSocket | 8080 | ws://localhost:8080 |
| pgAdmin | 5050 | http://localhost:5050 |
| Redis Commander | 8081 | http://localhost:8081 |

## 🔧 Configuration

### Variables d'environnement
Le fichier `.env.docker` contient la configuration pour Docker. Il sera copié vers `.env` automatiquement.

### Volumes persistants
- `postgres_data` : Données PostgreSQL
- `redis_data` : Données Redis  
- `./storage` : Storage Laravel
- `./public/music` : Fichiers audio
- `./public/video` : Fichiers vidéo

### Réseaux
Tous les services communiquent via le réseau `reveilart_network`.

## 🐛 Dépannage

### Vérifier l'état des services
```bash
docker-compose ps
```

### Voir les logs d'un service spécifique
```bash
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f app
```

### Redémarrer un service spécifique
```bash
docker-compose restart app
docker-compose restart postgres
```

### Accéder aux bases de données

#### PostgreSQL
```bash
# Via Docker
docker-compose exec postgres psql -U postgres -d REVEIL4ARTISTS

# Via client local
psql -h localhost -p 5432 -U postgres -d REVEIL4ARTISTS
```

#### Redis
```bash
# Via Docker
docker-compose exec redis redis-cli

# Via client local  
redis-cli -h localhost -p 6379
```

### Problèmes courants

#### Port déjà utilisé
```bash
# Trouver le processus utilisant le port
sudo lsof -i :8000
sudo lsof -i :5432

# Arrêter le service local
sudo systemctl stop postgresql
sudo systemctl stop redis-server
```

#### Problème de permissions
```bash
# Réparer les permissions du storage
docker-compose exec app chown -R www:www /var/www/html/storage
docker-compose exec app chmod -R 775 /var/www/html/storage
```

#### Base de données non accessible
```bash
# Recréer les conteneurs
docker-compose down -v
docker-compose up -d postgres
# Attendre 10 secondes
docker-compose up -d app
```

## 🧪 Tests et développement

### Exécuter les tests
```bash
make test
# ou
docker-compose exec app php artisan test
```

### Mode développement
```bash
# Installer les dépendances de dev
docker-compose exec app composer install

# Activer le debug
# Modifier APP_DEBUG=true dans .env
```

### Rebuild complet
```bash
make clean
make build
make install
```

## 📊 Monitoring

### Santé des services
```bash
# Vérifier que tous les services répondent
curl http://localhost:8000/health
```

### Métriques Redis
Accédez à Redis Commander sur http://localhost:5050 pour voir les clés et métriques.

### Métriques PostgreSQL  
Accédez à pgAdmin sur http://localhost:5050 avec :
- Email: admin@reveilart.com
- Password: admin

## 🔒 Sécurité

### Production
Pour la production, modifiez :
- Les mots de passe dans `docker-compose.yml`
- `APP_DEBUG=false` dans `.env`
- Ajoutez SSL/TLS
- Configurez un reverse proxy (Traefik, Nginx)

### Sauvegarde
```bash
# Sauvegarde PostgreSQL
docker-compose exec postgres pg_dump -U postgres REVEIL4ARTISTS > backup.sql

# Restauration
cat backup.sql | docker-compose exec -T postgres psql -U postgres REVEIL4ARTISTS
```

## 🚀 Déploiement

Cette configuration est prête pour le déploiement avec des modifications mineures pour la production.

Consultez le `docker-compose.yml` pour personnaliser selon vos besoins.
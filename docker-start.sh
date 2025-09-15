#!/bin/bash

# Script de démarrage Docker pour ReveilArt
echo "🎵 Démarrage de ReveilArt avec Docker..."

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Copier le fichier .env pour Docker si nécessaire
if [ ! -f .env ]; then
    echo "📄 Copie du fichier .env.docker vers .env..."
    cp .env.docker .env
fi

# Arrêter les conteneurs existants
echo "🛑 Arrêt des conteneurs existants..."
docker-compose down

# Construire les images
echo "🔨 Construction des images Docker..."
docker-compose build --no-cache

# Démarrer les services
echo "🚀 Démarrage des services..."
docker-compose up -d postgres redis

# Attendre que PostgreSQL soit prêt
echo "⏳ Attente de PostgreSQL..."
sleep 10

# Démarrer l'application
echo "🎵 Démarrage de l'application ReveilArt..."
docker-compose up -d app queue websocket

# Attendre que l'application soit prête
echo "⏳ Attente de l'application..."
sleep 5

# Exécuter les migrations
echo "🗃️ Exécution des migrations..."
docker-compose exec app php artisan migrate --force

# Générer la clé d'application si nécessaire
echo "🔑 Génération de la clé d'application..."
docker-compose exec app php artisan key:generate --force

# Créer les liens symboliques pour le storage
echo "🔗 Création des liens symboliques..."
docker-compose exec app php artisan storage:link

# Optimiser l'application
echo "⚡ Optimisation de l'application..."
docker-compose exec app php artisan config:cache
docker-compose exec app php artisan route:cache
docker-compose exec app php artisan view:cache

# Afficher les informations de démarrage
echo ""
echo "✅ ReveilArt est maintenant démarré !"
echo ""
echo "🌐 Application : http://localhost:8000"
echo "🗃️ Base de données : localhost:5432"
echo "🔴 Redis : localhost:6379"
echo "💬 WebSocket : localhost:8080"
echo "🔧 pgAdmin : http://localhost:5050 (avec --profile tools)"
echo "🔧 Redis Commander : http://localhost:8081 (avec --profile tools)"
echo ""
echo "📝 Commandes utiles :"
echo "   docker-compose logs -f app          # Voir les logs"
echo "   docker-compose exec app bash        # Accéder au conteneur"
echo "   docker-compose down                 # Arrêter tous les services"
echo "   docker-compose up --profile tools   # Démarrer avec les outils"
echo ""
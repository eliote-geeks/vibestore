#!/bin/bash

# Script d'arrêt Docker pour ReveilArt
echo "🛑 Arrêt de ReveilArt..."

# Arrêter tous les conteneurs
docker-compose down

# Optionnel : supprimer les volumes (attention, cela supprime les données)
if [ "$1" = "--clean" ]; then
    echo "🧹 Suppression des volumes (données supprimées)..."
    docker-compose down -v
    docker system prune -f
fi

echo "✅ ReveilArt arrêté avec succès!"
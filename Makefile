# Makefile pour ReveilArt Docker

.PHONY: help start stop restart build logs shell migrate seed fresh test tools

# Afficher l'aide
help:
	@echo "🎵 ReveilArt - Commandes Docker disponibles:"
	@echo ""
	@echo "  make start     - Démarrer tous les services"
	@echo "  make stop      - Arrêter tous les services"
	@echo "  make restart   - Redémarrer tous les services"
	@echo "  make build     - Reconstruire les images"
	@echo "  make logs      - Afficher les logs en temps réel"
	@echo "  make shell     - Accéder au shell de l'application"
	@echo "  make migrate   - Exécuter les migrations"
	@echo "  make seed      - Exécuter les seeders"
	@echo "  make fresh     - Reset de la DB + migrations + seeders"
	@echo "  make test      - Exécuter les tests"
	@echo "  make tools     - Démarrer avec les outils (pgAdmin, Redis Commander)"
	@echo "  make clean     - Nettoyer les conteneurs et volumes"

# Démarrer les services
start:
	@echo "🚀 Démarrage de ReveilArt..."
	@docker-compose up -d postgres redis
	@sleep 5
	@docker-compose up -d app queue websocket
	@echo "✅ ReveilArt démarré! Accédez à http://localhost:8000"

# Arrêter les services
stop:
	@echo "🛑 Arrêt de ReveilArt..."
	@docker-compose down
	@echo "✅ ReveilArt arrêté!"

# Redémarrer les services
restart: stop start

# Construire les images
build:
	@echo "🔨 Construction des images..."
	@docker-compose build --no-cache

# Afficher les logs
logs:
	@docker-compose logs -f app

# Accéder au shell
shell:
	@docker-compose exec app bash

# Exécuter les migrations
migrate:
	@echo "🗃️ Exécution des migrations..."
	@docker-compose exec app php artisan migrate

# Exécuter les seeders
seed:
	@echo "🌱 Exécution des seeders..."
	@docker-compose exec app php artisan db:seed

# Reset complet de la base de données
fresh:
	@echo "🔄 Reset complet de la base de données..."
	@docker-compose exec app php artisan migrate:fresh --seed

# Exécuter les tests
test:
	@echo "🧪 Exécution des tests..."
	@docker-compose exec app php artisan test

# Démarrer avec les outils de développement
tools:
	@echo "🔧 Démarrage avec les outils..."
	@docker-compose --profile tools up -d
	@echo "✅ Outils disponibles:"
	@echo "   pgAdmin: http://localhost:5050"
	@echo "   Redis Commander: http://localhost:8081"

# Nettoyer le système
clean:
	@echo "🧹 Nettoyage du système..."
	@docker-compose down -v
	@docker system prune -f
	@echo "✅ Nettoyage terminé!"

# Installation complète (première fois)
install: build start migrate seed
	@echo "🎉 Installation complète terminée!"
	@echo "🌐 Application disponible sur: http://localhost:8000"
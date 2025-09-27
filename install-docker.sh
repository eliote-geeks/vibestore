#!/bin/bash

# Script d'installation Docker pour VibeStore237
# Usage: sudo ./install-docker.sh

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_info "🐳 Vérification et installation de Docker..."

# Vérifier si on est root
if [ "$EUID" -ne 0 ]; then
    log_error "Ce script doit être exécuté en tant que root (utilisez sudo)"
    exit 1
fi

# Vérifier les technologies déjà installées
log_info "Vérification des technologies installées..."

# Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    log_success "Docker déjà installé : $DOCKER_VERSION"
    DOCKER_INSTALLED=true
else
    log_info "Docker non installé, installation en cours..."
    DOCKER_INSTALLED=false
fi

# Docker Compose
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    log_success "Docker Compose déjà installé : $COMPOSE_VERSION"
    COMPOSE_INSTALLED=true
else
    log_info "Docker Compose non installé, installation en cours..."
    COMPOSE_INSTALLED=false
fi

# Si tout est déjà installé, on peut arrêter
if [ "$DOCKER_INSTALLED" = true ] && [ "$COMPOSE_INSTALLED" = true ]; then
    log_success "✅ Docker et Docker Compose sont déjà installés !"
    log_info "Vous pouvez maintenant lancer : ./deploy-production.sh"
    exit 0
fi

# Mettre à jour les paquets
log_info "Mise à jour des paquets..."
apt update

# Installer les dépendances
log_info "Installation des dépendances..."
apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Ajouter la clé GPG Docker
log_info "Ajout de la clé GPG Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Ajouter le repository Docker
log_info "Ajout du repository Docker..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Mettre à jour et installer Docker
log_info "Installation de Docker..."
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Démarrer et activer Docker
log_info "Démarrage de Docker..."
systemctl start docker
systemctl enable docker

# Ajouter l'utilisateur courant au groupe docker
if [ -n "$SUDO_USER" ]; then
    log_info "Ajout de $SUDO_USER au groupe docker..."
    usermod -aG docker $SUDO_USER
fi

# Installer Docker Compose standalone
log_info "Installation de Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Créer le lien symbolique
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# Vérifier l'installation
log_info "Vérification de l'installation..."
docker --version
docker-compose --version

log_success "🎉 Docker et Docker Compose installés avec succès !"
log_info "Redémarrez votre session ou exécutez: newgrp docker"
log_info "Puis vous pourrez lancer: ./deploy-production.sh"
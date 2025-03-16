#!/bin/bash
set -e

# ------ Configuration ------
ENV_FILE=".env"
COMPOSE_PROJECT_NAME=${COMPOSE_PROJECT_NAME:-prod}
CACHE_IMAGE="app:cache"

# ------ Fonctions utilitaires ------
echo_info() {
  echo -e "\033[0;34m[INFO]\033[0m $1"
}

echo_success() {
  echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

echo_error() {
  echo -e "\033[0;31m[ERROR]\033[0m $1"
}

# ------ Vérification des prérequis ------
echo_info "Vérification des prérequis..."

if [ ! -f "$ENV_FILE" ]; then
  echo_error "Fichier .env non trouvé!"
  echo_info "Créez un fichier .env basé sur .env.example"
  exit 1
fi

# ------ Préparation ------
echo_info "Préparation du déploiement..."

# Charger les variables d'environnement
export $(grep -v '^#' "$ENV_FILE" | xargs)
export COMPOSE_PROJECT_NAME

# Activer BuildKit pour des builds plus rapides
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# ------ Construction et déploiement ------
echo_info "Démarrage du déploiement..."

# 1. Pull l'image de cache si elle existe
echo_info "Tentative de récupération du cache précédent..."
docker pull $CACHE_IMAGE || echo_info "Pas de cache disponible, on construit à partir de zéro"

# 2. Build avec cache et BuildKit
echo_info "Construction de l'image Docker..."
docker-compose build --build-arg BUILDKIT_INLINE_CACHE=1

# 3. Tagger l'image comme cache pour le prochain build
echo_info "Sauvegarde du cache pour accélérer les builds futurs..."
docker tag app:latest $CACHE_IMAGE || echo_info "Avertissement: Impossible de tagger l'image"

# 4. Démarrer les conteneurs
echo_info "Démarrage des conteneurs..."
docker-compose up -d

# 5. Nettoyer les images non utilisées
echo_info "Nettoyage des images non utilisées..."
docker image prune -f

# ------ Fin ------
echo_success "Déploiement terminé avec succès!"
echo_info "L'application est disponible à l'adresse: ${NEXT_PUBLIC_URL:-http://localhost:3744}" 
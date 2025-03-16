#!/bin/bash

# Ce script applique les migrations Prisma dans un environnement Docker

# Couleurs pour les messages
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}Vérification si le conteneur Docker est en cours d'exécution...${NC}"
if ! docker ps | grep -q app_simnshop; then
  echo -e "${RED}Le conteneur app_simnshop n'est pas en cours d'exécution.${NC}"
  echo -e "${CYAN}Démarrage des conteneurs Docker...${NC}"
  docker-compose up -d
  echo -e "${GREEN}Conteneurs démarrés.${NC}"
  # Attendre que le conteneur soit prêt
  sleep 5
fi

echo -e "${CYAN}Application des migrations Prisma...${NC}"
docker-compose exec app npx prisma migrate deploy

if [ $? -eq 0 ]; then
  echo -e "${GREEN}Migration terminée avec succès !${NC}"
  echo -e "${CYAN}Redémarrage du conteneur pour appliquer les changements...${NC}"
  docker-compose restart app
  echo -e "${GREEN}Le conteneur a été redémarré.${NC}"
else
  echo -e "${RED}La migration a échoué. Vérifiez les logs pour plus d'informations.${NC}"
  echo -e "${CYAN}Affichage des logs du conteneur :${NC}"
  docker-compose logs app | tail -n 50
fi

echo -e "${CYAN}Terminé.${NC}" 
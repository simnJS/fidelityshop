#!/bin/bash

# Créer le dossier uploads s'il n'existe pas déjà
mkdir -p ./uploads

# Copier les images existantes du container vers le dossier local si nécessaire
if [ "$(ls -A ./uploads 2>/dev/null)" == "" ]; then
  echo "Le dossier uploads est vide, copie des images existantes..."
  # Vérifier si le conteneur est en cours d'exécution
  CONTAINER_ID=$(docker ps | grep app_${COMPOSE_PROJECT_NAME:-prod} | awk '{print $1}')
  
  if [ -n "$CONTAINER_ID" ]; then
    # Copier les fichiers du conteneur vers le système hôte
    docker cp $CONTAINER_ID:/app/public/uploads/. ./uploads/
    echo "Images copiées avec succès depuis le conteneur."
  else
    echo "Le conteneur n'est pas en cours d'exécution, aucune image n'a été copiée."
    # Créer un fichier README dans le dossier uploads
    cat > ./uploads/README.md << 'EOF'
# Dossier d'uploads

Ce dossier est utilisé pour stocker les images téléchargées.

## Important
- Ce dossier est maintenant directement monté dans le conteneur Docker
- Les images sont désormais persistantes entre les redémarrages
- Les images stockées ici sont accessibles via /uploads/nom-du-fichier
EOF
  fi
else
  echo "Le dossier uploads contient déjà des fichiers."
fi

# Définir les permissions correctes
chmod -R 755 ./uploads
echo "Permissions du dossier uploads configurées."

echo "Initialisation terminée." 
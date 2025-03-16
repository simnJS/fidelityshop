#!/bin/bash

# Créer une migration pour modifier la colonne metadata
echo "Création de la migration Prisma pour modifier la colonne metadata..."
npx prisma migrate dev --name change_metadata_to_text

# Appliquer la migration
echo "Application de la migration à la base de données..."
npx prisma migrate deploy

# Générer le client Prisma
echo "Génération du client Prisma..."
npx prisma generate

echo "Migration terminée! La colonne metadata peut maintenant stocker de grandes quantités de données." 
#!/bin/bash

# Script pour installer les dépendances nécessaires à la gestion d'images

echo "Installation des dépendances pour la gestion d'images..."

# Installer formidable pour gérer l'upload de fichiers
npm install formidable@latest

# Installer uuid pour générer des noms de fichiers uniques
npm install uuid@latest

# Installer les types correspondants
npm install @types/formidable@latest @types/uuid@latest --save-dev

echo "Dépendances installées avec succès!"
echo "Redémarrez votre serveur pour appliquer les changements." 
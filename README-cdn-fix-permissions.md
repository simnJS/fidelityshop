# Résolution des problèmes de permissions Docker pour les uploads

Ce guide explique comment résoudre l'erreur "EACCES: permission denied, mkdir '/app/tmp'" que vous rencontrez lors de l'upload de preuves d'achat.

## Problème

Dans l'environnement Docker, l'application n'a pas les droits nécessaires pour créer ou accéder au dossier temporaire utilisé pour stocker les fichiers avant de les envoyer au CDN.

## Solution 1 : Utiliser le dossier /tmp standard (Implémenté)

La mise à jour du code utilise maintenant le dossier `/tmp` au lieu de `/app/tmp`, ce qui devrait résoudre le problème car `/tmp` est généralement accessible en écriture dans les conteneurs Docker.

## Solution 2 : Utiliser le fichier docker-compose.patch.yml

Si la solution 1 ne fonctionne pas, vous pouvez utiliser le fichier `docker-compose.patch.yml` fourni pour ajouter les volumes nécessaires :

1. Arrêtez le conteneur actuel :
   ```bash
   docker-compose down
   ```

2. Démarrez l'application avec le fichier de patch :
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.patch.yml up -d
   ```

Ce fichier de patch ajoute :
- Un volume dédié pour les fichiers temporaires (`app_tmp`)
- Un volume persistant pour les uploads (`app_uploads`)

## Solution 3 : Modifier manuellement le Dockerfile

Si les solutions précédentes ne fonctionnent pas, vous pouvez modifier votre Dockerfile pour créer le dossier et configurer les permissions :

1. Ajoutez ces lignes à votre Dockerfile :
   ```dockerfile
   # Créer les dossiers nécessaires et configurer les permissions
   RUN mkdir -p /tmp/uploads && \
       chmod -R 777 /tmp && \
       mkdir -p /app/public/uploads && \
       chmod -R 777 /app/public/uploads
   ```

2. Reconstruisez et redémarrez le conteneur :
   ```bash
   docker-compose build
   docker-compose up -d
   ```

## Solution 4 : Exécuter le conteneur avec un utilisateur root (Non recommandé)

En dernier recours, vous pouvez exécuter le conteneur avec l'utilisateur root, mais c'est moins sécurisé :

1. Ajoutez cette ligne à votre service dans `docker-compose.yml` :
   ```yaml
   user: "0:0"  # Exécute en tant que root
   ```

2. Redémarrez le conteneur :
   ```bash
   docker-compose down
   docker-compose up -d
   ```

## Vérification

Après avoir appliqué l'une de ces solutions, testez l'upload d'une preuve d'achat pour vérifier que le problème est résolu.

Si vous rencontrez toujours des problèmes, consultez les logs du conteneur pour obtenir plus d'informations sur l'erreur :

```bash
docker-compose logs -f app
``` 
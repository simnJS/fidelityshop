# Guide de déploiement de SimnShop

Ce guide explique comment déployer SimnShop en utilisant Docker et Portainer, avec une base de données PostgreSQL.

## Prérequis

- Un serveur avec Docker et Portainer installés
- Un compte GitHub avec le dépôt du projet
- Accès à un client SSH pour se connecter au serveur

## Déploiement avec GitHub et Portainer

### 1. Configurer les variables d'environnement

Créez un fichier `.env` basé sur le fichier `.env.example` fourni et remplissez-le avec vos valeurs:

```bash
# Configuration de l'application
PORT=3000
NEXTAUTH_URL=https://votre-domaine.com  # URL publique de votre site
NEXTAUTH_SECRET=votre_secret_tres_long_et_complexe  # Générez une longue chaîne aléatoire
NEXT_PUBLIC_URL=https://votre-domaine.com  # URL publique de votre site

# Configuration de la base de données PostgreSQL
DB_USER=simnshop
DB_PASSWORD=mot_de_passe_complexe  # Utilisez un mot de passe fort
DB_NAME=simnshop
DB_PORT=5432
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}?schema=public

# Configuration Discord
DISCORD_TOKEN=votre_token_discord  # Obtenu depuis le portail développeur Discord
DISCORD_CHANNEL_ID=votre_id_de_canal_discord  # ID du canal où envoyer les notifications
```

### 2. Méthode 1: Déploiement via Portainer avec GitHub

1. **Dans Portainer, accédez à votre environnement Docker**

2. **Créer une nouvelle Stack**
   - Cliquez sur "Stacks" dans le menu latéral
   - Cliquez sur "Add stack"
   - Donnez un nom à votre stack (ex: "simnshop")

3. **Configuration de la stack avec GitHub**
   - Dans "Build method", sélectionnez "Repository"
   - Entrez l'URL de votre dépôt GitHub: `https://github.com/votre-nom/simnshop.git`
   - Spécifiez la branche (généralement "main")
   - Indiquez le chemin du fichier Compose: `docker-compose.yml`

4. **Configurer les variables d'environnement**
   - Copiez le contenu de votre fichier `.env` dans la section "Environment variables"
   - Assurez-vous que toutes les variables sensibles sont correctement définies

5. **Déployer la stack**
   - Cliquez sur "Deploy the stack"
   - Portainer va télécharger le code, construire l'image et démarrer les conteneurs

### 3. Méthode 2: Déploiement via GitHub Container Registry

Cette méthode utilise les GitHub Actions pour construire automatiquement l'image Docker.

1. **Configurer les secrets GitHub**
   - Dans votre dépôt GitHub, allez dans Settings > Secrets and variables > Actions
   - Assurez-vous que vous avez les droits pour publier des packages dans GitHub Container Registry

2. **Pousser sur la branche principale pour déclencher le build**
   - Le workflow `.github/workflows/docker-build.yml` va construire et publier l'image
   - L'image sera disponible à: `ghcr.io/votre-nom-github/simnshop:latest`

3. **Dans Portainer, créer une stack**
   - Cliquez sur "Stacks" puis "Add stack"
   - Donnez un nom (ex: "simnshop")
   - Dans "Build method", sélectionnez "Web editor"
   - Copiez ce docker-compose modifié qui utilise l'image pré-construite:

```yaml
version: '3.8'

services:
  app:
    container_name: simnshop
    image: ghcr.io/votre-nom-github/simnshop:latest
    restart: always
    ports:
      - "${PORT:-3000}:3000"
    depends_on:
      - db
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - DISCORD_TOKEN=${DISCORD_TOKEN}
      - DISCORD_CHANNEL_ID=${DISCORD_CHANNEL_ID}
      - NEXT_PUBLIC_URL=${NEXT_PUBLIC_URL}
    networks:
      - simnshop_network

  db:
    container_name: simnshop_db
    image: postgres:14-alpine
    restart: always
    ports:
      - "${DB_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_NAME}
    networks:
      - simnshop_network

volumes:
  postgres_data:
    name: simnshop_db_data

networks:
  simnshop_network:
    name: simnshop_network
```

4. **Configurer les variables d'environnement**
   - Copiez le contenu de votre fichier `.env` dans la section "Environment variables"

5. **Déployer la stack**
   - Cliquez sur "Deploy the stack"

## Configuration post-déploiement

### 1. Initialiser la base de données

Après le premier déploiement, vous devez exécuter les migrations Prisma:

1. Accédez au conteneur de l'application dans Portainer
2. Ouvrez une console dans le conteneur
3. Exécutez les commandes:
   ```bash
   npx prisma migrate deploy
   ```

### 2. Configuration du proxy inverse (Nginx/Traefik)

Pour exposer votre application de manière sécurisée avec HTTPS, configurez un proxy inverse:

**Exemple avec Nginx:**
```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name votre-domaine.com;
    
    ssl_certificate /chemin/vers/certificat.pem;
    ssl_certificate_key /chemin/vers/cle.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Mise à jour de l'application

Pour mettre à jour votre application:

1. **Avec la méthode GitHub directe**:
   - Poussez les changements sur votre branche principale
   - Dans Portainer, allez dans votre stack
   - Cliquez sur "Pull and redeploy"

2. **Avec la méthode GitHub Container Registry**:
   - Poussez les changements sur votre branche principale
   - Attendez que le workflow GitHub Actions construise la nouvelle image
   - Dans Portainer, allez dans votre stack
   - Cliquez sur "Pull and redeploy"

## Dépannage

### Problèmes de connexion à la base de données
- Vérifiez que le conteneur de la base de données est en cours d'exécution
- Vérifiez que la variable `DATABASE_URL` est correctement configurée
- Inspectez les logs de l'application pour plus de détails

### L'application ne démarre pas
- Vérifiez les logs du conteneur pour identifier le problème
- Assurez-vous que toutes les variables d'environnement requises sont définies

### Problèmes d'authentification
- Vérifiez que `NEXTAUTH_URL` et `NEXTAUTH_SECRET` sont correctement configurés
- Assurez-vous que `NEXTAUTH_URL` correspond à l'URL publique de votre site

### Problèmes avec les webhooks Discord
- Vérifiez que `DISCORD_TOKEN` et `DISCORD_CHANNEL_ID` sont correctement configurés
- Assurez-vous que le bot Discord a les permissions requises dans le canal spécifié 
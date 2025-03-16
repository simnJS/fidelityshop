# Résolution de l'erreur 500 du Proxy CDN

Ce guide explique comment résoudre l'erreur 500 (Internal Server Error) que vous rencontrez avec le proxy d'upload d'images vers le CDN.

## Diagnostic

D'après les erreurs que vous avez partagées, l'API `/api/cdn/proxy-upload` renvoie une erreur 500. Voici les principales causes possibles :

1. **Problème de permissions** - Le serveur ne peut pas créer ou accéder aux fichiers temporaires
2. **Erreur dans le code du proxy** - Problème avec la gestion de formidable ou la communication avec le CDN
3. **Problème d'authentification** - Le token d'authentification pourrait être invalide ou expiré
4. **Dépendances manquantes** - Certaines dépendances peuvent être manquantes ou incompatibles

## Solution immédiate

Nous avons corrigé plusieurs problèmes potentiels dans le code du proxy. Pour appliquer ces corrections :

1. Redéployez l'application avec les modifications apportées au fichier `pages/api/cdn/proxy-upload.ts`
2. Vérifiez que le script `setup-uploads.js` a été exécuté pour installer toutes les dépendances nécessaires

## Solutions alternatives

En attendant que le problème soit complètement résolu, voici des solutions alternatives :

### 1. Utiliser l'outil en ligne de commande

L'outil en ligne de commande contourne les restrictions CORS et les problèmes de proxy :

```bash
npm run cdn:upload chemin/vers/image.jpg
```

Cet outil communique directement avec le CDN sans passer par le proxy.

### 2. Héberger temporairement vos images sur un autre service

Vous pouvez utiliser un service gratuit comme :
- [ImgBB](https://imgbb.com/)
- [Imgur](https://imgur.com/)
- [Cloudinary](https://cloudinary.com/)

### 3. Stocker les images localement

Vous pouvez temporairement stocker les images dans votre dossier `public/uploads` :

1. Créez un dossier `public/uploads` s'il n'existe pas déjà
2. Copiez vos images dans ce dossier
3. Référencez-les avec des URL relatives comme `/uploads/mon-image.jpg`

## Déboguer l'erreur

Pour identifier la cause exacte de l'erreur 500 :

1. **Consulter les logs du serveur** :
   ```bash
   docker-compose logs -f app
   ```

2. **Activer les logs de débogage** dans le fichier `.env` :
   ```
   DEBUG=true
   ```

3. **Tester l'accès direct au CDN** :
   ```bash
   curl -H "Authorization: MTc0MjEzODIyMzM5Mw==.ODQ2NjI0NDhiMzRkNmI4MzQwOTI2MTBkNzE1NjI0NWEuMzIwOGNmODY0Y2E2NTE3ZWJmZDJhZWQ0N2QxNmQ3MmRlZDc3YjQ0MWMwNTA2NmE4ZmU4YWI3ZGI1Mjc5ZGVjOWM5ODI4ZTZiZDU3YmRmNDJiMjUxNmYxMjM3MmFlYzlkZGUxYTQzMWRkY2Y3NGQ3NmMwZjJmODUyYmRjNmZmYzdkYzNjYzVhNzE1NTI0YTU5MWY3ZTVlNDMwNzdhMGQxOQ==" https://cdn.simnjs.fr/api/upload
   ```
   
## Redémarrer le service

Parfois, un simple redémarrage peut résoudre des problèmes temporaires :

```bash
docker-compose restart app
```

## Besoin d'aide supplémentaire ?

Si ces solutions ne résolvent pas votre problème, veuillez fournir les éléments suivants pour un diagnostic plus précis :

1. Les logs complets du serveur montrant l'erreur
2. La version exacte de Node.js que vous utilisez
3. Les versions des dépendances dans votre package.json
4. L'URL complète du CDN que vous essayez d'utiliser 
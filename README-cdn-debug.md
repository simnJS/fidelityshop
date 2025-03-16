# Guide de dépannage CDN

Ce document fournit des informations pour diagnostiquer et résoudre les problèmes courants avec l'uploader d'images CDN.

## Problèmes courants

### Erreur de permission EACCES lors de l'upload d'images

Si vous rencontrez l'erreur "EACCES: permission denied, mkdir '/app/tmp'", cela signifie que l'application n'a pas les droits nécessaires pour créer le dossier temporaire dans l'environnement Docker.

La solution incluse dans la dernière mise à jour utilise maintenant le dossier `/tmp` qui est accessible en écriture dans tous les environnements Docker standard. Si vous avez un environnement personnalisé où même `/tmp` n'est pas accessible, vous pouvez :

1. Modifier votre Dockerfile pour inclure les commandes suivantes :
   ```dockerfile
   # Créer un dossier temporaire et donner les droits
   RUN mkdir -p /app/tmp && chmod 777 /app/tmp
   ```

2. Ou modifier votre docker-compose.yml pour ajouter un volume temporaire :
   ```yaml
   volumes:
     - tmp-volume:/app/tmp
   
   # Définir le volume
   volumes:
     tmp-volume:
   ```

Après ces modifications, redémarrez votre conteneur.

### Erreur 500 lors de l'upload d'images

Si vous recevez une erreur 500 (Internal Server Error) lors de l'upload d'images via l'interface web, suivez ces étapes :

1. **Vérifier les logs du serveur**
   ```bash
   docker-compose logs -f app
   ```
   Les messages d'erreur dans les logs vous aideront à identifier le problème spécifique.

2. **Vérifier les dépendances**
   Assurez-vous que toutes les dépendances nécessaires sont installées :
   ```bash
   npm run setup:uploads
   ```
   Ce script vérifiera et installera les dépendances manquantes.

3. **Problèmes de cors**
   Si les logs mentionnent des problèmes CORS, cela peut être dû à des restrictions de sécurité du navigateur. Utilisez l'outil en ligne de commande pour contourner ce problème :
   ```bash
   npm run cdn:upload chemin/vers/image.jpg
   ```

4. **Problèmes de connexion au CDN**
   Vérifiez que le CDN est accessible depuis votre serveur :
   ```bash
   curl -I https://cdn.simnjs.fr
   ```
   Vous devriez recevoir une réponse HTTP 200.

### Problèmes avec le token d'authentification

Si vous rencontrez des erreurs d'authentification :

1. **Vérifier la validité du token**
   Le token CDN actuel peut être expiré. Contactez l'administrateur du CDN pour obtenir un nouveau token.

2. **Mettre à jour le token**
   Après avoir obtenu un nouveau token, mettez à jour ces fichiers :
   - `pages/api/cdn/proxy-upload.ts` - Variable `CDN_AUTH_TOKEN`
   - `scripts/upload-to-cdn.js` - Variable `CDN_AUTH_TOKEN`

### Images non affichées après upload réussi

Si l'upload semble réussir mais les images ne s'affichent pas :

1. **Vérifier l'URL de l'image**
   Assurez-vous que l'URL retournée par le CDN est correcte et accessible en la visitant directement dans un navigateur.

2. **Vérifier les paramètres CORS du CDN**
   Si les images sont accessibles directement mais pas dans votre application, il peut s'agir d'un problème CORS côté CDN.

3. **Vérifier la configuration du composant Image**
   Si vous utilisez le composant Next.js Image, assurez-vous que le domaine du CDN est configuré dans `next.config.js` :
   ```js
   images: {
     domains: ['cdn.simnjs.fr'],
   },
   ```

## Utiliser l'outil de ligne de commande

L'outil de ligne de commande est souvent plus fiable car il évite les problèmes CORS :

```bash
# Tester l'upload d'une image
npm run cdn:upload chemin/vers/image.jpg

# Output détaillé pour le débogage
NODE_DEBUG=http,request npm run cdn:upload chemin/vers/image.jpg
```

## Test rapide du proxy API

Pour tester si le proxy API fonctionne correctement :

```bash
# Créer un fichier test.jpg
curl -X POST -F "file=@chemin/vers/image.jpg" http://localhost:3000/api/cdn/proxy-upload
```

Si cette commande réussit mais que l'interface échoue, cela indique un problème côté client.

## Solution de contournement temporaire

Si les problèmes persistent, vous pouvez temporairement utiliser le stockage local :

1. Uploadez les images avec l'outil en ligne de commande
2. Notez l'URL retournée et utilisez-la dans vos produits

Contactez support@simnjs.fr si vous avez besoin d'assistance supplémentaire avec le CDN. 
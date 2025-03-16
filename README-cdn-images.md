# Guide d'utilisation des images CDN

Ce guide explique comment uploader et gérer des images avec le CDN Zipline intégré à l'application.

## Pourquoi utiliser le CDN?

- **Performance**: Les images sont servies depuis un réseau de distribution optimisé
- **Fiabilité**: Les images ne sont pas perdues lors des redémarrages ou déploiements
- **Évolutivité**: Capacité à stocker un grand nombre d'images sans impact sur les performances de l'application

## Méthodes d'upload des images

### 1. Via l'interface d'administration

La méthode la plus simple est d'utiliser l'interface d'administration dédiée:

1. Connectez-vous avec un compte administrateur
2. Accédez à **Images (CDN)** dans le menu de navigation
3. Utilisez le formulaire d'upload pour télécharger vos images
4. Copiez l'URL générée pour l'utiliser dans vos produits

### 2. Directement lors de la création/modification de produits

Lors de la création ou modification d'un produit:

1. Accédez au formulaire de création/modification de produit
2. Sous le champ "URL de l'image", vous trouverez un uploader intégré
3. Uploadez votre image directement depuis ce formulaire
4. L'URL sera automatiquement renseignée dans le champ du formulaire

### 3. Via ligne de commande (pour les développeurs)

Un outil en ligne de commande est disponible pour automatiser l'upload:

```bash
# Upload d'une image via ligne de commande
npm run cdn:upload chemin/vers/image.jpg
```

L'URL sera affichée dans la console et copiée dans le presse-papier.

## Bonnes pratiques

- **Format d'images**: Privilégiez des formats modernes comme WebP ou PNG optimisés
- **Taille des fichiers**: Gardez la taille des images sous 1-2 Mo pour de meilleures performances
- **Dimensions**: Assurez-vous que les images ont des dimensions adaptées à leur utilisation (idéalement 1200x1200px max pour les produits)
- **Nommage**: Utilisez des noms descriptifs pour vos fichiers avant l'upload

## Dépannage

### Si les images ne s'affichent pas:

1. Vérifiez que l'URL de l'image est correctement copiée dans le champ du produit
2. Assurez-vous que l'URL commence par `https://`
3. Testez l'URL directement dans votre navigateur pour vérifier si l'image est accessible
4. Si l'image est accessible dans le navigateur mais ne s'affiche pas dans l'application, vérifiez la console du navigateur pour d'éventuelles erreurs

### Si l'upload échoue:

1. Vérifiez la taille du fichier (max 10 Mo)
2. Assurez-vous que le format est supporté (JPG, PNG, GIF, WebP)
3. Vérifiez votre connexion internet
4. Essayez de réduire la taille de l'image avant l'upload 
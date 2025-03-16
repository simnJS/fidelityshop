# Guide sur le système d'images CDN

Ce document explique le nouveau système de gestion d'images implémenté dans SimnShop, qui utilise maintenant un CDN (Content Delivery Network) pour toutes les images.

## Qu'est-ce qui a changé ?

Toutes les images de l'application (produits, preuves d'achat, etc.) sont désormais stockées sur un CDN externe plutôt que sur le serveur local. Cela apporte de nombreux avantages :

1. **Performance améliorée** : Les images sont servies plus rapidement depuis des serveurs optimisés pour cela
2. **Meilleure fiabilité** : Les images ne sont pas perdues lors des redémarrages ou des déploiements
3. **Réduction de la charge serveur** : Votre serveur d'application n'a plus à gérer les requêtes pour les images
4. **Évolutivité** : Stockage et distribution illimités pour toutes vos images

## Comment cela affecte les utilisateurs

Pour la plupart des utilisateurs, ce changement est transparent. L'interface reste la même, mais vous pourriez remarquer que :

- Les images se chargent plus rapidement
- Les URLs des images ont changé (elles commencent par `https://cdn.simnjs.fr/`)

## Fonctionnalités concernées

Le nouveau système CDN est maintenant utilisé pour :

### 1. Les preuves d'achat

Toutes les preuves d'achat téléchargées par les utilisateurs sont automatiquement envoyées au CDN, y compris :
- Les preuves pour un seul produit
- Les preuves pour plusieurs produits

### 2. Les images de produits

Les administrateurs peuvent télécharger des images pour les produits directement depuis l'interface d'administration, et ces images sont également stockées sur le CDN.

### 3. Les autres téléchargements d'images

Tout autre téléchargement d'image dans l'application passe maintenant par le CDN.

## Comment accéder aux anciennes images ?

Si vous avez des images qui ont été téléchargées avant la mise à jour vers le CDN, elles restent accessibles via leurs anciennes URLs (commençant généralement par `/uploads/`). Ces images continueront de fonctionner, mais nous vous recommandons de les remplacer progressivement par des versions hébergées sur le CDN.

## En cas de problème

Si le CDN n'est pas disponible temporairement, le système utilisera automatiquement un stockage local comme solution de secours. Les images continueront d'être acceptées, mais seront stockées temporairement sur le serveur jusqu'à ce que le CDN soit à nouveau disponible.

## Pour les administrateurs

Les administrateurs peuvent consulter les guides techniques suivants pour plus d'informations :

- `README-cdn-debug.md` : Guide de dépannage pour les problèmes liés au CDN
- `README-cdn-cors-fix.md` : Résolution des problèmes CORS avec le CDN
- `README-cdn-images.md` : Guide détaillé sur la gestion des images via le CDN 
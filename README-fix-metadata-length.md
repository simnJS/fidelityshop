# Résolution de l'erreur de longueur de métadonnées

Ce guide explique comment résoudre l'erreur suivante que vous pouvez rencontrer lors du téléchargement de preuves d'achat avec plusieurs produits :

```
Invalid `prisma.receipt.create()` invocation:
The provided value for the column is too long for the column's type. Column: metadata
```

## Problème

Dans votre modèle de données Prisma, le champ `metadata` de la table `Receipt` est défini comme un `String` standard. Pour MySQL, cela correspond à un type `VARCHAR(191)` qui est limité à 191 caractères. Lorsque vous téléchargez une preuve d'achat avec plusieurs produits, les données JSON stockées dans ce champ peuvent dépasser cette limite.

## Solution

Nous avons modifié le schéma Prisma pour définir le champ `metadata` comme un `Text` plutôt qu'un `String`, ce qui permet de stocker une quantité beaucoup plus importante de données.

## Comment appliquer la solution

### 1. Modification du schéma Prisma

Le schéma a été modifié comme suit :

```prisma
model Receipt {
  // ... autres champs ...
  metadata       String?  @db.Text  // Pour stocker les données JSON des produits multiples
}
```

### 2. Appliquer la migration

Pour appliquer cette modification à votre base de données, suivez ces étapes :

#### En local (développement)

1. Exécutez le script de migration :
   ```bash
   # Sur Linux/Mac
   bash migration-metadata.sh
   
   # Sur Windows
   .\migration-metadata.ps1
   ```

#### En production (avec Docker)

1. Connectez-vous à votre serveur et accédez au répertoire du projet
2. Appliquez la migration avec Docker Compose :
   ```bash
   docker-compose exec app npx prisma migrate deploy
   ```

## Vérification

Après avoir appliqué la migration, testez à nouveau le téléchargement d'une preuve d'achat avec plusieurs produits pour vérifier que l'erreur a été résolue.

## Note pour les administrateurs

Cette modification n'affecte que le stockage des métadonnées dans la base de données. Aucune fonctionnalité existante ne sera impactée négativement par cette modification. Elle permet simplement de stocker plus d'informations sur les produits lors de l'envoi de preuves d'achat multiples. 
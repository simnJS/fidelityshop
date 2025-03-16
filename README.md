# FidelityShop - Système de Points de Fidélité Minecraft

FidelityShop est une application web qui permet de gérer un système de points de fidélité pour votre serveur Minecraft. Les utilisateurs peuvent télécharger des preuves d'achat, recevoir des points et les échanger contre des récompenses.

## Fonctionnalités

- Système d'authentification (inscription/connexion)
- Tableau de bord utilisateur
- Téléchargement de preuves d'achat
- Système de points de fidélité
- Boutique en ligne pour échanger des points
- Intégration avec Discord pour la validation des preuves d'achat et la gestion des commandes

## Prérequis

- Node.js 18+ et npm
- Un bot Discord (pour l'intégration Discord)

## Installation

1. Clonez ce dépôt :
```bash
git clone https://github.com/votre-nom/fidelityshop.git
cd fidelityshop
```

2. Installez les dépendances :
```bash
npm install
```

3. Configurez les variables d'environnement :
   - Copiez le fichier `.env.example` en `.env`
   - Modifiez les valeurs selon votre configuration

4. Initialisez la base de données :
```bash
npx prisma migrate dev --name init
```

5. Démarrez le serveur de développement :
```bash
npm run dev
```

6. Accédez à l'application à l'adresse [http://localhost:3000](http://localhost:3000)

## Configuration Discord

Pour utiliser l'intégration Discord, vous devez :

1. Créer un bot Discord sur le [portail développeur Discord](https://discord.com/developers/applications)
2. Ajouter le bot à votre serveur avec les permissions nécessaires
3. Configurer les variables d'environnement `DISCORD_TOKEN` et `DISCORD_CHANNEL_ID` dans le fichier `.env`

## Déploiement

Pour déployer l'application en production :

1. Construisez l'application :
```bash
npm run build
```

2. Démarrez le serveur de production :
```bash
npm start
```

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

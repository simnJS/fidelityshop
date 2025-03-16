FROM node:20-alpine AS base

# Installer les dépendances nécessaires pour Prisma
RUN apk add --no-cache libc6-compat openssl

# Créer l'application directory
WORKDIR /app

# Installer les dépendances - avec une meilleure utilisation du cache
FROM base AS deps
# Copier uniquement les fichiers nécessaires pour l'installation des dépendances
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Installer toutes les dépendances, y compris les devDependencies pour la phase de build
RUN npm ci && \
    # Installer spécifiquement les types manquants
    npm install --save-dev @types/bcrypt eslint && \
    # Générer le client Prisma
    npx prisma generate

# Build de l'application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copier le reste des fichiers
COPY . .

# Générer la version de production de l'application
ENV NODE_ENV=production
RUN npm run dev

# Image de production
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Ajouter un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/public/uploads && \
    chown -R nextjs:nodejs /app

# Installer seulement les dépendances requises pour l'exécution
RUN apk add --no-cache libc6-compat openssl

# Copier les fichiers nécessaires
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

# Exposer le port
EXPOSE 3000

# Configuration de la variable d'environnement pour next.js standalone
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Script de démarrage
CMD ["node", "server.js"] 
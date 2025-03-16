FROM node:20-alpine AS base

# Installer les dépendances nécessaires pour Prisma
RUN apk add --no-cache libc6-compat openssl

# Créer l'application directory
WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Installer les dépendances
FROM base AS deps
RUN npm ci

# Build de l'application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Image de production
FROM base AS runner
ENV NODE_ENV production

# Ajouter un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Copier les fichiers nécessaires
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Exposer le port
EXPOSE 3000

# Configuration de la variable d'environnement pour next.js standalone
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Démarrer l'application
CMD ["node", "server.js"] 
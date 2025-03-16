import { PrismaClient } from '@prisma/client'

// Éviter de créer plusieurs instances de PrismaClient 
// en développement en raison du hot-reloading
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma 
import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { prisma } from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Ajouter des headers CORS pour permettre les requêtes entre domaines avec cookies
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Gérer les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ message: 'Non autorisé' });
  }

  try {
    const userId = token.id as string;

    // Si l'utilisateur est admin, il peut voir toutes les commandes
    if (token.isAdmin && req.query.all === 'true') {
      const orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              username: true,
              minecraftName: true
            }
          },
          product: true
        }
      });
      return res.status(200).json(orders);
    }

    // Sinon, l'utilisateur ne voit que ses propres commandes
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: true
      }
    });

    return res.status(200).json(orders);
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    return res.status(500).json({ message: 'Erreur du serveur' });
  }
} 
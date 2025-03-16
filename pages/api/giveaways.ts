import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Récupérer les giveaways actifs
      const giveaways = await prisma.giveaway.findMany({
        where: {
          status: 'active',
          endDate: {
            gte: new Date(), // Date de fin supérieure ou égale à maintenant
          },
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              pointsCost: true,
            },
          },
          _count: {
            select: { entries: true }
          }
        },
        orderBy: {
          endDate: 'asc', // Trier par date de fin croissante
        },
      });

      return res.status(200).json(giveaways);
    } catch (error) {
      console.error('Erreur lors de la récupération des giveaways:', error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
} 
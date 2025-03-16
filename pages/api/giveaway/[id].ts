import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  // Vérifier que l'utilisateur est authentifié
  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID de giveaway invalide' });
  }

  if (req.method === 'GET') {
    try {
      // Récupérer le giveaway avec ses informations
      const giveaway = await prisma.giveaway.findUnique({
        where: { id },
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
      });

      if (!giveaway) {
        return res.status(404).json({ error: 'Giveaway non trouvé' });
      }

      // Vérifier si l'utilisateur participe déjà
      const entry = await prisma.giveawayEntry.findUnique({
        where: {
          userId_giveawayId: {
            userId: session.user.id || '',
            giveawayId: id
          }
        }
      });

      return res.status(200).json({
        ...giveaway,
        hasEntered: !!entry
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du giveaway:', error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
} 
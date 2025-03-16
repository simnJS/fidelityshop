import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const giveawayId = req.query.id as string;

  if (!giveawayId) {
    return res.status(400).json({ error: 'ID du giveaway manquant' });
  }

  try {
    // Récupérer le giveaway avec les informations associées
    const giveaway = await prisma.giveaway.findUnique({
      where: {
        id: giveawayId,
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
          select: {
            entries: true,
          },
        },
      },
    });

    if (!giveaway) {
      return res.status(404).json({ error: 'Giveaway non trouvé' });
    }

    // Si le giveaway a un gagnant, récupérer ses informations
    let winner = null;
    if (giveaway.winnerId) {
      const winnerEntry = await prisma.giveawayEntry.findFirst({
        where: {
          giveawayId: giveawayId,
          userId: giveaway.winnerId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      if (winnerEntry) {
        winner = {
          id: winnerEntry.user.id,
          username: winnerEntry.user.username,
        };
      }
    }

    // Préparer la réponse
    const response = {
      ...giveaway,
      winner,
    };

    return res.status(200).json(response);
  } catch (error: any) {
    console.error('Erreur lors de la récupération du giveaway:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
} 
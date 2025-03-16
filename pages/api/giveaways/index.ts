import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Récupérer tous les giveaways actifs avec les informations requises
    const giveaways = await prisma.giveaway.findMany({
      where: {
        status: 'active',
        startDate: {
          lte: new Date(),
        },
        endDate: {
          gte: new Date(),
        },
      },
      orderBy: {
        endDate: 'asc',
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

    // Si des giveaways ont des gagnants, récupérer leurs informations
    const giveawaysWithWinners = await Promise.all(
      giveaways.map(async (giveaway) => {
        if (giveaway.winnerId) {
          const winnerEntry = await prisma.giveawayEntry.findFirst({
            where: {
              giveawayId: giveaway.id,
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
            return {
              ...giveaway,
              winner: {
                id: winnerEntry.user.id,
                username: winnerEntry.user.username,
              },
            };
          }
        }

        return giveaway;
      })
    );

    return res.status(200).json(giveawaysWithWinners);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des giveaways:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
} 
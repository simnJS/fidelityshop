import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Ajouter des headers CORS pour permettre les requêtes entre domaines avec cookies
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Gérer les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const giveawayId = req.query.id as string;

  if (!giveawayId) {
    return res.status(400).json({ error: 'ID du giveaway manquant' });
  }

  try {
    console.log('API giveaway - Récupération du giveaway id:', giveawayId);
  
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
      console.log('API giveaway - Giveaway non trouvé:', giveawayId);
      return res.status(404).json({ error: 'Giveaway non trouvé' });
    }

    console.log(`API giveaway - Giveaway trouvé: ${giveaway.title}, status: ${giveaway.status}, entries: ${giveaway._count?.entries || 0}`);

    // Si le giveaway a un gagnant, récupérer ses informations
    let winner = null;
    if (giveaway.winnerId) {
      console.log(`API giveaway - Recherche du gagnant, ID: ${giveaway.winnerId}`);
      
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
        console.log(`API giveaway - Gagnant trouvé: ${winner.username}`);
      } else {
        console.log(`API giveaway - Entrée gagnante non trouvée pour l'ID: ${giveaway.winnerId}`);
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
    return res.status(500).json({ 
      error: 'Erreur serveur', 
      details: error.message 
    });
  }
} 
import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { prisma } from '../../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Récupérer le token JWT directement depuis la requête
    const token = await getToken({ req });

    // Vérifier que l'utilisateur est authentifié
    if (!token || !token.id) {
      console.log('Non authentifié via JWT:', token);
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Récupérer l'ID utilisateur du token
    const userId = token.id as string;

    // Vérifier que l'utilisateur est administrateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.isAdmin) {
      console.log('Non administrateur:', user);
      return res.status(403).json({ error: 'Accès interdit - vous devez être administrateur' });
    }

    // Récupérer l'ID du giveaway depuis l'URL
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'ID de giveaway invalide' });
    }

    if (req.method === 'POST') {
      try {
        // Vérifier que le giveaway existe et est actif
        const giveaway = await prisma.giveaway.findUnique({
          where: { id }
        });

        if (!giveaway) {
          return res.status(404).json({ error: 'Giveaway non trouvé' });
        }

        if (giveaway.status !== 'active') {
          return res.status(400).json({ error: 'Ce giveaway n\'est pas actif' });
        }

        if (giveaway.winnerId) {
          return res.status(400).json({ error: 'Ce giveaway a déjà un gagnant' });
        }

        // Récupérer toutes les participations
        const entries = await prisma.giveawayEntry.findMany({
          where: { giveawayId: id },
          include: {
            user: {
              select: {
                id: true,
                username: true
              }
            }
          }
        });

        if (entries.length === 0) {
          return res.status(400).json({ error: 'Aucun participant à ce giveaway' });
        }

        // Sélectionner un gagnant aléatoire
        const randomIndex = Math.floor(Math.random() * entries.length);
        const winner = entries[randomIndex];

        // Mettre à jour le giveaway avec le gagnant
        await prisma.giveaway.update({
          where: { id },
          data: {
            winnerId: winner.userId,
            status: 'completed'
          }
        });

        return res.status(200).json({
          success: true,
          winnerId: winner.userId,
          winnerUsername: winner.user.username
        });
      } catch (error) {
        console.error('Erreur lors de la sélection du gagnant:', error);
        return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
      }
    } else {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }
  } catch (error) {
    console.error('Erreur globale dans l\'API de sélection du gagnant:', error);
    return res.status(500).json({ error: 'Erreur serveur interne', details: (error as Error).message });
  }
} 
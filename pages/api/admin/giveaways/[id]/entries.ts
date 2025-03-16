import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { prisma } from '../../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Récupérer le token JWT directement depuis la requête
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

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

    if (req.method === 'GET') {
      try {
        // Vérifier que le giveaway existe
        const giveaway = await prisma.giveaway.findUnique({
          where: { id }
        });

        if (!giveaway) {
          return res.status(404).json({ error: 'Giveaway non trouvé' });
        }

        // Récupérer les participations
        const entries = await prisma.giveawayEntry.findMany({
          where: { giveawayId: id },
          include: {
            user: {
              select: {
                id: true,
                username: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        return res.status(200).json(entries);
      } catch (error) {
        console.error('Erreur lors de la récupération des participations:', error);
        return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
      }
    } else {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }
  } catch (error) {
    console.error('Erreur globale dans l\'API des participations au giveaway:', error);
    return res.status(500).json({ error: 'Erreur serveur interne', details: (error as Error).message });
  }
} 
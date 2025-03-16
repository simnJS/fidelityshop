import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '../../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  // Vérifier que l'utilisateur est authentifié et administrateur
  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  // Vérifier que l'utilisateur est administrateur
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user?.isAdmin) {
    return res.status(403).json({ error: 'Accès interdit - vous devez être administrateur' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID de giveaway invalide' });
  }

  if (req.method === 'POST') {
    try {
      // Récupérer le giveaway
      const giveaway = await prisma.giveaway.findUnique({
        where: { id },
        include: {
          entries: {
            include: {
              user: true
            }
          }
        }
      });

      if (!giveaway) {
        return res.status(404).json({ error: 'Giveaway non trouvé' });
      }

      if (giveaway.entries.length === 0) {
        return res.status(400).json({ error: 'Aucun participant à ce giveaway' });
      }

      // Sélectionner un gagnant aléatoire
      const randomIndex = Math.floor(Math.random() * giveaway.entries.length);
      const winner = giveaway.entries[randomIndex].user;

      // Mettre à jour le giveaway avec le gagnant et marquer comme complété
      await prisma.giveaway.update({
        where: { id },
        data: {
          winnerId: winner.id,
          status: 'completed'
        }
      });

      // Si le prix est un produit, attribuer le produit au gagnant
      if (giveaway.productId) {
        await prisma.purchase.create({
          data: {
            userId: winner.id,
            productId: giveaway.productId,
            quantity: 1,
            totalPoints: 0, // Gratuit car c'est un giveaway
          }
        });
      }

      return res.status(200).json({
        success: true,
        winnerId: winner.id,
        winnerUsername: winner.username
      });
    } catch (error) {
      console.error('Erreur lors de la sélection du gagnant:', error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
} 
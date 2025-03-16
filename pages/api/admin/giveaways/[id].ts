import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '../../../../lib/prisma';

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

  if (req.method === 'GET') {
    // Récupérer un giveaway spécifique
    try {
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
          entries: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                }
              }
            }
          },
        },
      });

      if (!giveaway) {
        return res.status(404).json({ error: 'Giveaway non trouvé' });
      }

      return res.status(200).json(giveaway);
    } catch (error) {
      console.error('Erreur lors de la récupération du giveaway:', error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'PUT') {
    // Mettre à jour un giveaway
    try {
      const { title, description, imageUrl, startDate, endDate, status, productId, customPrize } = req.body;

      // Valider les données
      if (!title || !description || !startDate || !endDate) {
        return res.status(400).json({ error: 'Tous les champs requis doivent être remplis' });
      }

      // Mettre à jour le giveaway
      const updatedGiveaway = await prisma.giveaway.update({
        where: { id },
        data: {
          title,
          description,
          imageUrl,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          status,
          productId: productId || null,
          customPrize: customPrize || null,
        },
      });

      return res.status(200).json(updatedGiveaway);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du giveaway:', error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'DELETE') {
    // Supprimer un giveaway
    try {
      // D'abord supprimer toutes les entrées associées
      await prisma.giveawayEntry.deleteMany({
        where: { giveawayId: id },
      });
      
      // Ensuite supprimer le giveaway
      const deletedGiveaway = await prisma.giveaway.delete({
        where: { id },
      });

      return res.status(200).json(deletedGiveaway);
    } catch (error) {
      console.error('Erreur lors de la suppression du giveaway:', error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
} 
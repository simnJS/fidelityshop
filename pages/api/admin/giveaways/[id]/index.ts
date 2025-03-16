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
        // Récupérer un giveaway spécifique
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

        return res.status(200).json(giveaway);
      } catch (error) {
        console.error('Erreur lors de la récupération du giveaway:', error);
        return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
      }
    } else if (req.method === 'PUT') {
      try {
        // Mettre à jour un giveaway
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
        return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
      }
    } else if (req.method === 'DELETE') {
      try {
        // Supprimer un giveaway
        await prisma.giveawayEntry.deleteMany({
          where: { giveawayId: id }
        });

        const deletedGiveaway = await prisma.giveaway.delete({
          where: { id },
        });

        return res.status(200).json({ message: 'Giveaway supprimé avec succès', giveaway: deletedGiveaway });
      } catch (error) {
        console.error('Erreur lors de la suppression du giveaway:', error);
        return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
      }
    } else {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }
  } catch (error) {
    console.error('Erreur globale dans l\'API giveaway spécifique:', error);
    return res.status(500).json({ error: 'Erreur serveur interne', details: (error as Error).message });
  }
} 
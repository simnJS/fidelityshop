import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

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

    if (req.method === 'GET') {
      // Récupérer tous les giveaways
      try {
        const giveaways = await prisma.giveaway.findMany({
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
            createdAt: 'desc',
          },
        });

        return res.status(200).json(giveaways);
      } catch (error) {
        console.error('Erreur lors de la récupération des giveaways:', error);
        return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
      }
    } else if (req.method === 'POST') {
      // Créer un nouveau giveaway
      try {
        const { title, description, imageUrl, startDate, endDate, status, productId, customPrize } = req.body;

        // Valider les données
        if (!title || !description || !startDate || !endDate) {
          return res.status(400).json({ error: 'Tous les champs requis doivent être remplis' });
        }

        console.log('Création de giveaway:', { title, startDate, endDate, status, productId, customPrize });

        // Créer le giveaway
        const giveaway = await prisma.giveaway.create({
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

        return res.status(201).json(giveaway);
      } catch (error) {
        console.error('Erreur lors de la création du giveaway:', error);
        return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
      }
    } else {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }
  } catch (error) {
    console.error('Erreur globale dans l\'API giveaways:', error);
    return res.status(500).json({ error: 'Erreur serveur interne', details: (error as Error).message });
  }
}
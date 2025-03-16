import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { prisma } from '../../../lib/prisma';

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

    if (req.method === 'GET') {
      try {
        // Récupérer tous les produits
        const products = await prisma.product.findMany({
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            pointsCost: true,
            inStock: true,
            isReward: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        return res.status(200).json(products);
      } catch (error) {
        console.error('Erreur lors de la récupération des produits:', error);
        return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
      }
    } else {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }
  } catch (error) {
    console.error('Erreur globale dans l\'API products:', error);
    return res.status(500).json({ error: 'Erreur serveur interne', details: (error as Error).message });
  }
} 
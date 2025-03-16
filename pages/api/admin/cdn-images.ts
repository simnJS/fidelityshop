import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { prisma } from '../../../lib/prisma';

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
      try {
        // Récupérer toutes les images des produits existants
        const productImages = await prisma.product.findMany({
          select: {
            id: true,
            imageUrl: true,
            name: true,
            createdAt: true
          },
          where: {
            imageUrl: {
              not: null
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        // Récupérer les images des giveaways existants
        const giveawayImages = await prisma.giveaway.findMany({
          select: {
            id: true,
            imageUrl: true,
            title: true,
            createdAt: true
          },
          where: {
            imageUrl: {
              not: null
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        // Récupérer les images des reçus
        const receiptImages = await prisma.receipt.findMany({
          select: {
            id: true,
            imageUrl: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        // Transformer en format uniforme
        const images = [
          ...productImages.map(p => ({
            id: p.id,
            url: p.imageUrl,
            type: 'PRODUCT',
            name: p.name,
            createdAt: p.createdAt
          })),
          ...giveawayImages.map(g => ({
            id: g.id,
            url: g.imageUrl,
            type: 'GIVEAWAY',
            name: g.title,
            createdAt: g.createdAt
          })),
          ...receiptImages.map(r => ({
            id: r.id,
            url: r.imageUrl,
            type: 'RECEIPT',
            createdAt: r.createdAt
          }))
        ];

        return res.status(200).json(images);
      } catch (error) {
        console.error('Erreur lors de la récupération des images:', error);
        return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
      }
    } else {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }
  } catch (error) {
    console.error('Erreur globale dans l\'API cdn-images:', error);
    return res.status(500).json({ error: 'Erreur serveur interne', details: (error as Error).message });
  }
} 
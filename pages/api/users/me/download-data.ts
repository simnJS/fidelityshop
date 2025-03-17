import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { prisma } from '../../../../lib/prisma';
import { withApiMiddleware } from '../../../../lib/api-middleware';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Vérifier l'authentification
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.id) {
    return res.status(401).json({ message: 'Non autorisé' });
  }

  const userId = token.id as string;

  if (req.method === 'GET') {
    try {
      // Récupérer les données de l'utilisateur
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          minecraftName: true,
          discordId: true,
          points: true,
          createdAt: true,
          updatedAt: true,
          // Ne pas inclure le mot de passe
        }
      });

      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      // Récupérer les achats de l'utilisateur
      const purchases = await prisma.purchase.findMany({
        where: { userId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true,
              pointsCost: true,
              isReward: true,
            }
          }
        }
      });

      // Récupérer les commandes de l'utilisateur
      const orders = await prisma.order.findMany({
        where: { userId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true,
              pointsCost: true,
              isReward: true,
            }
          }
        }
      });

      // Récupérer les reçus de l'utilisateur
      const receipts = await prisma.receipt.findMany({
        where: { userId },
        select: {
          id: true,
          status: true,
          pointsAwarded: true,
          createdAt: true,
          updatedAt: true,
          // Ne pas inclure l'URL de l'image pour des raisons de sécurité
        }
      });

      // Récupérer les transactions de points
      const pointTransactions = await prisma.pointTransaction.findMany({
        where: { userId },
        select: {
          id: true,
          points: true,
          type: true,
          reason: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      // Assembler et renvoyer toutes les données
      const userData = {
        user,
        purchases,
        orders,
        receipts,
        pointTransactions,
        exportedAt: new Date(),
        legalNote: "Ces données vous sont fournies conformément au Règlement Général sur la Protection des Données (RGPD). Elles représentent l'ensemble des informations personnelles que nous détenons à votre sujet."
      };

      return res.status(200).json(userData);
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      return res.status(500).json({ message: 'Erreur du serveur' });
    }
  } else {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }
}

export default withApiMiddleware(handler); 
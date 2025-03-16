import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { prisma } from '../../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

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

  // Vérifier l'authentification à l'aide de getServerSession
  // @ts-ignore - Ignorer l'erreur de type pour authOptions
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Non autorisé' });
  }

  try {
    const userId = session.user.id as string;

    // Si l'utilisateur est admin, il peut voir toutes les preuves d'achat
    if (session.user.isAdmin && req.query.all === 'true') {
      const receipts = await prisma.receipt.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              username: true,
              minecraftName: true
            }
          }
        }
      });
      return res.status(200).json(receipts);
    }

    // Sinon, l'utilisateur ne voit que ses propres preuves d'achat
    const receipts = await prisma.receipt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(receipts);
  } catch (error) {
    console.error('Erreur lors de la récupération des preuves d\'achat:', error);
    return res.status(500).json({ message: 'Erreur du serveur' });
  }
} 
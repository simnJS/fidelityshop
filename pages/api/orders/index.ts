import { NextApiRequest, NextApiResponse } from 'next';
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

  // Ajouter des logs pour le débogage
  console.log('API orders - Cookies reçus:', req.cookies);
  console.log('API orders - Headers reçus:', {
    origin: req.headers.origin,
    referer: req.headers.referer,
    cookie: req.headers.cookie?.substring(0, 50) + '...' // Tronquer pour la lisibilité
  });

  // @ts-ignore - Ignorer l'erreur de type pour authOptions
  const session = await getServerSession(req, res, authOptions);
  
  console.log('API orders - Session:', session ? 'Session présente' : 'Session absente');
  
  if (!session) {
    console.log('API orders - Authentification échouée');
    return res.status(401).json({ message: 'Non autorisé' });
  }

  try {
    const userId = session.user.id as string;
    console.log('API orders - Utilisateur authentifié:', userId.substring(0, 8) + '...');

    // Si l'utilisateur est admin, il peut voir toutes les commandes
    if (session.user.isAdmin && req.query.all === 'true') {
      const orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              username: true,
              minecraftName: true
            }
          },
          product: true
        }
      });
      return res.status(200).json(orders);
    }

    // Sinon, l'utilisateur ne voit que ses propres commandes
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: true
      }
    });

    console.log(`API orders - ${orders.length} commandes trouvées`);
    return res.status(200).json(orders);
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    return res.status(500).json({ message: 'Erreur du serveur' });
  }
} 
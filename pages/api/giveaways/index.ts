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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    console.log('API giveaways - Début de la requête GET');
    
    // Pour déterminer si on ne montre que les giveaways actifs
    const onlyActive = req.query.active === 'true';
    
    console.log('API giveaways - Paramètre onlyActive:', onlyActive);
    
    // Construire la requête en fonction des filtres
    const whereClause: any = {};
    
    if (onlyActive) {
      whereClause.status = 'active';
      
      // Pour les giveaways actifs, vérifier également les dates
      const now = new Date();
      whereClause.startDate = { lte: now };
      whereClause.endDate = { gte: now };
    }
    
    // Récupérer les giveaways
    const giveaways = await prisma.giveaway.findMany({
      where: whereClause,
      orderBy: {
        endDate: 'desc',
      },
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
          select: {
            entries: true,
          },
        },
      },
    });
    
    console.log(`API giveaways - ${giveaways.length} giveaways trouvés`);

    return res.status(200).json(giveaways);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des giveaways:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur', 
      details: error.message 
    });
  }
} 
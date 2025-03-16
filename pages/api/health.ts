import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Vérifier la connexion à la base de données
    await prisma.$queryRaw`SELECT 1`;
    
    // Tout est OK
    return res.status(200).json({ 
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur de healthcheck:', error);
    return res.status(500).json({ 
      status: 'unhealthy',
      error: 'La connexion à la base de données a échoué'
    });
  }
} 
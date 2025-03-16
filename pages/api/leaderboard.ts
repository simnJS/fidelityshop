import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  try {
    // Récupérer les 5 meilleurs utilisateurs en fonction de leurs points
    const topUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        minecraftName: true,
        points: true,
        // Exclure les informations sensibles comme email, password, etc.
      },
      orderBy: {
        points: 'desc',
      },
      take: 5,
    });

    return res.status(200).json({ 
      users: topUsers,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du classement:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération du classement' });
  }
} 
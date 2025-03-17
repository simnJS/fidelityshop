import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { prisma } from '../../../lib/prisma';
import { withApiMiddleware } from '../../../lib/api-middleware';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return res.status(401).json({ message: 'Non autorisé' });
  }

  // Vérifier que l'utilisateur est administrateur
  if (!token.isAdmin) {
    return res.status(403).json({ message: 'Accès refusé - Droits d\'administrateur requis' });
  }

  // Gérer les différentes méthodes HTTP
  if (req.method === 'GET') {
    try {
      // Exclure les données sensibles des utilisateurs
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          // email n'existe pas dans le modèle
          minecraftName: true,
          discordId: true,
          isAdmin: true,
          points: true,
          createdAt: true,
          updatedAt: true,
          // Exclure le mot de passe et autres données sensibles
        }
      });

      return res.status(200).json(users);
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      return res.status(500).json({ message: 'Erreur du serveur' });
    }
  } else {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }
}

export default withApiMiddleware(handler); 
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

  if (req.method === 'POST') {
    try {
      // Récupérer l'utilisateur
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true }
      });

      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      // Pour l'exemple, nous anonymisons les données et marquons le compte comme supprimé:
      await prisma.user.update({
        where: { id: userId },
        data: {
          username: `deleted_${Date.now()}`,
          password: 'COMPTE_SUPPRIME_' + Math.random().toString(36).substring(2, 15), // Mot de passe aléatoire pour empêcher la connexion
          minecraftName: null,
          discordId: null,
          isDeleted: true,
          deletedAt: new Date()
        }
      });

      // NextAuth va vérifier isDeleted lors des tentatives de connexion
      // Nous devons ajouter cette vérification dans [...nextauth].ts
      
      return res.status(200).json({ 
        message: 'Votre compte a été supprimé. Vous allez être déconnecté automatiquement.',
        shouldLogout: true
      });
    } catch (error) {
      console.error('Erreur lors de la demande de suppression:', error);
      return res.status(500).json({ message: 'Erreur du serveur' });
    }
  } else {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }
}

export default withApiMiddleware(handler); 
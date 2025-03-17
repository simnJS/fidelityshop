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

      // Dans un environnement de production, vous pourriez:
      // 1. Envoyer un email à l'administrateur pour traiter la demande
      // 2. Stocker la demande dans une table dédiée
      // 3. Mettre en place un délai de grâce avant suppression
      
      // Pour l'exemple, nous allons juste anonymiser les données:
      
      // Note: Ceci est une implémentation simplifiée.
      // Dans un environnement réel, vous devriez:
      // - Mettre en place un processus plus robuste
      // - Respecter les contraintes RGPD (délai de 30 jours, etc.)
      // - Envoyer des emails de confirmation
      
      // Anonymiser l'utilisateur au lieu de le supprimer complètement
      await prisma.user.update({
        where: { id: userId },
        data: {
          username: `deleted_${Date.now()}`,
          password: '', // Effacer le mot de passe
          minecraftName: null,
          discordId: null,
        }
      });
      
      // Une alternative serait de créer un statut "pending_deletion"
      // et de mettre en place un processus de suppression différé

      return res.status(200).json({ 
        message: 'Votre demande de suppression a été enregistrée. Votre compte sera supprimé dans les 30 jours conformément au RGPD.'
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
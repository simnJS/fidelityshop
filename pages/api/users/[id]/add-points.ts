import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { prisma } from '../../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Configuration CORS pour permettre les requêtes cross-domain avec cookies
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Gestion des requêtes préflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Vérification du jeton d'authentification
  const token = await getToken({ req });
  if (!token) {
    return res.status(401).json({ message: 'Non authentifié' });
  }

  // Vérification des droits d'administration
  if (!token.isAdmin) {
    return res.status(403).json({ message: 'Accès refusé - Droits administrateur requis' });
  }

  const userId = req.query.id as string;
  
  if (!userId) {
    return res.status(400).json({ message: 'ID utilisateur manquant' });
  }

  // Vérifier si la méthode est POST pour ajouter des points
  if (req.method === 'POST') {
    try {
      const { points, reason } = req.body;
      const pointsToAdd = parseInt(points, 10);

      // Validation des données
      if (isNaN(pointsToAdd) || pointsToAdd <= 0) {
        return res.status(400).json({ message: 'Veuillez fournir un nombre de points valide (supérieur à 0)' });
      }

      // Vérifier si l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      // Métadonnées pour l'historique des points
      const metadata = {
        type: 'ADMIN_ADD',
        points: pointsToAdd,
        reason: reason || 'Ajout par administrateur',
        adminId: token.sub,
        timestamp: new Date().toISOString(),
      };

      // Mettre à jour les points de l'utilisateur avec les métadonnées
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          points: { increment: pointsToAdd },
          // On pourrait stocker l'historique dans un champ metadata si nécessaire
        },
      });

      console.log(`Points ajoutés : ${pointsToAdd} à l'utilisateur ${user.username} par admin ${token.sub}`);
      console.log('Métadonnées de transaction:', JSON.stringify(metadata));

      return res.status(200).json({
        message: `${pointsToAdd} points ajoutés avec succès à l'utilisateur ${user.username}`,
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          points: updatedUser.points
        }
      });
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout de points:', error);
      return res.status(500).json({ message: 'Erreur lors de l\'ajout de points', error: error.message });
    }
  }

  // Méthode non supportée
  return res.status(405).json({ message: 'Méthode non autorisée' });
} 
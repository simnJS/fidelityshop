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

  try {
    console.log('API user - Début de la requête, vérification de la session');
    
    // Debug - Afficher les cookies reçus
    console.log('Cookies reçus:', req.cookies);
    
    // @ts-ignore - Ignorer l'erreur de type pour authOptions
    const session = await getServerSession(req, res, authOptions);
    
    console.log('Session obtenue:', session ? 'Session présente' : 'Session absente',
               session?.user?.id ? `user.id: ${String(session.user.id).substring(0, 5)}...` : 'pas de user.id');
               
    if (!session) {
      console.log('API user - Pas de session, retour 401');
      return res.status(401).json({ message: 'Non autorisé' });
    }

    try {
      const userId = session.user.id as string;
      
      if (!userId) {
        console.error('Pas d\'ID utilisateur dans la session:', session);
        return res.status(401).json({ message: 'Session invalide - pas d\'ID utilisateur' });
      }
      
      console.log('API user - Session valide, recherche utilisateur avec ID:', String(userId).substring(0, 5) + '...');
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          points: true,
          minecraftName: true,
          discordId: true,
          isAdmin: true,
          createdAt: true,
          // Ne pas inclure le mot de passe pour des raisons de sécurité
        }
      });

      if (!user) {
        console.log('API user - Utilisateur non trouvé avec ID:', String(userId).substring(0, 5) + '...');
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      console.log('API user - Utilisateur trouvé:', user.username);
      return res.status(200).json(user);
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
      return res.status(500).json({ message: 'Erreur du serveur' });
    }
  } catch (error) {
    console.error('Erreur globale dans API user:', error);
    return res.status(500).json({ message: 'Erreur du serveur' });
  }
} 
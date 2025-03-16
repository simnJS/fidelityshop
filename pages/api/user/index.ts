import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { prisma } from '../../../lib/prisma';

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
    console.log('API user - Début de la requête, vérification du token');
    
    // Debug - Afficher les cookies reçus
    console.log('Cookies reçus:', req.cookies);
    
    const token = await getToken({ req });
    
    console.log('Token obtenu:', token ? 'Token présent' : 'Token absent', 
               token?.sub ? `sub: ${String(token.sub).substring(0, 5)}...` : 'pas de sub', 
               token?.id ? `id: ${String(token.id).substring(0, 5)}...` : 'pas de id');
               
    if (!token) {
      console.log('API user - Pas de token JWT, retour 401');
      return res.status(401).json({ message: 'Non autorisé' });
    }

    try {
      // Essayer d'abord de récupérer l'ID via token.sub (standard JWT)
      // Si non disponible, utiliser token.id (backcompat)
      const userId = token.sub || token.id as string;
      
      if (!userId) {
        console.error('Pas d\'ID utilisateur dans le token:', token);
        return res.status(401).json({ message: 'Token invalide - pas d\'ID utilisateur' });
      }
      
      console.log('API user - Token valide, recherche utilisateur avec ID:', String(userId).substring(0, 5) + '...');
      
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
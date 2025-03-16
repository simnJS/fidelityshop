import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { prisma } from '../../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET' && req.method !== 'OPTIONS') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

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
    console.log('API check-entry - Début de la requête, vérification du token');
    
    // Debug - Afficher les cookies reçus
    console.log('Cookies reçus:', req.cookies);
    
    const token = await getToken({ req });
    
    console.log('Token obtenu:', token ? 'Token présent' : 'Token absent', 
                token?.sub ? `sub: ${String(token.sub).substring(0, 5)}...` : 'pas de sub', 
                token?.id ? `id: ${String(token.id).substring(0, 5)}...` : 'pas de id');
    
    if (!token) {
      console.log('API check-entry - Pas de token JWT, retour 401');
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Utiliser token.sub (standard JWT) ou token.id (compatibilité)
    const userId = token.sub || token.id as string;
    if (!userId) {
      console.log('API check-entry - Token sans ID utilisateur', token);
      return res.status(401).json({ error: 'Token invalide - pas d\'ID utilisateur' });
    }

    console.log('API check-entry - Token valide, userID:', String(userId).substring(0, 5) + '...');

    const giveawayId = req.query.id as string;

    if (!giveawayId) {
      return res.status(400).json({ error: 'ID du giveaway manquant' });
    }

    try {
      // Vérifier si l'utilisateur a déjà participé à ce giveaway
      const entry = await prisma.giveawayEntry.findFirst({
        where: {
          userId: userId,
          giveawayId: giveawayId,
        },
      });

      console.log('API check-entry - Vérification réussie:', !!entry ? 'A participé' : 'N\'a pas participé');
      return res.status(200).json({ hasEntered: !!entry });
    } catch (error: any) {
      console.error('Erreur lors de la vérification de la participation:', error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  } catch (error) {
    console.error('Erreur globale dans check-entry:', error);
    return res.status(500).json({ error: 'Erreur serveur interne' });
  }
} 
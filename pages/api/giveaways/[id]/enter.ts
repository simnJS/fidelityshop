import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST' && req.method !== 'OPTIONS') {
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
    console.log('API enter - Début de la requête, vérification de la session');
    
    // Debug - Afficher les cookies reçus
    console.log('Cookies reçus:', req.cookies);
    
    // @ts-ignore - Ignorer l'erreur de type pour authOptions
    const session = await getServerSession(req, res, authOptions);
    
    console.log('Session obtenue:', session ? 'Session présente' : 'Session absente', 
                session?.user.id ? `id: ${String(session.user.id).substring(0, 5)}...` : 'pas de id');
    
    if (!session) {
      console.log('API enter - Pas de session, retour 401');
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const userId = session.user.id;
    if (!userId) {
      console.log('API enter - Session sans ID utilisateur', session);
      return res.status(401).json({ error: 'Session invalide - pas d\'ID utilisateur' });
    }

    console.log('API enter - Session valide, userID:', String(userId).substring(0, 5) + '...');

    const giveawayId = req.query.id as string;

    if (!giveawayId) {
      return res.status(400).json({ error: 'ID du giveaway manquant' });
    }

    try {
      // Vérifier si le giveaway existe et est actif
      const giveaway = await prisma.giveaway.findUnique({
        where: {
          id: giveawayId,
        },
      });

      if (!giveaway) {
        return res.status(404).json({ error: 'Giveaway non trouvé' });
      }

      if (giveaway.status !== 'active') {
        return res.status(400).json({ error: 'Ce giveaway n\'est pas actif' });
      }

      const now = new Date();
      const startDate = new Date(giveaway.startDate);
      const endDate = new Date(giveaway.endDate);

      if (now < startDate) {
        return res.status(400).json({ error: 'Ce giveaway n\'a pas encore commencé' });
      }

      if (now > endDate) {
        return res.status(400).json({ error: 'Ce giveaway est terminé' });
      }

      // Vérifier si l'utilisateur a déjà participé
      const existingEntry = await prisma.giveawayEntry.findFirst({
        where: {
          userId: userId,
          giveawayId: giveawayId,
        },
      });

      if (existingEntry) {
        return res.status(400).json({ error: 'Vous participez déjà à ce giveaway' });
      }

      // Créer l'entrée pour l'utilisateur
      const entry = await prisma.giveawayEntry.create({
        data: {
          userId: userId,
          giveawayId: giveawayId,
        },
      });

      console.log('API enter - Participation enregistrée avec succès', entry);
      return res.status(200).json({ 
        success: true, 
        message: 'Participation enregistrée avec succès',
        entry: entry
      });
    } catch (error: any) {
      console.error('Erreur lors de la participation au giveaway:', error);
      return res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
  } catch (error: any) {
    console.error('Erreur globale dans enter:', error);
    return res.status(500).json({ error: 'Erreur serveur interne', details: error.message });
  }
} 
import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { prisma } from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Ajouter des headers CORS pour permettre les requêtes entre domaines avec cookies
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Gérer les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ message: 'Non autorisé' });
  }

  // Vérifier que l'utilisateur est administrateur
  if (!token.isAdmin) {
    return res.status(403).json({ message: 'Accès refusé - Droits d\'administrateur requis' });
  }

  // GET - Récupérer la liste des utilisateurs
  if (req.method === 'GET') {
    try {
      const { page = '1', limit = '10', search = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
      
      // Convertir les paramètres en nombres
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;
      
      // Créer le filtre de recherche
      const searchFilter = search 
        ? {
            OR: [
              { username: { contains: search as string, mode: 'insensitive' } },
              { minecraftName: { contains: search as string, mode: 'insensitive' } }
            ]
          } 
        : {};
      
      // Récupérer les utilisateurs avec pagination et tri
      const users = await prisma.user.findMany({
        where: searchFilter,
        orderBy: {
          [sortBy as string]: sortOrder as 'asc' | 'desc'
        },
        skip,
        take: limitNum,
        select: {
          id: true,
          username: true,
          points: true,
          minecraftName: true,
          discordId: true,
          isAdmin: true,
          createdAt: true,
          updatedAt: true,
          // Ne pas inclure le mot de passe pour des raisons de sécurité
          _count: {
            select: {
              receipts: true,
              orders: true,
              purchases: true
            }
          }
        }
      });
      
      // Compter le nombre total d'utilisateurs pour la pagination
      const totalUsers = await prisma.user.count({
        where: searchFilter
      });
      
      const totalPages = Math.ceil(totalUsers / limitNum);
      
      return res.status(200).json({
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalUsers,
          totalPages
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      return res.status(500).json({ message: 'Erreur du serveur' });
    }
  }
  
  // Méthode non supportée
  else {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }
} 
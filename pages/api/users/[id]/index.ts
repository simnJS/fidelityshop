import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

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

  // @ts-ignore - Ignorer l'erreur de type pour authOptions
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Non autorisé' });
  }

  // Vérifier que l'utilisateur est administrateur
  if (!session.user.isAdmin) {
    return res.status(403).json({ message: 'Accès refusé - Droits d\'administrateur requis' });
  }

  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'ID utilisateur invalide' });
  }

  // GET - Récupérer les détails d'un utilisateur
  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
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
        }
      });

      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      // Récupérer les commandes de l'utilisateur
      const orders = await prisma.order.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        include: {
          product: true
        }
      });

      // Récupérer les reçus de l'utilisateur
      const receipts = await prisma.receipt.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        include: {
          product: true
        }
      });

      return res.status(200).json({
        user,
        orders,
        receipts
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des détails de l\'utilisateur:', error);
      return res.status(500).json({ message: 'Erreur du serveur' });
    }
  }

  // PUT - Mettre à jour des informations utilisateur
  else if (req.method === 'PUT') {
    try {
      const { username, minecraftName, discordId, isAdmin, points } = req.body;

      // Vérifier que l'utilisateur existe
      const existingUser = await prisma.user.findUnique({
        where: { id }
      });

      if (!existingUser) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      // Préparer les données à mettre à jour
      const updateData: any = {};
      
      if (username !== undefined) updateData.username = username;
      if (minecraftName !== undefined) updateData.minecraftName = minecraftName;
      if (discordId !== undefined) updateData.discordId = discordId;
      if (isAdmin !== undefined) updateData.isAdmin = isAdmin;
      if (points !== undefined) updateData.points = parseInt(points, 10);

      // Mettre à jour l'utilisateur
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          username: true,
          points: true,
          minecraftName: true,
          discordId: true,
          isAdmin: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return res.status(200).json(updatedUser);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      return res.status(500).json({ message: 'Erreur du serveur' });
    }
  }

  // Méthode non supportée
  else {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }
} 
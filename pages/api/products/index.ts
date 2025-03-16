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

  // Récupérer le token JWT au lieu de la session
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return res.status(401).json({ message: 'Non autorisé' });
  }

  // GET - Récupérer tous les produits
  if (req.method === 'GET') {
    try {
      // Pour les administrateurs, possibilité de voir tous les produits (y compris inactifs)
      if (token.isAdmin && req.query.all === 'true') {
        const products = await prisma.product.findMany({
          orderBy: { createdAt: 'desc' }
        });
        return res.status(200).json(products);
      }
      
      // Filtrer par type de produit
      const isReward = req.query.type === 'reward' ? true : req.query.type === 'loyalty' ? false : undefined;
      
      const whereClause: any = { inStock: true };
      if (isReward !== undefined) {
        whereClause.isReward = isReward;
      }
      
      // Pour les utilisateurs normaux, uniquement les produits en stock
      const products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        where: whereClause
      });

      return res.status(200).json(products);
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      return res.status(500).json({ message: 'Erreur du serveur' });
    }
  }

  // POST - Ajouter un nouveau produit (admin seulement)
  else if (req.method === 'POST') {
    if (!token.isAdmin) {
      return res.status(403).json({ message: 'Accès refusé - Droits d\'administrateur requis' });
    }

    try {
      const { name, description, imageUrl, pointsCost, isReward } = req.body;

      // Validation de base
      if (!name || !description || !pointsCost) {
        return res.status(400).json({ message: 'Nom, description et coût en points sont requis' });
      }

      const product = await prisma.product.create({
        data: {
          name,
          description,
          imageUrl: imageUrl || null,
          pointsCost: parseInt(pointsCost),
          inStock: true,
          isReward: isReward === true
        }
      });

      return res.status(201).json(product);
    } catch (error) {
      console.error('Erreur lors de la création du produit:', error);
      return res.status(500).json({ message: 'Erreur du serveur' });
    }
  }

  // Méthode non supportée
  else {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }
} 
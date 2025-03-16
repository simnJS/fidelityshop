import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { prisma } from '../../../../lib/prisma';

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

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return res.status(401).json({ message: 'Non autorisé' });
  }

  // Vérifier les droits d'administrateur
  if (!token.isAdmin) {
    return res.status(403).json({ message: 'Accès refusé - Droits d\'administrateur requis' });
  }

  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'ID de produit invalide' });
  }

  // PUT - Basculer le statut du produit
  if (req.method === 'PUT') {
    try {
      // Vérifier que le produit existe
      const existingProduct = await prisma.product.findUnique({
        where: { id }
      });

      if (!existingProduct) {
        return res.status(404).json({ message: 'Produit non trouvé' });
      }

      // Inverser le statut actuel
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: {
          inStock: !existingProduct.inStock
        }
      });

      return res.status(200).json(updatedProduct);
    } catch (error) {
      console.error('Erreur lors du changement de statut du produit:', error);
      return res.status(500).json({ message: 'Erreur du serveur' });
    }
  }

  // Méthode non supportée
  else {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }
} 
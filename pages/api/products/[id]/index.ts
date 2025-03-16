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

  const token = await getToken({ req });

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

  // GET - Récupérer un produit spécifique
  if (req.method === 'GET') {
    try {
      const product = await prisma.product.findUnique({
        where: { id }
      });

      if (!product) {
        return res.status(404).json({ message: 'Produit non trouvé' });
      }

      return res.status(200).json(product);
    } catch (error) {
      console.error('Erreur lors de la récupération du produit:', error);
      return res.status(500).json({ message: 'Erreur du serveur' });
    }
  }

  // PUT - Mettre à jour un produit
  else if (req.method === 'PUT') {
    try {
      const { name, description, imageUrl, pointsCost, isReward } = req.body;

      // Validation de base
      if (!name || !description || !pointsCost) {
        return res.status(400).json({ message: 'Nom, description et coût en points sont requis' });
      }

      // Vérifier que le produit existe
      const existingProduct = await prisma.product.findUnique({
        where: { id }
      });

      if (!existingProduct) {
        return res.status(404).json({ message: 'Produit non trouvé' });
      }

      // Mettre à jour le produit
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: {
          name,
          description,
          imageUrl: imageUrl || null,
          pointsCost: parseInt(pointsCost),
          isReward: isReward === true
        }
      });

      return res.status(200).json(updatedProduct);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du produit:', error);
      return res.status(500).json({ message: 'Erreur du serveur' });
    }
  }

  // DELETE - Supprimer un produit
  else if (req.method === 'DELETE') {
    try {
      // Vérifier que le produit existe
      const existingProduct = await prisma.product.findUnique({
        where: { id }
      });

      if (!existingProduct) {
        return res.status(404).json({ message: 'Produit non trouvé' });
      }

      // Vérifier si le produit est utilisé dans des commandes
      const ordersCount = await prisma.order.count({
        where: { productId: id }
      });

      if (ordersCount > 0) {
        // Au lieu de supprimer, désactiver le produit
        const updatedProduct = await prisma.product.update({
          where: { id },
          data: { inStock: false }
        });
        
        return res.status(200).json({ 
          message: 'Le produit a été désactivé car il est utilisé dans des commandes',
          product: updatedProduct
        });
      }

      // Supprimer le produit
      await prisma.product.delete({
        where: { id }
      });

      return res.status(200).json({ message: 'Produit supprimé avec succès' });
    } catch (error) {
      console.error('Erreur lors de la suppression du produit:', error);
      return res.status(500).json({ message: 'Erreur du serveur' });
    }
  }

  // Méthode non supportée
  else {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }
} 
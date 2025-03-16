import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { prisma } from '../../../lib/prisma';
import { sendOrderNotification } from '../discord/webhook';

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

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ message: 'Non autorisé' });
  }

  if (!token.id) {
    return res.status(400).json({ message: 'ID utilisateur manquant dans le token' });
  }

  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'ID du produit requis' });
    }

    const userId = token.id as string;

    // Récupérer le produit
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    if (!product.inStock) {
      return res.status(400).json({ message: 'Ce produit n\'est pas disponible actuellement' });
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Calculer le coût total
    const totalPoints = product.pointsCost * quantity;

    // Vérifier si l'utilisateur a assez de points
    if (user.points < totalPoints) {
      return res.status(400).json({ 
        message: 'Points insuffisants',
        required: totalPoints,
        available: user.points
      });
    }

    // Créer la commande avec statut 'pending'
    const order = await prisma.order.create({
      data: {
        userId,
        productId,
        quantity,
        totalPoints,
        status: 'pending'
      }
    });

    // Envoyer une notification Discord AVANT de déduire les points
    let discordNotificationSent = false;
    let messageId = null;
    
    try {
      console.log('Tentative d\'envoi de notification Discord pour la commande:', order.id);
      messageId = await sendOrderNotification(order);
      discordNotificationSent = !!messageId;
      
      if (messageId) {
        console.log('Notification Discord envoyée avec succès, ID du message:', messageId);
        
        // Déduire les points de l'utilisateur SEULEMENT si la notification a été envoyée
        await prisma.user.update({
          where: { id: userId },
          data: {
            points: user.points - totalPoints
          }
        });
        
        // Mettre à jour l'ordre avec l'ID du message Discord
        await prisma.order.update({
          where: { id: order.id },
          data: { discordMessageId: messageId }
        });
      } else {
        console.error('Échec de l\'envoi de la notification Discord pour la commande:', order.id);
        
        // Si la notification n'a pas été envoyée, annuler la commande
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'cancelled' }
        });
        
        return res.status(500).json({ 
          message: 'Erreur lors de l\'envoi de la notification Discord. La commande a été annulée.',
          order: { ...order, status: 'cancelled' }
        });
      }
    } catch (discordError) {
      console.error('Erreur lors de l\'envoi de la notification Discord:', discordError);
      
      // Si une erreur se produit, annuler la commande
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'cancelled' }
      });
      
      return res.status(500).json({ 
        message: 'Erreur lors de l\'envoi de la notification Discord. La commande a été annulée.',
        order: { ...order, status: 'cancelled' }
      });
    }

    return res.status(201).json({
      message: 'Commande créée avec succès',
      order,
      discordNotificationSent
    });
  } catch (error) {
    console.error('Erreur lors de la création de la commande:', error);
    return res.status(500).json({ message: 'Erreur du serveur' });
  }
} 
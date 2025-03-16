import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '../../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Non autorisé' });
  }

  // Vérifier si l'utilisateur est administrateur
  if (!session.user.isAdmin) {
    return res.status(403).json({ message: 'Accès refusé - Droits d\'administrateur requis' });
  }

  try {
    const { id } = req.query;
    const { reason } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'ID du reçu requis' });
    }

    const receiptId = Array.isArray(id) ? id[0] : id;

    // Récupérer le reçu
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId }
    });

    if (!receipt) {
      return res.status(404).json({ message: 'Reçu non trouvé' });
    }

    if (receipt.status !== 'pending') {
      return res.status(400).json({ 
        message: `Ce reçu a déjà été ${receipt.status === 'approved' ? 'approuvé' : 'refusé'}`
      });
    }

    // Mettre à jour le statut du reçu
    const updatedReceipt = await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        status: 'rejected'
      }
    });

    return res.status(200).json({
      message: 'Reçu rejeté avec succès',
      receipt: updatedReceipt
    });
  } catch (error) {
    console.error('Erreur lors du rejet du reçu:', error);
    return res.status(500).json({ message: 'Erreur du serveur' });
  }
} 
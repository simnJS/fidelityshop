import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  // Vérifier que l'utilisateur est authentifié
  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID de giveaway invalide' });
  }

  if (req.method === 'POST') {
    try {
      // Vérifier que le giveaway existe et est actif
      const giveaway = await prisma.giveaway.findUnique({
        where: { 
          id,
          status: 'active',
          endDate: {
            gt: new Date()
          }
        }
      });

      if (!giveaway) {
        return res.status(404).json({ error: 'Ce giveaway n\'existe pas ou est terminé' });
      }

      // Vérifier si l'utilisateur participe déjà
      const existingEntry = await prisma.giveawayEntry.findUnique({
        where: {
          userId_giveawayId: {
            userId: session.user.id || '',
            giveawayId: id
          }
        }
      });

      if (existingEntry) {
        return res.status(400).json({ error: 'Vous participez déjà à ce giveaway' });
      }

      // Créer une nouvelle participation
      const entry = await prisma.giveawayEntry.create({
        data: {
          user: {
            connect: { id: session.user.id }
          },
          giveaway: {
            connect: { id }
          }
        }
      });

      return res.status(201).json({ success: true, entry });
    } catch (error) {
      console.error('Erreur lors de la participation au giveaway:', error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
} 
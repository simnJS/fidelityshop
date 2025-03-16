import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { prisma } from '../../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const token = await getToken({ req });
  if (!token) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  // Utiliser token.sub (standard JWT) ou token.id (compatibilité)
  const userId = token.sub || token.id as string;
  if (!userId) {
    return res.status(401).json({ error: 'Token invalide - pas d\'ID utilisateur' });
  }

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
    await prisma.giveawayEntry.create({
      data: {
        userId: userId,
        giveawayId: giveawayId,
      },
    });

    return res.status(200).json({ success: true, message: 'Participation enregistrée avec succès' });
  } catch (error: any) {
    console.error('Erreur lors de la participation au giveaway:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
} 
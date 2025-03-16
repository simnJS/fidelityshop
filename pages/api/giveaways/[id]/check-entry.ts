import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { prisma } from '../../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
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
    // Vérifier si l'utilisateur a déjà participé à ce giveaway
    const entry = await prisma.giveawayEntry.findFirst({
      where: {
        userId: userId,
        giveawayId: giveawayId,
      },
    });

    return res.status(200).json({ hasEntered: !!entry });
  } catch (error: any) {
    console.error('Erreur lors de la vérification de la participation:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
} 
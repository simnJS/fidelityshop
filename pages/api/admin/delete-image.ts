import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import fs from 'fs';
import path from 'path';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Vérifier la méthode
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Vérifier l'authentification et les droits admin
    const session = await getSession({ req });

    if (!session) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    if (!(session.user as any).isAdmin) {
      return res.status(403).json({ error: 'Accès refusé - Droits administrateur requis' });
    }

    // Récupérer le nom du fichier à supprimer
    const { filename } = req.query;

    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ error: 'Nom de fichier non spécifié' });
    }

    // Vérifier que le nom de fichier ne contient pas de chemins relatifs pour éviter les attaques
    if (filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Nom de fichier invalide' });
    }

    // Chemin complet du fichier
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    // Supprimer le fichier
    fs.unlinkSync(filePath);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
} 
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import fs from 'fs';
import path from 'path';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Vérifier la méthode
  if (req.method !== 'GET') {
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

    // Chemin du dossier uploads
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Vérifier si le dossier existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      return res.status(200).json({ images: [] });
    }

    // Lire le contenu du dossier
    const files = fs.readdirSync(uploadDir);
    
    // Filtrer pour ne garder que les images
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });

    // Construire les URLs des images
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const images = imageFiles.map(file => `${baseUrl}/uploads/${file}`);

    return res.status(200).json({ images });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
} 
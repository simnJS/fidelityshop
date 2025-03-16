import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import fs from 'fs';
import path from 'path';
import { IncomingForm } from 'formidable';
import { v4 as uuidv4 } from 'uuid';

// Désactiver le body parser intégré pour gérer le form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Vérifier la méthode
  if (req.method !== 'POST') {
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

    // Créer le dossier uploads s'il n'existe pas
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Parser le multipart form data
    const form = new IncomingForm({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10 MB
    });

    return new Promise((resolve, reject) => {
      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error('Erreur lors du parsing du formulaire:', err);
          res.status(500).json({ error: 'Erreur lors de l\'upload du fichier' });
          return resolve(true);
        }

        try {
          const file = files.image ? (Array.isArray(files.image) ? files.image[0] : files.image) : null;

          if (!file) {
            res.status(400).json({ error: 'Aucune image fournie' });
            return resolve(true);
          }

          // Vérifier le type du fichier
          if (!file.mimetype?.startsWith('image/')) {
            // Supprimer le fichier téléchargé
            fs.unlinkSync(file.filepath);
            res.status(400).json({ error: 'Le fichier doit être une image' });
            return resolve(true);
          }

          // Générer un nom de fichier unique
          const fileExt = path.extname(file.originalFilename || '');
          const newFileName = `${uuidv4()}${fileExt}`;
          const newFilePath = path.join(uploadDir, newFileName);

          // Déplacer/renommer le fichier
          fs.renameSync(file.filepath, newFilePath);

          // Construire l'URL publique
          const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
          const imageUrl = `${baseUrl}/uploads/${newFileName}`;

          res.status(200).json({ success: true, imageUrl });
          return resolve(true);
        } catch (error) {
          console.error('Erreur lors du traitement de l\'image:', error);
          res.status(500).json({ error: 'Erreur lors du traitement de l\'image' });
          return resolve(true);
        }
      });
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
} 
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import axios from 'axios';
import formidable from 'formidable';
import fs from 'fs';
import { createReadStream } from 'fs';
import FormData from 'form-data';

// Désactiver la validation de body intégrée pour gérer le form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

const CDN_UPLOAD_URL = 'https://cdn.simnjs.fr/api/upload';
const CDN_AUTH_TOKEN = 'MTc0MjEzODIyMzM5Mw==.ODQ2NjI0NDhiMzRkNmI4MzQwOTI2MTBkNzE1NjI0NWEuMzIwOGNmODY0Y2E2NTE3ZWJmZDJhZWQ0N2QxNmQ3MmRlZDc3YjQ0MWMwNTA2NmE4ZmU4YWI3ZGI1Mjc5ZGVjOWM5ODI4ZTZiZDU3YmRmNDJiMjUxNmYxMjM3MmFlYzlkZGUxYTQzMWRkY2Y3NGQ3NmMwZjJmODUyYmRjNmZmYzdkYzNjYzVhNzE1NTI0YTU5MWY3ZTVlNDMwNzdhMGQxOQ==';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Vérifier si la méthode est POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Vérifier l'authentification 
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Récupérer le fichier
    const form = new formidable.IncomingForm({
      maxFileSize: 10 * 1024 * 1024, // 10 MB
    });

    return new Promise<void>((resolve, reject) => {
      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error('Erreur lors du parsing du formulaire:', err);
          res.status(500).json({ error: 'Erreur lors du parsing du formulaire' });
          return resolve();
        }

        try {
          const file = files.file ? (Array.isArray(files.file) ? files.file[0] : files.file) : null;

          if (!file) {
            res.status(400).json({ error: 'Aucune image fournie' });
            return resolve();
          }

          // Préparer le FormData pour l'envoi au CDN
          const formData = new FormData();
          formData.append('file', createReadStream(file.filepath), {
            filename: file.originalFilename || 'image.jpg',
            contentType: file.mimetype || 'image/jpeg',
          });

          // Envoyer au CDN
          const cdnResponse = await axios.post(CDN_UPLOAD_URL, formData, {
            headers: {
              ...formData.getHeaders(),
              'Authorization': CDN_AUTH_TOKEN,
            },
          });

          // Supprimer le fichier temporaire
          try {
            fs.unlinkSync(file.filepath);
          } catch (error) {
            console.error('Erreur lors de la suppression du fichier temporaire:', error);
          }

          // Retourner la réponse du CDN
          res.status(200).json(cdnResponse.data);
          return resolve();
        } catch (error) {
          console.error('Erreur lors de l\'upload vers le CDN:', error);
          res.status(500).json({ error: 'Erreur lors de l\'upload vers le CDN' });
          return resolve();
        }
      });
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
} 
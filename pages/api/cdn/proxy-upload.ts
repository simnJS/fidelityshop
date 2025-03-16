import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
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
  console.log('Proxy upload request received');
  
  // Vérifier si la méthode est POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Pour l'instant, nous désactivons l'authentification pour faciliter le débogage
    // L'authentification sera implémentée dans une future mise à jour
    
    // Récupérer le fichier
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10 MB
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Erreur lors du parsing du formulaire:', err);
        return res.status(500).json({ error: 'Erreur lors du parsing du formulaire' });
      }

      try {
        const file = files.file ? (Array.isArray(files.file) ? files.file[0] : files.file) : null;

        if (!file) {
          return res.status(400).json({ error: 'Aucune image fournie' });
        }

        console.log('Fichier reçu:', file.originalFilename);

        // Préparer le FormData pour l'envoi au CDN
        const formData = new FormData();
        try {
          formData.append('file', createReadStream(file.filepath), {
            filename: file.originalFilename || 'image.jpg',
            contentType: file.mimetype || 'image/jpeg',
          });
        } catch (error) {
          console.error('Erreur lors de la préparation du fichier:', error);
          return res.status(500).json({ error: 'Erreur lors de la préparation du fichier' });
        }

        console.log('Envoi vers le CDN...');

        // Envoyer au CDN
        try {
          const cdnResponse = await axios.post(CDN_UPLOAD_URL, formData, {
            headers: {
              ...formData.getHeaders(),
              'Authorization': CDN_AUTH_TOKEN,
            },
          });

          console.log('Réponse du CDN reçue');

          // Supprimer le fichier temporaire
          try {
            fs.unlinkSync(file.filepath);
          } catch (error) {
            console.error('Erreur lors de la suppression du fichier temporaire:', error);
            // Continue anyway
          }

          // Retourner la réponse du CDN
          return res.status(200).json(cdnResponse.data);
        } catch (cdnError: any) {
          console.error('Erreur lors de l\'upload vers le CDN:', cdnError);
          if (cdnError.response) {
            console.error('Status:', cdnError.response.status);
            console.error('Data:', cdnError.response.data);
          }
          return res.status(500).json({ error: 'Erreur lors de l\'upload vers le CDN' });
        }
      } catch (error) {
        console.error('Erreur générale:', error);
        return res.status(500).json({ error: 'Erreur serveur lors du traitement de l\'upload' });
      }
    });
  } catch (error) {
    console.error('Erreur serveur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
} 
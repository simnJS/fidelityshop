import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '../../../lib/prisma';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { sendReceiptNotification } from '../discord/webhook';
import formidable from 'formidable';
import axios from 'axios';
import FormData from 'form-data';
import { createReadStream } from 'fs';

// Étendre l'interface NextApiRequest pour inclure les propriétés ajoutées par multer
interface FormidableRequest extends NextApiRequest {
  files: any;
  fields: any;
}

// Configuration du CDN
const CDN_UPLOAD_URL = 'https://cdn.simnjs.fr/api/upload';
const CDN_AUTH_TOKEN = 'MTc0MjEzODIyMzM5Mw==.ODQ2NjI0NDhiMzRkNmI4MzQwOTI2MTBkNzE1NjI0NWEuMzIwOGNmODY0Y2E2NTE3ZWJmZDJhZWQ0N2QxNmQ3MmRlZDc3YjQ0MWMwNTA2NmE4ZmU4YWI3ZGI1Mjc5ZGVjOWM5ODI4ZTZiZDU3YmRmNDJiMjUxNmYxMjM3MmFlYzlkZGUxYTQzMWRkY2Y3NGQ3NmMwZjJmODUyYmRjNmZmYzdkYzNjYzVhNzE1NTI0YTU5MWY3ZTVlNDMwNzdhMGQxOQ==';

// Désactiver le body parser par défaut de Next.js
export const config = {
  api: {
    bodyParser: false,
  },
};

// Fonction pour uploader une image vers le CDN
async function uploadToCDN(filePath: string, fileName: string, mimeType: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', createReadStream(filePath), {
    filename: fileName,
    contentType: mimeType,
  });

  try {
    const response = await axios.post(CDN_UPLOAD_URL, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': CDN_AUTH_TOKEN,
      },
    });

    if (response.data && response.data.files && response.data.files.length > 0) {
      return response.data.files[0].url;
    } else {
      throw new Error('Format de réponse CDN inattendu');
    }
  } catch (error) {
    console.error('Erreur lors de l\'upload vers le CDN:', error);
    throw new Error('Échec de l\'upload vers le CDN');
  }
}

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

  if (!session.user.id) {
    return res.status(400).json({ message: 'ID utilisateur manquant dans la session' });
  }

  try {
    // Créer un dossier temporaire si nécessaire
    const tmpDir = '/tmp';
    // Aucun besoin de créer le dossier /tmp car il existe déjà dans les conteneurs Docker
    
    // Utiliser formidable pour parser le formulaire
    const form = formidable({
      uploadDir: tmpDir,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      filter: function(part) {
        return part.name === 'receipt' && 
               (part.mimetype?.includes('image/jpeg') || 
                part.mimetype?.includes('image/png') || 
                part.mimetype?.includes('image/gif') || 
                false);
      }
    });

    // Parser le formulaire
    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    // Récupérer le fichier
    const fileData = files.receipt;
    const file = Array.isArray(fileData) ? fileData[0] : fileData;

    if (!file) {
      return res.status(400).json({ message: 'Aucun fichier n\'a été téléchargé' });
    }

    // Récupérer l'ID du produit
    const productIdField = fields.productId;
    const productId = Array.isArray(productIdField) ? productIdField[0] : productIdField;
    
    if (!productId) {
      return res.status(400).json({ message: 'ID du produit requis' });
    }

    // Vérifier si le produit existe
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    // Uploader l'image vers le CDN
    let cdnImageUrl = '';
    try {
      cdnImageUrl = await uploadToCDN(
        file.filepath, 
        file.originalFilename || `receipt-${Date.now()}.jpg`,
        file.mimetype || 'image/jpeg'
      );
      
      // Supprimer le fichier local temporaire
      fs.unlinkSync(file.filepath);
    } catch (uploadError) {
      console.error('Erreur lors de l\'upload au CDN:', uploadError);
      
      // Fallback : si l'upload vers le CDN échoue, on utilise le stockage local
      const uploadDir = path.join(process.cwd(), 'public/uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const fileName = `${Date.now()}-${file.originalFilename || 'receipt.jpg'}`;
      const localFilePath = path.join(uploadDir, fileName);
      
      fs.copyFileSync(file.filepath, localFilePath);
      fs.unlinkSync(file.filepath);
      
      cdnImageUrl = `/uploads/${fileName}`;
    }

    // Créer l'entrée dans la base de données
    const receipt = await prisma.receipt.create({
      data: {
        imageUrl: cdnImageUrl,
        userId: session.user.id,
        status: 'pending',
        productId: productId
      },
    });

    // Envoyer un message Discord
    try {
      await sendReceiptNotification({
        ...receipt,
        metadata: receipt.metadata || undefined
      });
    } catch (discordError) {
      console.error('Erreur lors de l\'envoi de la notification Discord:', discordError);
      // Ne pas échouer la transaction si l'envoi Discord échoue
    }

    return res.status(201).json({
      message: 'Preuve d\'achat téléchargée avec succès',
      receipt,
    });
  } catch (error) {
    console.error('Erreur lors du téléchargement de la preuve d\'achat:', error);
    return res.status(500).json({ message: 'Erreur du serveur' });
  }
} 
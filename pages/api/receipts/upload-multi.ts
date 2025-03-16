import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { prisma } from '../../../lib/prisma';
import path from 'path';
import fs from 'fs';
import { sendMultiProductReceiptNotification } from '../discord/webhook';
import formidable from 'formidable';
import axios from 'axios';
import FormData from 'form-data';
import { createReadStream } from 'fs';

// Étendre l'interface NextApiRequest pour inclure les propriétés ajoutées par formidable
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

  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ message: 'Non autorisé' });
  }

  if (!token.sub) {
    return res.status(400).json({ message: 'ID utilisateur manquant dans la session' });
  }

  const userId = token.sub;

  try {
    // Créer un dossier temporaire si nécessaire
    const tmpDir = '/tmp';
    // Aucun besoin de créer le dossier /tmp car il existe déjà dans les conteneurs Docker
    
    // Utiliser formidable pour parser le formulaire
    const form = formidable({
      uploadDir: tmpDir,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      multiples: true, // Permettre plusieurs fichiers
      filter: function(part) {
        return part.name === 'receipts' && 
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

    // Récupérer les fichiers
    const fileData = files.receipts;
    if (!fileData) {
      return res.status(400).json({ message: 'Aucun fichier n\'a été téléchargé' });
    }
    
    const receiptFiles = Array.isArray(fileData) ? fileData : [fileData];

    if (receiptFiles.length === 0) {
      return res.status(400).json({ message: 'Aucun fichier n\'a été téléchargé' });
    }

    // Récupérer la liste des produits
    const productsString = fields.products;
    const productsValue = Array.isArray(productsString) ? productsString[0] : productsString;
    
    if (!productsValue) {
      return res.status(400).json({ message: 'Liste de produits requise' });
    }

    let productsData;
    try {
      productsData = JSON.parse(productsValue.toString());
    } catch (error) {
      return res.status(400).json({ message: 'Format de liste de produits invalide' });
    }

    if (!Array.isArray(productsData) || productsData.length === 0) {
      return res.status(400).json({ message: 'La liste de produits ne peut pas être vide' });
    }

    // Vérifier que tous les produits existent
    const productIds = productsData.map(item => item.id);
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds
        }
      }
    });

    if (products.length !== productIds.length) {
      return res.status(404).json({ message: 'Un ou plusieurs produits n\'ont pas été trouvés' });
    }

    // Calculer le total des points potentiels
    const productMap = new Map(products.map(p => [p.id, p]));
    const selectedProducts = productsData.map(item => ({
      id: item.id,
      quantity: item.quantity,
      name: productMap.get(item.id)?.name || '',
      pointsCost: productMap.get(item.id)?.pointsCost || 0
    }));

    const totalPotentialPoints = selectedProducts.reduce((sum, item) => {
      return sum + (item.pointsCost * item.quantity);
    }, 0);

    // Uploader chaque image vers le CDN
    const uploadedImages = await Promise.all(
      receiptFiles.map(async (file) => {
        // Vérifier si le fichier existe
        if (!file || !file.filepath) {
          console.error('Fichier invalide:', file);
          return null;
        }
        
        try {
          const filepath = file.filepath;
          const originalFilename = file.originalFilename || `receipt-multi-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.jpg`;
          const mimetype = file.mimetype || 'image/jpeg';
          
          const cdnUrl = await uploadToCDN(
            filepath,
            originalFilename,
            mimetype
          );
          
          // Supprimer le fichier local temporaire
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
          
          return cdnUrl;
        } catch (uploadError) {
          console.error('Erreur lors de l\'upload au CDN:', uploadError);
          
          if (!file.filepath || !fs.existsSync(file.filepath)) {
            return null;
          }
          
          // Fallback : si l'upload vers le CDN échoue, on utilise le stockage local
          const uploadDir = path.join(process.cwd(), 'public/uploads');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${file.originalFilename || 'receipt-multi.jpg'}`;
          const localFilePath = path.join(uploadDir, fileName);
          
          fs.copyFileSync(file.filepath, localFilePath);
          fs.unlinkSync(file.filepath);
          
          return `/uploads/${fileName}`;
        }
      })
    );

    // Filtrer les images null
    const validImages = uploadedImages.filter(url => url !== null) as string[];
    
    if (validImages.length === 0) {
      return res.status(400).json({ message: 'Aucune image n\'a pu être traitée correctement' });
    }

    // Créer l'entrée dans la base de données avec toutes les images
    const receipt = await prisma.receipt.create({
      data: {
        imageUrl: validImages[0], // Image principale (première)
        userId: userId,
        status: 'pending',
        metadata: JSON.stringify({
          products: selectedProducts,
          totalPotentialPoints,
          additionalImages: validImages.slice(1) // Stocker les images supplémentaires
        })
      },
    });

    // Envoyer un message Discord
    try {
      await sendMultiProductReceiptNotification({
        ...receipt,
        metadata: receipt.metadata ? receipt.metadata : undefined
      }, selectedProducts, totalPotentialPoints);
    } catch (discordError) {
      console.error('Erreur lors de l\'envoi de la notification Discord:', discordError);
      // Ne pas échouer la transaction si l'envoi Discord échoue
    }

    return res.status(201).json({
      message: 'Preuves d\'achat téléchargées avec succès',
      receipt,
      imageCount: validImages.length
    });
  } catch (error) {
    console.error('Erreur lors du téléchargement des preuves d\'achat:', error);
    return res.status(500).json({ message: 'Erreur du serveur' });
  }
} 
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '../../../lib/prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { sendMultiProductReceiptNotification } from '../discord/webhook';

// Étendre l'interface NextApiRequest pour inclure les propriétés ajoutées par multer
interface MulterRequest extends NextApiRequest {
  file: any;
}

// Configuration de multer pour le stockage des fichiers
const upload = multer({
  storage: multer.diskStorage({
    destination: './public/uploads',
    filename: function (req: any, file: any, cb: any) {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: function (req: any, file: any, cb: any) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Seules les images sont autorisées"));
  }
});

// Transformer les fonctions middleware en promesses
const runMiddleware = (req: any, res: any, fn: any) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

// Désactiver le body parser par défaut de Next.js
export const config = {
  api: {
    bodyParser: false,
  },
};

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
    // S'assurer que le dossier uploads existe
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Utiliser multer pour gérer le téléchargement
    await runMiddleware(req, res, upload.single('receipt'));

    // Récupérer le fichier téléchargé
    const multerReq = req as MulterRequest;
    const file = multerReq.file;
    if (!file) {
      return res.status(400).json({ message: 'Aucun fichier n\'a été téléchargé' });
    }

    // Récupérer la liste des produits
    const productsString = multerReq.body.products;
    if (!productsString) {
      return res.status(400).json({ message: 'Liste de produits requise' });
    }

    let productsData;
    try {
      productsData = JSON.parse(productsString);
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

    // Créer l'entrée dans la base de données
    const receipt = await prisma.receipt.create({
      data: {
        imageUrl: `/uploads/${file.filename}`,
        userId: session.user.id,
        status: 'pending',
        metadata: JSON.stringify({
          products: selectedProducts,
          totalPotentialPoints
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
      message: 'Preuve d\'achat téléchargée avec succès',
      receipt,
    });
  } catch (error) {
    console.error('Erreur lors du téléchargement de la preuve d\'achat:', error);
    return res.status(500).json({ message: 'Erreur du serveur' });
  }
} 
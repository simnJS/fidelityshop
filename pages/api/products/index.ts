import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Ajouter des headers CORS pour permettre les requêtes entre domaines avec cookies
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Gérer les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log('API products - Début de la requête, vérification de la session');
    
    // Debug - Afficher les cookies reçus
    console.log('Cookies reçus:', req.cookies);
    console.log('Headers reçus:', {
      origin: req.headers.origin,
      referer: req.headers.referer,
      cookie: req.headers.cookie?.substring(0, 50) + '...' // Tronquer pour la lisibilité
    });
    
    // @ts-ignore - Ignorer l'erreur de type pour authOptions
    const session = await getServerSession(req, res, authOptions);
    
    console.log('Session obtenue:', session ? 'Session présente' : 'Session absente',
               session?.user?.id ? `user.id: ${String(session.user.id).substring(0, 5)}...` : 'pas de user.id');

    if (!session) {
      console.log('API products - Pas de session, retour 401');
      return res.status(401).json({ message: 'Non autorisé' });
    }

    // GET - Récupérer tous les produits
    if (req.method === 'GET') {
      try {
        console.log('API products - Traitement GET avec query:', req.query);
        
        // Pour les administrateurs, possibilité de voir tous les produits (y compris inactifs)
        if (session.user.isAdmin && req.query.all === 'true') {
          const products = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' }
          });
          return res.status(200).json(products);
        }
        
        // Filtrer par type de produit
        const isReward = req.query.type === 'reward' ? true : req.query.type === 'loyalty' ? false : undefined;
        
        const whereClause: any = { inStock: true };
        if (isReward !== undefined) {
          whereClause.isReward = isReward;
        }
        
        // Pour les utilisateurs normaux, uniquement les produits en stock
        const products = await prisma.product.findMany({
          orderBy: { createdAt: 'desc' },
          where: whereClause
        });

        console.log(`API products - Retournant ${products.length} produits (type: ${req.query.type || 'tous'})`);
        return res.status(200).json(products);
      } catch (error) {
        console.error('Erreur lors de la récupération des produits:', error);
        return res.status(500).json({ message: 'Erreur du serveur' });
      }
    }

    // POST - Ajouter un nouveau produit (admin seulement)
    else if (req.method === 'POST') {
      if (!session.user.isAdmin) {
        return res.status(403).json({ message: 'Accès refusé - Droits d\'administrateur requis' });
      }

      try {
        const { name, description, imageUrl, pointsCost, isReward } = req.body;

        // Validation de base
        if (!name || !description || !pointsCost) {
          return res.status(400).json({ message: 'Nom, description et coût en points sont requis' });
        }

        const product = await prisma.product.create({
          data: {
            name,
            description,
            imageUrl: imageUrl || null,
            pointsCost: parseInt(pointsCost),
            inStock: true,
            isReward: isReward === true
          }
        });

        return res.status(201).json(product);
      } catch (error) {
        console.error('Erreur lors de la création du produit:', error);
        return res.status(500).json({ message: 'Erreur du serveur' });
      }
    }

    // Méthode non supportée
    else {
      return res.status(405).json({ message: 'Méthode non autorisée' });
    }
  } catch (error) {
    console.error('Erreur globale dans API products:', error);
    return res.status(500).json({ message: 'Erreur serveur interne' });
  }
} 
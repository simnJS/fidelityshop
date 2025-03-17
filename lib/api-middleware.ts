import { NextApiRequest, NextApiResponse } from 'next';

type NextApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;

export function withApiMiddleware(handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Définir les en-têtes de sécurité
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // En-têtes CORS améliorés pour le RGPD
    const origin = req.headers.origin || '';
    
    // Configurer les origines autorisées (ajouter les domaines spécifiques en production)
    const allowedOrigins = [
      'http://localhost:3000',
      'https://localhost:3000',
      // Ajouter d'autres origines autorisées ici
    ];
    
    // Vérifier si l'origine est autorisée
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
      );
    }
    
    // Gérer les requêtes OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    try {
      // Traiter la requête avec le gestionnaire d'origine
      return await handler(req, res);
    } catch (error) {
      console.error('Erreur API:', error);
      
      // Répondre avec une erreur générique pour éviter la divulgation d'informations sensibles
      return res.status(500).json({
        message: 'Une erreur s\'est produite lors du traitement de votre demande.'
      });
    }
  };
} 
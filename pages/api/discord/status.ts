import { NextApiRequest, NextApiResponse } from 'next';
import { isDiscordConnected, connectDiscordClient } from '../../../lib/discord';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  if (!process.env.DISCORD_TOKEN || !process.env.DISCORD_CHANNEL_ID) {
    return res.status(500).json({ 
      connected: false, 
      message: 'Les variables d\'environnement Discord ne sont pas configurées',
      configError: true
    });
  }

  const connected = isDiscordConnected();

  // Si Discord n'est pas connecté, tenter de le connecter
  if (!connected) {
    console.log('[API] Discord non connecté, tentative de connexion...');
    try {
      const success = await connectDiscordClient();
      
      if (success) {
        console.log('[API] Connexion Discord réussie');
        return res.status(200).json({ 
          connected: true, 
          message: 'Connexion Discord établie avec succès' 
        });
      } else {
        console.log('[API] Échec de la connexion Discord');
        return res.status(200).json({ 
          connected: false, 
          message: 'Impossible de se connecter à Discord',
          attemptFailed: true
        });
      }
    } catch (error) {
      console.error('[API] Erreur lors de la tentative de connexion Discord:', error);
      return res.status(500).json({ 
        connected: false, 
        message: 'Erreur lors de la connexion à Discord',
        error: (error as Error).message
      });
    }
  }

  // Discord est déjà connecté
  return res.status(200).json({ 
    connected: true, 
    message: 'Discord est connecté'
  });
} 
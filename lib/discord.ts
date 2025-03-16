import { 
  Client, 
  GatewayIntentBits,
  Events,
  Interaction
} from 'discord.js';
import axios from 'axios';

// État de connexion du client Discord
let isConnecting = false;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 5000; // 5 secondes entre chaque tentative
let reconnectTimeout: NodeJS.Timeout | null = null;

// Initialiser le client Discord
export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ]
});

// Configuration des logs
client.on('debug', (message) => {
  console.log(`[Discord Debug] ${message}`);
});

client.on('warn', (message) => {
  console.warn(`[Discord Warning] ${message}`);
});

client.on('error', (error) => {
  console.error(`[Discord Error]`, error);
  handleDisconnect();
});

client.on('disconnect', () => {
  console.warn('[Discord] Déconnecté du serveur');
  handleDisconnect();
});

client.on('reconnecting', () => {
  console.log('[Discord] Tentative de reconnexion...');
});

client.on('ready', () => {
  console.log(`[Discord] Connecté comme ${client.user?.tag}!`);
  isConnecting = false;
  connectionAttempts = 0;
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
});

// Configurer les événements Discord pour gérer les interactions
client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (!interaction.isButton()) return;

  try {
    // Extraire les informations du bouton
    const customId = interaction.customId;
    const messageId = interaction.message.id;

    // Envoyer les informations à notre API d'interactions
    await interaction.deferUpdate();
    
    const response = await axios.post(`${process.env.NEXT_PUBLIC_URL}/api/discord/interactions`, {
      interactionId: interaction.id,
      customId,
      messageId
    });

    console.log('Interaction traitée avec succès:', response.data);
  } catch (error) {
    console.error('Erreur lors du traitement de l\'interaction:', error);
    
    // Répondre à l'utilisateur en cas d'erreur
    if (interaction.isRepliable() && !interaction.replied) {
      await interaction.reply({ 
        content: 'Une erreur est survenue lors du traitement de votre demande.', 
        ephemeral: true 
      });
    }
  }
});

// Fonction pour gérer la déconnexion et les tentatives de reconnexion
function handleDisconnect() {
  if (isConnecting) return;
  
  if (connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
    isConnecting = true;
    connectionAttempts++;
    
    console.log(`[Discord] Tentative de reconnexion ${connectionAttempts}/${MAX_RECONNECT_ATTEMPTS} dans ${RECONNECT_INTERVAL/1000} secondes...`);
    
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }
    
    reconnectTimeout = setTimeout(() => {
      connectDiscordClient().catch(err => {
        console.error("[Discord] Échec de la reconnexion:", err);
        isConnecting = false;
        handleDisconnect();
      });
    }, RECONNECT_INTERVAL);
  } else {
    console.error("[Discord] Nombre maximum de tentatives de reconnexion atteint. Abandon.");
    isConnecting = false;
  }
}

// Fonction pour connecter le client Discord
export async function connectDiscordClient(): Promise<boolean> {
  if (!process.env.DISCORD_TOKEN) {
    console.error('[Discord] Token non configuré dans les variables d\'environnement');
    return false;
  }
  
  if (client.isReady()) {
    console.log('[Discord] Client déjà connecté');
    return true;
  }
  
  if (isConnecting) {
    console.log('[Discord] Connexion déjà en cours...');
    return false;
  }
  
  isConnecting = true;
  
  try {
    console.log('[Discord] Tentative de connexion...');
    await client.login(process.env.DISCORD_TOKEN);
    return true;
  } catch (error) {
    console.error('[Discord] Erreur de connexion:', error);
    isConnecting = false;
    return false;
  }
}

// Fonction pour vérifier si Discord est connecté
export function isDiscordConnected(): boolean {
  return client.isReady();
}

// Fonction pour assurer la connexion Discord avant d'exécuter une fonction
export async function ensureDiscordConnected(): Promise<boolean> {
  // Si déjà connecté, retourner immédiatement
  if (client.isReady()) {
    return true;
  }

  // Si pas déjà en train de se connecter, tenter une connexion
  if (!isConnecting) {
    return await connectDiscordClient();
  }
  
  // Attendre jusqu'à 10 secondes pour que la connexion s'établisse
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    if (client.isReady()) {
      return true;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }
  
  return false;
} 
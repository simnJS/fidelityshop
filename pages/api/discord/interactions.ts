import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  TextChannel
} from 'discord.js';
import { client, ensureDiscordConnected } from '../../../lib/discord';

// Configurer les variables d'environnement
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

// Fonction pour approuver un reçu
async function approveReceipt(receiptId: string, points: number) {
  try {
    // Vérifier si le reçu existe
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      include: { user: true }
    });

    if (!receipt) {
      throw new Error('Reçu non trouvé');
    }

    if (receipt.status !== 'pending') {
      throw new Error(`Ce reçu a déjà été ${receipt.status === 'approved' ? 'approuvé' : 'refusé'}`);
    }

    // Mettre à jour le statut du reçu
    const updatedReceipt = await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        status: 'approved',
        pointsAwarded: points
      }
    });

    // Ajouter les points à l'utilisateur
    await prisma.user.update({
      where: { id: receipt.userId },
      data: {
        points: {
          increment: points
        }
      }
    });

    return updatedReceipt;
  } catch (error) {
    console.error('Erreur lors de l\'approbation du reçu:', error);
    throw error;
  }
}

// Fonction pour rejeter un reçu
async function rejectReceipt(receiptId: string) {
  try {
    // Vérifier si le reçu existe
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId }
    });

    if (!receipt) {
      throw new Error('Reçu non trouvé');
    }

    if (receipt.status !== 'pending') {
      throw new Error(`Ce reçu a déjà été ${receipt.status === 'approved' ? 'approuvé' : 'refusé'}`);
    }

    // Mettre à jour le statut du reçu
    const updatedReceipt = await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        status: 'rejected'
      }
    });

    return updatedReceipt;
  } catch (error) {
    console.error('Erreur lors du rejet du reçu:', error);
    throw error;
  }
}

// Fonction pour mettre à jour le statut d'une commande
async function updateOrderStatus(orderId: string, status: string) {
  try {
    // Vérifier si la commande existe
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new Error('Commande non trouvée');
    }

    // Mettre à jour le statut de la commande
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status
      }
    });

    return updatedOrder;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de la commande:', error);
    throw error;
  }
}

// Fonction pour mettre à jour le message Discord après une action
async function updateDiscordMessage(messageId: string, content: string, isSuccess: boolean = true, disableButtons: boolean = true) {
  if (!DISCORD_TOKEN || !DISCORD_CHANNEL_ID) {
    console.error('Les variables d\'environnement Discord ne sont pas configurées');
    return null;
  }

  try {
    // S'assurer que Discord est connecté avant de continuer
    const isConnected = await ensureDiscordConnected();
    if (!isConnected) {
      console.error('Impossible de connecter Discord pour mettre à jour le message');
      return null;
    }

    const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) {
      throw new Error('Canal Discord non trouvé ou non textuel');
    }

    // Typecasting pour s'assurer que channel est un TextChannel
    const textChannel = channel as TextChannel;
    const message = await textChannel.messages.fetch(messageId);

    if (!message) {
      throw new Error('Message Discord non trouvé');
    }

    // Créer un nouvel embed basé sur l'original mais avec un statut mis à jour
    const originalEmbed = message.embeds[0];
    const updatedEmbed = EmbedBuilder.from(originalEmbed)
      .setColor(isSuccess ? (content.includes('En traitement') ? '#3498db' : '#00FF00') : '#FF0000');
      
    // Mettre à jour la description pour inclure le statut
    let updatedDescription = originalEmbed.description || '';
    
    // Vérifier si un statut existe déjà dans la description
    if (updatedDescription.includes('**Statut:**')) {
      // Remplacer le statut existant
      updatedDescription = updatedDescription.replace(/\*\*Statut:\*\*.*$/, `**Statut:** ${content}`);
    } else {
      // Ajouter le statut à la fin
      updatedDescription += `\n\n**Statut:** ${content}`;
    }
    
    updatedEmbed.setDescription(updatedDescription);
    
    // Ajouter un badge de statut au titre
    let updatedTitle = originalEmbed.title || '';
    
    // Si le titre contient déjà un badge, le remplacer
    if (updatedTitle.includes('🔄') || updatedTitle.includes('✅') || updatedTitle.includes('❌')) {
      if (content.includes('En traitement')) {
        updatedTitle = updatedTitle.replace(/[🔄✅❌]\s/, '🔄 ');
      } else if (isSuccess) {
        updatedTitle = updatedTitle.replace(/[🔄✅❌]\s/, '✅ ');
      } else {
        updatedTitle = updatedTitle.replace(/[🔄✅❌]\s/, '❌ ');
      }
    } else {
      // Ajouter un badge au début
      if (content.includes('En traitement')) {
        updatedTitle = '🔄 ' + updatedTitle;
      } else if (isSuccess) {
        updatedTitle = '✅ ' + updatedTitle;
      } else {
        updatedTitle = '❌ ' + updatedTitle;
      }
    }
    
    updatedEmbed.setTitle(updatedTitle);

    // Mettre à jour les boutons selon le besoin
    let updatedComponents;
    if (disableButtons) {
      // Désactiver les boutons
      const disabledRow = ActionRowBuilder.from(message.components[0] as any)
        .setComponents(
          (message.components[0] as any).components.map((button: any) => {
            return ButtonBuilder.from(button).setDisabled(true);
          })
        );
      updatedComponents = [disabledRow as any];
    } else {
      // Garder les boutons actifs
      updatedComponents = message.components;
    }

    await message.edit({
      embeds: [updatedEmbed],
      components: updatedComponents
    });

    return message.id;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du message Discord:', error);
    return null;
  }
}

// Endpoint pour gérer les interactions Discord
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  try {
    const { interactionId, customId, messageId } = req.body;

    if (!customId || !messageId) {
      return res.status(400).json({ message: 'ID personnalisé et ID de message requis' });
    }

    // Traiter les différents types d'interactions
    if (customId.startsWith('approve_receipt:')) {
      const [_, receiptId, pointsStr] = customId.split(':');
      const points = parseInt(pointsStr);

      if (!receiptId || isNaN(points)) {
        return res.status(400).json({ message: 'ID du reçu et points invalides' });
      }

      await approveReceipt(receiptId, points);
      await updateDiscordMessage(messageId, `Approuvé (${points} points)`);

      return res.status(200).json({ message: 'Reçu approuvé avec succès' });
    }
    else if (customId.startsWith('approve_receipt_full:')) {
      const [_, receiptId, pointsStr] = customId.split(':');
      const points = parseInt(pointsStr);

      if (!receiptId || isNaN(points)) {
        return res.status(400).json({ message: 'ID du reçu et points invalides' });
      }

      await approveReceipt(receiptId, points);
      await updateDiscordMessage(messageId, `Approuvé (${points} points)`);

      return res.status(200).json({ message: 'Reçu approuvé avec tous les points' });
    }
    else if (customId.startsWith('approve_receipt_custom:')) {
      const [_, receiptId] = customId.split(':');

      if (!receiptId) {
        return res.status(400).json({ message: 'ID du reçu invalide' });
      }

      // Récupérer le reçu pour obtenir les métadonnées
      const receipt = await prisma.receipt.findUnique({
        where: { id: receiptId },
        include: { user: true }
      });

      if (!receipt) {
        return res.status(404).json({ message: 'Reçu non trouvé' });
      }

      // Demander des points personnalisés via un modal Discord
      // Comme cela n'est pas possible via cette API, nous allons créer un nouveau message
      // avec un bouton pour chaque option de points commune

      const pointOptions = [5, 10, 15, 20, 25, 30, 50, 100];

      if (!DISCORD_CHANNEL_ID) {
        return res.status(500).json({ message: 'Canal Discord non configuré' });
      }

      // S'assurer que Discord est connecté avant de continuer
      const isConnected = await ensureDiscordConnected();
      if (!isConnected) {
        return res.status(500).json({ message: 'Impossible de connecter Discord' });
      }

      const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
      
      if (!channel || !channel.isTextBased()) {
        return res.status(500).json({ message: 'Canal Discord non trouvé ou non textuel' });
      }

      const textChannel = channel as TextChannel;
      
      // Créer des boutons pour chaque option de points
      const rows = [];
      let currentRow = new ActionRowBuilder<ButtonBuilder>();
      let buttonCount = 0;
      
      for (const points of pointOptions) {
        if (buttonCount === 5) {  // Maximum 5 boutons par ligne
          rows.push(currentRow);
          currentRow = new ActionRowBuilder<ButtonBuilder>();
          buttonCount = 0;
        }
        
        currentRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`approve_receipt_points:${receiptId}:${points}`)
            .setLabel(`${points} points`)
            .setStyle(ButtonStyle.Primary)
        );
        
        buttonCount++;
      }
      
      if (buttonCount > 0) {
        rows.push(currentRow);
      }
      
      // Ajouter une dernière ligne avec un bouton pour annuler
      const cancelRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`cancel_custom_points:${receiptId}`)
            .setLabel('Annuler')
            .setStyle(ButtonStyle.Danger)
        );
      
      rows.push(cancelRow);
      
      // Envoyer un nouveau message avec les options de points
      await textChannel.send({
        content: `**Points personnalisés pour le reçu ${receiptId}**\nUtilisateur: ${receipt.user.username}\nVeuillez sélectionner le nombre de points à attribuer:`,
        components: rows as any
      });
      
      // Mettre à jour le message original pour indiquer qu'une sélection de points est en cours
      await updateDiscordMessage(messageId, 'En attente de sélection de points personnalisés...', true);
      
      return res.status(200).json({ message: 'Demande de points personnalisés envoyée' });
    }
    else if (customId.startsWith('approve_receipt_points:')) {
      const [_, receiptId, pointsStr] = customId.split(':');
      const points = parseInt(pointsStr);

      if (!receiptId || isNaN(points)) {
        return res.status(400).json({ message: 'ID du reçu et points invalides' });
      }

      await approveReceipt(receiptId, points);
      
      // Récupérer le message Discord original
      const receipt = await prisma.receipt.findUnique({
        where: { id: receiptId }
      });
      
      if (receipt?.discordMessageId) {
        await updateDiscordMessage(receipt.discordMessageId, `Approuvé (${points} points personnalisés)`);
      }
      
      // Désactiver ce message de sélection de points
      if (DISCORD_CHANNEL_ID) {
        // S'assurer que Discord est connecté avant de continuer
        const isConnected = await ensureDiscordConnected();
        if (isConnected) {
          const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
          if (channel && channel.isTextBased()) {
            const textChannel = channel as TextChannel;
            const message = await textChannel.messages.fetch(messageId);
            
            if (message) {
              await message.edit({
                content: `**Points personnalisés pour le reçu ${receiptId}**\n✅ ${points} points attribués avec succès!`,
                components: []
              });
            }
          }
        }
      }

      return res.status(200).json({ message: 'Reçu approuvé avec points personnalisés' });
    }
    else if (customId.startsWith('cancel_custom_points:')) {
      const [_, receiptId] = customId.split(':');

      if (!receiptId) {
        return res.status(400).json({ message: 'ID du reçu invalide' });
      }
      
      // Désactiver ce message de sélection de points
      if (DISCORD_CHANNEL_ID) {
        // S'assurer que Discord est connecté avant de continuer
        const isConnected = await ensureDiscordConnected();
        if (isConnected) {
          const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
          if (channel && channel.isTextBased()) {
            const textChannel = channel as TextChannel;
            const message = await textChannel.messages.fetch(messageId);
            
            if (message) {
              await message.edit({
                content: `**Points personnalisés pour le reçu ${receiptId}**\n❌ Attribution de points personnalisés annulée.`,
                components: []
              });
            }
          }
        }
      }
      
      return res.status(200).json({ message: 'Attribution de points personnalisés annulée' });
    }
    else if (customId.startsWith('reject_receipt:')) {
      const [_, receiptId] = customId.split(':');

      if (!receiptId) {
        return res.status(400).json({ message: 'ID du reçu invalide' });
      }

      await rejectReceipt(receiptId);
      await updateDiscordMessage(messageId, 'Refusé', false);

      return res.status(200).json({ message: 'Reçu refusé avec succès' });
    }
    else if (customId.startsWith('process_order:')) {
      const [_, orderId] = customId.split(':');

      if (!orderId) {
        return res.status(400).json({ message: 'ID de commande invalide' });
      }

      await updateOrderStatus(orderId, 'processing');
      // Ne pas désactiver les boutons pour permettre de cliquer sur "Terminé" ensuite
      await updateDiscordMessage(messageId, 'En traitement ⏳', true, false);

      return res.status(200).json({ message: 'Commande mise en traitement avec succès' });
    }
    else if (customId.startsWith('complete_order:')) {
      const [_, orderId] = customId.split(':');

      if (!orderId) {
        return res.status(400).json({ message: 'ID de commande invalide' });
      }

      await updateOrderStatus(orderId, 'completed');
      await updateDiscordMessage(messageId, 'Terminé ✨', true);

      return res.status(200).json({ message: 'Commande terminée avec succès' });
    }
    else {
      return res.status(400).json({ message: 'Type d\'interaction non pris en charge' });
    }
  } catch (error) {
    console.error('Erreur lors du traitement de l\'interaction Discord:', error);
    return res.status(500).json({ message: 'Erreur du serveur', error: (error as Error).message });
  }
} 
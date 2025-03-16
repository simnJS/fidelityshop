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

// Types pour les fonctions de notification
interface Receipt {
  id: string;
  userId: string;
  imageUrl: string;
  createdAt: Date | string;
  metadata?: string;
}

interface Order {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  totalPoints: number;
  createdAt: Date | string;
}

interface SelectedProduct {
  id: string;
  quantity: number;
  name: string;
  pointsCost: number;
}

// Configurer les variables d'environnement
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

// Fonction pour envoyer une notification de preuve d'achat à Discord
export async function sendReceiptNotification(receipt: Receipt) {
  if (!DISCORD_TOKEN || !DISCORD_CHANNEL_ID) {
    console.error('Les variables d\'environnement Discord ne sont pas configurées');
    return null;
  }

  try {
    // S'assurer que Discord est connecté avant de continuer
    const isConnected = await ensureDiscordConnected();
    if (!isConnected) {
      console.error('Impossible de connecter Discord pour envoyer la notification de reçu');
      return null;
    }

    // Récupérer les informations de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: receipt.userId }
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // URL complète de l'image
    const imageUrl = receipt.imageUrl.startsWith('http') ? receipt.imageUrl : `${process.env.NEXT_PUBLIC_URL}${receipt.imageUrl}`;

    // Créer l'embed
    const embed = new EmbedBuilder()
      .setTitle('📝 Nouvelle preuve d\'achat')
      .setColor('#0099ff')
      .setDescription(`Un utilisateur a envoyé une nouvelle preuve d'achat.\n\n**Lien de l'image:** [Voir en plein écran](${imageUrl})`)
      .addFields(
        { name: '👤 Utilisateur', value: user.username, inline: true },
        { name: '🎮 Nom Minecraft', value: user.minecraftName || 'Non défini', inline: true },
        { name: '📅 Date', value: new Date(receipt.createdAt).toLocaleString(), inline: true },
        { name: '🔢 ID du reçu', value: receipt.id, inline: false }
      )
      .setImage(imageUrl)
      .setFooter({ text: 'FidelityShop - Système de preuves d\'achat' })
      .setTimestamp();

    // Créer les boutons
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`approve_receipt:${receipt.id}:10`)
          .setLabel('✅ Approuver (10 points)')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`reject_receipt:${receipt.id}`)
          .setLabel('❌ Rejeter')
          .setStyle(ButtonStyle.Danger)
      );

    // Envoyer le message
    const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) {
      throw new Error('Canal Discord non trouvé ou non textuel');
    }

    // Typecasting pour s'assurer que channel est un TextChannel
    const textChannel = channel as TextChannel;
    
    // Envoyer d'abord l'image brute pour qu'elle soit facilement visible
    await textChannel.send({
      content: `**🖼️ PREUVE D'ACHAT - ${user.username}**\n${imageUrl}`
    });
    
    // Puis envoyer l'embed avec les boutons
    const message = await textChannel.send({
      embeds: [embed],
      components: [row]
    });

    // Mettre à jour le reçu avec l'ID du message Discord
    await prisma.receipt.update({
      where: { id: receipt.id },
      data: { discordMessageId: message.id }
    });

    return message.id;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification Discord:', error);
    return null;
  }
}

// Fonction pour envoyer une notification de preuve d'achat avec plusieurs produits
export async function sendMultiProductReceiptNotification(
  receipt: Receipt, 
  products: SelectedProduct[], 
  totalPoints: number
) {
  if (!DISCORD_TOKEN || !DISCORD_CHANNEL_ID) {
    console.error('Les variables d\'environnement Discord ne sont pas configurées');
    return null;
  }

  try {
    // S'assurer que Discord est connecté avant de continuer
    const isConnected = await ensureDiscordConnected();
    if (!isConnected) {
      console.error('Impossible de connecter Discord pour envoyer la notification de reçu multi-produits');
      return null;
    }

    // Récupérer les informations de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: receipt.userId }
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // URL complète de l'image
    const imageUrl = receipt.imageUrl.startsWith('http') ? receipt.imageUrl : `${process.env.NEXT_PUBLIC_URL}${receipt.imageUrl}`;

    // Créer un tableau avec les informations des produits
    let productsInfo = products.map(p => 
      `• ${p.name} x${p.quantity} (${p.pointsCost * p.quantity} points)`
    ).join('\n');

    if (productsInfo.length > 1000) {
      // Tronquer si trop long
      productsInfo = productsInfo.substring(0, 997) + '...';
    }

    // Créer l'embed
    const embed = new EmbedBuilder()
      .setTitle('📝 Nouvelle preuve d\'achat multi-produits')
      .setColor('#ff9900')
      .setDescription(`Un utilisateur a envoyé une preuve d'achat pour plusieurs produits.\n\n**Lien de l'image:** [Voir en plein écran](${imageUrl})`)
      .addFields(
        { name: '👤 Utilisateur', value: user.username, inline: true },
        { name: '🎮 Nom Minecraft', value: user.minecraftName || 'Non défini', inline: true },
        { name: '📅 Date', value: new Date(receipt.createdAt).toLocaleString(), inline: true },
        { name: '📋 Produits', value: productsInfo, inline: false },
        { name: '💰 Total', value: `${totalPoints} points`, inline: true },
        { name: '🔢 ID du reçu', value: receipt.id, inline: true }
      )
      .setImage(imageUrl)
      .setFooter({ text: 'FidelityShop - Système de preuves d\'achat' })
      .setTimestamp();

    // Créer les boutons
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`approve_receipt_full:${receipt.id}:${totalPoints}`)
          .setLabel(`✅ Approuver (${totalPoints} points)`)
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`approve_receipt_custom:${receipt.id}`)
          .setLabel('⚙️ Points personnalisés')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`reject_receipt:${receipt.id}`)
          .setLabel('❌ Rejeter')
          .setStyle(ButtonStyle.Danger)
      );

    // Envoyer le message
    const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) {
      throw new Error('Canal Discord non trouvé ou non textuel');
    }

    // Typecasting pour s'assurer que channel est un TextChannel
    const textChannel = channel as TextChannel;
    
    // Envoyer d'abord l'image brute pour qu'elle soit facilement visible
    await textChannel.send({
      content: `**🖼️ PREUVE D'ACHAT MULTI-PRODUITS - ${user.username}**\n${imageUrl}`
    });
    
    // Puis envoyer l'embed avec les boutons
    const message = await textChannel.send({
      embeds: [embed],
      components: [row]
    });

    // Mettre à jour le reçu avec l'ID du message Discord
    await prisma.receipt.update({
      where: { id: receipt.id },
      data: { discordMessageId: message.id }
    });

    return message.id;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification Discord:', error);
    return null;
  }
}

// Fonction pour envoyer une notification de commande à Discord
export async function sendOrderNotification(order: Order) {
  if (!DISCORD_TOKEN || !DISCORD_CHANNEL_ID) {
    console.error('Les variables d\'environnement Discord ne sont pas configurées');
    return null;
  }

  try {
    // S'assurer que Discord est connecté avant de continuer
    const isConnected = await ensureDiscordConnected();
    if (!isConnected) {
      console.error('Impossible de connecter Discord pour envoyer la notification de commande');
      return null;
    }

    // Récupérer les informations de l'utilisateur et du produit
    const user = await prisma.user.findUnique({
      where: { id: order.userId }
    });

    const product = await prisma.product.findUnique({
      where: { id: order.productId }
    });

    if (!user) {
      console.error('Utilisateur non trouvé pour la commande', order.id);
      return null;
    }

    if (!product) {
      console.error('Produit non trouvé pour la commande', order.id);
      return null;
    }

    // Créer l'embed
    const embed = new EmbedBuilder()
      .setTitle('🛒 Nouvelle commande')
      .setColor('#00ff99')
      .setDescription(`Un utilisateur a passé une nouvelle commande.`)
      .addFields(
        { name: '👤 Utilisateur', value: user.username, inline: true },
        { name: '🎮 Nom Minecraft', value: user.minecraftName || 'Non défini', inline: true },
        { name: '📅 Date', value: new Date(order.createdAt).toLocaleString(), inline: true },
        { name: '🎁 Produit', value: product.name, inline: true },
        { name: '🔢 Quantité', value: order.quantity.toString(), inline: true },
        { name: '💰 Points', value: order.totalPoints.toString(), inline: true },
        { name: '🆔 ID de commande', value: order.id, inline: false }
      )
      .setFooter({ text: 'FidelityShop - Système de commandes' })
      .setTimestamp();

    console.log('Création des boutons Discord');
    // Créer les boutons
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`process_order:${order.id}`)
          .setLabel('🔄 En traitement')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`complete_order:${order.id}`)
          .setLabel('✅ Terminé')
          .setStyle(ButtonStyle.Success)
      );

    console.log('Récupération du canal Discord', DISCORD_CHANNEL_ID);
    // Envoyer le message
    const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) {
      console.error('Problème avec le canal Discord:', { 
        channelExists: !!channel, 
        isTextBased: channel ? channel.isTextBased() : false,
        channelType: channel ? channel.type : 'undefined'
      });
      throw new Error('Canal Discord non trouvé ou non textuel');
    }

    console.log('Envoi du message Discord');
    // Typecasting pour s'assurer que channel est un TextChannel
    const textChannel = channel as TextChannel;
    const message = await textChannel.send({
      embeds: [embed],
      components: [row]
    });

    console.log('Message Discord envoyé avec succès, ID:', message.id);
    return message.id;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification Discord:', error);
    return null;
  }
}

// Endpoint pour gérer les interactions Discord
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Cette route est utilisée pour les webhooks Discord
  res.status(200).json({ message: 'Webhook Discord' });
} 
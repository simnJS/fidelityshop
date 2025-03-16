#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Token d'authentification pour le CDN
const CDN_AUTH_TOKEN = 'MTc0MjEzODIyMzM5Mw==.ODQ2NjI0NDhiMzRkNmI4MzQwOTI2MTBkNzE1NjI0NWEuMzIwOGNmODY0Y2E2NTE3ZWJmZDJhZWQ0N2QxNmQ3MmRlZDc3YjQ0MWMwNTA2NmE4ZmU4YWI3ZGI1Mjc5ZGVjOWM5ODI4ZTZiZDU3YmRmNDJiMjUxNmYxMjM3MmFlYzlkZGUxYTQzMWRkY2Y3NGQ3NmMwZjJmODUyYmRjNmZmYzdkYzNjYzVhNzE1NTI0YTU5MWY3ZTVlNDMwNzdhMGQxOQ==';
const CDN_UPLOAD_URL = 'https://cdn.simnjs.fr/api/upload';

async function uploadToCDN(filePath) {
  console.log('Démarrage de l\'upload vers le CDN...');
  
  if (!fs.existsSync(filePath)) {
    console.error(`Erreur: Le fichier "${filePath}" n'existe pas.`);
    process.exit(1);
  }

  try {
    const fileName = path.basename(filePath);
    const fileStats = fs.statSync(filePath);
    const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`Fichier: ${fileName}`);
    console.log(`Taille: ${fileSizeMB} MB`);
    
    if (fileStats.size > 10 * 1024 * 1024) {
      console.error('Erreur: Le fichier dépasse la taille maximale de 10 MB.');
      process.exit(1);
    }
    
    const fileStream = fs.createReadStream(filePath);
    
    const formData = new FormData();
    formData.append('file', fileStream);
    
    console.log(`Envoi de l'image au CDN (${fileName})...`);
    console.log('URL du CDN:', CDN_UPLOAD_URL);
    
    const response = await axios.post(CDN_UPLOAD_URL, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': CDN_AUTH_TOKEN
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    if (response.data && response.data.files && response.data.files.length > 0) {
      const imageUrl = response.data.files[0].url;
      console.log(`✅ Upload réussi!`);
      console.log(`📋 URL: ${imageUrl}`);
      
      // Copier l'URL dans le presse-papier si disponible
      try {
        const clipboardCommand = process.platform === 'win32' ? 
          `echo ${imageUrl} | clip` : 
          `echo "${imageUrl}" | pbcopy`;
        require('child_process').execSync(clipboardCommand);
        console.log('📌 URL copiée dans le presse-papier!');
      } catch (error) {
        console.log('Note: Impossible de copier l\'URL dans le presse-papier');
      }
      
      return imageUrl;
    } else {
      console.error('Réponse du CDN:', JSON.stringify(response.data, null, 2));
      throw new Error('Format de réponse inattendu du CDN');
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'upload:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('Aucune réponse reçue du serveur');
      console.error(error.message);
    } else {
      console.error('Erreur:', error.message);
    }
    
    console.log('\nEssayez ces actions pour résoudre le problème:');
    console.log('1. Vérifiez votre connexion internet');
    console.log('2. Assurez-vous que le CDN est accessible');
    console.log('3. Vérifiez que le token d\'authentification est valide');
    console.log('4. Essayez avec une image plus petite ou dans un format différent');
    
    process.exit(1);
  }
}

// Exécution du script
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node upload-to-cdn.js <chemin_du_fichier>');
    console.error('Exemple: node upload-to-cdn.js ./images/monimage.jpg');
    process.exit(1);
  }
  
  uploadToCDN(args[0]);
}

module.exports = uploadToCDN; 
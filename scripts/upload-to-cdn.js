#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Token d'authentification pour le CDN
const CDN_AUTH_TOKEN = 'MTc0MjEzODIyMzM5Mw==.ODQ2NjI0NDhiMzRkNmI4MzQwOTI2MTBkNzE1NjI0NWEuMzIwOGNmODY0Y2E2NTE3ZWJmZDJhZWQ0N2QxNmQ3MmRlZDc3YjQ0MWMwNTA2NmE4ZmU4YWI3ZGI1Mjc5ZGVjOWM5ODI4ZTZiZDU3YmRmNDJiMjUxNmYxMjM3MmFlYzlkZGUxYTQzMWRkY2Y3NGQ3NmMwZjJmODUyYmRjNmZmYzdkYzNjYzVhNzE1NTI0YTU5MWY3ZTVlNDMwNzdhMGQxOQ==';
const CDN_UPLOAD_URL = 'https://cdn.simnjs.fr/api/upload';

async function uploadToCDN(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Erreur: Le fichier "${filePath}" n'existe pas.`);
    process.exit(1);
  }

  try {
    const fileName = path.basename(filePath);
    const fileStream = fs.createReadStream(filePath);
    
    const formData = new FormData();
    formData.append('file', fileStream);
    
    console.log(`Uploading ${fileName} to CDN...`);
    
    const response = await axios.post(CDN_UPLOAD_URL, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': CDN_AUTH_TOKEN
      }
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
        // Si la commande de copie échoue, on ignore silencieusement
      }
      
      return imageUrl;
    } else {
      throw new Error('Format de réponse inattendu du CDN');
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'upload:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

// Exécution du script
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node upload-to-cdn.js <chemin_du_fichier>');
    process.exit(1);
  }
  
  uploadToCDN(args[0]);
}

module.exports = uploadToCDN; 
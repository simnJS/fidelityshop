const fs = require('fs');
const path = require('path');

// Chemin vers le dossier public
const publicDir = path.join(process.cwd(), 'public');
// Chemin vers le dossier uploads dans public
const uploadsDir = path.join(publicDir, 'uploads');

console.log("📂 Configuration du dossier d'uploads...");

// Vérifier si le dossier public existe
if (!fs.existsSync(publicDir)) {
  console.log("Création du dossier public...");
  fs.mkdirSync(publicDir);
}

// Vérifier si le dossier uploads existe
if (!fs.existsSync(uploadsDir)) {
  console.log("Création du dossier uploads...");
  fs.mkdirSync(uploadsDir);
}

// Créer un fichier .gitkeep pour que le dossier soit préservé dans Git
const gitkeepFile = path.join(uploadsDir, '.gitkeep');
if (!fs.existsSync(gitkeepFile)) {
  fs.writeFileSync(gitkeepFile, '');
}

// Créer un fichier README.md dans le dossier uploads pour expliquer son utilisation
const readmeFile = path.join(uploadsDir, 'README.md');
const readmeContent = `# Dossier d'uploads

Ce dossier est utilisé pour stocker les images téléchargées.

## Important
- Ce dossier doit être accessible publiquement
- Il doit être monté comme un volume dans Docker pour la persistance des données
- Les images stockées ici sont accessibles via /uploads/nom-du-fichier
`;

fs.writeFileSync(readmeFile, readmeContent);

console.log("✅ Dossier d'uploads configuré avec succès!");
console.log(`📁 Chemin: ${uploadsDir}`);

// Vérification des droits d'accès
try {
  const testFile = path.join(uploadsDir, 'test-write-permission.tmp');
  fs.writeFileSync(testFile, 'Test write permission');
  fs.unlinkSync(testFile);
  console.log("✅ Les permissions d'écriture sont correctes.");
} catch (error) {
  console.error("❌ ERREUR: Impossible d'écrire dans le dossier uploads. Vérifiez les permissions:");
  console.error(error.message);
} 
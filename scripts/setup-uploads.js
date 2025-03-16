#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Chemins des dossiers nécessaires
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');
const TEMP_DIR = path.join(process.cwd(), 'tmp');

// Chemins des dépendances requises
const DEPENDENCIES = [
  'axios',
  'form-data',
  'formidable'
];

console.log('🚀 Configuration du système d\'upload des images...');

// Création des dossiers s'ils n'existent pas
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Dossier créé: ${dir}`);
    } catch (error) {
      console.error(`❌ Erreur lors de la création du dossier ${dir}:`, error.message);
    }
  } else {
    console.log(`✓ Dossier existant: ${dir}`);
  }
}

// Vérification des dépendances
function checkDependencies() {
  console.log('\n📦 Vérification des dépendances requises...');
  
  let missingDeps = [];
  
  for (const dep of DEPENDENCIES) {
    try {
      require.resolve(dep);
      console.log(`✓ ${dep} est installé`);
    } catch (error) {
      console.log(`❌ ${dep} n'est pas installé`);
      missingDeps.push(dep);
    }
  }
  
  if (missingDeps.length > 0) {
    console.log('\n⚠️ Dépendances manquantes détectées. Installation...');
    
    try {
      execSync(`npm install ${missingDeps.join(' ')} --save`, { stdio: 'inherit' });
      console.log('✅ Dépendances installées avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'installation des dépendances:', error.message);
      console.log('\nVeuillez les installer manuellement avec:');
      console.log(`npm install ${missingDeps.join(' ')} --save`);
    }
  }
}

// Création du fichier .gitkeep pour conserver le dossier uploads dans git
function createGitKeep() {
  const gitkeepPath = path.join(UPLOADS_DIR, '.gitkeep');
  
  if (!fs.existsSync(gitkeepPath)) {
    try {
      fs.writeFileSync(gitkeepPath, '');
      console.log('✅ Fichier .gitkeep créé dans le dossier uploads');
    } catch (error) {
      console.error('❌ Erreur lors de la création du fichier .gitkeep:', error.message);
    }
  }
}

// Vérifier et configurer le .gitignore
function updateGitignore() {
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  let gitignoreContent = '';
  
  try {
    if (fs.existsSync(gitignorePath)) {
      gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    }
    
    const uploadsIgnore = 'public/uploads/*';
    const tmpIgnore = 'tmp/*';
    const keepUploadsDir = '!public/uploads/.gitkeep';
    
    const entriesToAdd = [];
    
    if (!gitignoreContent.includes(uploadsIgnore)) {
      entriesToAdd.push(uploadsIgnore);
    }
    
    if (!gitignoreContent.includes(tmpIgnore)) {
      entriesToAdd.push(tmpIgnore);
    }
    
    if (!gitignoreContent.includes(keepUploadsDir)) {
      entriesToAdd.push(keepUploadsDir);
    }
    
    if (entriesToAdd.length > 0) {
      const newContent = gitignoreContent + '\n' + entriesToAdd.join('\n') + '\n';
      fs.writeFileSync(gitignorePath, newContent);
      console.log('✅ .gitignore mis à jour pour exclure les uploads');
    } else {
      console.log('✓ .gitignore est déjà configuré correctement');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du .gitignore:', error.message);
  }
}

// Exécution des fonctions
ensureDirectoryExists(PUBLIC_DIR);
ensureDirectoryExists(UPLOADS_DIR);
ensureDirectoryExists(TEMP_DIR);
checkDependencies();
createGitKeep();
updateGitignore();

console.log('\n✅ Configuration terminée! Le système d\'upload d\'images est prêt.'); 
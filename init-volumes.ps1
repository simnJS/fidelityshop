# Créer le dossier uploads s'il n'existe pas déjà
if (-not (Test-Path -Path ".\uploads")) {
    New-Item -Path ".\uploads" -ItemType Directory
    Write-Host "Dossier uploads créé."
}

# Vérifier si le dossier est vide
$isEmpty = (Get-ChildItem -Path ".\uploads" -Force | Measure-Object).Count -eq 0

if ($isEmpty) {
    Write-Host "Le dossier uploads est vide, copie des images existantes..."
    
    # Vérifier si le conteneur est en cours d'exécution
    $containerName = "app_" + $env:COMPOSE_PROJECT_NAME
    if (-not $containerName) {
        $containerName = "app_prod"
    }
    
    $containerId = docker ps | Select-String $containerName
    
    if ($containerId) {
        # Extraire l'ID du conteneur
        $containerIdStr = $containerId -replace '\s+', ' ' -split ' ' | Select-Object -First 1
        
        # Copier les fichiers du conteneur vers le système hôte
        docker cp "${containerIdStr}:/app/public/uploads/." ".\uploads\"
        Write-Host "Images copiées avec succès depuis le conteneur."
    } else {
        Write-Host "Le conteneur n'est pas en cours d'exécution, aucune image n'a été copiée."
        
        # Créer un fichier README dans le dossier uploads
        $readmeContent = @"
# Dossier d'uploads

Ce dossier est utilisé pour stocker les images téléchargées.

## Important
- Ce dossier est maintenant directement monté dans le conteneur Docker
- Les images sont désormais persistantes entre les redémarrages
- Les images stockées ici sont accessibles via /uploads/nom-du-fichier
"@
        Set-Content -Path ".\uploads\README.md" -Value $readmeContent
    }
} else {
    Write-Host "Le dossier uploads contient déjà des fichiers."
}

Write-Host "Initialisation terminée." 
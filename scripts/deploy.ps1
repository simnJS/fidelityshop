# ------ Configuration ------
$EnvFile = ".env"
$ComposeProjectName = if ($env:COMPOSE_PROJECT_NAME) { $env:COMPOSE_PROJECT_NAME } else { "prod" }
$CacheImage = "app:cache"

# ------ Fonctions utilitaires ------
function Write-Info {
    param ([string]$message)
    Write-Host "[INFO] $message" -ForegroundColor Blue
}

function Write-Success {
    param ([string]$message)
    Write-Host "[SUCCESS] $message" -ForegroundColor Green
}

function Write-Error {
    param ([string]$message)
    Write-Host "[ERROR] $message" -ForegroundColor Red
}

# ------ Vérification des prérequis ------
Write-Info "Vérification des prérequis..."

if (-not (Test-Path $EnvFile)) {
    Write-Error "Fichier .env non trouvé!"
    Write-Info "Créez un fichier .env basé sur .env.example"
    exit 1
}

# ------ Préparation ------
Write-Info "Préparation du déploiement..."

# Charger les variables d'environnement
Get-Content $EnvFile | ForEach-Object {
    if ($_ -match "^\s*([^#][^=]+)=(.*)$") {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($name, $value)
    }
}
[Environment]::SetEnvironmentVariable("COMPOSE_PROJECT_NAME", $ComposeProjectName)

# ------ Construction et déploiement ------
Write-Info "Démarrage du déploiement..."

# 1. Pull l'image de cache si elle existe
Write-Info "Recherche d'une image cache..."
docker pull $CacheImage 2>$null

# 2. Build avec cache
Write-Info "Construction de l'image Docker..."
docker-compose build --build-arg BUILDKIT_INLINE_CACHE=1

# 3. Tagger l'image comme cache pour le prochain build
Write-Info "Mise en cache de l'image pour de futures accélérations..."
docker tag app:latest $CacheImage

# 4. Démarrer les conteneurs
Write-Info "Démarrage des conteneurs..."
docker-compose up -d

# 5. Nettoyer les images non utilisées
Write-Info "Nettoyage des images non utilisées..."
docker image prune -f

# ------ Fin ------
Write-Success "Déploiement terminé avec succès!"
$url = if ($env:NEXT_PUBLIC_URL) { $env:NEXT_PUBLIC_URL } else { "http://localhost:3744" }
Write-Info "L'application est disponible à l'adresse: $url" 
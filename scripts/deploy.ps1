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

# Activer BuildKit pour des builds plus rapides
[Environment]::SetEnvironmentVariable("DOCKER_BUILDKIT", "1")
[Environment]::SetEnvironmentVariable("COMPOSE_DOCKER_CLI_BUILD", "1")

# ------ Construction et déploiement ------
Write-Info "Démarrage du déploiement..."

# 1. Pull l'image de cache si elle existe
Write-Info "Tentative de récupération du cache précédent..."
try {
    docker pull $CacheImage
} catch {
    Write-Info "Pas de cache disponible, on construit à partir de zéro"
}

# 2. Build avec cache et BuildKit
Write-Info "Construction de l'image Docker avec BuildKit..."
docker-compose build --build-arg BUILDKIT_INLINE_CACHE=1

# 3. Tagger l'image comme cache pour le prochain build
Write-Info "Sauvegarde du cache pour accélérer les builds futurs..."
try {
    docker tag app:latest $CacheImage
} catch {
    Write-Info "Avertissement: Impossible de tagger l'image"
}

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
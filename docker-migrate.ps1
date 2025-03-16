# Ce script applique les migrations Prisma dans un environnement Docker

Write-Host "Vérification si le conteneur Docker est en cours d'exécution..." -ForegroundColor Cyan
$containerRunning = docker ps | Select-String -Pattern "app_simnshop" -Quiet

if (-not $containerRunning) {
    Write-Host "Le conteneur app_simnshop n'est pas en cours d'exécution." -ForegroundColor Red
    Write-Host "Démarrage des conteneurs Docker..." -ForegroundColor Cyan
    docker-compose up -d
    Write-Host "Conteneurs démarrés." -ForegroundColor Green
    # Attendre que le conteneur soit prêt
    Start-Sleep -Seconds 5
}

Write-Host "Application des migrations Prisma..." -ForegroundColor Cyan
docker-compose exec app npx prisma migrate deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host "Migration terminée avec succès !" -ForegroundColor Green
    Write-Host "Redémarrage du conteneur pour appliquer les changements..." -ForegroundColor Cyan
    docker-compose restart app
    Write-Host "Le conteneur a été redémarré." -ForegroundColor Green
} else {
    Write-Host "La migration a échoué. Vérifiez les logs pour plus d'informations." -ForegroundColor Red
    Write-Host "Affichage des logs du conteneur :" -ForegroundColor Cyan
    docker-compose logs app | Select-Object -Last 50
}

Write-Host "Terminé." -ForegroundColor Cyan 
# Créer une migration pour modifier la colonne metadata
Write-Host "Création de la migration Prisma pour modifier la colonne metadata..." -ForegroundColor Cyan
npx prisma migrate dev --name change_metadata_to_text

# Appliquer la migration
Write-Host "Application de la migration à la base de données..." -ForegroundColor Cyan
npx prisma migrate deploy

# Générer le client Prisma
Write-Host "Génération du client Prisma..." -ForegroundColor Cyan
npx prisma generate

Write-Host "Migration terminée! La colonne metadata peut maintenant stocker de grandes quantités de données." -ForegroundColor Green 
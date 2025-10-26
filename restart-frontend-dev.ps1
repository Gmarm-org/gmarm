# Script para reiniciar frontend con nueva configuración
Write-Host "🔄 Reiniciando frontend con nueva configuración..." -ForegroundColor Green

# Detener el contenedor del frontend
Write-Host "⏹️  Deteniendo contenedor frontend_dev..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml stop frontend_dev

# Eliminar el contenedor para forzar rebuild
Write-Host "🗑️  Eliminando contenedor frontend_dev..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml rm -f frontend_dev

# Reconstruir y levantar el frontend
Write-Host "🔨 Reconstruyendo y levantando frontend_dev..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml up -d --build frontend_dev

# Mostrar logs para verificar
Write-Host "📋 Mostrando logs del frontend..." -ForegroundColor Green
docker-compose -f docker-compose.dev.yml logs -f frontend_dev

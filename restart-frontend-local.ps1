# Script para reiniciar frontend en entorno LOCAL
Write-Host "🔄 Reiniciando frontend LOCAL..." -ForegroundColor Green

# Detener el contenedor del frontend
Write-Host "⏹️  Deteniendo contenedor frontend_local..." -ForegroundColor Yellow
docker-compose -f docker-compose.local.yml stop frontend_local

# Eliminar el contenedor para forzar rebuild
Write-Host "🗑️  Eliminando contenedor frontend_local..." -ForegroundColor Yellow
docker-compose -f docker-compose.local.yml rm -f frontend_local

# Reconstruir y levantar el frontend
Write-Host "🔨 Reconstruyendo y levantando frontend_local..." -ForegroundColor Yellow
docker-compose -f docker-compose.local.yml up -d --build frontend_local

# Mostrar logs para verificar
Write-Host "📋 Mostrando logs del frontend..." -ForegroundColor Green
docker-compose -f docker-compose.local.yml logs -f frontend_local

# Script para detener entorno de desarrollo LOCAL
Write-Host "🛑 Deteniendo entorno de desarrollo LOCAL..." -ForegroundColor Yellow

# Detener servicios
Write-Host "⏹️  Deteniendo servicios..." -ForegroundColor Yellow
docker-compose -f docker-compose.local.yml down

# Mostrar estado final
Write-Host "📋 Estado final de los servicios:" -ForegroundColor Green
docker-compose -f docker-compose.local.yml ps

Write-Host "✅ Entorno LOCAL detenido!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Para iniciar nuevamente:" -ForegroundColor Yellow
Write-Host "   .\start-local.ps1" -ForegroundColor White

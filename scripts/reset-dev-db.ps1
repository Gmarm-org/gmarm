Write-Host "🔄 Reseteando base de datos de desarrollo..." -ForegroundColor Yellow
Write-Host "⚠️  ADVERTENCIA: Esto eliminará TODOS los datos de la BD de desarrollo" -ForegroundColor Red

# Detener servicios
Write-Host "📦 Deteniendo servicios..." -ForegroundColor Blue
docker-compose -f docker-compose.dev.yml down

# Eliminar volumen de PostgreSQL para forzar recreación
Write-Host "🗑️  Eliminando volumen de PostgreSQL..." -ForegroundColor Blue
docker volume rm gmarm_postgres_data_dev 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Volumen no existe o ya fue eliminado" -ForegroundColor Gray
}

# Limpiar imágenes huérfanas (opcional)
Write-Host "🧹 Limpiando imágenes huérfanas..." -ForegroundColor Blue
docker image prune -f

Write-Host "✅ Base de datos reseteada. La próxima vez que ejecutes 'docker-compose -f docker-compose.dev.yml up'" -ForegroundColor Green
Write-Host "   se creará una BD limpia y se ejecutará el SQL maestro automáticamente." -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Para levantar servicios con BD limpia:" -ForegroundColor Cyan
Write-Host "   docker-compose -f docker-compose.dev.yml up -d --build" -ForegroundColor White

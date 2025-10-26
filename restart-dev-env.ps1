# Script para reiniciar todo el entorno de desarrollo
Write-Host "🔄 Reiniciando entorno de desarrollo completo..." -ForegroundColor Green

# Detener todos los servicios
Write-Host "⏹️  Deteniendo todos los servicios..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml down

# Limpiar contenedores y volúmenes (opcional, descomenta si quieres limpiar todo)
# Write-Host "🧹 Limpiando contenedores y volúmenes..." -ForegroundColor Yellow
# docker-compose -f docker-compose.dev.yml down -v

# Reconstruir y levantar todos los servicios
Write-Host "🔨 Reconstruyendo y levantando todos los servicios..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml up -d --build

# Esperar un momento para que los servicios se inicien
Write-Host "⏳ Esperando que los servicios se inicien..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Mostrar estado de los servicios
Write-Host "📋 Estado de los servicios:" -ForegroundColor Green
docker-compose -f docker-compose.dev.yml ps

# Mostrar logs del backend
Write-Host "📋 Logs del backend:" -ForegroundColor Green
docker-compose -f docker-compose.dev.yml logs backend_dev

# Mostrar logs del frontend
Write-Host "📋 Logs del frontend:" -ForegroundColor Green
docker-compose -f docker-compose.dev.yml logs frontend_dev

Write-Host "✅ Entorno de desarrollo reiniciado!" -ForegroundColor Green
Write-Host "🌐 Frontend: http://72.167.52.14:5173" -ForegroundColor Cyan
Write-Host "🔧 Backend: http://72.167.52.14:8080" -ForegroundColor Cyan
Write-Host "📊 Base de datos: postgresql://72.167.52.14:5432" -ForegroundColor Cyan

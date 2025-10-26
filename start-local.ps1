# Script para iniciar entorno de desarrollo LOCAL
Write-Host "🚀 Iniciando entorno de desarrollo LOCAL..." -ForegroundColor Green

# Verificar si Docker está ejecutándose
Write-Host "🔍 Verificando Docker..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "✅ Docker está ejecutándose" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker no está ejecutándose. Por favor, inicia Docker Desktop." -ForegroundColor Red
    exit 1
}

# Detener cualquier contenedor existente
Write-Host "⏹️  Deteniendo contenedores existentes..." -ForegroundColor Yellow
docker-compose -f docker-compose.local.yml down

# Limpiar contenedores y volúmenes (opcional)
$cleanChoice = Read-Host "¿Deseas limpiar completamente los contenedores y volúmenes? (s/n)"
if ($cleanChoice -eq "s" -or $cleanChoice -eq "S") {
    Write-Host "🧹 Limpiando contenedores y volúmenes..." -ForegroundColor Yellow
    docker-compose -f docker-compose.local.yml down -v
}

# Construir y levantar servicios
Write-Host "🔨 Construyendo y levantando servicios..." -ForegroundColor Yellow
docker-compose -f docker-compose.local.yml up -d --build

# Esperar a que los servicios se inicien
Write-Host "⏳ Esperando que los servicios se inicien..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Mostrar estado de los servicios
Write-Host "📋 Estado de los servicios:" -ForegroundColor Green
docker-compose -f docker-compose.local.yml ps

# Mostrar logs del backend
Write-Host "📋 Logs del backend:" -ForegroundColor Green
docker-compose -f docker-compose.local.yml logs backend_local

# Mostrar logs del frontend
Write-Host "📋 Logs del frontend:" -ForegroundColor Green
docker-compose -f docker-compose.local.yml logs frontend_local

Write-Host "✅ Entorno LOCAL iniciado!" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔧 Backend: http://localhost:8080" -ForegroundColor Cyan
Write-Host "📊 Base de datos: postgresql://localhost:5432" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Para ver logs en tiempo real:" -ForegroundColor Yellow
Write-Host "   docker-compose -f docker-compose.local.yml logs -f" -ForegroundColor White
Write-Host ""
Write-Host "📝 Para detener servicios:" -ForegroundColor Yellow
Write-Host "   docker-compose -f docker-compose.local.yml down" -ForegroundColor White

# =====================================================
# Script para inicializar la base de datos con codificación UTF-8
# =====================================================

Write-Host "Inicializando base de datos con codificacion UTF-8..." -ForegroundColor Green

# Configurar codificación UTF-8 para PowerShell
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Verificar que el contenedor de PostgreSQL esté ejecutándose
$containerName = "gmarm-postgres-local"
$containerStatus = docker ps --filter "name=$containerName" --format "{{.Status}}"

if (-not $containerStatus) {
    Write-Host "Error: El contenedor $containerName no esta ejecutandose" -ForegroundColor Red
    exit 1
}

Write-Host "Contenedor PostgreSQL encontrado: $containerStatus" -ForegroundColor Green

# Limpiar la base de datos completamente
Write-Host "Limpiando base de datos..." -ForegroundColor Yellow
docker exec -it $containerName psql -U postgres -d gmarm_dev -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" 2>$null

# Ejecutar el script SQL con codificación UTF-8
Write-Host "Ejecutando script SQL maestro..." -ForegroundColor Yellow

# Usar Get-Content con codificación UTF-8 y pasar al contenedor
Get-Content -Path "datos/00_gmarm_completo.sql" -Encoding UTF8 | docker exec -i $containerName psql -U postgres -d gmarm_dev

if ($LASTEXITCODE -eq 0) {
    Write-Host "Base de datos inicializada correctamente con codificacion UTF-8" -ForegroundColor Green
    
    # Verificar que las preguntas se insertaron correctamente
    Write-Host "Verificando preguntas..." -ForegroundColor Yellow
    docker exec -it $containerName psql -U postgres -d gmarm_dev -c "SELECT id, pregunta FROM pregunta_cliente ORDER BY id LIMIT 3;"
    
    Write-Host "Base de datos lista para usar!" -ForegroundColor Green
} else {
    Write-Host "Error al inicializar la base de datos" -ForegroundColor Red
    exit 1
}
# ========================================
# SCRIPT: RESET BD DESDE CERO (PowerShell)
# ========================================
# Este script:
#   1. Elimina completamente la base de datos (down -v)
#   2. Recrea desde el SQL maestro
#   3. Elimina TODOS los documentos generados y subidos
#   4. Libera espacio en el servidor
#
# Uso:
#   .\scripts\reset-bd-desde-cero.ps1 [local|dev|prod]
#   Si no se especifica ambiente, usa 'local'
# ========================================

param(
    [string]$Ambiente = "local"
)

$ErrorActionPreference = "Stop"

$dockerComposeFile = switch ($Ambiente) {
    "local" { "docker-compose.local.yml"; break }
    "dev" { "docker-compose.dev.yml"; break }
    "prod" { "docker-compose.prod.yml"; break }
    default {
        Write-Host "❌ Ambiente no válido: $Ambiente" -ForegroundColor Red
        Write-Host "   Usa: local, dev o prod" -ForegroundColor Yellow
        exit 1
    }
}

$dbName = switch ($Ambiente) {
    "local" { "gmarm_local"; break }
    "dev" { "gmarm_dev"; break }
    "prod" { "gmarm_prod"; break }
}

$dbContainer = switch ($Ambiente) {
    "local" { "gmarm-postgres-local"; break }
    "dev" { "gmarm-postgres-dev"; break }
    "prod" { "gmarm-postgres-prod"; break }
}

Write-Host ""
Write-Host "🔄 RESET COMPLETO DE BASE DE DATOS - AMBIENTE: $Ambiente" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  ATENCIÓN: Este script:" -ForegroundColor Yellow
Write-Host "   1. Elimina COMPLETAMENTE la base de datos (sin respaldos)"
Write-Host "   2. Elimina TODOS los documentos generados y subidos"
Write-Host "   3. Recrea la BD desde el SQL maestro"
Write-Host "   4. Resetea todas las secuencias"
Write-Host ""
Write-Host "📁 Directorios que serán eliminados:" -ForegroundColor Yellow
Write-Host "   - documentacion\* (contratos, documentos, autorizaciones)"
Write-Host "   - uploads\* (archivos subidos por clientes)"
Write-Host "   - backend\uploads\* (archivos temporales)"
Write-Host ""

$confirm = Read-Host "¿Estás seguro? Escribe 'SI' para continuar"
if ($confirm -ne "SI") {
    Write-Host "❌ Cancelado por el usuario" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🛑 Paso 1/6: Deteniendo servicios y eliminando volúmenes..." -ForegroundColor Yellow
docker-compose -f $dockerComposeFile down -v

Write-Host ""
Write-Host "🗑️  Paso 2/6: Eliminando documentos generados y subidos..." -ForegroundColor Yellow

# Función para eliminar contenido de directorio
function Remove-DirectoryContents {
    param([string]$Path)
    
    if (Test-Path $Path) {
        Write-Host "   Eliminando: $Path" -ForegroundColor Gray
        Get-ChildItem -Path $Path -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
        Get-ChildItem -Path $Path -Directory -Force -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
    }
}

# Eliminar documentos de clientes
Remove-DirectoryContents "documentacion\documentos_cliente"

# Eliminar contratos generados
Remove-DirectoryContents "documentacion\contratos_generados"

# Eliminar documentos de importación
Remove-DirectoryContents "documentacion\documentos_importacion"

# Eliminar autorizaciones
Remove-DirectoryContents "documentacion\autorizaciones"

# Eliminar uploads de clientes
Remove-DirectoryContents "uploads\clientes"

# Eliminar imágenes de armas (mantener estructura)
if (Test-Path "uploads\images\weapons") {
    Write-Host "   Eliminando imágenes de armas en: uploads\images\weapons" -ForegroundColor Gray
    Get-ChildItem -Path "uploads\images\weapons" -File -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
}

# Eliminar uploads del backend
Remove-DirectoryContents "backend\uploads"

# Calcular espacio liberado (aproximado)
Write-Host ""
Write-Host "📊 Espacio liberado:" -ForegroundColor Green
$dirs = @("documentacion", "uploads", "backend\uploads") | Where-Object { Test-Path $_ }
if ($dirs) {
    $totalSize = ($dirs | Get-ChildItem -Recurse -ErrorAction SilentlyContinue | 
                  Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
    $totalSizeMB = [math]::Round($totalSize / 1MB, 2)
    Write-Host "   Aproximadamente: $totalSizeMB MB" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Paso 3/6: Iniciando solo PostgreSQL..." -ForegroundColor Yellow
try {
    docker-compose -f $dockerComposeFile up -d postgres_$Ambiente 2>$null
} catch {
    try {
        docker-compose -f $dockerComposeFile up -d postgres 2>$null
    } catch {
        Write-Host "   ⚠️  No se pudo iniciar con el nombre específico, intentando con nombre genérico..." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "⏳ Paso 4/6: Esperando a que PostgreSQL inicie..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$ready = $false

while ($attempt -lt $maxAttempts -and -not $ready) {
    $attempt++
    $result = docker exec $dbContainer pg_isready -U postgres 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL listo después de $attempt intentos" -ForegroundColor Green
        $ready = $true
    } else {
        Write-Host "   Intento $attempt/$maxAttempts..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if (-not $ready) {
    Write-Host "❌ PostgreSQL no está listo después de $maxAttempts intentos" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "💾 Paso 5/6: Recreando base de datos desde SQL maestro..." -ForegroundColor Yellow

# Eliminar base de datos si existe
Write-Host "   Eliminando base de datos existente..." -ForegroundColor Gray
docker exec $dbContainer psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS $dbName;" 2>$null | Out-Null

# Crear nueva base de datos
Write-Host "   Creando nueva base de datos con UTF-8..." -ForegroundColor Gray
docker exec $dbContainer psql -U postgres -d postgres -c "CREATE DATABASE $dbName WITH ENCODING='UTF8' LC_COLLATE='C.UTF-8' LC_CTYPE='C.UTF-8';"

# Verificar que existe el SQL maestro
if (-not (Test-Path "datos\00_gmarm_completo.sql")) {
    Write-Host "❌ Error: No se encuentra el archivo datos\00_gmarm_completo.sql" -ForegroundColor Red
    exit 1
}

# Cargar SQL maestro
Write-Host "   Cargando SQL maestro (esto puede tardar 1-2 minutos)..." -ForegroundColor Gray
Get-Content "datos\00_gmarm_completo.sql" -Raw -Encoding UTF8 | docker exec -i $dbContainer psql -U postgres -d $dbName

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ SQL maestro cargado correctamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error cargando SQL maestro" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Paso 6/6: Verificando datos cargados..." -ForegroundColor Yellow

# Verificar datos
$usuarios = docker exec $dbContainer psql -U postgres -d $dbName -tAc "SELECT COUNT(*) FROM usuario;" 2>$null
$armas = docker exec $dbContainer psql -U postgres -d $dbName -tAc "SELECT COUNT(*) FROM arma;" 2>$null
$clientes = docker exec $dbContainer psql -U postgres -d $dbName -tAc "SELECT COUNT(*) FROM cliente;" 2>$null

Write-Host "   ✅ Usuarios: $usuarios" -ForegroundColor Green
Write-Host "   ✅ Armas: $armas" -ForegroundColor Green
Write-Host "   ✅ Clientes: $clientes" -ForegroundColor Green

Write-Host ""
Write-Host "🚀 Iniciando todos los servicios..." -ForegroundColor Yellow
docker-compose -f $dockerComposeFile up -d

Write-Host ""
Write-Host "⏳ Esperando servicios (15 segundos)..." -ForegroundColor Gray
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "✅ RESET COMPLETO FINALIZADO" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Estado del sistema:" -ForegroundColor Cyan
docker-compose -f $dockerComposeFile ps

Write-Host ""
Write-Host "🎯 Base de datos lista desde cero" -ForegroundColor Green
Write-Host "📁 Documentos y uploads eliminados" -ForegroundColor Green
Write-Host ""
Write-Host '💡 Proximos pasos:' -ForegroundColor Yellow
Write-Host "   1. Verificar que los servicios esten corriendo: docker-compose -f $dockerComposeFile ps"
Write-Host '   2. Acceder a la aplicacion y probar funcionalidades'
Write-Host ''


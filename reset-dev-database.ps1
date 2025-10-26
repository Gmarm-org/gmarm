# ========================================
# SCRIPT: Reset Development Database
# ========================================
# Este script reinicia la base de datos de desarrollo desde 0
# con el SQL maestro completo

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  REINICIAR BASE DE DATOS DESARROLLO"  -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Detener servicios y eliminar volúmenes
Write-Host "📥 Paso 1: Deteniendo servicios y eliminando volúmenes..." -ForegroundColor Yellow
docker-compose -f docker-compose.local.yml down -v

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error deteniendo servicios" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Servicios detenidos y volúmenes eliminados" -ForegroundColor Green
Write-Host ""

# Paso 2: Levantar solo PostgreSQL
Write-Host "🐘 Paso 2: Levantando PostgreSQL..." -ForegroundColor Yellow
docker-compose -f docker-compose.local.yml up -d postgres_local

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error levantando PostgreSQL" -ForegroundColor Red
    exit 1
}

Write-Host "✅ PostgreSQL iniciado" -ForegroundColor Green
Write-Host ""

# Paso 3: Esperar a que PostgreSQL esté listo
Write-Host "⏳ Paso 3: Esperando a que PostgreSQL esté listo..." -ForegroundColor Yellow
$maxRetries = 30
$retries = 0

while ($retries -lt $maxRetries) {
    $result = docker exec gmarm-postgres-local pg_isready -U postgres 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL está listo" -ForegroundColor Green
        break
    }
    
    $retries++
    Write-Host "  Intento $retries/$maxRetries..." -ForegroundColor Gray
    Start-Sleep -Seconds 2
}

if ($retries -eq $maxRetries) {
    Write-Host "❌ PostgreSQL no respondió a tiempo" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Paso 4: Crear la base de datos (si no existe)
Write-Host "📝 Paso 4: Creando base de datos gmarm_dev..." -ForegroundColor Yellow
docker exec gmarm-postgres-local psql -U postgres -c "CREATE DATABASE gmarm_dev;" 2>&1 | Out-Null

# Verificar que la base existe
$dbExists = docker exec gmarm-postgres-local psql -U postgres -lqt | Select-String "gmarm_dev"
if ($dbExists) {
    Write-Host "✅ Base de datos gmarm_dev disponible" -ForegroundColor Green
} else {
    Write-Host "❌ Error: base de datos gmarm_dev no está disponible" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Paso 5: Ejecutar SQL maestro
Write-Host "📝 Paso 5: Ejecutando SQL maestro..." -ForegroundColor Yellow
Get-Content datos/00_gmarm_completo.sql | docker exec -i gmarm-postgres-local psql -U postgres -d gmarm_dev

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error ejecutando SQL maestro" -ForegroundColor Red
    exit 1
}

Write-Host "✅ SQL maestro ejecutado exitosamente" -ForegroundColor Green
Write-Host ""

# Paso 6: Verificar datos
Write-Host "🔍 Paso 6: Verificando datos..." -ForegroundColor Yellow
Write-Host ""

$query = @"
SELECT 'Tablas creadas:' as info, COUNT(*) as total FROM information_schema.tables WHERE table_schema = 'public';
SELECT 'Usuarios:' as info, COUNT(*) as total FROM usuario;
SELECT 'Clientes:' as info, COUNT(*) as total FROM cliente;
SELECT 'Armas:' as info, COUNT(*) as total FROM arma;
SELECT 'Tipos de Cliente:' as info, COUNT(*) as total FROM tipo_cliente;
"@

docker exec gmarm-postgres-local psql -U postgres -d gmarm_dev -c "$query"

Write-Host ""
Write-Host "✅ Verificación completada" -ForegroundColor Green
Write-Host ""

# Paso 7: Levantar servicios restantes
Write-Host "🚀 Paso 7: Levantando servicios restantes..." -ForegroundColor Yellow
docker-compose -f docker-compose.local.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error levantando servicios" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Todos los servicios levantados" -ForegroundColor Green
Write-Host ""

# Resumen final
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ BASE DE DATOS REINICIADA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Servicios disponibles:" -ForegroundColor Yellow
Write-Host "  • Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "  • Backend:   http://localhost:8080" -ForegroundColor White
Write-Host "  • PostgreSQL: localhost:5432" -ForegroundColor White
Write-Host ""
Write-Host "👤 Usuarios de prueba:" -ForegroundColor Yellow
Write-Host "  • Admin:     admin@armasimportacion.com / admin123" -ForegroundColor White
Write-Host "  • Jefe:      jefe@test.com / admin123" -ForegroundColor White
Write-Host "  • Vendedor:  vendedor@test.com / admin123" -ForegroundColor White
Write-Host "  • Karolina:  karritogeova@hotmail.com / admin123" -ForegroundColor White
Write-Host "  • Rossy:     rossy-revelo@hotmail.com / admin123" -ForegroundColor White
Write-Host ""
Write-Host "⏳ Espera ~30 segundos para que el backend inicie completamente" -ForegroundColor Gray
Write-Host ""


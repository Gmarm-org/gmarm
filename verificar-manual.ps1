# =====================================================
# VERIFICACIÓN MANUAL DE BASE DE DATOS
# =====================================================

Write-Host "=== VERIFICACIÓN MANUAL DE BASE DE DATOS ===" -ForegroundColor Cyan
Write-Host ""

# Verificar Docker
Write-Host "1. Verificando Docker..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "   Docker está funcionando" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Docker no está funcionando" -ForegroundColor Red
    Write-Host "   Por favor inicia Docker Desktop y vuelve a ejecutar este script" -ForegroundColor Red
    exit 1
}

# Verificar contenedores
Write-Host ""
Write-Host "2. Verificando contenedores..." -ForegroundColor Yellow
$containers = docker-compose -f docker-compose.dev.yml ps
Write-Host $containers

# Verificar PostgreSQL
Write-Host ""
Write-Host "3. Verificando PostgreSQL..." -ForegroundColor Yellow
try {
    docker exec gmarm-postgres-dev pg_isready -U postgres
    Write-Host "   PostgreSQL está funcionando" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: PostgreSQL no está funcionando" -ForegroundColor Red
    Write-Host "   Ejecuta: docker-compose -f docker-compose.dev.yml up -d" -ForegroundColor Red
    exit 1
}

# Verificar orden de archivos SQL
Write-Host ""
Write-Host "4. Verificando orden de archivos SQL..." -ForegroundColor Yellow
$files = Get-ChildItem datos\*.sql | Sort-Object Name
Write-Host "   Archivos SQL encontrados:"
foreach ($file in $files) {
    Write-Host "   - $($file.Name)" -ForegroundColor White
}

# Verificar que no hay duplicados
$numbers = $files | ForEach-Object { 
    if ($_.Name -match '^(\d+)_') { 
        $matches[1] 
    } 
}
$duplicates = $numbers | Group-Object | Where-Object { $_.Count -gt 1 }
if ($duplicates) {
    Write-Host "   ERROR: Números duplicados encontrados: $($duplicates.Name -join ', ')" -ForegroundColor Red
} else {
    Write-Host "   Orden de archivos correcto" -ForegroundColor Green
}

# Ejecutar verificación SQL
Write-Host ""
Write-Host "5. Ejecutando verificación SQL..." -ForegroundColor Yellow
try {
    docker exec gmarm-postgres-dev psql -U postgres -d gmarm_db -f /docker-entrypoint-initdb.d/verificar_orden_ejecucion.sql
    Write-Host "   Verificación SQL completada" -ForegroundColor Green
} catch {
    Write-Host "   ERROR en verificación SQL: $($_.Exception.Message)" -ForegroundColor Red
}

# Probar función
Write-Host ""
Write-Host "6. Probando función corregida..." -ForegroundColor Yellow
try {
    docker exec gmarm-postgres-dev psql -U postgres -d gmarm_db -c "SELECT obtener_documentos_por_tipo_cliente('Civil');"
    Write-Host "   Función funciona correctamente" -ForegroundColor Green
} catch {
    Write-Host "   ERROR en función: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== VERIFICACIÓN COMPLETADA ===" -ForegroundColor Cyan
Write-Host "Si todos los pasos están en verde, la base de datos está lista para deploy" -ForegroundColor White
Write-Host ""
Write-Host "Comandos útiles:" -ForegroundColor Yellow
Write-Host "  - Iniciar contenedores: docker-compose -f docker-compose.dev.yml up -d" -ForegroundColor Gray
Write-Host "  - Ver logs: docker-compose -f docker-compose.dev.yml logs -f postgres_dev" -ForegroundColor Gray
Write-Host "  - Detener contenedores: docker-compose -f docker-compose.dev.yml down" -ForegroundColor Gray 
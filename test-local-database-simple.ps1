# =====================================================
# SCRIPT PARA PROBAR BASE DE DATOS LOCALMENTE (PowerShell)
# =====================================================

Write-Host "Probando base de datos localmente..." -ForegroundColor Green

# Verificar que Docker esté funcionando
try {
    docker info | Out-Null
    Write-Host "Docker está funcionando" -ForegroundColor Green
} catch {
    Write-Host "Docker no está funcionando. Por favor inicia Docker." -ForegroundColor Red
    exit 1
}

# Verificar que los contenedores estén funcionando
$containers = docker-compose -f docker-compose.dev.yml ps --format json | ConvertFrom-Json
$running = $containers | Where-Object { $_.State -eq "Up" }

if ($running.Count -eq 0) {
    Write-Host "Los contenedores no están funcionando. Iniciando..." -ForegroundColor Yellow
    docker-compose -f docker-compose.dev.yml up -d
    Start-Sleep -Seconds 10
}

# Esperar a que PostgreSQL esté listo
Write-Host "Esperando a que PostgreSQL esté listo..." -ForegroundColor Yellow
for ($i = 1; $i -le 30; $i++) {
    try {
        docker exec gmarm-postgres-dev pg_isready -U postgres | Out-Null
        Write-Host "PostgreSQL está listo!" -ForegroundColor Green
        break
    } catch {
        Write-Host "Intento $i/30: PostgreSQL aún no está listo..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

# Ejecutar verificación de orden de ejecución
Write-Host "Verificando orden de ejecución de scripts..." -ForegroundColor Cyan
try {
    docker exec gmarm-postgres-dev psql -U postgres -d gmarm_db -f /docker-entrypoint-initdb.d/verificar_orden_ejecucion.sql
    Write-Host "Verificación completada" -ForegroundColor Green
} catch {
    Write-Host "Error en verificación: $($_.Exception.Message)" -ForegroundColor Red
}

# Probar función corregida
Write-Host "Probando función corregida..." -ForegroundColor Cyan
try {
    docker exec gmarm-postgres-dev psql -U postgres -d gmarm_db -c "SELECT obtener_documentos_por_tipo_cliente('Civil');"
    Write-Host "Función funciona correctamente" -ForegroundColor Green
} catch {
    Write-Host "Error en función: $($_.Exception.Message)" -ForegroundColor Red
}

# Verificar estado de contenedores
Write-Host "Estado de contenedores:" -ForegroundColor Cyan
docker-compose -f docker-compose.dev.yml ps

Write-Host ""
Write-Host "Prueba local completada." -ForegroundColor Green
Write-Host "Si no hay errores, la base de datos está lista para deploy." -ForegroundColor White
Write-Host ""
Write-Host "Para ver logs en tiempo real:" -ForegroundColor Yellow
Write-Host "   docker-compose -f docker-compose.dev.yml logs -f postgres_dev" -ForegroundColor Gray 
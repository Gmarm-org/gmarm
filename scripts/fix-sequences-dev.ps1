# ========================================
# SCRIPT: Fix Database Sequences (PowerShell)
# ========================================
# Este script corrige las secuencias de PostgreSQL para que los IDs sean consecutivos
# Útil después de resets manuales o migraciones

$ContainerName = "gmarm-postgres-local"
$DbName = "gmarm_dev"

Write-Host "🔄 Corrigiendo secuencias de PostgreSQL..." -ForegroundColor Yellow
Write-Host ""

# Verificar que el contenedor existe
$containerExists = docker ps -a | Select-String $ContainerName
if (-not $containerExists) {
    Write-Host "❌ Contenedor $ContainerName no encontrado" -ForegroundColor Red
    exit 1
}

# Verificar si el contenedor está corriendo
$containerRunning = docker ps | Select-String $ContainerName
if (-not $containerRunning) {
    Write-Host "❌ Contenedor $ContainerName no está corriendo" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Contenedor encontrado y corriendo" -ForegroundColor Green
Write-Host ""

# Resetear secuencias
$sequenceResetQuery = @"
SELECT 'Reseteando secuencias de PostgreSQL...' as info;

SELECT setval('usuario_id_seq', COALESCE((SELECT MAX(id) FROM usuario), 0), true);
SELECT setval('cliente_id_seq', COALESCE((SELECT MAX(id) FROM cliente), 0), true);
SELECT setval('cliente_arma_id_seq', COALESCE((SELECT MAX(id) FROM cliente_arma), 0), true);
SELECT setval('pago_id_seq', COALESCE((SELECT MAX(id) FROM pago), 0), true);
SELECT setval('cuota_pago_id_seq', COALESCE((SELECT MAX(id) FROM cuota_pago), 0), true);
SELECT setval('documento_generado_id_seq', COALESCE((SELECT MAX(id) FROM documento_generado), 0), true);
SELECT setval('documento_cliente_id_seq', COALESCE((SELECT MAX(id) FROM documento_cliente), 0), true);
SELECT setval('arma_id_seq', COALESCE((SELECT MAX(id) FROM arma), 0), true);
SELECT setval('arma_serie_id_seq', COALESCE((SELECT MAX(id) FROM arma_serie), 0), true);
SELECT setval('arma_stock_id_seq', COALESCE((SELECT MAX(id) FROM arma_stock), 0), true);
SELECT setval('categoria_arma_id_seq', COALESCE((SELECT MAX(id) FROM categoria_arma), 0), true);
SELECT setval('respuesta_cliente_id_seq', COALESCE((SELECT MAX(id) FROM respuesta_cliente), 0), true);
SELECT setval('grupo_importacion_id_seq', COALESCE((SELECT MAX(id) FROM grupo_importacion), 0), true);
SELECT setval('cliente_grupo_importacion_id_seq', COALESCE((SELECT MAX(id) FROM cliente_grupo_importacion), 0), true);
SELECT setval('importacion_id_seq', COALESCE((SELECT MAX(id) FROM importacion), 0), true);
SELECT setval('inventario_id_seq', COALESCE((SELECT MAX(id) FROM inventario), 0), true);
SELECT setval('configuracion_sistema_id_seq', COALESCE((SELECT MAX(id) FROM configuracion_sistema), 0), true);
SELECT setval('notificacion_id_seq', COALESCE((SELECT MAX(id) FROM notificacion), 0), true);
SELECT setval('log_auditoria_id_seq', COALESCE((SELECT MAX(id) FROM log_auditoria), 0), true);
SELECT setval('arma_imagen_id_seq', COALESCE((SELECT MAX(id) FROM arma_imagen), 0), true);

SELECT 'Secuencias reseteadas exitosamente' as info;
"@

docker exec $ContainerName psql -U postgres -d $DbName -c "$sequenceResetQuery" 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Secuencias corregidas exitosamente" -ForegroundColor Green
    Write-Host "El próximo ID generado será consecutivo" -ForegroundColor Gray
} else {
    Write-Host "❌ Error corrigiendo secuencias" -ForegroundColor Red
    exit 1
}


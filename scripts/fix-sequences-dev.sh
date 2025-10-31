#!/bin/bash
# ========================================
# SCRIPT: Fix Database Sequences (Linux)
# ========================================
# Este script corrige las secuencias de PostgreSQL para que los IDs sean consecutivos
# Útil después de resets manuales o migraciones

CONTAINER_NAME="gmarm-postgres-dev"
DB_NAME="gmarm_dev"

echo "🔄 Corrigiendo secuencias de PostgreSQL..."
echo ""

# Verificar que el contenedor existe
if ! docker ps -a | grep -q "$CONTAINER_NAME"; then
    echo "❌ Contenedor $CONTAINER_NAME no encontrado"
    exit 1
fi

# Verificar si el contenedor está corriendo
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "❌ Contenedor $CONTAINER_NAME no está corriendo"
    exit 1
fi

echo "✅ Contenedor encontrado y corriendo"
echo ""

# Resetear secuencias
docker exec $CONTAINER_NAME psql -U postgres -d $DB_NAME -c "
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

SELECT '✅ Secuencias reseteadas exitosamente' as info;
"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Secuencias corregidas exitosamente"
    echo "El próximo ID generado será consecutivo"
else
    echo "❌ Error corrigiendo secuencias"
    exit 1
fi


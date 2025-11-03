#!/bin/bash

# ==========================================================
# Script para verificar series en la base de datos
# ==========================================================

echo "🔍 VERIFICACIÓN DE SERIES EN BASE DE DATOS"
echo "=========================================="
echo ""

POSTGRES_CONTAINER="gmarm-postgres-dev"
DB_NAME="gmarm_dev"
DB_USER="postgres"

# 1. Verificar tabla arma_serie existe
echo "1. Verificando tabla arma_serie..."
TABLE_EXISTS=$(docker exec $POSTGRES_CONTAINER psql -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='arma_serie';" | xargs)

if [ "$TABLE_EXISTS" = "0" ]; then
    echo "❌ Tabla arma_serie NO EXISTE"
    exit 1
fi
echo "✅ Tabla arma_serie existe"
echo ""

# 2. Contar series totales
echo "2. Contando series totales..."
TOTAL_SERIES=$(docker exec $POSTGRES_CONTAINER psql -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM arma_serie;" | xargs)
echo "   Total series: $TOTAL_SERIES"
echo ""

# 3. Contar series disponibles
echo "3. Contando series DISPONIBLES..."
SERIES_DISPONIBLES=$(docker exec $POSTGRES_CONTAINER psql -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM arma_serie WHERE estado='DISPONIBLE';" | xargs)
echo "   Series disponibles: $SERIES_DISPONIBLES"
echo ""

# 4. Ver series por arma
echo "4. Series por arma (top 10 armas con más series)..."
docker exec $POSTGRES_CONTAINER psql -U $DB_USER -d $DB_NAME -c "
SELECT 
    a.id,
    a.codigo,
    a.nombre,
    a.expoferia,
    COUNT(aser.id) as total_series,
    COUNT(CASE WHEN aser.estado='DISPONIBLE' THEN 1 END) as series_disponibles
FROM arma a
LEFT JOIN arma_serie aser ON aser.arma_id = a.id
GROUP BY a.id, a.codigo, a.nombre, a.expoferia
HAVING COUNT(aser.id) > 0
ORDER BY total_series DESC
LIMIT 10;
"
echo ""

# 5. Verificar armas de expoferia
echo "5. Armas de expoferia (expoferia=true)..."
ARMAS_EXPOFERIA=$(docker exec $POSTGRES_CONTAINER psql -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM arma WHERE expoferia=true;" | xargs)
echo "   Total armas expoferia: $ARMAS_EXPOFERIA"

docker exec $POSTGRES_CONTAINER psql -U $DB_USER -d $DB_NAME -c "
SELECT id, codigo, nombre, expoferia 
FROM arma 
WHERE expoferia=true 
LIMIT 5;
"
echo ""

# 6. Verificar series del arma ID 47
echo "6. Verificando arma ID 47 específicamente..."
docker exec $POSTGRES_CONTAINER psql -U $DB_USER -d $DB_NAME -c "
SELECT id, codigo, nombre, expoferia 
FROM arma 
WHERE id=47;
"

echo "   Series del arma 47:"
docker exec $POSTGRES_CONTAINER psql -U $DB_USER -d $DB_NAME -c "
SELECT id, numero_serie, estado 
FROM arma_serie 
WHERE arma_id=47;
"
echo ""

# 7. Verificar configuración de expoferia
echo "7. Configuración de expoferia..."
docker exec $POSTGRES_CONTAINER psql -U $DB_USER -d $DB_NAME -c "
SELECT clave, valor 
FROM configuracion_sistema 
WHERE clave IN ('EXPOFERIA_ACTIVA', 'EXPOFERIA_NOMBRE');
"
echo ""

echo "=========================================="
echo "✅ VERIFICACIÓN COMPLETADA"
echo "=========================================="

exit 0


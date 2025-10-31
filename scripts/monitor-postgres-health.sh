#!/bin/bash

# ========================================
# MONITOR DE SALUD DE POSTGRES
# ========================================
# Este script monitorea la salud de PostgreSQL y detecta problemas
# Ejecutar: ./scripts/monitor-postgres-health.sh

CONTAINER_NAME="gmarm-postgres-dev"
MAX_CONNECTIONS=30
WARN_CONNECTIONS=20

echo "🔍 Monitoreando PostgreSQL: $CONTAINER_NAME"
echo "============================================"
echo ""

# Verificar que el contenedor existe
if ! docker ps -a | grep -q "$CONTAINER_NAME"; then
    echo "❌ Contenedor $CONTAINER_NAME no encontrado"
    exit 1
fi

# Verificar si el contenedor está corriendo
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "❌ Contenedor $CONTAINER_NAME no está corriendo"
    docker logs --tail 50 $CONTAINER_NAME
    exit 1
fi

# Obtener estadísticas de conexiones
ACTIVE_CONNECTIONS=$(docker exec $CONTAINER_NAME psql -U postgres -d gmarm_dev -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'gmarm_dev';" 2>/dev/null | tr -d ' ')
MAX_REACHED=$(docker exec $CONTAINER_NAME psql -U postgres -d gmarm_dev -t -c "SELECT setting::int FROM pg_settings WHERE name = 'max_connections';" 2>/dev/null | tr -d ' ')
IDLE_CONNECTIONS=$(docker exec $CONTAINER_NAME psql -U postgres -d gmarm_dev -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'gmarm_dev' AND state = 'idle';" 2>/dev/null | tr -d ' ')
IDLE_IN_TRANSACTION=$(docker exec $CONTAINER_NAME psql -U postgres -d gmarm_dev -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'gmarm_dev' AND state = 'idle in transaction';" 2>/dev/null | tr -d ' ')

echo "📊 Estadísticas de Conexiones:"
echo "   Conexiones activas: $ACTIVE_CONNECTIONS / $MAX_REACHED"
echo "   Conexiones idle: $IDLE_CONNECTIONS"
echo "   Idle in transaction: $IDLE_IN_TRANSACTION"
echo ""

# Verificar si hay demasiadas conexiones
if [ "$ACTIVE_CONNECTIONS" -ge "$WARN_CONNECTIONS" ]; then
    echo "⚠️  ADVERTENCIA: Conexiones altas ($ACTIVE_CONNECTIONS/$MAX_REACHED)"
    if [ "$IDLE_IN_TRANSACTION" -gt 0 ]; then
        echo "   ⚠️  Hay $IDLE_IN_TRANSACTION conexiones idle in transaction (posible leak)"
        echo ""
        echo "🔍 Detalles de conexiones idle in transaction:"
        docker exec $CONTAINER_NAME psql -U postgres -d gmarm_dev -c "SELECT pid, usename, application_name, client_addr, state, wait_event, query_start, state_change FROM pg_stat_activity WHERE datname = 'gmarm_dev' AND state = 'idle in transaction' ORDER BY query_start LIMIT 10;"
    fi
fi

if [ "$ACTIVE_CONNECTIONS" -ge "$MAX_CONNECTIONS" ]; then
    echo "❌ ERROR: PostgreSQL con conexiones al máximo ($ACTIVE_CONNECTIONS/$MAX_CONNECTIONS)"
    exit 1
fi

# Verificar uso de memoria
echo "💾 Uso de Memoria del Contenedor:"
docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}\t{{.MemPerc}}" | grep $CONTAINER_NAME

echo ""
echo "✅ PostgreSQL está funcionando correctamente"


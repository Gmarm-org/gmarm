#!/bin/bash

# =====================================================
# SCRIPT PARA PROBAR BASE DE DATOS LOCALMENTE
# =====================================================

echo "🧪 Probando base de datos localmente..."

# Verificar que Docker esté funcionando
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker no está funcionando. Por favor inicia Docker."
    exit 1
fi

# Verificar que los contenedores estén funcionando
if ! docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
    echo "⚠️  Los contenedores no están funcionando. Iniciando..."
    docker-compose -f docker-compose.dev.yml up -d
    sleep 10
fi

# Esperar a que PostgreSQL esté listo
echo "⏳ Esperando a que PostgreSQL esté listo..."
for i in {1..30}; do
    if docker exec gmarm-postgres-dev pg_isready -U postgres >/dev/null 2>&1; then
        echo "✅ PostgreSQL está listo!"
        break
    fi
    echo "⏳ Intento $i/30: PostgreSQL aún no está listo..."
    sleep 2
done

# Ejecutar verificación de orden de ejecución
echo "🔍 Verificando orden de ejecución de scripts..."
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_db -f /docker-entrypoint-initdb.d/verificar_orden_ejecucion.sql

# Probar función corregida
echo "🧪 Probando función corregida..."
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_db -c "SELECT obtener_documentos_por_tipo_cliente('Civil');"

# Verificar estado de contenedores
echo "📊 Estado de contenedores:"
docker-compose -f docker-compose.dev.yml ps

echo ""
echo "✅ Prueba local completada."
echo "📋 Si no hay errores, la base de datos está lista para deploy."
echo ""
echo "🔧 Para ver logs en tiempo real:"
echo "   docker-compose -f docker-compose.dev.yml logs -f postgres_dev" 
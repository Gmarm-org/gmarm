#!/bin/bash

# =====================================================
# SCRIPT PARA CORREGIR ERROR DE FUNCIÓN
# =====================================================

echo "🔧 Corrigiendo error de función obtener_documentos_por_tipo_cliente..."

# Verificar que PostgreSQL esté funcionando
if ! docker exec gmarm-postgres-dev pg_isready -U postgres >/dev/null 2>&1; then
    echo "❌ PostgreSQL no está funcionando. Iniciando contenedores..."
    docker-compose -f docker-compose.dev.yml up -d postgres_dev
    
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
fi

# Ejecutar script de corrección
echo "🔧 Aplicando corrección de función..."
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_db -f /docker-entrypoint-initdb.d/06_correccion_funcion.sql

# Verificar que la corrección funcionó
echo "🔍 Verificando que la corrección funcionó..."
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_db -c "SELECT obtener_documentos_por_tipo_cliente('Civil');"

echo "✅ ¡Corrección aplicada! La función debería funcionar correctamente ahora."
echo ""
echo "📋 Para verificar que todo funciona:"
echo "   docker exec gmarm-postgres-dev psql -U postgres -d gmarm_db -c \"SELECT obtener_documentos_por_tipo_cliente('Civil');\"" 
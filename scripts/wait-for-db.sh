#!/bin/bash

# ========================================
# SCRIPT DE ESPERA PARA BASE DE DATOS
# ========================================
# Este script espera hasta que la base de datos esté completamente lista
# antes de iniciar el backend

set -e

host="$1"
shift
db_name="$1"
shift
db_user="$1"
shift
cmd="$@"

echo "⏳ Esperando a que PostgreSQL esté disponible en $host..."
echo "📋 Base de datos: $db_name"
echo "👤 Usuario: $db_user"

# Función para verificar conexión
check_db() {
    PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$host" -U "$db_user" -d postgres -c '\q' 2>/dev/null
    return $?
}

# Esperar hasta 180 segundos (3 minutos) para que PostgreSQL esté listo
timeout=180
elapsed=0
interval=2

while ! check_db; do
    elapsed=$((elapsed + interval))
    if [ $elapsed -ge $timeout ]; then
        echo "❌ Error: Timeout esperando a PostgreSQL después de ${timeout}s"
        exit 1
    fi
    echo "⏳ PostgreSQL no está listo aún. Esperando... (${elapsed}s / ${timeout}s)"
    sleep $interval
done

echo "✅ PostgreSQL está disponible!"

# Verificar que la base de datos específica exista
echo "🔍 Verificando existencia de base de datos $db_name..."

DB_EXISTS=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$host" -U "$db_user" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$db_name';" 2>/dev/null)

if [ "$DB_EXISTS" = "1" ]; then
    echo "✅ Base de datos $db_name existe"
    
    # Verificar que tenga tablas
    TABLE_COUNT=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$host" -U "$db_user" -d "$db_name" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null)
    echo "📊 Tablas en base de datos: $TABLE_COUNT"
    
    if [ "$TABLE_COUNT" -gt 0 ]; then
        echo "✅ Base de datos inicializada correctamente con $TABLE_COUNT tablas"
    else
        echo "⚠️ Advertencia: Base de datos existe pero no tiene tablas. Inicialización puede estar pendiente."
        echo "⏳ Esperando 30 segundos adicionales para que se completen los scripts de init..."
        sleep 30
    fi
else
    echo "⚠️ Base de datos $db_name no existe. Esperando a que se cree..."
    # Esperar hasta 120 segundos más para que se ejecuten los scripts de inicialización
    init_timeout=120
    init_elapsed=0
    
    while [ "$DB_EXISTS" != "1" ] && [ $init_elapsed -lt $init_timeout ]; do
        sleep 5
        init_elapsed=$((init_elapsed + 5))
        DB_EXISTS=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$host" -U "$db_user" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$db_name';" 2>/dev/null)
        echo "⏳ Esperando creación de base de datos... (${init_elapsed}s / ${init_timeout}s)"
    done
    
    if [ "$DB_EXISTS" = "1" ]; then
        echo "✅ Base de datos $db_name creada exitosamente"
        # Esperar un poco más para que los datos se carguen
        echo "⏳ Esperando 15 segundos para que se carguen los datos iniciales..."
        sleep 15
    else
        echo "❌ Error: Base de datos $db_name no se creó después de ${init_timeout}s"
        echo "🔍 Verificando logs de PostgreSQL..."
        exit 1
    fi
fi

echo "🎉 Base de datos completamente lista!"
echo "🚀 Ejecutando comando: $cmd"

# Ejecutar el comando
exec $cmd


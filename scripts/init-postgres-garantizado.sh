#!/bin/bash
set -e

echo "=========================================="
echo "🔧 INICIALIZACIÓN GARANTIZADA DE POSTGRESQL"
echo "=========================================="

# Este script se ejecuta DENTRO del contenedor PostgreSQL
# ANTES de que acepte conexiones

# Esperar a que PostgreSQL interno esté listo
echo "⏳ Esperando a que PostgreSQL interno esté listo..."
until pg_isready -U "$POSTGRES_USER" -q; do
    sleep 1
done
echo "✅ PostgreSQL interno listo"

# SIEMPRE verificar si la BD existe
echo "🔍 Verificando si la base de datos '$POSTGRES_DB' existe..."

# Conectar a la BD por defecto 'postgres' para verificar
DB_EXISTS=$(psql -U "$POSTGRES_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$POSTGRES_DB'" 2>/dev/null || echo "")

if [ -z "$DB_EXISTS" ] || [ "$DB_EXISTS" != "1" ]; then
    echo "❌ Base de datos NO existe - CREANDO AHORA..."
    
    # Crear la base de datos
    psql -U "$POSTGRES_USER" -d postgres <<-EOSQL
        CREATE DATABASE $POSTGRES_DB 
        WITH ENCODING='UTF8' 
        LC_COLLATE='C' 
        LC_CTYPE='C' 
        TEMPLATE=template0;
EOSQL
    
    if [ $? -eq 0 ]; then
        echo "✅ Base de datos '$POSTGRES_DB' creada"
    else
        echo "❌ ERROR: No se pudo crear la base de datos"
        exit 1
    fi
    
    # Esperar un momento
    sleep 2
    
    # CARGAR EL SCRIPT SQL MAESTRO
    echo "📊 Cargando script SQL maestro..."
    if [ -f "/docker-entrypoint-initdb.d/00_gmarm_completo.sql" ]; then
        psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/00_gmarm_completo.sql
        
        if [ $? -eq 0 ]; then
            echo "✅ Script SQL ejecutado exitosamente"
        else
            echo "❌ ERROR: Falló la ejecución del script SQL"
            exit 1
        fi
    else
        echo "⚠️ WARNING: Script SQL no encontrado en /docker-entrypoint-initdb.d/"
    fi
else
    echo "✅ Base de datos '$POSTGRES_DB' ya existe"
    
    # Verificar que tenga tablas
    TABLE_COUNT=$(psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'" 2>/dev/null || echo "0")
    
    echo "📊 Tablas en BD: $TABLE_COUNT"
    
    if [ "$TABLE_COUNT" = "0" ] || [ -z "$TABLE_COUNT" ]; then
        echo "⚠️ Base de datos VACÍA - Cargando datos..."
        
        if [ -f "/docker-entrypoint-initdb.d/00_gmarm_completo.sql" ]; then
            psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/00_gmarm_completo.sql
            echo "✅ Datos cargados"
        fi
    else
        # Verificar datos críticos
        USUARIO_COUNT=$(psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT COUNT(*) FROM usuario" 2>/dev/null || echo "0")
        echo "👥 Usuarios en BD: $USUARIO_COUNT"
        
        if [ "$USUARIO_COUNT" = "0" ]; then
            echo "⚠️ BD sin usuarios - Reinicializando..."
            psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
            psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/00_gmarm_completo.sql
            echo "✅ BD reinicializada"
        fi
    fi
fi

echo ""
echo "=========================================="
echo "✅ INICIALIZACIÓN COMPLETADA"
echo "=========================================="
echo "📊 Base de datos: $POSTGRES_DB"
echo "👤 Usuario: $POSTGRES_USER"
echo "✅ LISTO PARA ACEPTAR CONEXIONES"
echo ""

exit 0


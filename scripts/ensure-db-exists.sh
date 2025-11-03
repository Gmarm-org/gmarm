#!/bin/bash

# ========================================
# SCRIPT PARA GARANTIZAR QUE LA BASE DE DATOS EXISTA
# ========================================
# Este script se ejecuta SIEMPRE que el contenedor inicie
# y verifica que la base de datos exista y tenga datos

set -e

echo "🔍 VERIFICANDO ESTADO DE LA BASE DE DATOS..."

# Esperar a que PostgreSQL esté listo
until pg_isready -U "$POSTGRES_USER" -d postgres; do
    echo "⏳ Esperando a que PostgreSQL esté listo..."
    sleep 2
done

echo "✅ PostgreSQL está listo"

# Verificar si la base de datos existe
echo "🔍 Verificando si la base de datos '$POSTGRES_DB' existe..."
DB_EXISTS=$(psql -U "$POSTGRES_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$POSTGRES_DB'")

if [ "$DB_EXISTS" != "1" ]; then
    echo "❌ BASE DE DATOS NO EXISTE - RECREANDO..."
    
    # Crear la base de datos
    psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE $POSTGRES_DB WITH ENCODING='UTF8' LC_COLLATE='C' LC_CTYPE='C';"
    echo "✅ Base de datos '$POSTGRES_DB' creada"
    
    # Ejecutar el script SQL maestro
    echo "📊 Ejecutando script SQL maestro..."
    if [ -f /docker-entrypoint-initdb.d/00_gmarm_completo.sql ]; then
        psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/00_gmarm_completo.sql
        echo "✅ Script SQL ejecutado exitosamente"
    else
        echo "❌ ERROR: Script SQL no encontrado"
        exit 1
    fi
else
    echo "✅ Base de datos '$POSTGRES_DB' existe"
    
    # Verificar si tiene datos
    echo "🔍 Verificando si la base de datos tiene datos..."
    TABLE_COUNT=$(psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
    
    if [ "$TABLE_COUNT" -eq "0" ]; then
        echo "⚠️ BASE DE DATOS VACÍA - REINICIALIZANDO..."
        
        # Ejecutar el script SQL maestro
        if [ -f /docker-entrypoint-initdb.d/00_gmarm_completo.sql ]; then
            psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/00_gmarm_completo.sql
            echo "✅ Base de datos reinicializada exitosamente"
        else
            echo "❌ ERROR: Script SQL no encontrado"
            exit 1
        fi
    else
        echo "✅ Base de datos tiene $TABLE_COUNT tablas"
        
        # Verificar tablas críticas
        USUARIO_COUNT=$(psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT COUNT(*) FROM usuario;" 2>/dev/null || echo "0")
        ARMA_COUNT=$(psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT COUNT(*) FROM arma;" 2>/dev/null || echo "0")
        
        echo "📊 Usuarios: $USUARIO_COUNT | Armas: $ARMA_COUNT"
        
        if [ "$USUARIO_COUNT" -eq "0" ]; then
            echo "⚠️ NO HAY USUARIOS - REINICIALIZANDO BASE DE DATOS..."
            
            # Eliminar todas las tablas y reinicializar
            psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
            psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/00_gmarm_completo.sql
            echo "✅ Base de datos reinicializada con éxito"
        fi
    fi
fi

echo "🎉 VERIFICACIÓN COMPLETADA - BASE DE DATOS LISTA"

exit 0


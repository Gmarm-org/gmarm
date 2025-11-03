#!/bin/bash
set -e

echo "🚀 ENTRYPOINT PERSONALIZADO DE POSTGRESQL"
echo "=========================================="

# Ejecutar el entrypoint original de PostgreSQL
docker-entrypoint.sh postgres &
POSTGRES_PID=$!

# Esperar a que PostgreSQL esté listo
echo "⏳ Esperando a que PostgreSQL esté listo..."
until pg_isready -U "$POSTGRES_USER"; do
    sleep 1
done
echo "✅ PostgreSQL está listo"

# Verificar si la base de datos existe
echo "🔍 Verificando si la base de datos '$POSTGRES_DB' existe..."
DB_EXISTS=$(psql -U "$POSTGRES_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$POSTGRES_DB'" || echo "0")

if [ "$DB_EXISTS" != "1" ]; then
    echo "❌ BASE DE DATOS NO EXISTE - CREANDO..."
    
    # Crear la base de datos
    psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE $POSTGRES_DB WITH ENCODING='UTF8' LC_COLLATE='C' LC_CTYPE='C';"
    echo "✅ Base de datos '$POSTGRES_DB' creada"
    
    # Ejecutar el script SQL maestro
    if [ -f /docker-entrypoint-initdb.d/00_gmarm_completo.sql ]; then
        echo "📊 Ejecutando script SQL maestro..."
        psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/00_gmarm_completo.sql
        echo "✅ Script SQL ejecutado exitosamente"
    else
        echo "⚠️ Script SQL no encontrado"
    fi
else
    echo "✅ Base de datos '$POSTGRES_DB' existe"
    
    # Verificar si tiene datos
    TABLE_COUNT=$(psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" || echo "0")
    
    if [ "$TABLE_COUNT" -eq "0" ]; then
        echo "⚠️ BASE DE DATOS VACÍA - INICIALIZANDO..."
        
        if [ -f /docker-entrypoint-initdb.d/00_gmarm_completo.sql ]; then
            psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/00_gmarm_completo.sql
            echo "✅ Base de datos inicializada"
        fi
    else
        echo "✅ Base de datos tiene $TABLE_COUNT tablas"
        
        # Verificar datos críticos
        USUARIO_COUNT=$(psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT COUNT(*) FROM usuario;" 2>/dev/null || echo "0")
        
        if [ "$USUARIO_COUNT" -eq "0" ]; then
            echo "⚠️ NO HAY USUARIOS - REINICIALIZANDO..."
            psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
            psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/00_gmarm_completo.sql
            echo "✅ Base de datos reinicializada"
        else
            echo "✅ Base de datos operativa ($USUARIO_COUNT usuarios)"
        fi
    fi
fi

echo "🎉 INICIALIZACIÓN COMPLETADA"
echo "=========================================="

# Mantener el proceso de PostgreSQL en primer plano
wait $POSTGRES_PID


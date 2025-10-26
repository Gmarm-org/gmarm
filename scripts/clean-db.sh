#!/bin/bash
# =====================================================
# Script para limpiar completamente la base de datos
# Solo para desarrollo - NUNCA usar en producción
# =====================================================

echo "⚠️  ADVERTENCIA: Este script eliminará TODOS los datos de la base de datos"
echo "¿Estás seguro? (y/N)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "🧹 Limpiando base de datos completamente..."
    
    # Configurar variables
    CONTAINER_NAME="gmarm-postgres-local"
    DB_NAME="gmarm_dev"
    DB_USER="postgres"
    
    # Verificar que el contenedor esté ejecutándose
    if ! docker ps --filter "name=$CONTAINER_NAME" --format "{{.Status}}" | grep -q "Up"; then
        echo "❌ Error: El contenedor $CONTAINER_NAME no está ejecutándose"
        exit 1
    fi
    
    # Eliminar completamente el esquema
    docker exec -it $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
    
    if [ $? -eq 0 ]; then
        echo "✅ Base de datos limpiada completamente"
        echo "📊 Todas las tablas, datos y claves primarias han sido eliminados"
    else
        echo "❌ Error al limpiar la base de datos"
        exit 1
    fi
else
    echo "❌ Operación cancelada"
fi

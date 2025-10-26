#!/bin/bash
# =====================================================
# Script para aplicar migraciones a la base de datos
# Usar para cambios incrementales después de la primera inicialización
# =====================================================

echo "🔄 Aplicando migraciones a la base de datos..."

# Configurar variables
CONTAINER_NAME="gmarm-postgres-local"
DB_NAME="gmarm_dev"
DB_USER="postgres"

# Verificar que el contenedor esté ejecutándose
if ! docker ps --filter "name=$CONTAINER_NAME" --format "{{.Status}}" | grep -q "Up"; then
    echo "❌ Error: El contenedor $CONTAINER_NAME no está ejecutándose"
    exit 1
fi

# Verificar si existe el archivo de migración
MIGRATION_FILE="datos/migrations/$(date +%Y%m%d_%H%M%S)_migration.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ No se encontró archivo de migración: $MIGRATION_FILE"
    echo "📝 Crea el archivo de migración en: datos/migrations/"
    exit 1
fi

echo "📄 Aplicando migración: $MIGRATION_FILE"
cat "$MIGRATION_FILE" | docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME

if [ $? -eq 0 ]; then
    echo "✅ Migración aplicada correctamente"
else
    echo "❌ Error al aplicar la migración"
    exit 1
fi

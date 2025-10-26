#!/bin/bash
# =====================================================
# Script para inicializar la base de datos por PRIMERA VEZ
# Solo ejecutar una vez al configurar el entorno
# =====================================================

echo "🚀 Inicializando base de datos por primera vez..."

# Configurar variables
CONTAINER_NAME="gmarm-postgres-local"
DB_NAME="gmarm_dev"
DB_USER="postgres"

# Verificar que el contenedor esté ejecutándose
if ! docker ps --filter "name=$CONTAINER_NAME" --format "{{.Status}}" | grep -q "Up"; then
    echo "❌ Error: El contenedor $CONTAINER_NAME no está ejecutándose"
    exit 1
fi

echo "✅ Contenedor PostgreSQL encontrado"

# Limpiar la base de datos completamente (por si acaso)
echo "🧹 Limpiando base de datos..."
docker exec -it $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" 2>/dev/null

# Ejecutar el script SQL maestro con codificación UTF-8
echo "📄 Ejecutando script SQL maestro..."
cat "datos/00_gmarm_completo.sql" | docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME

if [ $? -eq 0 ]; then
    echo "✅ Base de datos inicializada correctamente"
    
    # Verificar que las preguntas se insertaron correctamente
    echo "🔍 Verificando preguntas..."
    docker exec -it $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "SELECT id, pregunta FROM pregunta_cliente ORDER BY id LIMIT 3;"
    
    echo "🎉 ¡Base de datos lista para desarrollo!"
    echo "📝 A partir de ahora, usa scripts de migración para cambios"
else
    echo "❌ Error al inicializar la base de datos"
    exit 1
fi

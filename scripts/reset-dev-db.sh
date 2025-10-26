#!/bin/bash

echo "🔄 Reseteando base de datos de desarrollo..."
echo "⚠️  ADVERTENCIA: Esto eliminará TODOS los datos de la BD de desarrollo"

# Detener servicios
echo "📦 Deteniendo servicios..."
docker compose -f docker-compose.dev.yml down

# Eliminar volumen de PostgreSQL para forzar recreación
echo "🗑️  Eliminando volumen de PostgreSQL..."
docker volume rm gmarm_postgres_data_dev 2>/dev/null || echo "Volumen no existe o ya fue eliminado"

# Limpiar imágenes huérfanas (opcional)
echo "🧹 Limpiando imágenes huérfanas..."
docker image prune -f

echo "✅ Base de datos reseteada. La próxima vez que ejecutes 'docker compose -f docker-compose.dev.yml up'"
echo "   se creará una BD limpia y se ejecutará el SQL maestro automáticamente."
echo ""
echo "🚀 Para levantar servicios con BD limpia:"
echo "   docker compose -f docker-compose.dev.yml up -d --build"
echo ""
echo "📝 Para ejecutar en Ubuntu Server:"
echo "   chmod +x scripts/reset-dev-db.sh"
echo "   ./scripts/reset-dev-db.sh"

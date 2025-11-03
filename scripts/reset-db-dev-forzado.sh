#!/bin/bash

# ==========================================================
# RESET FORZADO - Elimina TODO y empieza de CERO
# ==========================================================

set -e

echo "🔥 RESET FORZADO DE BASE DE DATOS DEV"
echo "=========================================="
echo ""

# 1. Detener y eliminar TODOS los contenedores gmarm
echo "🛑 Deteniendo contenedores..."
docker-compose -f docker-compose.dev.yml down -v --remove-orphans
echo ""

# 2. Eliminar contenedores manualmente (por si quedan zombies)
echo "🧹 Limpiando contenedores zombies..."
docker ps -a | grep gmarm | awk '{print $1}' | xargs -r docker rm -f 2>/dev/null || echo "  (No hay zombies)"
echo ""

# 3. Eliminar TODOS los volúmenes de postgres
echo "🗑️  Eliminando volúmenes de PostgreSQL..."
docker volume ls | grep postgres | awk '{print $2}' | xargs -r docker volume rm 2>/dev/null || echo "  (Volúmenes ya eliminados)"
echo ""

# 4. Limpiar sistema Docker
echo "🧹 Limpiando sistema Docker..."
docker system prune -f
echo ""

# 5. Levantar PostgreSQL
echo "🚀 Levantando PostgreSQL limpio..."
docker-compose -f docker-compose.dev.yml up -d postgres_dev
echo ""

# 6. Esperar
echo "⏳ Esperando a PostgreSQL..."
sleep 15

# Verificar con reintentos
for i in {1..30}; do
    if docker exec gmarm-postgres-dev pg_isready -U postgres > /dev/null 2>&1; then
        echo "✅ PostgreSQL listo"
        break
    fi
    sleep 2
done
echo ""

# 7. Verificar si la BD existe
echo "🔍 Verificando base de datos..."
DB_EXISTS=$(docker exec gmarm-postgres-dev psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='gmarm_dev';" 2>/dev/null | xargs || echo "0")

if [ "$DB_EXISTS" = "1" ]; then
    echo "⚠️  BD existe - eliminando..."
    docker exec gmarm-postgres-dev psql -U postgres -c "DROP DATABASE gmarm_dev;" 2>/dev/null || echo "  (No se pudo eliminar)"
fi

# 8. Crear BD limpia
echo "💾 Creando base de datos limpia..."
docker exec -i gmarm-postgres-dev psql -U postgres -c "CREATE DATABASE gmarm_dev WITH ENCODING='UTF8' LC_COLLATE='C' LC_CTYPE='C';"
echo "✅ Base de datos creada"
echo ""

# 9. Cargar datos
echo "📊 Cargando SQL maestro..."
docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev < datos/00_gmarm_completo.sql
echo "✅ Datos cargados"
echo ""

# 10. Verificar
echo "🔍 Verificando datos..."
USUARIOS=$(docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -tAc "SELECT COUNT(*) FROM usuario;" | xargs)
ARMAS=$(docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -tAc "SELECT COUNT(*) FROM arma;" | xargs)
echo "   Usuarios: $USUARIOS"
echo "   Armas: $ARMAS"
echo ""

# 11. Levantar backend y frontend
echo "🚀 Levantando backend y frontend..."
docker-compose -f docker-compose.dev.yml up -d
echo ""

# 12. Esperar
echo "⏳ Esperando 60 segundos..."
sleep 60

# 13. Verificar recursos
echo "📊 Uso de recursos:"
docker stats --no-stream
echo ""

# 14. Verificar endpoints
echo "🧪 Verificando endpoints..."
curl -f http://localhost:8080/api/health && echo "✅ Health OK" || echo "❌ Health FALLO"
curl -f http://localhost:8080/api/tipos-cliente/config > /dev/null 2>&1 && echo "✅ Tipos-cliente OK" || echo "❌ Tipos-cliente FALLO"
echo ""

echo "✅ RESET COMPLETADO"
echo ""
echo "Si PostgreSQL sigue en 99% memoria:"
echo "  → Servidor necesita más RAM o cambiar a MySQL"
echo ""

exit 0


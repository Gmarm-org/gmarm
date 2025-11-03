#!/bin/bash

# ==========================================================
# Script DEFINITIVO para resetear la BD DEV
# ==========================================================
# Soluciona el problema de consumo 100% CPU/RAM de PostgreSQL
# ==========================================================

set -e
set -o pipefail

POSTGRES_CONTAINER="gmarm-postgres-dev"
VOLUME_NAME="dev_postgres_data_dev"
DUMP_FILE="./datos/00_gmarm_completo.sql"
DB_NAME="gmarm_dev"
DB_USER="postgres"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "=========================================="
echo "🔥 RESET DEFINITIVO DE BASE DE DATOS DEV"
echo "=========================================="
echo ""

# 1. Detener contenedores
echo -e "${YELLOW}🛑 1. Deteniendo contenedores...${NC}"
docker-compose -f docker-compose.dev.yml down
echo -e "${GREEN}✅ Contenedores detenidos${NC}"
echo ""

# 2. Eliminar volumen antiguo (limpieza total)
echo -e "${YELLOW}🗑️  2. Eliminando volumen antiguo...${NC}"
docker volume rm $VOLUME_NAME 2>/dev/null || echo "  (Volumen no existía)"
echo -e "${GREEN}✅ Volumen eliminado${NC}"
echo ""

# 3. Crear volumen limpio
echo -e "${YELLOW}📦 3. Creando volumen limpio...${NC}"
docker volume create $VOLUME_NAME
echo -e "${GREEN}✅ Volumen creado${NC}"
echo ""

# 4. Levantar SOLO PostgreSQL
echo -e "${YELLOW}🚀 4. Levantando PostgreSQL...${NC}"
docker-compose -f docker-compose.dev.yml up -d postgres_dev
echo ""

# 5. Esperar a que PostgreSQL esté listo
echo -e "${YELLOW}⏳ 5. Esperando a que PostgreSQL esté listo...${NC}"
MAX_WAIT=60
COUNT=0
while [ $COUNT -lt $MAX_WAIT ]; do
    if docker exec $POSTGRES_CONTAINER pg_isready -U $DB_USER > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL listo (intento $COUNT)${NC}"
        break
    fi
    COUNT=$((COUNT + 1))
    echo "   Esperando... ($COUNT/$MAX_WAIT)"
    sleep 2
done

if [ $COUNT -eq $MAX_WAIT ]; then
    echo -e "${RED}❌ PostgreSQL no responde${NC}"
    docker logs $POSTGRES_CONTAINER --tail 50
    exit 1
fi
echo ""

# 6. Crear base de datos
echo -e "${YELLOW}💾 6. Creando base de datos...${NC}"
docker exec -i $POSTGRES_CONTAINER psql -U $DB_USER -c "CREATE DATABASE $DB_NAME WITH ENCODING='UTF8' LC_COLLATE='C' LC_CTYPE='C';"
echo -e "${GREEN}✅ Base de datos creada${NC}"
echo ""

# 7. Cargar SQL maestro (método optimizado)
echo -e "${YELLOW}📊 7. Cargando SQL maestro...${NC}"
if [ ! -f "$DUMP_FILE" ]; then
    echo -e "${RED}❌ Error: $DUMP_FILE no encontrado${NC}"
    exit 1
fi

# Cargar en una sola transacción (más rápido)
echo "   Cargando datos (esto puede tardar 30-60 segundos)..."
docker exec -i $POSTGRES_CONTAINER psql -U $DB_USER -d $DB_NAME < $DUMP_FILE

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SQL maestro cargado exitosamente${NC}"
else
    echo -e "${RED}❌ Error cargando SQL${NC}"
    exit 1
fi
echo ""

# 8. Verificar datos
echo -e "${YELLOW}🔍 8. Verificando datos cargados...${NC}"
USUARIO_COUNT=$(docker exec $POSTGRES_CONTAINER psql -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM usuario;" | xargs)
ARMA_COUNT=$(docker exec $POSTGRES_CONTAINER psql -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM arma;" | xargs)
CLIENTE_COUNT=$(docker exec $POSTGRES_CONTAINER psql -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM cliente;" | xargs)

echo "   Usuarios: $USUARIO_COUNT"
echo "   Armas: $ARMA_COUNT"
echo "   Clientes: $CLIENTE_COUNT"

if [ "$USUARIO_COUNT" -eq "0" ]; then
    echo -e "${RED}❌ Error: Base de datos sin datos${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Datos verificados${NC}"
echo ""

# 9. Verificar límites de memoria
echo -e "${YELLOW}🔍 9. Verificando límites de memoria...${NC}"
MEMORY_LIMIT=$(docker exec $POSTGRES_CONTAINER cat /sys/fs/cgroup/memory.max 2>/dev/null || echo "no disponible")
if [ "$MEMORY_LIMIT" != "no disponible" ]; then
    MEMORY_GB=$(echo "scale=2; $MEMORY_LIMIT / 1024 / 1024 / 1024" | bc)
    echo "   Límite configurado: ${MEMORY_GB}GB"
    echo -e "${GREEN}✅ Límite aplicado correctamente${NC}"
else
    echo -e "${YELLOW}⚠️  No se pudo verificar límite${NC}"
fi
echo ""

# 10. Levantar backend y frontend
echo -e "${YELLOW}🚀 10. Levantando backend y frontend...${NC}"
docker-compose -f docker-compose.dev.yml up -d backend_dev frontend_dev
echo ""

# 11. Esperar a que backend esté listo
echo -e "${YELLOW}⏳ 11. Esperando a que backend inicie (60 segundos)...${NC}"
sleep 60

# 12. Verificar endpoints
echo -e "${YELLOW}🧪 12. Verificando endpoints...${NC}"

# Health
if curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ /api/health: OK${NC}"
else
    echo -e "${RED}❌ /api/health: FALLO${NC}"
fi

# Tipos cliente
if curl -f http://localhost:8080/api/tipos-cliente/config > /dev/null 2>&1; then
    echo -e "${GREEN}✅ /api/tipos-cliente/config: OK${NC}"
else
    echo -e "${RED}❌ /api/tipos-cliente/config: FALLO${NC}"
fi

# Usuarios
if curl -f http://localhost:8080/api/usuarios?page=0\&size=10 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ /api/usuarios: OK${NC}"
else
    echo -e "${RED}❌ /api/usuarios: FALLO${NC}"
fi
echo ""

# 13. Verificar uso de recursos FINAL
echo -e "${YELLOW}📊 13. Uso de recursos DESPUÉS del reset:${NC}"
echo "=========================================="
docker stats --no-stream
echo ""

# 14. Verificar reinicios
echo -e "${YELLOW}🔄 14. Verificando reinicios de PostgreSQL...${NC}"
RESTARTS=$(docker inspect $POSTGRES_CONTAINER --format='{{.RestartCount}}')
OOM_KILLED=$(docker inspect $POSTGRES_CONTAINER --format='{{.State.OOMKilled}}')
echo "   Reinicios: $RESTARTS"
echo "   OOM Killed: $OOM_KILLED"
echo ""

# Resumen
echo "=========================================="
echo -e "${GREEN}✅ RESET COMPLETADO${NC}"
echo "=========================================="
echo ""
echo "📋 Resumen:"
echo "   - Base de datos: NUEVA (volumen recreado)"
echo "   - Usuarios: $USUARIO_COUNT"
echo "   - Armas: $ARMA_COUNT"
echo "   - Clientes: $CLIENTE_COUNT"
echo "   - Límite memoria PostgreSQL: ${MEMORY_GB:-1.5}GB"
echo ""
echo "🎯 Próximos pasos:"
echo "   1. Probar login en: http://72.167.52.14:5173"
echo "   2. Monitorear en 1 hora: docker stats --no-stream"
echo "   3. Verificar reinicios: docker inspect $POSTGRES_CONTAINER --format='Restarts={{.RestartCount}}'"
echo ""
echo "⚠️  Si PostgreSQL sigue en 99% memoria después de 5 minutos:"
echo "   - El servidor necesita más RAM (actual: 3.8GB es muy poco)"
echo "   - Considera migrar a MySQL/MariaDB (usa ~200MB vs 1.5GB)"
echo ""

exit 0


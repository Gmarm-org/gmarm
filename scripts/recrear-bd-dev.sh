#!/bin/bash

# 🔧 SCRIPT: Recrear Base de Datos DEV
# Fecha: 2025-11-10
# Uso: bash recrear-bd-dev.sh

set -e

echo "========================================="
echo "🔧 RECREAR BASE DE DATOS - DEV"
echo "========================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directorio del proyecto
PROJECT_DIR="$HOME/deploy/dev"

# Verificar que estamos en el directorio correcto
if [ ! -f "$PROJECT_DIR/docker-compose.dev.yml" ]; then
  echo -e "${RED}❌ ERROR: No se encuentra docker-compose.dev.yml${NC}"
  echo "   Ejecuta desde: $PROJECT_DIR"
  exit 1
fi

cd "$PROJECT_DIR"

echo -e "${YELLOW}⏹️  Paso 1: Deteniendo servicios actuales...${NC}"
docker-compose -f docker-compose.dev.yml down
echo -e "${GREEN}✅ Servicios detenidos${NC}"
echo ""

echo -e "${YELLOW}🗑️  Paso 2: Eliminando volúmenes antiguos...${NC}"
docker-compose -f docker-compose.dev.yml down -v
echo -e "${GREEN}✅ Volúmenes eliminados${NC}"
echo ""

echo -e "${YELLOW}🚀 Paso 3: Levantando servicios con docker-compose actualizado...${NC}"
echo "   (PostgreSQL: 2GB, Backend: 512MB, Frontend: 512MB)"
docker-compose -f docker-compose.dev.yml up -d
echo -e "${GREEN}✅ Servicios iniciados${NC}"
echo ""

echo -e "${YELLOW}⏳ Paso 4: Esperando a que PostgreSQL inicie (60 segundos)...${NC}"
sleep 60
echo -e "${GREEN}✅ Espera completada${NC}"
echo ""

echo -e "${YELLOW}🔍 Paso 5: Verificando estado de PostgreSQL...${NC}"
docker exec gmarm-postgres-dev pg_isready -U postgres
echo -e "${GREEN}✅ PostgreSQL está listo${NC}"
echo ""

echo -e "${YELLOW}🗄️  Paso 6: Verificando si BD existe...${NC}"
DB_EXISTS=$(docker exec gmarm-postgres-dev psql -U postgres -lqt | cut -d \| -f 1 | grep -w gmarm_dev || true)

if [ -z "$DB_EXISTS" ]; then
  echo -e "${YELLOW}⚠️  Base de datos 'gmarm_dev' NO existe, creando...${NC}"
  docker exec gmarm-postgres-dev psql -U postgres -c \
    "CREATE DATABASE gmarm_dev WITH ENCODING='UTF8' LC_COLLATE='C' LC_CTYPE='C';"
  echo -e "${GREEN}✅ Base de datos creada${NC}"
else
  echo -e "${GREEN}✅ Base de datos 'gmarm_dev' ya existe${NC}"
fi

echo ""
echo -e "${YELLOW}📜 Paso 7: Ejecutando script maestro...${NC}"
if [ -f "$PROJECT_DIR/datos/00_gmarm_completo.sql" ]; then
  cat "$PROJECT_DIR/datos/00_gmarm_completo.sql" | \
    docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev
  echo -e "${GREEN}✅ Script maestro ejecutado${NC}"
else
  echo -e "${RED}❌ ERROR: No se encuentra 00_gmarm_completo.sql${NC}"
  exit 1
fi

echo ""
echo -e "${YELLOW}🔍 Paso 8: Verificando datos en la BD...${NC}"
USER_COUNT=$(docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -tAc "SELECT COUNT(*) FROM usuario;" || echo "0")
echo "   Usuarios en BD: $USER_COUNT"

if [ "$USER_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✅ Datos cargados correctamente${NC}"
else
  echo -e "${RED}⚠️  ADVERTENCIA: No se encontraron usuarios en la BD${NC}"
fi

echo ""
echo -e "${YELLOW}🔍 Paso 9: Verificando estado de servicios...${NC}"
docker-compose -f docker-compose.dev.yml ps
echo ""

echo -e "${YELLOW}🔍 Paso 10: Verificando uso de memoria...${NC}"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
echo ""

echo "========================================="
echo "✅ RECREACIÓN COMPLETADA"
echo "========================================="
echo ""
echo -e "${GREEN}Frontend:${NC}  http://72.167.52.14:5173"
echo -e "${GREEN}Backend:${NC}   http://72.167.52.14:8080"
echo -e "${GREEN}PostgreSQL:${NC} localhost:5432"
echo ""
echo -e "${YELLOW}📝 SIGUIENTE PASO:${NC}"
echo "   Ejecutar diagnóstico: bash scripts/diagnostico-dev.sh"
echo ""


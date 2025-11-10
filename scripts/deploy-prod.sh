#!/bin/bash

# 🚀 SCRIPT DE DESPLIEGUE A PRODUCCIÓN
# Fecha: 2025-11-10
# Uso: bash scripts/deploy-prod.sh

set -e

echo "========================================"
echo "🚀 DESPLIEGUE A PRODUCCIÓN - GMARM"
echo "========================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.prod.yml" ]; then
  echo -e "${RED}❌ ERROR: docker-compose.prod.yml no encontrado${NC}"
  echo "   Ejecuta desde el directorio raíz del proyecto"
  exit 1
fi

# Verificar que .env existe
if [ ! -f ".env" ]; then
  echo -e "${RED}❌ ERROR: Archivo .env no encontrado${NC}"
  echo "   Crea .env desde .env.prod.example"
  exit 1
fi

echo -e "${YELLOW}📋 Verificando requisitos...${NC}"
echo ""

# Verificar Docker
if ! command -v docker &> /dev/null; then
  echo -e "${RED}❌ Docker no está instalado${NC}"
  exit 1
fi

# Verificar Docker Compose
if ! command -v docker-compose &> /dev/null; then
  echo -e "${RED}❌ Docker Compose no está instalado${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Docker y Docker Compose instalados${NC}"
echo ""

# Verificar que estamos en branch main
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
  echo -e "${YELLOW}⚠️  WARNING: No estás en branch main${NC}"
  echo "   Branch actual: $BRANCH"
  read -p "¿Deseas continuar de todos modos? (s/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
    echo -e "${RED}❌ Despliegue cancelado${NC}"
    exit 1
  fi
fi

echo -e "${YELLOW}⏹️  Paso 1: Deteniendo ambiente DEV (si existe)...${NC}"
if docker ps | grep -q "gmarm-.*-dev"; then
  docker-compose -f docker-compose.dev.yml down
  echo -e "${GREEN}✅ Ambiente DEV detenido${NC}"
else
  echo -e "${GREEN}✅ Ambiente DEV no está corriendo${NC}"
fi
echo ""

echo -e "${YELLOW}💾 Paso 2: Backup de base de datos (si existe)...${NC}"
if docker ps | grep -q "gmarm-postgres-prod"; then
  BACKUP_DIR="backups"
  mkdir -p "$BACKUP_DIR"
  BACKUP_FILE="$BACKUP_DIR/backup-pre-deploy-$(date +%Y%m%d-%H%M%S).sql"
  
  echo "   Creando backup en: $BACKUP_FILE"
  docker exec gmarm-postgres-prod pg_dump -U postgres -d gmarm_prod > "$BACKUP_FILE"
  
  if [ -f "$BACKUP_FILE" ]; then
    echo -e "${GREEN}✅ Backup creado exitosamente${NC}"
    echo "   Tamaño: $(du -h $BACKUP_FILE | cut -f1)"
  else
    echo -e "${RED}❌ Error creando backup${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}⚠️  PostgreSQL prod no está corriendo - saltando backup${NC}"
fi
echo ""

echo -e "${YELLOW}🔄 Paso 3: Pull de cambios desde main...${NC}"
git pull origin main
echo -e "${GREEN}✅ Código actualizado${NC}"
echo ""

echo -e "${YELLOW}🔧 Paso 4: Verificando variables de entorno...${NC}"
# Verificar variables críticas
MISSING_VARS=()

if [ -z "$POSTGRES_PASSWORD" ]; then
  MISSING_VARS+=("POSTGRES_PASSWORD")
fi

if [ -z "$JWT_SECRET" ]; then
  MISSING_VARS+=("JWT_SECRET")
fi

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo -e "${RED}❌ Variables de entorno faltantes:${NC}"
  for var in "${MISSING_VARS[@]}"; do
    echo "   - $var"
  done
  echo ""
  echo "   Configura estas variables en .env"
  exit 1
fi

echo -e "${GREEN}✅ Variables de entorno configuradas${NC}"
echo ""

echo -e "${YELLOW}🏗️  Paso 5: Construyendo imágenes Docker...${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache
echo -e "${GREEN}✅ Imágenes construidas${NC}"
echo ""

echo -e "${YELLOW}🚀 Paso 6: Levantando servicios de producción...${NC}"
docker-compose -f docker-compose.prod.yml up -d
echo -e "${GREEN}✅ Servicios iniciados${NC}"
echo ""

echo -e "${YELLOW}⏳ Paso 7: Esperando a que los servicios estén listos (60 segundos)...${NC}"
sleep 60
echo -e "${GREEN}✅ Espera completada${NC}"
echo ""

echo -e "${YELLOW}🔍 Paso 8: Verificando estado de servicios...${NC}"
docker-compose -f docker-compose.prod.yml ps
echo ""

echo -e "${YELLOW}🏥 Paso 9: Health check del backend...${NC}"
HEALTH_CHECK=$(curl -s http://localhost:8080/api/health || echo "FAIL")

if echo "$HEALTH_CHECK" | grep -q "UP"; then
  echo -e "${GREEN}✅ Backend responde correctamente${NC}"
  echo "   $HEALTH_CHECK"
else
  echo -e "${RED}❌ Backend no responde${NC}"
  echo "   Verifica los logs: docker-compose -f docker-compose.prod.yml logs backend"
  exit 1
fi
echo ""

echo -e "${YELLOW}🗄️  Paso 10: Verificando base de datos...${NC}"
DB_CHECK=$(docker exec gmarm-postgres-prod psql -U postgres -d gmarm_prod -tAc "SELECT COUNT(*) FROM usuario;" 2>/dev/null || echo "0")

if [ "$DB_CHECK" -gt 0 ]; then
  echo -e "${GREEN}✅ Base de datos con datos (Usuarios: $DB_CHECK)${NC}"
else
  echo -e "${RED}❌ Base de datos vacía o inaccesible${NC}"
  exit 1
fi
echo ""

echo -e "${YELLOW}📊 Paso 11: Uso de recursos...${NC}"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
echo ""

echo "========================================"
echo -e "${GREEN}✅ DESPLIEGUE COMPLETADO EXITOSAMENTE${NC}"
echo "========================================"
echo ""
echo -e "${GREEN}🌐 URLS DE PRODUCCIÓN:${NC}"
echo "   Frontend:  http://$(hostname -I | awk '{print $1}'):80"
echo "   Backend:   http://$(hostname -I | awk '{print $1}'):8080"
echo "   Health:    http://$(hostname -I | awk '{print $1}'):8080/api/health"
echo ""
echo -e "${YELLOW}📝 SIGUIENTES PASOS:${NC}"
echo "   1. Verifica que la aplicación funcione correctamente"
echo "   2. Prueba login y funcionalidades críticas"
echo "   3. Monitorea logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   4. Configura backup automático: bash scripts/setup-backup.sh"
echo ""
echo -e "${YELLOW}🔄 ROLLBACK (si algo falla):${NC}"
echo "   bash scripts/rollback-prod.sh $BACKUP_FILE"
echo ""


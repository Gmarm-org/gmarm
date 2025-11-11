#!/bin/bash

# 🚀 SCRIPT DE DEPLOYMENT - Llamado por GitHub Actions
# Fecha: 2025-11-10
# Este script es llamado automáticamente por CI/CD

set -e

echo "========================================"
echo "🚀 DEPLOYMENT AUTOMÁTICO - GMARM"
echo "========================================"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Detectar ambiente basado en el directorio actual
CURRENT_DIR=$(pwd)
if [[ "$CURRENT_DIR" == *"/deploy/prod"* ]]; then
  ENV="production"
  COMPOSE_FILE="docker-compose.prod.yml"
elif [[ "$CURRENT_DIR" == *"/deploy/dev"* ]]; then
  ENV="development"
  COMPOSE_FILE="docker-compose.dev.yml"
else
  echo -e "${RED}❌ ERROR: Directorio no reconocido${NC}"
  exit 1
fi

echo -e "${YELLOW}🌍 Ambiente detectado: $ENV${NC}"
echo -e "${YELLOW}🐳 Compose file: $COMPOSE_FILE${NC}"
echo ""

# 🔒 PROTEGER .env ANTES DE CUALQUIER OPERACIÓN GIT
echo -e "${YELLOW}🔒 Paso 0: Protegiendo archivo .env...${NC}"

if [ -f ".env" ]; then
  # Hacer backup temporal del .env
  cp .env .env.backup
  echo -e "${GREEN}✅ Backup de .env creado (.env.backup)${NC}"
  ENV_EXISTED=true
else
  echo -e "${YELLOW}⚠️  Archivo .env no existe (primera vez)${NC}"
  ENV_EXISTED=false
fi

# Verificar que el compose file existe
if [ ! -f "$COMPOSE_FILE" ]; then
  echo -e "${RED}❌ ERROR: $COMPOSE_FILE no encontrado${NC}"
  exit 1
fi

# PRODUCCIÓN: Verificar que .env existe o existió
if [ "$ENV" = "production" ]; then
  if [ "$ENV_EXISTED" = false ]; then
    echo -e "${RED}❌ ERROR: Archivo .env no encontrado en producción${NC}"
    echo "   Crea .env desde env.prod.example"
    exit 1
  fi
  echo -e "${GREEN}✅ Archivo .env protegido${NC}"
fi

echo ""

# 🔒 RESTAURAR .env SI EXISTÍA (después de git operations)
if [ "$ENV_EXISTED" = true ] && [ -f ".env.backup" ]; then
  echo -e "${YELLOW}🔒 Restaurando .env protegido...${NC}"
  cp .env.backup .env
  chmod 600 .env
  echo -e "${GREEN}✅ Archivo .env restaurado y protegido${NC}"
  echo ""
fi

echo -e "${YELLOW}💾 Paso 1: Backup pre-deployment (si aplica)...${NC}"

if [ "$ENV" = "production" ]; then
  # Crear backup solo si PostgreSQL está corriendo
  if docker ps | grep -q "gmarm-postgres-prod"; then
    mkdir -p backups
    BACKUP_FILE="backups/pre-deploy-$(date +%Y%m%d-%H%M%S).sql"
    
    echo "   Creando backup en: $BACKUP_FILE"
    docker exec gmarm-postgres-prod pg_dump -U postgres -d gmarm_prod > "$BACKUP_FILE" 2>/dev/null || true
    
    if [ -f "$BACKUP_FILE" ]; then
      gzip "$BACKUP_FILE"
      echo -e "${GREEN}✅ Backup creado: ${BACKUP_FILE}.gz${NC}"
    else
      echo -e "${YELLOW}⚠️  No se pudo crear backup (puede ser primera vez)${NC}"
    fi
  else
    echo -e "${YELLOW}⚠️  PostgreSQL no está corriendo - saltando backup${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Ambiente DEV - saltando backup${NC}"
fi

echo ""
echo -e "${YELLOW}🐳 Paso 2: Reconstruyendo y levantando servicios...${NC}"

# Detener servicios actuales
docker-compose -f "$COMPOSE_FILE" down

# Construir y levantar con nuevos límites
docker-compose -f "$COMPOSE_FILE" up -d --build --remove-orphans

echo -e "${GREEN}✅ Servicios iniciados${NC}"
echo ""

echo -e "${YELLOW}⏳ Paso 3: Esperando a que servicios estén listos...${NC}"
sleep 60
echo -e "${GREEN}✅ Espera completada${NC}"
echo ""

echo -e "${YELLOW}🔍 Paso 4: Verificando servicios...${NC}"
docker-compose -f "$COMPOSE_FILE" ps
echo ""

echo -e "${YELLOW}🏥 Paso 5: Health check...${NC}"

# Detectar puerto del backend según ambiente
if [ "$ENV" = "production" ]; then
  BACKEND_PORT=8080
else
  BACKEND_PORT=8080
fi

HEALTH_URL="http://localhost:$BACKEND_PORT/api/health"
HEALTH_CHECK=$(curl -s "$HEALTH_URL" 2>/dev/null || echo "FAIL")

if echo "$HEALTH_CHECK" | grep -q "UP"; then
  echo -e "${GREEN}✅ Backend respondiendo correctamente${NC}"
  echo "   Response: $HEALTH_CHECK"
else
  echo -e "${RED}⚠️  Backend no responde (puede necesitar más tiempo)${NC}"
  echo "   Verifica logs: docker-compose -f $COMPOSE_FILE logs backend"
fi

echo ""
echo -e "${YELLOW}📊 Paso 6: Uso de recursos...${NC}"
docker stats --no-stream
echo ""

echo "========================================"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETADO${NC}"
echo "========================================"
echo ""
echo -e "${YELLOW}📝 Logs disponibles en:${NC}"
echo "   docker-compose -f $COMPOSE_FILE logs -f"
echo ""

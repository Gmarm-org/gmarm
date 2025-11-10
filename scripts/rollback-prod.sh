#!/bin/bash

# 🔄 SCRIPT DE ROLLBACK DE PRODUCCIÓN
# Fecha: 2025-11-10
# Uso: bash scripts/rollback-prod.sh [backup_file]

set -e

echo "========================================"
echo "🔄 ROLLBACK DE PRODUCCIÓN - GMARM"
echo "========================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verificar que se proporcionó un archivo de backup
if [ -z "$1" ]; then
  echo -e "${RED}❌ ERROR: Debes especificar un archivo de backup${NC}"
  echo ""
  echo "Uso: bash scripts/rollback-prod.sh [backup_file]"
  echo ""
  echo "Backups disponibles:"
  ls -lt backups/gmarm-prod-*.sql.gz | head -10
  exit 1
fi

BACKUP_FILE="$1"

# Verificar que el archivo existe
if [ ! -f "$BACKUP_FILE" ]; then
  echo -e "${RED}❌ ERROR: Archivo de backup no encontrado: $BACKUP_FILE${NC}"
  exit 1
fi

echo -e "${YELLOW}⚠️  ADVERTENCIA: Esto restaurará la base de datos al estado del backup${NC}"
echo "   Backup: $BACKUP_FILE"
echo "   Tamaño: $(du -h $BACKUP_FILE | cut -f1)"
echo ""
read -p "¿Estás SEGURO de que deseas continuar? (escribe 'SI' para confirmar): " -r
echo

if [ "$REPLY" != "SI" ]; then
  echo -e "${RED}❌ Rollback cancelado${NC}"
  exit 1
fi

echo ""
echo -e "${YELLOW}💾 Paso 1: Creando backup de seguridad antes del rollback...${NC}"
SAFETY_BACKUP="backups/safety-pre-rollback-$(date +%Y%m%d-%H%M%S).sql"
docker exec gmarm-postgres-prod pg_dump -U postgres -d gmarm_prod > "$SAFETY_BACKUP"
gzip "$SAFETY_BACKUP"
echo -e "${GREEN}✅ Backup de seguridad creado: ${SAFETY_BACKUP}.gz${NC}"
echo ""

echo -e "${YELLOW}⏹️  Paso 2: Deteniendo servicios...${NC}"
docker-compose -f docker-compose.prod.yml stop backend frontend
echo -e "${GREEN}✅ Servicios detenidos${NC}"
echo ""

echo -e "${YELLOW}🗑️  Paso 3: Eliminando base de datos actual...${NC}"
docker exec gmarm-postgres-prod psql -U postgres -c "DROP DATABASE IF EXISTS gmarm_prod;"
echo -e "${GREEN}✅ Base de datos eliminada${NC}"
echo ""

echo -e "${YELLOW}🔧 Paso 4: Recreando base de datos...${NC}"
docker exec gmarm-postgres-prod psql -U postgres -c \
  "CREATE DATABASE gmarm_prod WITH ENCODING='UTF8' LC_COLLATE='C' LC_CTYPE='C';"
echo -e "${GREEN}✅ Base de datos recreada${NC}"
echo ""

echo -e "${YELLOW}📥 Paso 5: Restaurando backup...${NC}"

# Descomprimir si es necesario
if [[ "$BACKUP_FILE" == *.gz ]]; then
  echo "   Descomprimiendo backup..."
  TEMP_FILE="/tmp/restore-temp.sql"
  gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
  cat "$TEMP_FILE" | docker exec -i gmarm-postgres-prod psql -U postgres -d gmarm_prod
  rm "$TEMP_FILE"
else
  cat "$BACKUP_FILE" | docker exec -i gmarm-postgres-prod psql -U postgres -d gmarm_prod
fi

echo -e "${GREEN}✅ Backup restaurado${NC}"
echo ""

echo -e "${YELLOW}🚀 Paso 6: Reiniciando servicios...${NC}"
docker-compose -f docker-compose.prod.yml start backend frontend
echo -e "${GREEN}✅ Servicios reiniciados${NC}"
echo ""

echo -e "${YELLOW}⏳ Paso 7: Esperando a que servicios estén listos (30 segundos)...${NC}"
sleep 30
echo ""

echo -e "${YELLOW}🔍 Paso 8: Verificando datos restaurados...${NC}"
USER_COUNT=$(docker exec gmarm-postgres-prod psql -U postgres -d gmarm_prod -tAc "SELECT COUNT(*) FROM usuario;")
echo "   Usuarios en BD: $USER_COUNT"
echo -e "${GREEN}✅ Datos verificados${NC}"
echo ""

echo "========================================"
echo -e "${GREEN}✅ ROLLBACK COMPLETADO${NC}"
echo "========================================"
echo ""
echo -e "${YELLOW}📝 SIGUIENTES PASOS:${NC}"
echo "   1. Verifica que la aplicación funcione"
echo "   2. Prueba login y funcionalidades críticas"
echo "   3. Si todo está OK, puedes eliminar el backup de seguridad:"
echo "      rm ${SAFETY_BACKUP}.gz"
echo ""
echo -e "${YELLOW}⚠️  SI ALGO FALLÓ:${NC}"
echo "   Puedes volver al estado anterior con:"
echo "   bash scripts/rollback-prod.sh ${SAFETY_BACKUP}.gz"
echo ""


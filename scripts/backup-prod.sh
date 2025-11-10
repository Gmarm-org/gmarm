#!/bin/bash

# 💾 SCRIPT DE BACKUP DE PRODUCCIÓN
# Fecha: 2025-11-10
# Uso: bash scripts/backup-prod.sh

set -e

echo "========================================"
echo "💾 BACKUP DE PRODUCCIÓN - GMARM"
echo "========================================"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuración
BACKUP_DIR="backups"
RETENTION_DAYS=30  # Mantener backups por 30 días
CONTAINER_NAME="gmarm-postgres-prod"
DB_NAME="gmarm_prod"
DB_USER="postgres"

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

# Verificar que PostgreSQL esté corriendo
if ! docker ps | grep -q "$CONTAINER_NAME"; then
  echo -e "${RED}❌ PostgreSQL no está corriendo${NC}"
  exit 1
fi

# Nombre del archivo de backup
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/gmarm-prod-$TIMESTAMP.sql"
BACKUP_FILE_GZ="$BACKUP_FILE.gz"

echo -e "${YELLOW}📦 Creando backup...${NC}"
echo "   Base de datos: $DB_NAME"
echo "   Archivo: $BACKUP_FILE_GZ"
echo ""

# Crear backup
docker exec $CONTAINER_NAME pg_dump -U $DB_USER -d $DB_NAME > "$BACKUP_FILE"

# Verificar que el backup se creó
if [ ! -f "$BACKUP_FILE" ]; then
  echo -e "${RED}❌ Error creando backup${NC}"
  exit 1
fi

# Comprimir backup
gzip "$BACKUP_FILE"

if [ ! -f "$BACKUP_FILE_GZ" ]; then
  echo -e "${RED}❌ Error comprimiendo backup${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Backup creado exitosamente${NC}"
echo "   Tamaño: $(du -h $BACKUP_FILE_GZ | cut -f1)"
echo ""

# Limpiar backups antiguos
echo -e "${YELLOW}🧹 Limpiando backups antiguos (> $RETENTION_DAYS días)...${NC}"
DELETED_COUNT=$(find "$BACKUP_DIR" -name "gmarm-prod-*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)

if [ "$DELETED_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✅ $DELETED_COUNT backups antiguos eliminados${NC}"
else
  echo -e "${GREEN}✅ No hay backups antiguos para eliminar${NC}"
fi
echo ""

# Listar últimos 10 backups
echo -e "${YELLOW}📋 Últimos backups disponibles:${NC}"
ls -lht "$BACKUP_DIR"/gmarm-prod-*.sql.gz | head -10
echo ""

echo "========================================"
echo -e "${GREEN}✅ BACKUP COMPLETADO${NC}"
echo "========================================"
echo ""
echo -e "${YELLOW}📝 Para restaurar este backup:${NC}"
echo "   bash scripts/restore-backup.sh $BACKUP_FILE_GZ"
echo ""


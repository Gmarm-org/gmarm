#!/bin/bash

# 🔄 RESTAURAR BACKUP DE PRODUCCIÓN
# Fecha: 2025-11-10
# Uso: bash scripts/restore-backup.sh [backup_file]

set -e

echo "========================================"
echo "🔄 RESTAURAR BACKUP - PRODUCCIÓN"
echo "========================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

CONTAINER_NAME="gmarm-postgres-prod"
DB_NAME="gmarm_prod"
DB_USER="postgres"

# Verificar argumento
if [ -z "$1" ]; then
  echo -e "${RED}❌ ERROR: Debes especificar un archivo de backup${NC}"
  echo ""
  echo "Uso: bash scripts/restore-backup.sh [backup_file]"
  echo ""
  echo "Backups disponibles (más recientes primero):"
  ls -lht backups/gmarm-prod-*.sql.gz 2>/dev/null | head -10 || echo "  No hay backups disponibles"
  exit 1
fi

BACKUP_FILE="$1"

# Verificar que el archivo existe
if [ ! -f "$BACKUP_FILE" ]; then
  echo -e "${RED}❌ ERROR: Archivo no encontrado: $BACKUP_FILE${NC}"
  exit 1
fi

# Verificar que PostgreSQL está corriendo
if ! docker ps | grep -q "$CONTAINER_NAME"; then
  echo -e "${RED}❌ ERROR: PostgreSQL no está corriendo${NC}"
  echo "   Inicia con: docker-compose -f docker-compose.prod.yml up -d postgres_prod"
  exit 1
fi

# Mostrar información del backup
echo -e "${YELLOW}📦 Información del backup:${NC}"
echo "   Archivo: $BACKUP_FILE"
echo "   Tamaño: $(du -h $BACKUP_FILE | cut -f1)"
echo "   Fecha: $(stat -c %y $BACKUP_FILE | cut -d'.' -f1)"
echo ""

# ADVERTENCIA FINAL
echo -e "${RED}⚠️  ⚠️  ⚠️  ADVERTENCIA ⚠️  ⚠️  ⚠️${NC}"
echo ""
echo "Esto ELIMINARÁ todos los datos actuales y los"
echo "reemplazará con los datos del backup."
echo ""
echo "TODOS los cambios desde el backup se PERDERÁN."
echo ""
read -p "¿Estás ABSOLUTAMENTE SEGURO? (escribe 'SI' para continuar): " -r
echo

if [ "$REPLY" != "SI" ]; then
  echo -e "${YELLOW}❌ Restauración cancelada${NC}"
  exit 0
fi

echo ""
echo -e "${YELLOW}💾 Paso 1: Creando backup de seguridad PRE-restauración...${NC}"
SAFETY_BACKUP="backups/safety-pre-restore-$(date +%Y%m%d-%H%M%S).sql"
docker exec $CONTAINER_NAME pg_dump -U $DB_USER -d $DB_NAME > "$SAFETY_BACKUP" 2>/dev/null || true
if [ -f "$SAFETY_BACKUP" ]; then
  gzip "$SAFETY_BACKUP"
  echo -e "${GREEN}✅ Backup de seguridad creado: ${SAFETY_BACKUP}.gz${NC}"
else
  echo -e "${YELLOW}⚠️  No se pudo crear backup de seguridad (BD puede estar vacía)${NC}"
fi
echo ""

echo -e "${YELLOW}⏹️  Paso 2: Deteniendo servicios backend y frontend...${NC}"
docker-compose -f docker-compose.prod.yml stop backend frontend
echo -e "${GREEN}✅ Servicios detenidos${NC}"
echo ""

echo -e "${YELLOW}🗑️  Paso 3: Eliminando base de datos actual...${NC}"
docker exec $CONTAINER_NAME psql -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME;"
echo -e "${GREEN}✅ Base de datos eliminada${NC}"
echo ""

echo -e "${YELLOW}🔧 Paso 4: Recreando base de datos limpia...${NC}"
docker exec $CONTAINER_NAME psql -U $DB_USER -c \
  "CREATE DATABASE $DB_NAME WITH ENCODING='UTF8' LC_COLLATE='C' LC_CTYPE='C';"
echo -e "${GREEN}✅ Base de datos recreada${NC}"
echo ""

echo -e "${YELLOW}📥 Paso 5: Restaurando datos del backup...${NC}"
echo "   (Esto puede tomar varios minutos para backups grandes)"

# Descomprimir y restaurar
if [[ "$BACKUP_FILE" == *.gz ]]; then
  echo "   Descomprimiendo..."
  gunzip -c "$BACKUP_FILE" | docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME
else
  cat "$BACKUP_FILE" | docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME
fi

echo -e "${GREEN}✅ Datos restaurados${NC}"
echo ""

echo -e "${YELLOW}🔍 Paso 6: Verificando datos restaurados...${NC}"

# Verificar tablas
TABLA_COUNT=$(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "   Tablas: $TABLA_COUNT"

# Verificar usuarios
USER_COUNT=$(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM usuario;" 2>/dev/null || echo "0")
echo "   Usuarios: $USER_COUNT"

# Verificar armas
ARMA_COUNT=$(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM arma;" 2>/dev/null || echo "0")
echo "   Armas: $ARMA_COUNT"

# Verificar clientes
CLIENTE_COUNT=$(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM cliente;" 2>/dev/null || echo "0")
echo "   Clientes: $CLIENTE_COUNT"

if [ "$USER_COUNT" -eq 0 ]; then
  echo -e "${RED}❌ ERROR: No hay usuarios en la BD restaurada${NC}"
  echo ""
  echo "Restaurando backup de seguridad..."
  gunzip -c "${SAFETY_BACKUP}.gz" | docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME
  exit 1
fi

echo -e "${GREEN}✅ Datos verificados correctamente${NC}"
echo ""

echo -e "${YELLOW}🚀 Paso 7: Reiniciando servicios...${NC}"
docker-compose -f docker-compose.prod.yml start backend frontend
echo -e "${GREEN}✅ Servicios reiniciados${NC}"
echo ""

echo -e "${YELLOW}⏳ Paso 8: Esperando a que servicios estén listos (30 segundos)...${NC}"
sleep 30
echo ""

echo -e "${YELLOW}🏥 Paso 9: Health check...${NC}"
HEALTH_CHECK=$(curl -s http://localhost:8080/api/health 2>/dev/null || echo "FAIL")
if echo "$HEALTH_CHECK" | grep -q "UP"; then
  echo -e "${GREEN}✅ Backend responde correctamente${NC}"
else
  echo -e "${RED}⚠️  Backend no responde (puede necesitar más tiempo)${NC}"
fi
echo ""

echo "========================================"
echo -e "${GREEN}✅ RESTAURACIÓN COMPLETADA${NC}"
echo "========================================"
echo ""
echo "📊 RESUMEN:"
echo "   Backup restaurado: $(basename $BACKUP_FILE)"
echo "   Tablas: $TABLA_COUNT"
echo "   Usuarios: $USER_COUNT"
echo "   Armas: $ARMA_COUNT"
echo "   Clientes: $CLIENTE_COUNT"
echo ""
echo -e "${YELLOW}📝 SIGUIENTES PASOS:${NC}"
echo "   1. Verifica que la aplicación funcione: http://$(hostname -I | awk '{print $1}'):80"
echo "   2. Prueba login con usuarios conocidos"
echo "   3. Verifica que los datos sean correctos"
echo ""
if [ -f "${SAFETY_BACKUP}.gz" ]; then
  echo -e "${YELLOW}🔄 ROLLBACK (si algo está mal):${NC}"
  echo "   bash scripts/restore-backup.sh ${SAFETY_BACKUP}.gz"
  echo ""
  echo -e "${YELLOW}🗑️  LIMPIAR (cuando confirmes que todo está OK):${NC}"
  echo "   rm ${SAFETY_BACKUP}.gz"
  echo ""
fi


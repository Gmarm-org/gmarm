#!/bin/bash

# 💾 SCRIPT DE BACKUP COMPLETO DE PRODUCCIÓN (BD + ARCHIVOS)
# Fecha: 2026-02-11
# Uso: bash scripts/backup-completo-prod.sh

set -e

echo "========================================"
echo "💾 BACKUP COMPLETO - GMARM PRODUCCIÓN"
echo "========================================"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuración
BACKUP_DIR="backups"
RETENTION_DAYS=60
CONTAINER_NAME="gmarm-postgres-prod"
DB_NAME="gmarm_prod"
DB_USER="postgres"

# Directorio consolidado de archivos (montado por docker-compose.prod.yml)
# Contiene: documentos de clientes, documentos de importación, imágenes de armas
STORAGE_DIR="documentacion"

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"
mkdir -p "$BACKUP_DIR/completos"

# Verificar que PostgreSQL esté corriendo
if ! docker ps | grep -q "$CONTAINER_NAME"; then
  echo -e "${RED}❌ PostgreSQL no está corriendo${NC}"
  exit 1
fi

# Timestamp para el backup
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="gmarm-completo-$TIMESTAMP"
BACKUP_BASE="$BACKUP_DIR/completos/$BACKUP_NAME"

echo -e "${YELLOW}📦 Iniciando backup completo...${NC}"
echo "   Fecha: $(date)"
echo "   Nombre: $BACKUP_NAME"
echo ""

# =====================================
# PASO 1: BACKUP DE LA BASE DE DATOS
# =====================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📊 PASO 1: Backup de Base de Datos${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

DB_BACKUP_FILE="${BACKUP_BASE}-database.sql"

echo "   Exportando base de datos..."
docker exec $CONTAINER_NAME pg_dump -U $DB_USER -d $DB_NAME > "$DB_BACKUP_FILE"

if [ ! -f "$DB_BACKUP_FILE" ]; then
  echo -e "${RED}❌ Error creando backup de BD${NC}"
  exit 1
fi

# Validar el backup
echo "   Validando backup de BD..."
DB_SIZE=$(du -h "$DB_BACKUP_FILE" | cut -f1)
DB_LINES=$(wc -l < "$DB_BACKUP_FILE" | tr -d ' ')
if [ "$DB_LINES" -gt 10 ] && head -5 "$DB_BACKUP_FILE" | grep -q "PostgreSQL"; then
  echo -e "${GREEN}✅ Backup de BD creado: ${DB_SIZE} (${DB_LINES} líneas)${NC}"
else
  echo -e "${RED}❌ Backup de BD inválido (${DB_LINES} líneas, ${DB_SIZE})${NC}"
  echo "   Primeras 3 líneas del archivo:"
  head -3 "$DB_BACKUP_FILE"
  exit 1
fi
echo ""

# =====================================
# PASO 2: BACKUP DE ARCHIVOS
# =====================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📁 PASO 2: Backup de Archivos${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

FILES_BACKUP="${BACKUP_BASE}-archivos.tar.gz"
ARCHIVOS_ENCONTRADOS=0

# Verificar directorio consolidado
if [ -d "$STORAGE_DIR" ]; then
  FILE_COUNT=$(find "$STORAGE_DIR" -type f 2>/dev/null | wc -l)
  echo "   ✅ $STORAGE_DIR ($FILE_COUNT archivos totales)"
  ARCHIVOS_ENCONTRADOS=1
fi

echo ""

if [ "$ARCHIVOS_ENCONTRADOS" -gt 0 ]; then
  echo "   Comprimiendo archivos..."
  tar -czf "$FILES_BACKUP" "$STORAGE_DIR" 2>/dev/null || true

  if [ -f "$FILES_BACKUP" ]; then
    FILES_SIZE=$(du -h "$FILES_BACKUP" | cut -f1)
    echo -e "${GREEN}✅ Archivos respaldados: ${FILES_SIZE}${NC}"
  else
    echo -e "${YELLOW}⚠️  No se pudieron comprimir archivos${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  No se encontraron directorios de archivos${NC}"
fi
echo ""

# =====================================
# PASO 3: CREAR ARCHIVO COMBINADO
# =====================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📦 PASO 3: Crear Backup Combinado${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

COMBINED_BACKUP="${BACKUP_BASE}.tar.gz"

# Crear directorio temporal
TEMP_DIR=$(mktemp -d)
mkdir -p "$TEMP_DIR/$BACKUP_NAME"

# Copiar archivos al directorio temporal
cp "$DB_BACKUP_FILE" "$TEMP_DIR/$BACKUP_NAME/"
if [ -f "$FILES_BACKUP" ]; then
  cp "$FILES_BACKUP" "$TEMP_DIR/$BACKUP_NAME/"
fi

# Crear metadata
cat > "$TEMP_DIR/$BACKUP_NAME/METADATA.txt" << EOF
GMARM - Backup Completo de Producción
======================================

Fecha: $(date)
Timestamp: $TIMESTAMP
Hostname: $(hostname)
Usuario: $(whoami)

CONTENIDO:
----------
- Base de datos: ${DB_NAME}
  Tamaño: ${DB_SIZE}

- Archivos (documentacion/):
  Tamaño total: ${FILES_SIZE:-N/A}

VERSIÓN:
--------
Backend: $(git rev-parse --short HEAD 2>/dev/null || echo "N/A")
Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "N/A")

RESTAURACIÓN:
-------------
1. Descomprimir: tar -xzf $(basename $COMBINED_BACKUP)
2. Restaurar BD: bash scripts/restore-backup.sh ${BACKUP_NAME}/${BACKUP_NAME}-database.sql
3. Restaurar archivos: tar -xzf ${BACKUP_NAME}/${BACKUP_NAME}-archivos.tar.gz

EOF

# Crear checksum
cd "$TEMP_DIR/$BACKUP_NAME"
sha256sum * > CHECKSUMS.txt 2>/dev/null || true
cd - > /dev/null

echo "   Creando archivo combinado..."
tar -czf "$COMBINED_BACKUP" -C "$TEMP_DIR" "$BACKUP_NAME"

# Limpiar archivos temporales
rm -rf "$TEMP_DIR"
rm -f "$DB_BACKUP_FILE"
[ -f "$FILES_BACKUP" ] && rm -f "$FILES_BACKUP"

if [ -f "$COMBINED_BACKUP" ]; then
  COMBINED_SIZE=$(du -h "$COMBINED_BACKUP" | cut -f1)
  echo -e "${GREEN}✅ Backup combinado creado: ${COMBINED_SIZE}${NC}"
else
  echo -e "${RED}❌ Error creando backup combinado${NC}"
  exit 1
fi
echo ""

# =====================================
# PASO 4: VALIDACIÓN Y VERIFICACIÓN
# =====================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}🔍 PASO 4: Validación del Backup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "   Verificando integridad..."
if tar -tzf "$COMBINED_BACKUP" > /dev/null 2>&1; then
  FILE_COUNT=$(tar -tzf "$COMBINED_BACKUP" | wc -l)
  echo -e "${GREEN}✅ Backup íntegro (${FILE_COUNT} archivos)${NC}"
else
  echo -e "${RED}❌ Backup corrupto${NC}"
  exit 1
fi

echo ""

# =====================================
# PASO 5: LIMPIEZA DE BACKUPS ANTIGUOS
# =====================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}🧹 PASO 5: Limpieza de Backups Antiguos${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "   Buscando backups > ${RETENTION_DAYS} días..."
DELETED_COUNT=$(find "$BACKUP_DIR/completos" -name "gmarm-completo-*.tar.gz" -mtime +$RETENTION_DAYS -delete -print 2>/dev/null | wc -l)

if [ "$DELETED_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✅ ${DELETED_COUNT} backups antiguos eliminados${NC}"
else
  echo -e "${GREEN}✅ No hay backups antiguos para eliminar${NC}"
fi
echo ""

# =====================================
# PASO 6: RESUMEN Y ESTADÍSTICAS
# =====================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📊 RESUMEN DEL BACKUP${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

BACKUP_COUNT=$(find "$BACKUP_DIR/completos" -name "gmarm-completo-*.tar.gz" | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR/completos" 2>/dev/null | cut -f1)

echo "   📦 Backup creado: $(basename $COMBINED_BACKUP)"
echo "   📏 Tamaño: $COMBINED_SIZE"
echo "   📁 Ubicación: $COMBINED_BACKUP"
echo "   🗄️  Total backups: $BACKUP_COUNT"
echo "   💾 Espacio usado: $TOTAL_SIZE"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 Últimos 5 Backups Completos${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
ls -lht "$BACKUP_DIR/completos"/gmarm-completo-*.tar.gz 2>/dev/null | head -5 | awk '{print "   " $9 " (" $5 ") - " $6 " " $7 " " $8}'
echo ""

echo "========================================"
echo -e "${GREEN}✅ BACKUP COMPLETO FINALIZADO${NC}"
echo "========================================"
echo ""
echo -e "${YELLOW}📝 Para restaurar este backup:${NC}"
echo ""
echo "   1. Descomprimir backup:"
echo "      tar -xzf $COMBINED_BACKUP"
echo ""
echo "   2. Ver contenido:"
echo "      cat ${BACKUP_NAME}/METADATA.txt"
echo ""
echo "   3. Restaurar base de datos:"
echo "      bash scripts/restore-backup.sh ${BACKUP_NAME}/${BACKUP_NAME}-database.sql"
echo ""
echo "   4. Restaurar archivos (si existen):"
echo "      tar -xzf ${BACKUP_NAME}/${BACKUP_NAME}-archivos.tar.gz"
echo ""

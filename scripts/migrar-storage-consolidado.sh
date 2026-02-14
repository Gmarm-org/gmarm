#!/bin/bash

# ========================================
# MIGRACIÓN: Consolidar uploads/ → documentacion/
# ========================================
# Ejecutar UNA SOLA VEZ en producción después de desplegar
# el código con las nuevas rutas consolidadas.
#
# Uso: bash scripts/migrar-storage-consolidado.sh
# ========================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

CONTAINER_NAME="gmarm-postgres-prod"
DB_NAME="gmarm_prod"
DB_USER="postgres"

echo "========================================"
echo "MIGRACIÓN: Consolidar almacenamiento"
echo "========================================"
echo ""

# ----------------------------------------
# PASO 1: Backup
# ----------------------------------------
echo -e "${YELLOW}PASO 1: Creando backup completo antes de migrar...${NC}"
if [ -f "scripts/backup-completo-prod.sh" ]; then
  bash scripts/backup-completo-prod.sh
  echo -e "${GREEN}✅ Backup completado${NC}"
else
  echo -e "${RED}❌ No se encontró scripts/backup-completo-prod.sh${NC}"
  exit 1
fi
echo ""

# ----------------------------------------
# PASO 2: Auditar rutas en BD
# ----------------------------------------
echo -e "${YELLOW}PASO 2: Auditando rutas actuales en BD...${NC}"
docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "
  SELECT 'documento_cliente' as tabla,
         LEFT(ruta_archivo, 40) as ejemplo_ruta,
         COUNT(*) as total
  FROM documento_cliente
  WHERE ruta_archivo IS NOT NULL
  GROUP BY LEFT(ruta_archivo, 40)
  UNION ALL
  SELECT 'documento_generado', LEFT(ruta_archivo, 40), COUNT(*)
  FROM documento_generado
  WHERE ruta_archivo IS NOT NULL
  GROUP BY LEFT(ruta_archivo, 40)
  UNION ALL
  SELECT 'doc_grupo_import', LEFT(ruta_archivo, 40), COUNT(*)
  FROM documento_grupo_importacion
  WHERE ruta_archivo IS NOT NULL
  GROUP BY LEFT(ruta_archivo, 40)
  UNION ALL
  SELECT 'arma_imagen', LEFT(url_imagen, 40), COUNT(*)
  FROM arma_imagen
  GROUP BY LEFT(url_imagen, 40)
  ORDER BY tabla;
"
echo ""

# ----------------------------------------
# PASO 3: Normalizar rutas absolutas en BD
# ----------------------------------------
echo -e "${YELLOW}PASO 3: Normalizando rutas absolutas en BD...${NC}"
docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "
  UPDATE documento_cliente
  SET ruta_archivo = REPLACE(ruta_archivo, '/app/documentacion/documentos_cliente/', '')
  WHERE ruta_archivo LIKE '/app/documentacion/documentos_cliente/%';

  UPDATE documento_cliente
  SET ruta_archivo = REPLACE(ruta_archivo, '/app/documentacion/', '')
  WHERE ruta_archivo LIKE '/app/documentacion/%';

  UPDATE documento_generado
  SET ruta_archivo = REPLACE(ruta_archivo, '/app/documentacion/documentos_cliente/', '')
  WHERE ruta_archivo LIKE '/app/documentacion/documentos_cliente/%';

  UPDATE documento_generado
  SET ruta_archivo = REPLACE(ruta_archivo, '/app/documentacion/', '')
  WHERE ruta_archivo LIKE '/app/documentacion/%';

  UPDATE documento_grupo_importacion
  SET ruta_archivo = REPLACE(ruta_archivo, '/app/documentacion/documentos_cliente/', '')
  WHERE ruta_archivo LIKE '/app/documentacion/documentos_cliente/%';

  UPDATE documento_grupo_importacion
  SET ruta_archivo = REPLACE(ruta_archivo, '/app/documentacion/', '')
  WHERE ruta_archivo LIKE '/app/documentacion/%';
"
echo -e "${GREEN}✅ Rutas normalizadas${NC}"
echo ""

# ----------------------------------------
# PASO 4: Mover imágenes de armas
# ----------------------------------------
echo -e "${YELLOW}PASO 4: Moviendo imágenes de armas...${NC}"
mkdir -p documentacion/images/weapons

if [ -d "uploads/images/weapons" ]; then
  IMG_COUNT=$(find uploads/images/weapons -type f 2>/dev/null | wc -l)
  if [ "$IMG_COUNT" -gt 0 ]; then
    cp -a uploads/images/weapons/* documentacion/images/weapons/ 2>/dev/null
    NEW_COUNT=$(find documentacion/images/weapons -type f 2>/dev/null | wc -l)
    echo -e "${GREEN}✅ $NEW_COUNT imágenes copiadas a documentacion/images/weapons/${NC}"
  else
    echo "   No hay imágenes que mover"
  fi
else
  echo "   Directorio uploads/images/weapons/ no existe (puede que ya se haya migrado)"
fi
echo ""

# ----------------------------------------
# PASO 5: Verificar post-migración
# ----------------------------------------
echo -e "${YELLOW}PASO 5: Verificando migración...${NC}"
docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "
  SELECT 'documento_cliente' as tabla, COUNT(*) as total,
         COUNT(CASE WHEN ruta_archivo LIKE '/app/%' THEN 1 END) as paths_absolutos
  FROM documento_cliente WHERE ruta_archivo IS NOT NULL
  UNION ALL
  SELECT 'documento_generado', COUNT(*),
         COUNT(CASE WHEN ruta_archivo LIKE '/app/%' THEN 1 END)
  FROM documento_generado WHERE ruta_archivo IS NOT NULL
  UNION ALL
  SELECT 'doc_grupo_import', COUNT(*),
         COUNT(CASE WHEN ruta_archivo LIKE '/app/%' THEN 1 END)
  FROM documento_grupo_importacion WHERE ruta_archivo IS NOT NULL;
"
echo ""
echo "   Si 'paths_absolutos' es 0 en todas las tablas, la migración fue exitosa."
echo ""

# ----------------------------------------
# PASO 6: Instrucciones finales
# ----------------------------------------
echo "========================================"
echo -e "${GREEN}✅ MIGRACIÓN COMPLETADA${NC}"
echo "========================================"
echo ""
echo "Pasos siguientes:"
echo "  1. Redesplegar con el nuevo docker-compose:"
echo "     docker-compose -f docker-compose.prod.yml down"
echo "     docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "  2. Verificar que documentos e imágenes cargan en la app"
echo ""
echo "  3. Si todo OK, eliminar directorio viejo:"
echo "     rm -rf uploads/"
echo ""

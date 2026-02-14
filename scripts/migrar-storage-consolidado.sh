#!/bin/bash

# ========================================
# MIGRACIÓN COMPLETA: Consolidar uploads/ → documentacion/
# ========================================
# Ejecutar UNA SOLA VEZ en producción.
# Este script hace TODO: backup, pull, migrar archivos,
# normalizar BD, redesplegar y verificar.
#
# Uso: bash scripts/migrar-storage-consolidado.sh
# ========================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

CONTAINER_NAME="gmarm-postgres-prod"
DB_NAME="gmarm_prod"
DB_USER="postgres"
COMPOSE_FILE="docker-compose.prod.yml"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  MIGRACIÓN COMPLETA DE PRODUCCIÓN${NC}"
echo -e "${BLUE}  uploads/ → documentacion/${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "  Este script hará lo siguiente:"
echo "  1. Pull del código nuevo"
echo "  2. Backup completo (BD + archivos)"
echo "  3. Copiar imágenes de armas a documentacion/"
echo "  4. Bajar servicios"
echo "  5. Redesplegar con nuevo código"
echo "  6. Normalizar rutas en BD"
echo "  7. Verificar que todo funcione"
echo ""
echo -e "${YELLOW}IMPORTANTE: Los servicios estarán caídos unos minutos.${NC}"
echo ""
read -p "¿Continuar? (escribe SI para confirmar): " CONFIRMAR
if [ "$CONFIRMAR" != "SI" ]; then
  echo -e "${RED}Cancelado.${NC}"
  exit 0
fi
echo ""

# ========================================
# PASO 1: PULL DEL CÓDIGO NUEVO
# ========================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PASO 1/7: Descargando código nuevo...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

git pull origin main
echo ""
echo -e "${GREEN}Código actualizado${NC}"
echo ""

# ========================================
# PASO 2: BACKUP COMPLETO
# ========================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PASO 2/7: Creando backup completo...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -f "scripts/backup-completo-prod.sh" ]; then
  bash scripts/backup-completo-prod.sh
  echo -e "${GREEN}Backup completado${NC}"
else
  echo -e "${RED}No se encontró scripts/backup-completo-prod.sh${NC}"
  exit 1
fi
echo ""

# ========================================
# PASO 3: COPIAR IMÁGENES DE ARMAS
# ========================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PASO 3/7: Copiando imágenes de armas...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

mkdir -p documentacion/images/weapons

if [ -d "uploads/images/weapons" ]; then
  IMG_COUNT=$(find uploads/images/weapons -type f 2>/dev/null | wc -l | tr -d ' ')
  if [ "$IMG_COUNT" -gt 0 ]; then
    cp -a uploads/images/weapons/* documentacion/images/weapons/ 2>/dev/null || true
    NEW_COUNT=$(find documentacion/images/weapons -type f 2>/dev/null | wc -l | tr -d ' ')
    echo -e "${GREEN}$NEW_COUNT imágenes copiadas a documentacion/images/weapons/${NC}"
  else
    echo "  No hay imágenes que copiar"
  fi
else
  echo "  uploads/images/weapons/ no existe (puede que ya se haya migrado)"
fi
echo ""

# ========================================
# PASO 4: BAJAR SERVICIOS
# ========================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PASO 4/7: Bajando servicios...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

docker-compose -f $COMPOSE_FILE down
echo ""
echo -e "${GREEN}Servicios detenidos${NC}"
echo ""

# ========================================
# PASO 5: REDESPLEGAR CON NUEVO CÓDIGO
# ========================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PASO 5/7: Redesplegando servicios...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

docker-compose -f $COMPOSE_FILE up -d --build
echo ""

# Esperar a que PostgreSQL esté listo
echo "  Esperando a que PostgreSQL esté listo..."
for i in $(seq 1 30); do
  if docker exec $CONTAINER_NAME pg_isready -U $DB_USER -d $DB_NAME > /dev/null 2>&1; then
    echo -e "${GREEN}  PostgreSQL listo${NC}"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo -e "${RED}  PostgreSQL no respondió después de 30 intentos${NC}"
    exit 1
  fi
  sleep 2
done

# Esperar a que el backend esté healthy
echo "  Esperando a que el backend inicie (puede tardar ~60s)..."
for i in $(seq 1 40); do
  if curl -sf http://localhost:8080/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}  Backend listo${NC}"
    break
  fi
  if [ "$i" -eq 40 ]; then
    echo -e "${YELLOW}  Backend aún iniciando, continuando...${NC}"
  fi
  sleep 3
done
echo ""

# ========================================
# PASO 6: NORMALIZAR RUTAS EN BD
# ========================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PASO 6/7: Normalizando rutas en BD...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "  Rutas ANTES de normalizar:"
docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "
  SELECT 'documento_cliente' as tabla,
         LEFT(ruta_archivo, 50) as ejemplo_ruta,
         COUNT(*) as total
  FROM documento_cliente
  WHERE ruta_archivo IS NOT NULL
  GROUP BY LEFT(ruta_archivo, 50)
  UNION ALL
  SELECT 'documento_generado', LEFT(ruta_archivo, 50), COUNT(*)
  FROM documento_generado
  WHERE ruta_archivo IS NOT NULL
  GROUP BY LEFT(ruta_archivo, 50)
  UNION ALL
  SELECT 'doc_grupo_import', LEFT(ruta_archivo, 50), COUNT(*)
  FROM documento_grupo_importacion
  WHERE ruta_archivo IS NOT NULL
  GROUP BY LEFT(ruta_archivo, 50)
  ORDER BY tabla;
"
echo ""

echo "  Normalizando rutas absolutas a relativas..."
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
echo ""
echo -e "${GREEN}Rutas normalizadas${NC}"
echo ""

# ========================================
# PASO 7: VERIFICACIÓN FINAL
# ========================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PASO 7/7: Verificación final...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verificar que no queden paths absolutos
echo "  Rutas DESPUÉS de normalizar:"
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

# Verificar imágenes de armas
WEAPONS_COUNT=$(find documentacion/images/weapons -type f 2>/dev/null | wc -l | tr -d ' ')
echo "  Imágenes de armas en documentacion/: $WEAPONS_COUNT"

# Verificar servicios
echo ""
echo "  Estado de servicios:"
docker-compose -f $COMPOSE_FILE ps
echo ""

# Verificar health del backend
if curl -sf http://localhost:8080/api/health > /dev/null 2>&1; then
  echo -e "${GREEN}  Backend: OK${NC}"
else
  echo -e "${YELLOW}  Backend: Aún iniciando (verificar manualmente en unos minutos)${NC}"
fi
echo ""

# ========================================
# RESUMEN
# ========================================
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}  MIGRACIÓN COMPLETADA${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "  Verifica en la app:"
echo "    - Las imágenes de armas se ven correctamente"
echo "    - Los documentos de clientes cargan"
echo "    - Los documentos generados se muestran (los 4 tipos)"
echo ""
echo "  Si todo funciona bien, puedes eliminar el directorio viejo:"
echo -e "    ${YELLOW}rm -rf uploads/${NC}"
echo ""
echo "  Si algo falla, restaura el backup:"
echo "    Ver: scripts/GUIA_RESET_BD.md"
echo ""

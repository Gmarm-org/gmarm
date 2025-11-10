#!/bin/bash

# 🔍 VERIFICAR INTEGRIDAD DE DATOS EN PRODUCCIÓN
# Fecha: 2025-11-10
# Uso: bash scripts/verificar-datos-prod.sh

set -e

echo "========================================"
echo "🔍 VERIFICACIÓN DE DATOS - PRODUCCIÓN"
echo "========================================"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

CONTAINER_NAME="gmarm-postgres-prod"
DB_NAME="gmarm_prod"
DB_USER="postgres"

# Verificar que PostgreSQL esté corriendo
if ! docker ps | grep -q "$CONTAINER_NAME"; then
  echo -e "${RED}❌ CRÍTICO: PostgreSQL no está corriendo${NC}"
  exit 1
fi

echo -e "${GREEN}✅ PostgreSQL está corriendo${NC}"
echo ""

# 1. Verificar que la BD existe
echo -e "${YELLOW}🗄️  1. Verificando base de datos...${NC}"
DB_EXISTS=$(docker exec $CONTAINER_NAME psql -U $DB_USER -lqt | cut -d \| -f 1 | grep -w $DB_NAME | wc -l)

if [ "$DB_EXISTS" -eq 0 ]; then
  echo -e "${RED}❌ CRÍTICO: Base de datos '$DB_NAME' NO EXISTE${NC}"
  exit 1
fi

echo -e "${GREEN}   ✅ Base de datos existe${NC}"

# 2. Contar tablas
echo -e "${YELLOW}🗄️  2. Verificando tablas...${NC}"
TABLA_COUNT=$(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "   Tablas en BD: $TABLA_COUNT"

if [ "$TABLA_COUNT" -lt 30 ]; then
  echo -e "${RED}   ⚠️  ADVERTENCIA: Pocas tablas (esperado: ~36)${NC}"
fi

# 3. Verificar datos en tablas críticas
echo -e "${YELLOW}📊 3. Verificando datos críticos...${NC}"

# Usuarios
USER_COUNT=$(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM usuario;")
echo "   Usuarios: $USER_COUNT"
if [ "$USER_COUNT" -eq 0 ]; then
  echo -e "${RED}   ❌ ERROR: No hay usuarios en la BD${NC}"
  exit 1
fi

# Armas
ARMA_COUNT=$(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM arma;")
echo "   Armas: $ARMA_COUNT"

# Clientes
CLIENTE_COUNT=$(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM cliente;")
echo "   Clientes: $CLIENTE_COUNT"

# Licencias
LICENCIA_COUNT=$(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM licencia;")
echo "   Licencias: $LICENCIA_COUNT"
if [ "$LICENCIA_COUNT" -eq 0 ]; then
  echo -e "${YELLOW}   ⚠️  ADVERTENCIA: No hay licencias registradas${NC}"
fi

# Tipos de cliente
TIPO_CLIENTE_COUNT=$(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM tipo_cliente;")
echo "   Tipos de cliente: $TIPO_CLIENTE_COUNT"

# 4. Verificar integridad referencial
echo -e "${YELLOW}🔗 4. Verificando integridad referencial...${NC}"

# Clientes con tipo de cliente válido
CLIENTES_INVALIDOS=$(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM cliente WHERE tipo_cliente_id NOT IN (SELECT id FROM tipo_cliente);")
if [ "$CLIENTES_INVALIDOS" -gt 0 ]; then
  echo -e "${RED}   ❌ ERROR: $CLIENTES_INVALIDOS clientes con tipo_cliente_id inválido${NC}"
else
  echo -e "${GREEN}   ✅ Integridad de clientes OK${NC}"
fi

# Usuarios con rol válido
USUARIOS_INVALIDOS=$(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM usuario WHERE rol_id NOT IN (SELECT id FROM rol);")
if [ "$USUARIOS_INVALIDOS" -gt 0 ]; then
  echo -e "${RED}   ❌ ERROR: $USUARIOS_INVALIDOS usuarios con rol_id inválido${NC}"
else
  echo -e "${GREEN}   ✅ Integridad de usuarios OK${NC}"
fi

# 5. Verificar secuencias (IDs autoincrementales)
echo -e "${YELLOW}🔢 5. Verificando secuencias...${NC}"
SECUENCIAS=$(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM information_schema.sequences WHERE sequence_schema = 'public';")
echo "   Secuencias activas: $SECUENCIAS"

# 6. Verificar último backup
echo -e "${YELLOW}💾 6. Verificando backups...${NC}"
LAST_BACKUP=$(ls -t backups/gmarm-prod-*.sql.gz 2>/dev/null | head -1)

if [ -z "$LAST_BACKUP" ]; then
  echo -e "${RED}   ❌ CRÍTICO: NO hay backups disponibles${NC}"
  BACKUP_STATUS="FAIL"
else
  BACKUP_AGE=$(( ($(date +%s) - $(stat -c %Y "$LAST_BACKUP")) / 3600 ))
  BACKUP_SIZE=$(du -h "$LAST_BACKUP" | cut -f1)
  echo "   Último backup: $LAST_BACKUP"
  echo "   Antigüedad: $BACKUP_AGE horas"
  echo "   Tamaño: $BACKUP_SIZE"
  
  if [ "$BACKUP_AGE" -gt 12 ]; then
    echo -e "${YELLOW}   ⚠️  ADVERTENCIA: Backup tiene más de 12 horas${NC}"
    BACKUP_STATUS="WARNING"
  else
    echo -e "${GREEN}   ✅ Backup reciente disponible${NC}"
    BACKUP_STATUS="OK"
  fi
fi

# 7. Verificar espacio en disco
echo -e "${YELLOW}💿 7. Verificando espacio en disco...${NC}"
DISK_USAGE=$(df -h $(pwd) | awk 'NR==2 {print $5}' | sed 's/%//')
echo "   Uso de disco: ${DISK_USAGE}%"

if [ "$DISK_USAGE" -gt 90 ]; then
  echo -e "${RED}   ❌ CRÍTICO: Disco casi lleno (>${DISK_USAGE}%)${NC}"
  DISK_STATUS="FAIL"
elif [ "$DISK_USAGE" -gt 80 ]; then
  echo -e "${YELLOW}   ⚠️  ADVERTENCIA: Disco en ${DISK_USAGE}%${NC}"
  DISK_STATUS="WARNING"
else
  echo -e "${GREEN}   ✅ Espacio en disco OK${NC}"
  DISK_STATUS="OK"
fi

# 8. Verificar memoria de PostgreSQL
echo -e "${YELLOW}💾 8. Verificando memoria PostgreSQL...${NC}"
PG_MEM=$(docker stats --no-stream $CONTAINER_NAME | awk 'NR==2 {print $7}' | sed 's/%//')
echo "   Uso de memoria: ${PG_MEM}%"

if [ "$PG_MEM" -gt 90 ]; then
  echo -e "${RED}   ❌ CRÍTICO: Memoria PostgreSQL > 90%${NC}"
  MEM_STATUS="FAIL"
elif [ "$PG_MEM" -gt 80 ]; then
  echo -e "${YELLOW}   ⚠️  ADVERTENCIA: Memoria PostgreSQL > 80%${NC}"
  MEM_STATUS="WARNING"
else
  echo -e "${GREEN}   ✅ Memoria PostgreSQL OK${NC}"
  MEM_STATUS="OK"
fi

# 9. Verificar conexiones activas
echo -e "${YELLOW}🔗 9. Verificando conexiones...${NC}"
CONEXIONES=$(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM pg_stat_activity WHERE datname = '$DB_NAME';")
MAX_CONEXIONES=$(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -tAc "SHOW max_connections;" | tr -d ' ')
echo "   Conexiones activas: $CONEXIONES / $MAX_CONEXIONES"

if [ "$CONEXIONES" -gt $(($MAX_CONEXIONES * 80 / 100)) ]; then
  echo -e "${RED}   ❌ ADVERTENCIA: Muchas conexiones activas${NC}"
fi

# 10. Generar reporte
echo ""
echo "========================================"
echo -e "${GREEN}📊 REPORTE FINAL${NC}"
echo "========================================"
echo ""
echo "Fecha: $(date)"
echo "Base de datos: $DB_NAME"
echo ""
echo "DATOS:"
echo "  Usuarios: $USER_COUNT"
echo "  Armas: $ARMA_COUNT"
echo "  Clientes: $CLIENTE_COUNT"
echo "  Licencias: $LICENCIA_COUNT"
echo "  Tablas: $TABLA_COUNT"
echo ""
echo "RECURSOS:"
echo "  Memoria PostgreSQL: ${PG_MEM}% ($MEM_STATUS)"
echo "  Disco: ${DISK_USAGE}% ($DISK_STATUS)"
echo "  Conexiones: $CONEXIONES / $MAX_CONEXIONES"
echo ""
echo "BACKUPS:"
if [ -n "$LAST_BACKUP" ]; then
  echo "  Último: $(basename $LAST_BACKUP)"
  echo "  Antigüedad: $BACKUP_AGE horas"
  echo "  Estado: $BACKUP_STATUS"
else
  echo "  Estado: NO DISPONIBLE"
fi
echo ""

# Determinar estado general
if [ "$MEM_STATUS" = "FAIL" ] || [ "$DISK_STATUS" = "FAIL" ] || [ "$BACKUP_STATUS" = "FAIL" ]; then
  echo -e "${RED}❌ ESTADO GENERAL: CRÍTICO${NC}"
  echo ""
  echo "ACCIONES REQUERIDAS:"
  [ "$MEM_STATUS" = "FAIL" ] && echo "  - Reiniciar PostgreSQL o aumentar límite de memoria"
  [ "$DISK_STATUS" = "FAIL" ] && echo "  - Limpiar espacio en disco"
  [ "$BACKUP_STATUS" = "FAIL" ] && echo "  - Crear backup inmediatamente: bash scripts/backup-prod.sh"
  exit 1
elif [ "$MEM_STATUS" = "WARNING" ] || [ "$DISK_STATUS" = "WARNING" ] || [ "$BACKUP_STATUS" = "WARNING" ]; then
  echo -e "${YELLOW}⚠️  ESTADO GENERAL: ADVERTENCIA${NC}"
  exit 0
else
  echo -e "${GREEN}✅ ESTADO GENERAL: SALUDABLE${NC}"
  exit 0
fi


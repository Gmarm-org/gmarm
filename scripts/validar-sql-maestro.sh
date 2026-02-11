#!/bin/bash

# 🔍 VALIDAR SQL MAESTRO ANTES DE PRODUCCIÓN
# Fecha: 2026-02-11
# Uso: bash scripts/validar-sql-maestro.sh

set -e

echo "========================================"
echo "🔍 VALIDACIÓN DEL SQL MAESTRO"
echo "========================================"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SQL_FILE="datos/00_gmarm_completo.sql"
ERRORES=0
WARNINGS=0

# Verificar que el archivo existe
if [ ! -f "$SQL_FILE" ]; then
  echo -e "${RED}❌ ERROR: Archivo SQL maestro no encontrado: $SQL_FILE${NC}"
  exit 1
fi

echo -e "${YELLOW}📄 Archivo: $SQL_FILE${NC}"
echo -e "${YELLOW}📏 Tamaño: $(du -h $SQL_FILE | cut -f1)${NC}"
echo ""

echo "========================================"
echo "🔎 VERIFICACIONES DE SINTAXIS"
echo "========================================"
echo ""

# 1. Verificar encoding UTF-8
echo -n "1. Verificando encoding UTF-8... "
if file "$SQL_FILE" | grep -q "UTF-8"; then
  echo -e "${GREEN}✅${NC}"
else
  echo -e "${RED}❌ No es UTF-8${NC}"
  ((ERRORES++))
fi

# 2. Verificar que no hay caracteres raros
echo -n "2. Verificando caracteres especiales... "
if grep -q $'\r' "$SQL_FILE"; then
  echo -e "${RED}❌ Contiene caracteres de Windows (CRLF)${NC}"
  ((ERRORES++))
else
  echo -e "${GREEN}✅${NC}"
fi

# 3. Verificar balance de comillas
echo -n "3. Verificando balance de comillas simples... "
SINGLE_QUOTES=$(grep -o "'" "$SQL_FILE" | wc -l)
if [ $((SINGLE_QUOTES % 2)) -eq 0 ]; then
  echo -e "${GREEN}✅ ($SINGLE_QUOTES comillas)${NC}"
else
  echo -e "${YELLOW}⚠️  Número impar de comillas ($SINGLE_QUOTES)${NC}"
  ((WARNINGS++))
fi

# 4. Verificar balance de paréntesis
echo -n "4. Verificando balance de paréntesis... "
OPEN=$(grep -o "(" "$SQL_FILE" | wc -l)
CLOSE=$(grep -o ")" "$SQL_FILE" | wc -l)
if [ "$OPEN" -eq "$CLOSE" ]; then
  echo -e "${GREEN}✅ (${OPEN} abiertos, ${CLOSE} cerrados)${NC}"
else
  echo -e "${RED}❌ Desbalanceados: ${OPEN} abiertos, ${CLOSE} cerrados${NC}"
  ((ERRORES++))
fi

# 5. Verificar que no hay TODO o FIXME
echo -n "5. Verificando comentarios TODO/FIXME... "
TODO_COUNT=$(grep -i "TODO\|FIXME" "$SQL_FILE" | wc -l)
if [ "$TODO_COUNT" -eq 0 ]; then
  echo -e "${GREEN}✅${NC}"
else
  echo -e "${YELLOW}⚠️  ${TODO_COUNT} comentarios pendientes${NC}"
  ((WARNINGS++))
fi

echo ""
echo "========================================"
echo "🗂️  VERIFICACIONES DE ESTRUCTURA"
echo "========================================"
echo ""

# 6. Verificar tablas principales
echo "6. Verificando tablas principales..."
TABLAS_REQUERIDAS=("usuario" "rol" "cliente" "arma" "venta" "pago" "licencia" "grupo_importacion" "documento_generado")
for tabla in "${TABLAS_REQUERIDAS[@]}"; do
  echo -n "   - Tabla $tabla... "
  if grep -q "CREATE TABLE.*$tabla" "$SQL_FILE"; then
    echo -e "${GREEN}✅${NC}"
  else
    echo -e "${RED}❌ NO ENCONTRADA${NC}"
    ((ERRORES++))
  fi
done

echo ""
echo "7. Verificando datos de inicialización..."

# Roles
echo -n "   - Roles del sistema... "
ROLES=$(grep -c "INSERT INTO rol.*VALUES" "$SQL_FILE" || echo "0")
if [ "$ROLES" -gt 0 ]; then
  echo -e "${GREEN}✅ ($ROLES entradas)${NC}"
else
  echo -e "${RED}❌ Sin roles${NC}"
  ((ERRORES++))
fi

# Usuarios
echo -n "   - Usuarios del sistema... "
USUARIOS=$(grep -c "INSERT INTO usuario.*VALUES\|INSERT INTO usuario (" "$SQL_FILE" || echo "0")
if [ "$USUARIOS" -gt 0 ]; then
  echo -e "${GREEN}✅ ($USUARIOS bloques)${NC}"
else
  echo -e "${RED}❌ Sin usuarios${NC}"
  ((ERRORES++))
fi

# Tipos de documento
echo -n "   - Tipos de documento... "
DOCS=$(grep -c "tipo_documento.*VALUES" "$SQL_FILE" || echo "0")
if [ "$DOCS" -gt 0 ]; then
  echo -e "${GREEN}✅${NC}"
else
  echo -e "${YELLOW}⚠️  Sin tipos de documento${NC}"
  ((WARNINGS++))
fi

# Configuración del sistema
echo -n "   - Configuración del sistema... "
if grep -q "configuracion_sistema" "$SQL_FILE"; then
  echo -e "${GREEN}✅${NC}"
else
  echo -e "${YELLOW}⚠️  Sin configuración del sistema${NC}"
  ((WARNINGS++))
fi

echo ""
echo "========================================"
echo "👥 VERIFICACIONES DE USUARIOS"
echo "========================================"
echo ""

# Verificar usuarios específicos
echo "8. Verificando usuarios requeridos..."
USUARIOS_REQ=("admin" "david.guevara" "franklin.endara")
for user in "${USUARIOS_REQ[@]}"; do
  echo -n "   - Usuario $user... "
  if grep -q "username.*$user" "$SQL_FILE"; then
    echo -e "${GREEN}✅${NC}"
  else
    echo -e "${RED}❌ NO ENCONTRADO${NC}"
    ((ERRORES++))
  fi
done

# Verificar que Franklin tiene 3 roles
echo -n "9. Verificando roles de Franklin Endara... "
if grep -q "franklin.endara.*VENDOR.*FINANCE.*SALES_CHIEF\|VENDOR.*FINANCE.*SALES_CHIEF.*franklin.endara" "$SQL_FILE"; then
  echo -e "${GREEN}✅ (3 roles: VENDOR, FINANCE, SALES_CHIEF)${NC}"
else
  echo -e "${YELLOW}⚠️  Verificar manualmente${NC}"
  ((WARNINGS++))
fi

echo ""
echo "========================================"
echo "🔐 VERIFICACIONES DE SEGURIDAD"
echo "========================================"
echo ""

# 10. Verificar que no hay passwords en texto plano visibles
echo -n "10. Verificando passwords seguros... "
if grep -i "password.*admin123\|password.*'password'" "$SQL_FILE" | grep -v "password_hash.*admin123" | grep -q .; then
  echo -e "${YELLOW}⚠️  Passwords de prueba encontrados (cambiar en producción)${NC}"
  ((WARNINGS++))
else
  echo -e "${GREEN}✅${NC}"
fi

# 11. Verificar que no hay emails de prueba en producción
echo -n "11. Verificando emails... "
TEST_EMAILS=$(grep -i "@test.com\|@example.com" "$SQL_FILE" | wc -l)
if [ "$TEST_EMAILS" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  ${TEST_EMAILS} emails de prueba (OK para desarrollo)${NC}"
  ((WARNINGS++))
else
  echo -e "${GREEN}✅${NC}"
fi

echo ""
echo "========================================"
echo "📊 ESTADÍSTICAS DEL SQL"
echo "========================================"
echo ""

echo "Líneas totales: $(wc -l < $SQL_FILE)"
echo "Tablas CREATE: $(grep -c "CREATE TABLE" $SQL_FILE)"
echo "Índices CREATE: $(grep -c "CREATE INDEX\|CREATE UNIQUE INDEX" $SQL_FILE || echo "0")"
echo "INSERT statements: $(grep -c "INSERT INTO" $SQL_FILE)"
echo "Comentarios: $(grep -c "^--" $SQL_FILE)"
echo ""

echo "========================================"
echo "📋 RESUMEN DE VALIDACIÓN"
echo "========================================"
echo ""

if [ "$ERRORES" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
  echo -e "${GREEN}✅ ¡PERFECTO! SQL maestro listo para producción${NC}"
  echo ""
  exit 0
elif [ "$ERRORES" -eq 0 ]; then
  echo -e "${YELLOW}⚠️  SQL maestro tiene ${WARNINGS} advertencias${NC}"
  echo ""
  echo "Puedes continuar, pero revisa las advertencias."
  echo ""
  exit 0
else
  echo -e "${RED}❌ SQL maestro tiene ${ERRORES} errores y ${WARNINGS} advertencias${NC}"
  echo ""
  echo "DEBES corregir los errores antes de usar en producción."
  echo ""
  exit 1
fi

#!/bin/bash

# Script de validación de builds para GMARM
# Ejecuta este script antes de hacer commit/push para asegurar que todo compila

echo "🔍 Validación de Builds - GMARM"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
BUILD_FAILED=0
START_TIME=$(date +%s)

# 1. Frontend Build
echo -e "${BLUE}📦 [1/2] Compilando Frontend...${NC}"
cd frontend
if npm run build 2>&1 | tee /tmp/frontend-build.log; then
    echo -e "${GREEN}✅ Frontend build exitoso${NC}"
else
    echo -e "${RED}❌ Frontend build FALLÓ${NC}"
    echo ""
    echo "Ver errores completos en: /tmp/frontend-build.log"
    BUILD_FAILED=1
fi
cd ..

echo ""

# 2. Backend Build
echo -e "${BLUE}🏗️  [2/2] Compilando Backend (Docker)...${NC}"
if docker-compose -f docker-compose.local.yml build backend_local 2>&1 | tee /tmp/backend-build.log | grep -E "Step|Successfully|ERROR"; then
    # Verificar si el build terminó exitosamente
    if grep -q "ERROR" /tmp/backend-build.log; then
        echo -e "${RED}❌ Backend build FALLÓ${NC}"
        BUILD_FAILED=1
    else
        echo -e "${GREEN}✅ Backend build exitoso${NC}"
    fi
else
    echo -e "${RED}❌ Backend build FALLÓ${NC}"
    BUILD_FAILED=1
fi

# Calcular tiempo total
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Resultado final
if [ $BUILD_FAILED -eq 1 ]; then
    echo -e "${RED}❌ VALIDACIÓN FALLIDA${NC}"
    echo ""
    echo "Uno o más builds fallaron."
    echo ""
    echo "📋 Logs completos:"
    echo "  - Frontend: /tmp/frontend-build.log"
    echo "  - Backend: /tmp/backend-build.log"
    echo ""
    echo -e "${YELLOW}⏱  Tiempo total: ${DURATION}s${NC}"
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ VALIDACIÓN EXITOSA${NC}"
    echo ""
    echo "Todos los builds pasaron correctamente."
    echo "✓ Frontend compilado"
    echo "✓ Backend compilado"
    echo ""
    echo -e "${GREEN}⏱  Tiempo total: ${DURATION}s${NC}"
    echo ""
    echo -e "${GREEN}Puedes hacer commit y push con confianza 🚀${NC}"
    echo ""
    exit 0
fi

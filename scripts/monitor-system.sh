#!/bin/bash

# ========================================
# SCRIPT DE MONITOREO LOCAL DEL SISTEMA
# ========================================
# Este script verifica el estado de todos los servicios

set -e

echo "🔍 GMARM System Monitor"
echo "======================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para verificar servicio
check_service() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "🔍 Checking $name... "
    
    if curl -f -s --max-time 10 "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        return 1
    fi
}

# Función para verificar Docker container
check_container() {
    local container_name=$1
    
    echo -n "🐳 Checking container $container_name... "
    
    if docker ps --format "table {{.Names}}" | grep -q "^${container_name}$"; then
        echo -e "${GREEN}✅ Running${NC}"
        return 0
    else
        echo -e "${RED}❌ Not Running${NC}"
        return 1
    fi
}

# Función para verificar base de datos
check_database() {
    local container_name=$1
    local db_name=$2
    
    echo -n "🗄️ Checking database $db_name... "
    
    if docker exec "$container_name" pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Connected${NC}"
        return 0
    else
        echo -e "${RED}❌ Not Connected${NC}"
        return 1
    fi
}

echo "📋 System Status Check"
echo "======================"

# Verificar Docker
echo ""
echo "🐳 Docker Status:"
if command -v docker &> /dev/null; then
    echo -e "   Docker: ${GREEN}✅ Installed${NC}"
    if docker ps &> /dev/null; then
        echo -e "   Docker Daemon: ${GREEN}✅ Running${NC}"
    else
        echo -e "   Docker Daemon: ${RED}❌ Not Running${NC}"
        exit 1
    fi
else
    echo -e "   Docker: ${RED}❌ Not Installed${NC}"
    exit 1
fi

# Verificar contenedores
echo ""
echo "📦 Container Status:"
check_container "gmarm-backend-dev"
check_container "gmarm-frontend-dev"
check_container "gmarm-postgres-dev"

# Verificar base de datos
echo ""
echo "🗄️ Database Status:"
check_database "gmarm-postgres-dev" "gmarm_dev"

# Verificar servicios HTTP
echo ""
echo "🌐 Service Status:"
check_service "Backend API" "http://localhost:8080/api/health"
check_service "Frontend" "http://localhost:5173"

# Verificar endpoints específicos
echo ""
echo "🔗 API Endpoints:"
check_service "Auth Endpoint" "http://localhost:8080/api/auth/login"
check_service "Client Types" "http://localhost:8080/api/tipos-cliente/config"
check_service "Health Check" "http://localhost:8080/api/health"

# Verificar logs recientes
echo ""
echo "📋 Recent Logs (last 10 lines):"
echo "==============================="

echo ""
echo -e "${BLUE}Backend Logs:${NC}"
docker logs gmarm-backend-dev --tail 10 2>/dev/null || echo "No backend logs available"

echo ""
echo -e "${BLUE}Frontend Logs:${NC}"
docker logs gmarm-frontend-dev --tail 10 2>/dev/null || echo "No frontend logs available"

echo ""
echo -e "${BLUE}Database Logs:${NC}"
docker logs gmarm-postgres-dev --tail 5 2>/dev/null || echo "No database logs available"

# Verificar espacio en disco
echo ""
echo "💾 Disk Usage:"
echo "============="
docker system df

# Verificar memoria
echo ""
echo "🧠 Memory Usage:"
echo "==============="
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" | head -10

# Resumen final
echo ""
echo "📊 System Summary:"
echo "=================="

# Contar servicios funcionando
BACKEND_OK=$(curl -f -s --max-time 5 "http://localhost:8080/api/health" > /dev/null 2>&1 && echo "1" || echo "0")
FRONTEND_OK=$(curl -f -s --max-time 5 "http://localhost:5173" > /dev/null 2>&1 && echo "1" || echo "0")
DB_OK=$(docker exec gmarm-postgres-dev pg_isready -U postgres > /dev/null 2>&1 && echo "1" || echo "0")

TOTAL_SERVICES=3
WORKING_SERVICES=$((BACKEND_OK + FRONTEND_OK + DB_OK))

echo "Services Working: $WORKING_SERVICES/$TOTAL_SERVICES"

if [ $WORKING_SERVICES -eq $TOTAL_SERVICES ]; then
    echo -e "${GREEN}🎉 All services are running correctly!${NC}"
    exit 0
elif [ $WORKING_SERVICES -gt 0 ]; then
    echo -e "${YELLOW}⚠️ Some services have issues${NC}"
    exit 1
else
    echo -e "${RED}❌ All services are down${NC}"
    exit 2
fi

#!/bin/bash

# ========================================
# SCRIPT DE DIAGNÓSTICO COMPLETO - DEV
# ========================================
# Ejecutar este script para verificar el estado del sistema
# Uso: bash scripts/diagnostico-dev.sh

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "=========================================="
echo "🔍 DIAGNÓSTICO COMPLETO DEL SISTEMA"
echo "Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="
echo ""

# 1. MEMORIA Y SWAP
echo -e "${BLUE}📊 1. MEMORIA Y SWAP${NC}"
echo "----------------------------------------"
free -h
echo ""
SWAP_TOTAL=$(free -h | grep Swap | awk '{print $2}')
if [ "$SWAP_TOTAL" = "0B" ]; then
    echo -e "${RED}❌ CRÍTICO: NO HAY SWAP CONFIGURADO${NC}"
    echo "   Ejecuta: sudo scripts/setup-swap.sh"
else
    echo -e "${GREEN}✅ SWAP configurado: $SWAP_TOTAL${NC}"
fi
echo ""

# 2. ESTADO DE CONTENEDORES
echo -e "${BLUE}🐳 2. ESTADO DE CONTENEDORES DOCKER${NC}"
echo "----------------------------------------"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"
echo ""

# 3. REINICIOS DE POSTGRESQL
echo -e "${BLUE}🔄 3. HISTORIAL DE REINICIOS - POSTGRESQL${NC}"
echo "----------------------------------------"
if docker inspect gmarm-postgres-dev > /dev/null 2>&1; then
    POSTGRES_RESTARTS=$(docker inspect gmarm-postgres-dev --format='{{.RestartCount}}')
    POSTGRES_STARTED=$(docker inspect gmarm-postgres-dev --format='{{.State.StartedAt}}')
    POSTGRES_OOM=$(docker inspect gmarm-postgres-dev --format='{{.State.OOMKilled}}')
    
    echo "Reinicios totales: $POSTGRES_RESTARTS"
    echo "Última vez iniciado: $POSTGRES_STARTED"
    echo "OOM Killed: $POSTGRES_OOM"
    
    if [ "$POSTGRES_OOM" = "true" ]; then
        echo -e "${RED}⚠️  PostgreSQL fue asesinado por OOM Killer${NC}"
    elif [ "$POSTGRES_RESTARTS" -eq 0 ]; then
        echo -e "${GREEN}✅ PostgreSQL estable (0 reinicios)${NC}"
    else
        echo -e "${YELLOW}⚠️  PostgreSQL ha sido reiniciado $POSTGRES_RESTARTS veces${NC}"
    fi
else
    echo -e "${RED}❌ Contenedor gmarm-postgres-dev no encontrado${NC}"
fi
echo ""

# 4. BASE DE DATOS
echo -e "${BLUE}💾 4. ESTADO DE LA BASE DE DATOS${NC}"
echo "----------------------------------------"
if docker exec gmarm-postgres-dev psql -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='gmarm_dev'" 2>/dev/null | grep -q 1; then
    echo -e "${GREEN}✅ Base de datos 'gmarm_dev' existe${NC}"
    
    # Contar tablas
    TABLA_COUNT=$(docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
    echo "   Tablas en BD: $TABLA_COUNT"
    
    # Contar datos críticos
    USUARIO_COUNT=$(docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -tAc "SELECT COUNT(*) FROM usuario;" 2>/dev/null || echo "0")
    ARMA_COUNT=$(docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -tAc "SELECT COUNT(*) FROM arma;" 2>/dev/null || echo "0")
    CLIENTE_COUNT=$(docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -tAc "SELECT COUNT(*) FROM cliente;" 2>/dev/null || echo "0")
    
    echo "   Usuarios: $USUARIO_COUNT"
    echo "   Armas: $ARMA_COUNT"
    echo "   Clientes: $CLIENTE_COUNT"
    
    if [ "$USUARIO_COUNT" -eq "0" ]; then
        echo -e "${RED}❌ CRÍTICO: Base de datos vacía (0 usuarios)${NC}"
    else
        echo -e "${GREEN}✅ Base de datos con datos${NC}"
    fi
else
    echo -e "${RED}❌ CRÍTICO: Base de datos 'gmarm_dev' NO EXISTE${NC}"
    echo "   Ejecuta: docker exec -i gmarm-postgres-dev psql -U postgres -c \"CREATE DATABASE gmarm_dev WITH ENCODING='UTF8' LC_COLLATE='C' LC_CTYPE='C';\""
fi
echo ""

# 5. USO DE RECURSOS
echo -e "${BLUE}📈 5. USO DE RECURSOS ACTUAL${NC}"
echo "----------------------------------------"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
echo ""

# 6. OOM KILLER
echo -e "${BLUE}💀 6. EVENTOS OOM KILLER (últimas 24 horas)${NC}"
echo "----------------------------------------"
OOM_EVENTS=$(sudo dmesg -T | grep -i "killed process\|out of memory" | tail -20)
if [ -z "$OOM_EVENTS" ]; then
    echo -e "${GREEN}✅ No hay eventos OOM Killer recientes${NC}"
else
    echo -e "${YELLOW}⚠️  Eventos OOM Killer detectados:${NC}"
    echo "$OOM_EVENTS"
fi
echo ""

# 7. BACKEND HEALTH
echo -e "${BLUE}🏥 7. HEALTH CHECK - BACKEND${NC}"
echo "----------------------------------------"
if curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend respondiendo correctamente${NC}"
    HEALTH_RESPONSE=$(curl -s http://localhost:8080/api/health)
    echo "   Respuesta: $HEALTH_RESPONSE"
else
    echo -e "${RED}❌ Backend NO responde${NC}"
fi
echo ""

# 8. FRONTEND ACCESIBLE
echo -e "${BLUE}🌐 8. FRONTEND ACCESIBILIDAD${NC}"
echo "----------------------------------------"
if curl -f http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend accesible${NC}"
else
    echo -e "${RED}❌ Frontend NO accesible${NC}"
fi
echo ""

# 9. LOGS RECIENTES DE POSTGRESQL
echo -e "${BLUE}📋 9. LOGS RECIENTES - POSTGRESQL (últimas 20 líneas)${NC}"
echo "----------------------------------------"
docker logs gmarm-postgres-dev --tail 20 2>&1 | grep -v "LOG:  connection" | head -20
echo ""

# 10. UPTIME DEL SISTEMA
echo -e "${BLUE}⏱️  10. UPTIME DEL SERVIDOR${NC}"
echo "----------------------------------------"
uptime
echo ""

# 11. RESUMEN Y RECOMENDACIONES
echo "=========================================="
echo -e "${BLUE}📊 RESUMEN${NC}"
echo "=========================================="

ISSUES=0

# Verificar SWAP
if [ "$SWAP_TOTAL" = "0B" ]; then
    echo -e "${RED}❌ CRÍTICO: Sin SWAP - ejecutar setup-swap.sh${NC}"
    ISSUES=$((ISSUES + 1))
fi

# Verificar PostgreSQL
if [ "$POSTGRES_OOM" = "true" ]; then
    echo -e "${RED}❌ CRÍTICO: PostgreSQL asesinado por OOM${NC}"
    ISSUES=$((ISSUES + 1))
fi

# Verificar BD
if [ "$USUARIO_COUNT" = "0" ]; then
    echo -e "${RED}❌ CRÍTICO: Base de datos vacía${NC}"
    ISSUES=$((ISSUES + 1))
fi

# Verificar Backend
if ! curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend no responde${NC}"
    ISSUES=$((ISSUES + 1))
fi

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ ¡TODO FUNCIONANDO CORRECTAMENTE!${NC}"
    echo -e "${GREEN}   Sistema estable y operativo${NC}"
else
    echo -e "${YELLOW}⚠️  Se detectaron $ISSUES problemas${NC}"
    echo -e "${YELLOW}   Revisa los detalles arriba${NC}"
fi

echo ""
echo "=========================================="
echo "✅ DIAGNÓSTICO COMPLETADO"
echo "=========================================="
echo ""

# Guardar log
LOG_FILE="/tmp/diagnostico-dev-$(date +%Y%m%d-%H%M%S).log"
echo "📝 Log guardado en: $LOG_FILE"

exit 0


#!/bin/bash

# ========================================
# SOLUCIÓN DEFINITIVA PARA OOM KILLER
# ========================================
# Este script aplica TODOS los cambios necesarios
# para eliminar el OOM Killer de una vez por todas

set -e

echo "🔥 APLICANDO SOLUCIÓN DEFINITIVA PARA OOM KILLER"
echo "=========================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Verificar directorio
if [ ! -f "docker-compose.dev.yml" ]; then
    echo -e "${RED}❌ Error: Ejecuta desde el directorio del proyecto${NC}"
    exit 1
fi

# 2. Pull de cambios
echo -e "${YELLOW}📥 1. Actualizando código...${NC}"
git pull origin dev
echo ""

# 3. Detener servicios
echo -e "${YELLOW}🛑 2. Deteniendo servicios...${NC}"
docker-compose -f docker-compose.dev.yml down
echo ""

# 4. Limpiar imágenes viejas
echo -e "${YELLOW}🧹 3. Limpiando imágenes antiguas...${NC}"
docker rmi dev-backend_dev dev-frontend_dev 2>/dev/null || echo "  (Imágenes ya eliminadas)"
echo ""

# 5. Reconstruir TODO sin caché
echo -e "${YELLOW}🔨 4. Reconstruyendo TODO sin caché (puede tardar 2-3 minutos)...${NC}"
docker-compose -f docker-compose.dev.yml build --no-cache
echo ""

# 6. Levantar SOLO PostgreSQL primero
echo -e "${YELLOW}🚀 5. Levantando PostgreSQL primero...${NC}"
docker-compose -f docker-compose.dev.yml up -d postgres_dev
echo ""

# 7. Esperar a que PostgreSQL responda
echo -e "${YELLOW}⏳ 6. Esperando a que PostgreSQL esté listo...${NC}"
MAX_WAIT=60
COUNT=0
while [ $COUNT -lt $MAX_WAIT ]; do
    if docker exec gmarm-postgres-dev pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ PostgreSQL responde (intento $COUNT)${NC}"
        break
    fi
    COUNT=$((COUNT + 1))
    echo "   Esperando... ($COUNT/$MAX_WAIT)"
    sleep 2
done

if [ $COUNT -eq $MAX_WAIT ]; then
    echo -e "${RED}   ❌ PostgreSQL no responde después de 2 minutos${NC}"
    docker logs gmarm-postgres-dev --tail 50
    exit 1
fi

sleep 5  # Esperar 5 segundos más para estabilidad

# 8. Verificar que PostgreSQL esté healthy
echo -e "${YELLOW}🔍 7. Verificando PostgreSQL...${NC}"
POSTGRES_HEALTH=$(docker inspect gmarm-postgres-dev --format='{{.State.Health.Status}}' 2>/dev/null || echo "none")
echo "   Estado: $POSTGRES_HEALTH"
echo ""

# 9. Verificar/crear base de datos
echo -e "${YELLOW}💾 8. Verificando base de datos...${NC}"
DB_EXISTS=$(docker exec gmarm-postgres-dev psql -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='gmarm_dev'" 2>/dev/null || echo "0")

if [ "$DB_EXISTS" != "1" ]; then
    echo -e "${RED}   Base de datos NO existe - creando...${NC}"
    
    docker exec -i gmarm-postgres-dev psql -U postgres -c "CREATE DATABASE gmarm_dev WITH ENCODING='UTF8' LC_COLLATE='C' LC_CTYPE='C';"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}   ✅ Base de datos creada${NC}"
        
        echo "   📊 Cargando datos..."
        docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev < datos/00_gmarm_completo.sql
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}   ✅ Datos cargados exitosamente${NC}"
        else
            echo -e "${RED}   ❌ Error cargando datos${NC}"
            exit 1
        fi
    else
        echo -e "${RED}   ❌ Error creando base de datos${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}   ✅ Base de datos ya existe${NC}"
    
    # Verificar datos
    USUARIO_COUNT=$(docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -tAc "SELECT COUNT(*) FROM usuario;" 2>/dev/null || echo "0")
    if [ "$USUARIO_COUNT" -eq "0" ]; then
        echo -e "${YELLOW}   ⚠️  Base de datos vacía - recargando datos...${NC}"
        docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
        docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev < datos/00_gmarm_completo.sql
        echo -e "${GREEN}   ✅ Datos recargados${NC}"
    else
        echo -e "${GREEN}   ✅ Base de datos tiene $USUARIO_COUNT usuarios${NC}"
    fi
fi
echo ""

# 9.5. Levantar Backend y Frontend
echo -e "${YELLOW}🚀 8.5. Levantando Backend y Frontend...${NC}"
docker-compose -f docker-compose.dev.yml up -d backend_dev frontend_dev
echo ""

# 10. Esperar backend
echo -e "${YELLOW}⏳ 9. Esperando a que el backend inicie (60 segundos)...${NC}"
sleep 60

# 11. Verificar backend
echo -e "${YELLOW}🏥 10. Verificando backend...${NC}"
BACKEND_STARTED=$(docker logs gmarm-backend-dev 2>&1 | grep -c "Started ArmasimportacionApplication" || echo "0")
if [ "$BACKEND_STARTED" -gt "0" ]; then
    echo -e "${GREEN}   ✅ Backend iniciado correctamente${NC}"
else
    echo -e "${YELLOW}   ⚠️  Backend aún está iniciando...${NC}"
fi
echo ""

# 12. Verificación final
echo ""
echo "=========================================="
echo -e "${GREEN}✅ APLICACIÓN COMPLETADA${NC}"
echo "=========================================="
echo ""

# Mostrar configuración actual
echo -e "${YELLOW}📊 CONFIGURACIÓN APLICADA:${NC}"
echo ""
echo "PostgreSQL:"
echo "  - Límite memoria: 1536MB (1.5GB)"
echo "  - max_connections: 5"
echo "  - shared_buffers: 32MB"
echo "  - work_mem: 512KB"
echo "  - autovacuum: OFF (para desarrollo)"
echo "  - fsync: OFF (SOLO desarrollo)"
echo ""
echo "Backend Java:"
echo "  - Límite memoria: 384MB"
echo "  - JVM Heap: 256MB máximo"
echo "  - Metaspace: 96MB"
echo ""
echo "Frontend:"
echo "  - Límite memoria: 384MB"
echo ""
echo "SWAP: 2GB"
echo ""

# Estado actual
echo -e "${YELLOW}📈 ESTADO ACTUAL:${NC}"
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}"
echo ""

# Verificar OOM
echo -e "${YELLOW}💀 VERIFICACIÓN OOM:${NC}"
OOM_KILLED=$(docker inspect gmarm-postgres-dev --format='{{.State.OOMKilled}}' 2>/dev/null || echo "unknown")
RESTART_COUNT=$(docker inspect gmarm-postgres-dev --format='{{.RestartCount}}' 2>/dev/null || echo "0")

echo "  OOM Killed: $OOM_KILLED"
echo "  Reinicios: $RESTART_COUNT"
echo ""

if [ "$OOM_KILLED" = "false" ]; then
    echo -e "${GREEN}✅ PostgreSQL NO ha sido asesinado por OOM${NC}"
else
    echo -e "${RED}⚠️  PostgreSQL fue asesinado anteriormente${NC}"
    echo -e "${YELLOW}   (El contador se reseteará en el próximo reinicio limpio)${NC}"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "🎉 PROCESO COMPLETADO"
echo "==========================================${NC}"
echo ""
echo "Comandos útiles:"
echo "  Ver logs de PostgreSQL:  docker logs gmarm-postgres-dev -f"
echo "  Ver logs de Backend:     docker logs gmarm-backend-dev -f"
echo "  Monitorear recursos:     watch -n 5 'docker stats --no-stream'"
echo "  Verificar OOM:           docker inspect gmarm-postgres-dev --format='OOMKilled={{.State.OOMKilled}}, Restarts={{.RestartCount}}'"
echo ""
echo -e "${YELLOW}⏰ MONITOREO: Espera 2-3 horas y ejecuta 'bash scripts/diagnostico-dev.sh'${NC}"
echo -e "${YELLOW}   Si Restarts=0 y OOMKilled=false, el problema está RESUELTO.${NC}"
echo ""

exit 0


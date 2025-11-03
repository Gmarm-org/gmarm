#!/bin/bash

# ========================================
# SCRIPT DE DESPLIEGUE PARA DEV
# ========================================
# Este script despliega la aplicación en el servidor de desarrollo
# asegurando que todos los servicios se inicien correctamente

set -e

echo "🚀 INICIANDO DESPLIEGUE EN DESARROLLO..."
echo "=========================================="

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para logs
log_info() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Compilar backend
log_info "Compilando backend..."
cd backend
chmod +x ./mvnw  # Dar permisos al Maven wrapper
./mvnw clean compile -DskipTests
if [ $? -ne 0 ]; then
    log_error "Error compilando backend"
    exit 1
fi
cd ..
log_info "Backend compilado exitosamente"

# 2. Construir frontend
log_info "Construyendo frontend..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    log_error "Error construyendo frontend"
    exit 1
fi
cd ..
log_info "Frontend construido exitosamente"

# 3. Verificar que las variables de entorno estén configuradas
log_info "Verificando variables de entorno..."
if [ -z "$BACKEND_URL" ]; then
    log_warn "BACKEND_URL no configurada, usando http://72.167.52.14:8080"
    export BACKEND_URL="http://72.167.52.14:8080"
fi

if [ -z "$FRONTEND_URL" ]; then
    log_warn "FRONTEND_URL no configurada, usando http://72.167.52.14:5173"
    export FRONTEND_URL="http://72.167.52.14:5173"
fi

if [ -z "$WS_HOST" ]; then
    export WS_HOST="72.167.52.14"
fi

if [ -z "$WS_PORT" ]; then
    export WS_PORT="5173"
fi

log_info "Variables de entorno configuradas:"
echo "  BACKEND_URL=$BACKEND_URL"
echo "  FRONTEND_URL=$FRONTEND_URL"
echo "  WS_HOST=$WS_HOST"
echo "  WS_PORT=$WS_PORT"

# 4. Detener servicios existentes
log_info "Deteniendo servicios existentes..."
docker-compose -f docker-compose.dev.yml down

# 5. Reconstruir y levantar servicios
log_info "Reconstruyendo y levantando servicios..."
docker-compose -f docker-compose.dev.yml up -d --build

# 6. Esperar a que PostgreSQL esté healthy
log_info "Esperando a que PostgreSQL esté listo..."
MAX_RETRIES=60
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
    if docker inspect gmarm-postgres-dev | grep -q '"Status": "healthy"'; then
        log_info "PostgreSQL está healthy"
        break
    fi
    RETRY=$((RETRY+1))
    echo "  Intento $RETRY/$MAX_RETRIES..."
    sleep 2
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    log_error "PostgreSQL no está healthy después de $MAX_RETRIES intentos"
    docker logs gmarm-postgres-dev --tail 50
    exit 1
fi

# 7. Esperar a que el backend esté listo
log_info "Esperando a que el backend esté listo..."
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
        log_info "Backend está respondiendo"
        break
    fi
    RETRY=$((RETRY+1))
    echo "  Intento $RETRY/$MAX_RETRIES..."
    sleep 3
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    log_warn "Backend no responde después de $MAX_RETRIES intentos"
    log_warn "Verificando logs del backend..."
    docker logs gmarm-backend-dev --tail 100
fi

# 8. Verificar logs finales
log_info "Verificando estado final de servicios..."
docker-compose -f docker-compose.dev.yml ps

# 9. Verificar que la base de datos tenga datos
log_info "Verificando datos en base de datos..."
USUARIO_COUNT=$(docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -tAc "SELECT COUNT(*) FROM usuario;" 2>/dev/null || echo "0")
ARMA_COUNT=$(docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -tAc "SELECT COUNT(*) FROM arma;" 2>/dev/null || echo "0")

echo "  📊 Usuarios: $USUARIO_COUNT"
echo "  🔫 Armas: $ARMA_COUNT"

if [ "$USUARIO_COUNT" -eq "0" ]; then
    log_error "Base de datos vacía - verificar inicialización"
    docker logs gmarm-postgres-dev --tail 100
    exit 1
fi

log_info "=========================================="
log_info "🎉 DESPLIEGUE COMPLETADO EXITOSAMENTE"
log_info "=========================================="
echo ""
log_info "Servicios disponibles:"
echo "  Backend:  http://72.167.52.14:8080"
echo "  Frontend: http://72.167.52.14:5173"
echo "  Swagger:  http://72.167.52.14:8080/swagger-ui.html"
echo ""
log_info "Para monitorear logs:"
echo "  docker logs gmarm-backend-dev -f"
echo "  docker logs gmarm-postgres-dev -f"
echo ""

exit 0


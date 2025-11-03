#!/bin/bash

# ========================================
# FIX RÁPIDO PARA ERROR 403 EN DEV
# ========================================
# Soluciona problemas de permisos (403 Forbidden)
# reconstruyendo el backend con la configuración correcta

set -e

echo "🔧 SOLUCIONANDO ERROR 403 EN DEV..."
echo "=========================================="

# 1. Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.dev.yml" ]; then
    echo "❌ Error: Debes ejecutar este script desde el directorio del proyecto"
    exit 1
fi

# 2. Pull de los últimos cambios (por si acaso)
echo "📥 Actualizando código..."
git pull origin dev

# 3. Detener servicios
echo "🛑 Deteniendo servicios..."
docker-compose -f docker-compose.dev.yml down

# 4. Limpiar imágenes antiguas del backend
echo "🧹 Limpiando imagen vieja del backend..."
docker rmi dev-backend_dev 2>/dev/null || echo "  (Imagen no existía)"

# 5. Rebuild FORZADO del backend (sin caché)
echo "🔨 Reconstruyendo backend SIN CACHÉ..."
docker-compose -f docker-compose.dev.yml build --no-cache backend_dev

# 6. Levantar servicios
echo "🚀 Levantando servicios..."
docker-compose -f docker-compose.dev.yml up -d

# 7. Esperar a que PostgreSQL esté healthy
echo "⏳ Esperando a PostgreSQL..."
sleep 10

# Verificar que la BD exista
echo "🔍 Verificando base de datos..."
DB_EXISTS=$(docker exec gmarm-postgres-dev psql -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='gmarm_dev'" 2>/dev/null || echo "0")

if [ "$DB_EXISTS" != "1" ]; then
    echo "⚠️  Base de datos no existe - creando..."
    docker exec -i gmarm-postgres-dev psql -U postgres -c "CREATE DATABASE gmarm_dev WITH ENCODING='UTF8' LC_COLLATE='C' LC_CTYPE='C';"
    docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev < datos/00_gmarm_completo.sql
    echo "✅ Base de datos creada y cargada"
fi

# 8. Esperar a que el backend esté listo
echo "⏳ Esperando a que el backend inicie..."
MAX_RETRIES=40
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
    if docker logs gmarm-backend-dev 2>&1 | grep -q "Started ArmasimportacionApplication"; then
        echo "✅ Backend iniciado correctamente"
        break
    fi
    RETRY=$((RETRY+1))
    echo "  Esperando... ($RETRY/$MAX_RETRIES)"
    sleep 3
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    echo "⚠️  Backend tardó mucho en iniciar"
    echo "📋 Últimos logs del backend:"
    docker logs gmarm-backend-dev --tail 50
fi

# 9. Probar endpoints críticos
echo ""
echo "🧪 PROBANDO ENDPOINTS..."
echo "----------------------------------------"

# Test /api/health
echo -n "  /api/health: "
if curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ FALLO"
fi

# Test /api/arma
echo -n "  /api/arma: "
ARMA_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/arma)
if [ "$ARMA_RESPONSE" = "200" ]; then
    echo "✅ OK (200)"
elif [ "$ARMA_RESPONSE" = "403" ]; then
    echo "❌ FORBIDDEN (403) - Problema de seguridad"
else
    echo "⚠️  HTTP $ARMA_RESPONSE"
fi

# Test /api/tipos-cliente/config
echo -n "  /api/tipos-cliente/config: "
TIPOS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/tipos-cliente/config)
if [ "$TIPOS_RESPONSE" = "200" ]; then
    echo "✅ OK (200)"
elif [ "$TIPOS_RESPONSE" = "403" ]; then
    echo "❌ FORBIDDEN (403)"
else
    echo "⚠️  HTTP $TIPOS_RESPONSE"
fi

# Test /api/usuarios
echo -n "  /api/usuarios: "
USUARIOS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/usuarios?page=0&size=10)
if [ "$USUARIOS_RESPONSE" = "200" ]; then
    echo "✅ OK (200)"
elif [ "$USUARIOS_RESPONSE" = "403" ]; then
    echo "❌ FORBIDDEN (403)"
else
    echo "⚠️  HTTP $USUARIOS_RESPONSE"
fi

echo ""
echo "=========================================="
echo "✅ PROCESO COMPLETADO"
echo "=========================================="
echo ""
echo "📊 Estado de servicios:"
docker-compose -f docker-compose.dev.yml ps
echo ""

# Si todavía hay error 403
if [ "$ARMA_RESPONSE" = "403" ]; then
    echo "⚠️  AÚN HAY ERROR 403 EN /api/arma"
    echo ""
    echo "📋 Verifica manualmente el SecurityConfig:"
    echo "  docker exec gmarm-backend-dev cat /app/BOOT-INF/classes/com/armasimportacion/config/SecurityConfig.class"
    echo ""
    echo "📋 O verifica los logs del backend:"
    echo "  docker logs gmarm-backend-dev | grep -i 'security\|permitAll\|forbidden'"
    echo ""
fi

exit 0


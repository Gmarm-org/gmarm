#!/bin/bash

# ============================================================
# FIX DEFINITIVO - POSTGRESQL EN LOOP INFINITO (DEV)
# ============================================================
# Este script MATA FORZOSAMENTE PostgreSQL si está en loop
# y lo reinicia con la BD garantizada ANTES del backend
# ============================================================

set -e

echo "🔥 =============================================="
echo "🔥 FIX POSTGRESQL EN LOOP - FORZADO Y DEFINITIVO"
echo "🔥 =============================================="

# 1. Diagnóstico inicial
echo ""
echo "📊 Estado actual del sistema:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.BlockIO}}"

# 2. MATAR FORZOSAMENTE todos los contenedores
echo ""
echo "💀 Matando FORZOSAMENTE todos los contenedores..."
docker kill gmarm-postgres-dev gmarm-backend-dev gmarm-frontend-dev 2>/dev/null || true

# 3. ELIMINAR contenedores
echo ""
echo "🗑️  Eliminando contenedores..."
docker rm -f gmarm-postgres-dev gmarm-backend-dev gmarm-frontend-dev 2>/dev/null || true

# 4. ELIMINAR volumen de PostgreSQL (fuerza recreación limpia)
echo ""
echo "🗑️  Eliminando volumen de PostgreSQL (forzar recreación)..."
docker volume rm gmarm_postgres_data_dev 2>/dev/null || true

# 5. Esperar a que todo esté completamente detenido
echo ""
echo "⏳ Esperando 5 segundos para asegurar limpieza..."
sleep 5

# 6. Verificar que no hay procesos zombies
echo ""
echo "🧟 Verificando procesos zombie de Docker..."
docker ps -aq --filter "name=gmarm-" | xargs docker rm -f 2>/dev/null || true

# 7. FASE 1: Levantar SOLO PostgreSQL (con volumen LIMPIO)
echo ""
echo "🚀 FASE 1: Levantando SOLO PostgreSQL con volumen limpio..."
docker-compose -f docker-compose.dev.yml up -d postgres_dev

# 8. Esperar agresivamente a que PostgreSQL esté listo
echo ""
echo "⏳ FASE 2: Esperando a que PostgreSQL esté REALMENTE listo..."

MAX_ATTEMPTS=60
ATTEMPT=0
POSTGRES_READY=false

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    
    # Verificar pg_isready
    if docker exec gmarm-postgres-dev pg_isready -U postgres > /dev/null 2>&1; then
        echo "✅ PostgreSQL respondiendo en intento $ATTEMPT/$MAX_ATTEMPTS"
        POSTGRES_READY=true
        break
    fi
    
    # Verificar que PostgreSQL no esté en loop
    CPU_USAGE=$(docker stats --no-stream --format "{{.CPUPerc}}" gmarm-postgres-dev | sed 's/%//')
    if [ ! -z "$CPU_USAGE" ]; then
        CPU_INT=$(echo "$CPU_USAGE" | cut -d'.' -f1)
        if [ "$CPU_INT" -gt 30 ]; then
            echo "🚨 ALERTA: PostgreSQL usando $CPU_USAGE% CPU en intento $ATTEMPT - posible loop"
        fi
    fi
    
    echo "⏳ Esperando PostgreSQL... intento $ATTEMPT/$MAX_ATTEMPTS"
    sleep 2
done

if [ "$POSTGRES_READY" = false ]; then
    echo ""
    echo "❌ ERROR: PostgreSQL no respondió después de $MAX_ATTEMPTS intentos"
    echo "❌ Ejecuta: docker logs gmarm-postgres-dev"
    exit 1
fi

# 9. FASE 3: Crear la base de datos EXPLICITAMENTE
echo ""
echo "🗄️  FASE 3: Creando base de datos gmarm_dev..."

# Intentar crear varias veces por si PostgreSQL aún no está completamente listo
for i in {1..5}; do
    if docker exec gmarm-postgres-dev psql -U postgres -c "CREATE DATABASE gmarm_dev WITH ENCODING='UTF8' LC_COLLATE='C' LC_CTYPE='C';" 2>&1 | grep -q "already exists\|CREATE DATABASE"; then
        echo "✅ Base de datos gmarm_dev creada/existe"
        break
    fi
    echo "⏳ Reintentando crear BD... intento $i/5"
    sleep 3
done

# 10. FASE 4: Cargar datos del SQL maestro
echo ""
echo "📥 FASE 4: Cargando datos del SQL maestro..."
cat datos/00_gmarm_completo.sql | docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev 2>&1 | grep -E "INSERT|CREATE|ERROR" | tail -50

# 11. Verificar que los datos se cargaron
echo ""
echo "🔍 FASE 5: Verificando datos cargados..."
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "
    SELECT 'Usuarios' as tabla, COUNT(*) as total FROM usuario
    UNION ALL
    SELECT 'Armas', COUNT(*) FROM arma
    UNION ALL
    SELECT 'Series', COUNT(*) FROM arma_serie
    UNION ALL
    SELECT 'Provincias', COUNT(*) FROM provincia;
"

# 12. Verificar uso de memoria de PostgreSQL AHORA (debe ser bajo)
echo ""
echo "📊 Uso de memoria de PostgreSQL AHORA (debe ser <30%):"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" gmarm-postgres-dev

# 13. FASE 6: Ahora sí, levantar backend y frontend
echo ""
echo "🚀 FASE 6: Levantando backend y frontend (con --build para xlsx)..."
docker-compose -f docker-compose.dev.yml up -d --build backend_dev frontend_dev

# 14. Esperar a que el backend inicie
echo ""
echo "⏳ FASE 7: Esperando a que Spring Boot inicie (90 segundos)..."
sleep 90

# 15. Diagnóstico final
echo ""
echo "🔍 DIAGNÓSTICO FINAL:"
bash scripts/diagnostico-dev.sh

echo ""
echo "✅ =============================================="
echo "✅ FIX COMPLETADO - POSTGRESQL SIN LOOP"
echo "✅ =============================================="
echo ""
echo "🎯 URLs:"
echo "   Frontend: http://72.167.52.14:5173"
echo "   Backend:  http://72.167.52.14:8080"
echo ""
echo "📊 Monitorea con: docker stats --no-stream"
echo ""
echo "⚠️  Si PostgreSQL vuelve a 100% RAM/CPU → el backend está intentando conectarse a BD inexistente"
echo "⚠️  En ese caso, DETÉN el backend: docker stop gmarm-backend-dev"
echo ""


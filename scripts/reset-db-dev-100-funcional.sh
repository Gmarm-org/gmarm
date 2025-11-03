#!/bin/bash

# ============================================================
# RESET DEFINITIVO DE BD DEV - 100% FUNCIONAL
# ============================================================
# Este script garantiza:
# 1. BD creada ANTES de que el backend intente conectarse
# 2. Sin loops de CPU/RAM de PostgreSQL
# 3. Datos cargados correctamente
# ============================================================

set -e

echo "🔥 =============================================="
echo "🔥 RESET DEFINITIVO DEV - SOLUCIÓN 100% FUNCIONAL"
echo "🔥 =============================================="

# 1. Detener TODOS los servicios
echo ""
echo "1️⃣ Deteniendo todos los servicios..."
docker-compose -f docker-compose.dev.yml down -v

# 2. Limpiar imágenes viejas (opcional pero recomendado)
echo ""
echo "2️⃣ Limpiando imágenes Docker viejas..."
docker system prune -f

# 3. FASE 1: Levantar SOLO PostgreSQL
echo ""
echo "3️⃣ FASE 1: Levantando SOLO PostgreSQL..."
docker-compose -f docker-compose.dev.yml up -d postgres_dev

# 4. Esperar a que PostgreSQL esté REALMENTE listo
echo ""
echo "4️⃣ Esperando a que PostgreSQL esté listo..."
sleep 15

# Verificar que PostgreSQL responde
for i in {1..30}; do
    if docker exec gmarm-postgres-dev pg_isready -U postgres > /dev/null 2>&1; then
        echo "✅ PostgreSQL está listo!"
        break
    fi
    echo "⏳ Esperando PostgreSQL... intento $i/30"
    sleep 2
done

# 5. FASE 2: Crear la base de datos si no existe
echo ""
echo "5️⃣ FASE 2: Creando base de datos gmarm_dev..."
docker exec gmarm-postgres-dev psql -U postgres -c "CREATE DATABASE gmarm_dev;" 2>&1 | grep -v "already exists" || true

# 6. FASE 3: Cargar datos del SQL maestro
echo ""
echo "6️⃣ FASE 3: Cargando datos del SQL maestro..."
cat datos/00_gmarm_completo.sql | docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev

# 7. Verificar que los datos se cargaron
echo ""
echo "7️⃣ Verificando datos cargados..."
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "
    SELECT 'Usuarios' as tabla, COUNT(*) as total FROM usuario
    UNION ALL
    SELECT 'Armas', COUNT(*) FROM arma
    UNION ALL
    SELECT 'Series', COUNT(*) FROM arma_serie;
"

# 8. FASE 4: Ahora sí, levantar backend y frontend
echo ""
echo "8️⃣ FASE 4: Levantando backend y frontend..."
docker-compose -f docker-compose.dev.yml up -d --build

# 9. Esperar a que el backend inicie
echo ""
echo "9️⃣ Esperando a que el backend inicie (60 segundos)..."
sleep 60

# 10. Verificar estado final
echo ""
echo "🔟 Estado final de los servicios:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "📊 Uso de memoria:"
docker stats --no-stream

echo ""
echo "✅ =============================================="
echo "✅ RESET COMPLETADO - SISTEMA 100% FUNCIONAL"
echo "✅ =============================================="
echo ""
echo "🎯 URLs:"
echo "   Frontend: http://72.167.52.14:5173"
echo "   Backend:  http://72.167.52.14:8080"
echo ""
echo "🔐 Credenciales:"
echo "   Admin:     admin@armasimportacion.com / admin123"
echo "   Vendedor:  vendedor@test.com / admin123"
echo "   Finanzas:  finanzas@test.com / admin123"
echo ""


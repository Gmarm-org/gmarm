#!/bin/bash

# ========================================
# SCRIPT PARA REINICIAR SERVIDOR DE DESARROLLO
# ========================================
# Ejecutar en el servidor: ssh ubuntu@72.167.52.14

set -e

echo "🔄 REINICIANDO SERVIDOR DE DESARROLLO GMARM"
echo "==========================================="
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.dev.yml" ]; then
    echo "❌ Error: No se encontró docker-compose.dev.yml"
    echo "📁 Asegúrate de estar en: /home/ubuntu/deploy/dev"
    exit 1
fi

echo "✅ Directorio correcto"
echo ""

# 1. Mostrar estado actual
echo "📊 Estado actual de contenedores:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# 2. Detener servicios
echo "🛑 Deteniendo servicios..."
docker-compose -f docker-compose.dev.yml down
echo "✅ Servicios detenidos"
echo ""

# 3. Limpiar volúmenes
echo "🗑️  Limpiando volúmenes..."
docker-compose -f docker-compose.dev.yml down -v
echo "✅ Volúmenes limpiados"
echo ""

# 4. Pull últimos cambios
echo "🔄 Obteniendo últimos cambios de GitHub..."
git fetch origin
git reset --hard origin/dev
git pull origin dev
echo "✅ Código actualizado"
echo ""

# 5. Limpiar sistema Docker
echo "🧹 Limpiando sistema Docker..."
docker system prune -f
echo "✅ Sistema limpio"
echo ""

# 6. Rebuild y levantar servicios
echo "🔨 Construyendo y levantando servicios..."
docker-compose -f docker-compose.dev.yml up -d --build
echo "✅ Servicios iniciados"
echo ""

# 7. Esperar a que PostgreSQL esté listo
echo "⏳ Esperando a que PostgreSQL esté listo..."
for i in {1..30}; do
    if docker exec gmarm-postgres-dev pg_isready -U postgres > /dev/null 2>&1; then
        echo "✅ PostgreSQL listo"
        break
    fi
    echo "⏳ Intento $i/30: Esperando PostgreSQL..."
    sleep 5
done

if ! docker exec gmarm-postgres-dev pg_isready -U postgres > /dev/null 2>&1; then
    echo "❌ PostgreSQL no está respondiendo"
    echo "📋 Logs de PostgreSQL:"
    docker logs gmarm-postgres-dev --tail 50
    exit 1
fi
echo ""

# 8. Esperar a que Backend esté listo
echo "⏳ Esperando a que Backend esté listo..."
for i in {1..20}; do
    if curl -f -s http://localhost:8080/api/health > /dev/null 2>&1; then
        echo "✅ Backend listo"
        break
    fi
    echo "⏳ Intento $i/20: Esperando Backend..."
    sleep 10
done

if ! curl -f -s http://localhost:8080/api/health > /dev/null 2>&1; then
    echo "⚠️  Backend puede estar aún iniciando..."
    echo "📋 Logs del Backend:"
    docker logs gmarm-backend-dev --tail 100
fi
echo ""

# 9. Esperar a que Frontend esté listo
echo "⏳ Esperando a que Frontend esté listo..."
for i in {1..15}; do
    if curl -f -s http://localhost:5173 > /dev/null 2>&1; then
        echo "✅ Frontend listo"
        break
    fi
    echo "⏳ Intento $i/15: Esperando Frontend..."
    sleep 5
done

if ! curl -f -s http://localhost:5173 > /dev/null 2>&1; then
    echo "⚠️  Frontend puede estar aún iniciando..."
    echo "📋 Logs del Frontend:"
    docker logs gmarm-frontend-dev --tail 50
fi
echo ""

# 10. Verificar datos en base de datos
echo "🗄️  Verificando datos en base de datos..."
USUARIOS=$(docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -t -c "SELECT COUNT(*) FROM usuario;" 2>/dev/null | tr -d ' ')
ROLES=$(docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -t -c "SELECT COUNT(*) FROM usuario_rol;" 2>/dev/null | tr -d ' ')

if [ ! -z "$USUARIOS" ] && [ "$USUARIOS" -gt 0 ]; then
    echo "✅ Usuarios en BD: $USUARIOS"
else
    echo "⚠️  No hay usuarios en BD, ejecutando SQL maestro..."
    cat datos/00_gmarm_completo.sql | docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev
    USUARIOS=$(docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -t -c "SELECT COUNT(*) FROM usuario;" | tr -d ' ')
    echo "✅ Usuarios creados: $USUARIOS"
fi

if [ ! -z "$ROLES" ] && [ "$ROLES" -gt 0 ]; then
    echo "✅ Roles asignados: $ROLES"
else
    echo "⚠️  No hay roles asignados, ejecutando fix..."
    cat datos/fix_admin_roles.sql | docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev 2>/dev/null || true
fi
echo ""

# 11. Estado final
echo "📊 ESTADO FINAL:"
echo "==============="
docker-compose -f docker-compose.dev.yml ps
echo ""

echo "🌐 URLs DE ACCESO:"
echo "=================="
echo "Frontend: http://72.167.52.14:5173"
echo "Backend API: http://72.167.52.14:8080/api"
echo "Health Check: http://72.167.52.14:8080/api/health"
echo ""

echo "🔑 CREDENCIALES POR DEFECTO:"
echo "============================"
echo "Admin: admin@armasimportacion.com / admin123"
echo ""

echo "📝 COMANDOS ÚTILES:"
echo "==================="
echo "Ver logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "Ver logs backend: docker logs gmarm-backend-dev -f"
echo "Ver logs frontend: docker logs gmarm-frontend-dev -f"
echo "Reiniciar: docker-compose -f docker-compose.dev.yml restart"
echo ""

echo "🎉 ¡SERVIDOR REINICIADO EXITOSAMENTE!"

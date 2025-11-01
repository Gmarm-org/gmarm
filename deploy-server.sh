#!/bin/bash

# ========================================
# SCRIPT DE DESPLIEGUE PARA SERVIDOR
# ========================================
# Este script se ejecuta en el servidor después del CI/CD

set -e  # Salir si hay algún error

echo "🚀 Iniciando despliegue en servidor..."

# Obtener el directorio actual
CURRENT_DIR=$(pwd)
echo "📁 Directorio actual: $CURRENT_DIR"

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.dev.yml" ] && [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ Error: No se encontraron archivos docker-compose en el directorio actual"
    echo "📁 Contenido del directorio:"
    ls -la
    exit 1
fi

# Determinar el archivo de compose a usar
if [ -f "docker-compose.dev.yml" ]; then
    COMPOSE_FILE="docker-compose.dev.yml"
    echo "🔧 Usando configuración de DESARROLLO"
elif [ -f "docker-compose.prod.yml" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    echo "🚀 Usando configuración de PRODUCCIÓN"
else
    echo "❌ Error: No se encontró archivo docker-compose válido"
    exit 1
fi

echo "📋 Archivo de compose: $COMPOSE_FILE"

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado"
    exit 1
fi

# Verificar que Docker Compose esté instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado"
    exit 1
fi

echo "✅ Docker y Docker Compose están instalados"

# Detener y eliminar contenedores existentes
echo "🛑 Deteniendo contenedores existentes..."
# Intentar detener con docker-compose primero
docker-compose -f $COMPOSE_FILE down --remove-orphans || true

# Limpiar contenedores zombies que puedan quedar
echo "🧹 Limpiando contenedores huérfanos (forzado)..."
# Eliminar contenedores gmarm- manualmente uno por uno para evitar problemas
for container in $(docker ps -a -q --filter "name=gmarm-"); do
    echo "  Eliminando contenedor $container..."
    docker stop $container 2>/dev/null || true
    docker rm -f $container 2>/dev/null || true
done

# Limpiar redes huérfanas que puedan quedar
echo "🧹 Limpiando redes huérfanas..."
docker network prune -f || true

# Esperar un momento para que Docker procese la limpieza
sleep 2

# Limpiar imágenes no utilizadas (PERO NO volúmenes)
echo "🧹 Limpiando imágenes no utilizadas..."
docker system prune -f --volumes=false

# Construir las imágenes (sin --no-cache para despliegues más rápidos)
echo "🔨 Construyendo imágenes Docker..."
docker-compose -f $COMPOSE_FILE build

# Crear directorio de uploads si no existe
echo "📁 Creando directorio de uploads..."
mkdir -p backend/uploads

# Dar permisos a los scripts si existen
if [ -f "setup-docker-dev.sh" ]; then
    echo "🔐 Dando permisos a setup-docker-dev.sh..."
    chmod +x setup-docker-dev.sh
fi

if [ -f "check-docker-status.sh" ]; then
    echo "🔐 Dando permisos a check-docker-status.sh..."
    chmod +x check-docker-status.sh
fi

# Iniciar los servicios (forzar recreación para evitar conflictos)
echo "🚀 Iniciando servicios..."
docker-compose -f $COMPOSE_FILE up -d --force-recreate

# Mostrar logs iniciales del backend para diagnóstico
echo "📋 Logs iniciales del backend (últimas 20 líneas):"
sleep 5  # Esperar un poco para que arranque
docker-compose -f $COMPOSE_FILE logs --tail=20 backend_dev 2>&1 || echo "⚠️  Backend aún no tiene logs"

# Esperar a que PostgreSQL esté listo
echo "⏳ Esperando a que PostgreSQL esté listo..."
for i in {1..30}; do
if docker exec gmarm-postgres-dev pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL está funcionando"
        break
    fi
    echo "⏳ Intento $i/30: PostgreSQL aún no está listo..."
    sleep 5
done

# Verificar que PostgreSQL esté funcionando después de los intentos
if ! docker exec gmarm-postgres-dev pg_isready -U postgres > /dev/null 2>&1; then
    echo "❌ Error: PostgreSQL no está funcionando después de 30 intentos"
    echo "📋 Logs de PostgreSQL:"
    docker-compose -f $COMPOSE_FILE logs postgres_dev
    exit 1
fi

# Verificar si la base de datos existe y tiene tablas
echo "🔍 Verificando si la base de datos necesita inicialización..."

# Primero verificar si la BD existe
DB_EXISTS=$(docker exec gmarm-postgres-dev psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='gmarm_dev';" 2>/dev/null | xargs || echo "0")

if [ "$DB_EXISTS" = "0" ] || [ -z "$DB_EXISTS" ]; then
    echo "⚠️ Base de datos gmarm_dev NO existe, creándola manualmente..."
    docker exec gmarm-postgres-dev psql -U postgres -c "CREATE DATABASE gmarm_dev ENCODING 'UTF8';" 2>/dev/null || echo "BD puede existir ya"
    
    # Esperar un momento
    sleep 5
    
    # Cargar SQL maestro
    echo "📥 Cargando SQL maestro..."
    if [ -f "datos/00_gmarm_completo.sql" ]; then
        docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev < datos/00_gmarm_completo.sql
        echo "✅ SQL maestro cargado exitosamente"
    else
        echo "❌ Error: archivo 00_gmarm_completo.sql no encontrado"
        exit 1
    fi
    
    TABLE_COUNT="999"  # Ya lo cargamos manualmente
else
    echo "✅ Base de datos gmarm_dev existe"
    # Verificar si tiene tablas
    TABLE_COUNT=$(docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs || echo "0")
fi

if [ "$TABLE_COUNT" = "0" ] || [ -z "$TABLE_COUNT" ]; then
    echo "⚠️  Base de datos vacía detectada, cargando SQL maestro..."
    
    if [ -f "datos/00_gmarm_completo.sql" ]; then
        # Ejecutar SQL maestro con codificación UTF-8
        echo "📄 Ejecutando script SQL maestro..."
        cat "datos/00_gmarm_completo.sql" | docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev 2>&1
        
        if [ $? -eq 0 ]; then
            echo "✅ SQL maestro ejecutado exitosamente"
        else
            echo "⚠️  Error al ejecutar SQL maestro, pero continuando..."
        fi
    else
        echo "⚠️  No se encontró datos/00_gmarm_completo.sql"
    fi
else
    echo "✅ Base de datos ya tiene $TABLE_COUNT tablas"
fi

# Esperar a que el backend esté listo
echo "⏳ Esperando a que el backend esté listo..."
for i in {1..20}; do
if curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
    echo "✅ Backend está funcionando"
        break
    fi
    echo "⏳ Intento $i/20: Backend aún no está listo..."
    sleep 10
done

# Verificar que el backend esté funcionando después de los intentos
if ! curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
    echo "❌ Backend no está funcionando después de 20 intentos"
    echo "📋 Verificando estado de contenedores:"
    docker-compose -f $COMPOSE_FILE ps
    echo ""
    echo "📋 Logs del backend (últimas 50 líneas):"
    docker-compose -f $COMPOSE_FILE logs --tail=50 backend_dev
    echo ""
    echo "📋 Verificando si el contenedor del backend está corriendo:"
    docker ps | grep backend_dev || echo "❌ Contenedor backend_dev NO está corriendo"
    exit 1
fi

# Verificar que el frontend esté funcionando
echo "⏳ Esperando a que el frontend esté listo..."
for i in {1..15}; do
if curl -f http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Frontend está funcionando"
        break
    fi
    echo "⏳ Intento $i/15: Frontend aún no está listo..."
    sleep 5
done

if ! curl -f http://localhost:5173 > /dev/null 2>&1; then
    echo "⚠️  Frontend puede estar aún iniciando..."
    echo "📋 Logs del frontend:"
    docker-compose -f $COMPOSE_FILE logs frontend_dev
fi

# Mostrar estado final
echo ""
echo "🎉 ¡Despliegue completado exitosamente!"
echo ""
echo "📋 Estado de los contenedores:"
docker-compose -f $COMPOSE_FILE ps
echo ""
echo "🌐 URLs de acceso:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:8080/api"
echo "   Swagger UI: http://localhost:8080/swagger-ui.html"
echo ""
echo "🔑 Credenciales por defecto:"
echo "   Administrador: admin / admin123"
echo "   Vendedor: vendedor1 / vendedor123"
echo "   Test: test / test123"
echo ""
echo "📝 Comandos útiles:"
echo "   Ver logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "   Detener: docker-compose -f $COMPOSE_FILE down"
echo "   Reiniciar: docker-compose -f $COMPOSE_FILE restart" 
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

# Detener contenedores existentes
# IMPORTANTE: NO usar --volumes para preservar datos de la base de datos
echo "🛑 Deteniendo contenedores existentes..."
docker-compose -f $COMPOSE_FILE down --remove-orphans || true

# Limpiar imágenes no utilizadas
echo "🧹 Limpiando imágenes no utilizadas..."
docker system prune -f

# Construir las imágenes
echo "🔨 Construyendo imágenes Docker..."
docker-compose -f $COMPOSE_FILE build --no-cache

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

# Iniciar los servicios
echo "🚀 Iniciando servicios..."
docker-compose -f $COMPOSE_FILE up -d

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
    echo "⚠️  Backend puede estar aún iniciando..."
    echo "📋 Logs del backend:"
    docker-compose -f $COMPOSE_FILE logs backend_dev
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
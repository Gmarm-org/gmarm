#!/bin/bash

# ========================================
# SCRIPT DE INICIO PARA DESARROLLO DOCKER
# ========================================
# Este script configura y ejecuta el sistema GMARM en Docker
# Para usar en servidor Ubuntu con Docker

set -e  # Salir si hay algún error

echo "🚀 Iniciando GMARM en modo desarrollo con Docker..."

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor instala Docker primero."
    exit 1
fi

# Verificar que Docker Compose esté instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado. Por favor instala Docker Compose primero."
    exit 1
fi

echo "✅ Docker y Docker Compose están instalados"

# Detener contenedores existentes si los hay
echo "🛑 Deteniendo contenedores existentes..."
docker-compose -f docker-compose.dev.yml down --volumes --remove-orphans

# Limpiar imágenes anteriores (opcional)
echo "🧹 Limpiando imágenes anteriores..."
docker system prune -f

# Construir las imágenes
echo "🔨 Construyendo imágenes Docker..."
docker-compose -f docker-compose.dev.yml build --no-cache

# Crear directorio de uploads si no existe
echo "📁 Creando directorio de uploads..."
mkdir -p backend/uploads

# Iniciar los servicios
echo "🚀 Iniciando servicios..."
docker-compose -f docker-compose.dev.yml up -d

# Esperar a que PostgreSQL esté listo
echo "⏳ Esperando a que PostgreSQL esté listo..."
sleep 10

# Verificar que los servicios estén funcionando
echo "🔍 Verificando servicios..."

# Verificar PostgreSQL
if docker exec gmarm-postgres-dev pg_isready -U postgres; then
    echo "✅ PostgreSQL está funcionando"
else
    echo "❌ Error: PostgreSQL no está funcionando"
    exit 1
fi

# Verificar Backend
echo "⏳ Esperando a que el backend esté listo..."
sleep 15

if curl -f http://localhost:8080/api/health 2>/dev/null; then
    echo "✅ Backend está funcionando"
else
    echo "⚠️  Backend puede estar aún iniciando..."
fi

# Verificar Frontend
echo "⏳ Esperando a que el frontend esté listo..."
sleep 10

if curl -f http://localhost:5173 2>/dev/null; then
    echo "✅ Frontend está funcionando"
else
    echo "⚠️  Frontend puede estar aún iniciando..."
fi

echo ""
echo "🎉 ¡Sistema GMARM iniciado exitosamente!"
echo ""
echo "📋 Información de acceso:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:8080/api"
echo "   Swagger UI: http://localhost:8080/swagger-ui.html"
echo "   PostgreSQL: localhost:5432"
echo ""
echo "🔑 Credenciales por defecto:"
echo "   Administrador: admin / admin123"
echo "   Vendedor: vendedor1 / vendedor123"
echo "   Test: test / test123"
echo ""
echo "📝 Comandos útiles:"
echo "   Ver logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "   Detener: docker-compose -f docker-compose.dev.yml down"
echo "   Reiniciar: docker-compose -f docker-compose.dev.yml restart"
echo ""
echo "🔍 Para ver los logs en tiempo real:"
echo "   docker-compose -f docker-compose.dev.yml logs -f [servicio]"
echo "   Ejemplo: docker-compose -f docker-compose.dev.yml logs -f backend_dev" 
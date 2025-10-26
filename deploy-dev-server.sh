#!/bin/bash

# ========================================
# SCRIPT DE DESPLIEGUE PARA SERVIDOR DE DESARROLLO
# ========================================
# Este script despliega la aplicación en modo desarrollo en el servidor

set -e  # Salir si hay algún error

echo "🚀 INICIANDO DESPLIEGUE EN SERVIDOR DE DESARROLLO..."

# ========================================
# VERIFICACIONES PREVIAS
# ========================================
echo "🔍 Verificando requisitos..."

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

# ========================================
# CONFIGURACIÓN
# ========================================
echo "⚙️ Configurando variables de entorno..."

# Crear archivo de variables de entorno para el servidor
cat > .env.dev.local << EOF
# Configuración para servidor de desarrollo
POSTGRES_DB=gmarm_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432

BACKEND_PORT=8080
BACKEND_URL=http://72.167.52.14:8080

FRONTEND_PORT=5173
FRONTEND_URL=http://72.167.52.14:5173

NODE_ENV=development
SPRING_PROFILES_ACTIVE=docker
EOF

echo "✅ Archivo .env.dev.local creado"

# ========================================
# DETENER SERVICIOS EXISTENTES
# ========================================
echo "🛑 Deteniendo servicios existentes..."
docker-compose -f docker-compose.dev.yml down --remove-orphans || true

# ========================================
# LIMPIAR IMÁGENES Y VOLÚMENES
# ========================================
echo "🧹 Limpiando recursos Docker..."

# Eliminar contenedores huérfanos
docker container prune -f

# Eliminar imágenes no utilizadas
docker image prune -f

# Eliminar volúmenes no utilizados (¡CUIDADO! Esto elimina datos)
read -p "⚠️ ¿Deseas eliminar volúmenes de base de datos? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️ Eliminando volúmenes..."
    docker volume prune -f
    echo "✅ Volúmenes eliminados"
else
    echo "ℹ️ Manteniendo volúmenes existentes"
fi

# ========================================
# CONSTRUIR Y DESPLEGAR
# ========================================
echo "🔨 Construyendo y desplegando servicios..."

# Construir y levantar servicios
docker-compose -f docker-compose.dev.yml --env-file .env.dev.local up --build -d

echo "✅ Servicios desplegados"

# ========================================
# VERIFICAR ESTADO
# ========================================
echo "🔍 Verificando estado de los servicios..."

# Esperar un momento para que los servicios se inicien
sleep 10

# Mostrar estado de los contenedores
echo "📊 Estado de los contenedores:"
docker-compose -f docker-compose.dev.yml ps

# Verificar que los servicios estén corriendo
echo "🔍 Verificando servicios..."
if ! docker-compose -f docker-compose.dev.yml ps | grep -q "backend_dev.*Up"; then
    echo "❌ Backend no está corriendo"
    echo "📋 Logs del backend:"
    docker-compose -f docker-compose.dev.yml logs --tail=50 backend_dev
    exit 1
fi

if ! docker-compose -f docker-compose.dev.yml ps | grep -q "frontend_dev.*Up"; then
    echo "❌ Frontend no está corriendo"
    echo "📋 Logs del frontend:"
    docker-compose -f docker-compose.dev.yml logs --tail=50 frontend_dev
    exit 1
fi

echo "✅ Todos los servicios están corriendo"

# Verificar logs del backend
echo "📋 Logs del backend:"
docker-compose -f docker-compose.dev.yml logs --tail=20 backend_dev

# Verificar logs del frontend
echo "📋 Logs del frontend:"
docker-compose -f docker-compose.dev.yml logs --tail=20 frontend_dev

# ========================================
# VERIFICAR CONECTIVIDAD
# ========================================
echo "🌐 Verificando conectividad..."

# Verificar que el backend esté respondiendo
echo "🔍 Probando backend..."
if curl -s http://localhost:8080/health > /dev/null; then
    echo "✅ Backend respondiendo en puerto 8080"
else
    echo "❌ Backend no responde en puerto 8080"
fi

# Verificar que el frontend esté respondiendo
echo "🔍 Probando frontend..."
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Frontend respondiendo en puerto 5173"
else
    echo "❌ Frontend no responde en puerto 5173"
fi

# ========================================
# INFORMACIÓN FINAL
# ========================================
echo ""
echo "🎉 DESPLIEGUE COMPLETADO EXITOSAMENTE!"
echo ""
echo "📱 FRONTEND: http://72.167.52.14:5173"
echo "🔧 BACKEND: http://72.167.52.14:8080"
echo "🗄️ BASE DE DATOS: localhost:5432"
echo ""
echo "📋 COMANDOS ÚTILES:"
echo "  Ver logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "  Ver estado: docker-compose -f docker-compose.dev.yml ps"
echo "  Detener: docker-compose -f docker-compose.dev.yml down"
echo "  Reiniciar: docker-compose -f docker-compose.dev.yml restart"
echo ""
echo "🔍 Para verificar CORS, abre el frontend y revisa la consola del navegador"
echo ""

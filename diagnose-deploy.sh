#!/bin/bash

# ========================================
# SCRIPT DE DIAGNÓSTICO PARA DEPLOY
# ========================================
# Este script diagnostica problemas comunes en el deploy

echo "🔍 DIAGNÓSTICO DE DEPLOY INICIADO..."

# ========================================
# VERIFICAR ARCHIVOS
# ========================================
echo "📁 Verificando archivos de configuración..."

if [ ! -f "docker-compose.dev.yml" ]; then
    echo "❌ docker-compose.dev.yml no encontrado"
    exit 1
fi

if [ ! -f "deploy-dev-server.sh" ]; then
    echo "❌ deploy-dev-server.sh no encontrado"
    exit 1
fi

echo "✅ Archivos de configuración encontrados"

# ========================================
# VERIFICAR DOCKER COMPOSE
# ========================================
echo "🐳 Verificando Docker Compose..."

# Verificar que docker-compose funcione
if ! docker-compose -f docker-compose.dev.yml config > /dev/null 2>&1; then
    echo "❌ Error en docker-compose.dev.yml"
    docker-compose -f docker-compose.dev.yml config
    exit 1
fi

echo "✅ Docker Compose válido"

# Mostrar servicios configurados
echo "📋 Servicios configurados:"
docker-compose -f docker-compose.dev.yml config --services

# ========================================
# VERIFICAR SERVICIOS
# ========================================
echo "🔍 Verificando servicios..."

# Verificar que backend_dev esté definido
if ! docker-compose -f docker-compose.dev.yml config --services | grep -q "backend_dev"; then
    echo "❌ Servicio backend_dev no encontrado"
    echo "📋 Servicios disponibles:"
    docker-compose -f docker-compose.dev.yml config --services
    exit 1
fi

# Verificar que frontend_dev esté definido
if ! docker-compose -f docker-compose.dev.yml config --services | grep -q "frontend_dev"; then
    echo "❌ Servicio frontend_dev no encontrado"
    echo "📋 Servicios disponibles:"
    docker-compose -f docker-compose.dev.yml config --services
    exit 1
fi

echo "✅ Todos los servicios están definidos correctamente"

# ========================================
# VERIFICAR DOCKER
# ========================================
echo "🐳 Verificando Docker..."

# Verificar que Docker esté corriendo
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker no está corriendo"
    exit 1
fi

echo "✅ Docker está corriendo"

# Verificar espacio disponible
echo "💾 Espacio disponible en Docker:"
docker system df

# ========================================
# VERIFICAR PUERTOS
# ========================================
echo "🔌 Verificando puertos..."

# Verificar puerto 8080
if netstat -tuln | grep -q ":8080"; then
    echo "⚠️ Puerto 8080 ya está en uso"
    netstat -tuln | grep ":8080"
else
    echo "✅ Puerto 8080 disponible"
fi

# Verificar puerto 5173
if netstat -tuln | grep -q ":5173"; then
    echo "⚠️ Puerto 5173 ya está en uso"
    netstat -tuln | grep ":5173"
else
    echo "✅ Puerto 5173 disponible"
fi

# ========================================
# VERIFICAR VOLÚMENES
# ========================================
echo "💾 Verificando volúmenes..."

# Verificar que el volumen de postgres exista
if docker volume ls | grep -q "postgres_data_dev"; then
    echo "✅ Volumen postgres_data_dev existe"
else
    echo "ℹ️ Volumen postgres_data_dev no existe (se creará)"
fi

# ========================================
# VERIFICAR REDES
# ========================================
echo "🌐 Verificando redes..."

# Verificar que la red exista
if docker network ls | grep -q "gmarm_network"; then
    echo "✅ Red gmarm_network existe"
else
    echo "ℹ️ Red gmarm_network no existe (se creará)"
fi

# ========================================
# RESUMEN
# ========================================
echo ""
echo "🎯 DIAGNÓSTICO COMPLETADO"
echo ""
echo "📋 RESUMEN:"
echo "  ✅ Archivos de configuración: OK"
echo "  ✅ Docker Compose: OK"
echo "  ✅ Servicios: OK"
echo "  ✅ Docker: OK"
echo "  ✅ Puertos: Verificados"
echo "  ✅ Volúmenes: Verificados"
echo "  ✅ Redes: Verificadas"
echo ""
echo "🚀 El sistema está listo para deploy"
echo "💡 Si hay problemas, revisa los logs de Docker"
echo ""

#!/bin/bash

echo "🔍 Verificando configuración de Docker para GMARM..."

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado"
    exit 1
fi

echo "✅ Docker y Docker Compose están instalados"

# Verificar archivos de configuración
echo "📁 Verificando archivos de configuración..."

if [ ! -f "docker-compose.dev.yml" ]; then
    echo "❌ docker-compose.dev.yml no encontrado"
    exit 1
fi

if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ docker-compose.prod.yml no encontrado"
    exit 1
fi

if [ ! -f "backend/Dockerfile" ]; then
    echo "❌ backend/Dockerfile no encontrado"
    exit 1
fi

if [ ! -f "frontend/Dockerfile" ]; then
    echo "❌ frontend/Dockerfile no encontrado"
    exit 1
fi

if [ ! -f "frontend/Dockerfile.dev" ]; then
    echo "❌ frontend/Dockerfile.dev no encontrado"
    exit 1
fi

if [ ! -f "frontend/nginx.conf" ]; then
    echo "❌ frontend/nginx.conf no encontrado"
    exit 1
fi

echo "✅ Todos los archivos de configuración están presentes"

# Verificar configuración del backend
echo "🔧 Verificando configuración del backend..."

if [ ! -f "backend/pom.xml" ]; then
    echo "❌ backend/pom.xml no encontrado"
    exit 1
fi

if [ ! -f "backend/src/main/resources/application-docker.properties" ]; then
    echo "❌ application-docker.properties no encontrado"
    exit 1
fi

if [ ! -f "backend/src/main/resources/application-prod.properties" ]; then
    echo "❌ application-prod.properties no encontrado"
    exit 1
fi

echo "✅ Configuración del backend verificada"

# Verificar configuración del frontend
echo "🎨 Verificando configuración del frontend..."

if [ ! -f "frontend/package.json" ]; then
    echo "❌ frontend/package.json no encontrado"
    exit 1
fi

if [ ! -f "frontend/vite.config.ts" ]; then
    echo "❌ frontend/vite.config.ts no encontrado"
    exit 1
fi

echo "✅ Configuración del frontend verificada"

# Verificar datos de inicialización
echo "🗄️ Verificando datos de inicialización..."

if [ ! -d "datos" ]; then
    echo "❌ Directorio datos no encontrado"
    exit 1
fi

if [ ! -f "datos/gmarm_schema_mejorado.sql" ]; then
    echo "❌ gmarm_schema_mejorado.sql no encontrado"
    exit 1
fi

echo "✅ Datos de inicialización verificados"

echo ""
echo "🎉 ¡Configuración de Docker verificada exitosamente!"
echo ""
echo "📋 Resumen de la configuración:"
echo "   • Backend: Spring Boot con PostgreSQL"
echo "   • Frontend: React + Vite con Nginx (producción)"
echo "   • Base de datos: PostgreSQL 14"
echo "   • Red: gmarm-network"
echo ""
echo "🚀 Para ejecutar en desarrollo:"
echo "   docker-compose -f docker-compose.dev.yml up --build"
echo ""
echo "🚀 Para ejecutar en producción:"
echo "   docker-compose -f docker-compose.prod.yml up --build"
echo "" 
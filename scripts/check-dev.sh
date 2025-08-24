#!/bin/bash

# ========================================
# SCRIPT DE VERIFICACIÓN RÁPIDA DEL ENTORNO
# ========================================
# Este script verifica rápidamente el estado de todos los servicios

set -e

echo "🔍 VERIFICANDO ESTADO DEL ENTORNO DE DESARROLLO..."
echo ""

# ========================================
# VERIFICAR DOCKER
# ========================================
echo "🐳 Verificando Docker..."
if command -v docker &> /dev/null; then
    echo "✅ Docker está instalado"
    docker --version
else
    echo "❌ Docker no está instalado"
    exit 1
fi

if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose está instalado"
    docker-compose --version
else
    echo "❌ Docker Compose no está instalado"
    exit 1
fi

echo ""

# ========================================
# VERIFICAR SERVICIOS
# ========================================
echo "📊 Verificando estado de servicios..."

if [ -f "docker-compose.dev.yml" ]; then
    echo "✅ docker-compose.dev.yml encontrado"
    
    # Verificar si los servicios están corriendo
    if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
        echo "✅ Servicios están corriendo"
        echo ""
        echo "📋 Estado de servicios:"
        docker-compose -f docker-compose.dev.yml ps
    else
        echo "⚠️ Servicios no están corriendo"
        echo "💡 Para iniciar: docker-compose -f docker-compose.dev.yml up -d"
    fi
else
    echo "❌ docker-compose.dev.yml no encontrado"
fi

echo ""

# ========================================
# VERIFICAR CONECTIVIDAD
# ========================================
echo "🌐 Verificando conectividad..."

# Verificar puertos
PORTS=("5432" "8080" "5173")
SERVICES=("PostgreSQL" "Backend" "Frontend")

for i in "${!PORTS[@]}"; do
    port=${PORTS[$i]}
    service=${SERVICES[$i]}
    
    if netstat -an 2>/dev/null | grep -q ":$port "; then
        echo "✅ $service (puerto $port): Activo"
    else
        echo "❌ $service (puerto $port): Inactivo"
    fi
done

echo ""

# ========================================
# VERIFICAR ARCHIVOS CRÍTICOS
# ========================================
echo "📁 Verificando archivos críticos..."

CRITICAL_FILES=(
    "docker-compose.dev.yml"
    "backend/Dockerfile"
    "frontend/Dockerfile.dev"
    "datos/00_gmarm_completo.sql"
    "scripts/init-db.sh"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (FALTANTE)"
    fi
done

echo ""

# ========================================
# VERIFICAR IMÁGENES
# ========================================
echo "🖼️ Verificando imágenes de armas..."

if [ -d "frontend/public/images/weapons" ]; then
    IMAGE_COUNT=$(find frontend/public/images/weapons -name "*.png" -o -name "*.jpg" -o -name "*.webp" -o -name "*.svg" | wc -l)
    echo "✅ Directorio de imágenes encontrado"
    echo "📊 Total de imágenes: $IMAGE_COUNT"
    
    if [ $IMAGE_COUNT -gt 0 ]; then
        echo "✅ Imágenes disponibles"
    else
        echo "⚠️ No hay imágenes en el directorio"
    fi
else
    echo "❌ Directorio de imágenes no encontrado"
fi

echo ""

# ========================================
# VERIFICAR VARIABLES DE ENTORNO
# ========================================
echo "⚙️ Verificando variables de entorno..."

if [ -f ".env.dev.local" ]; then
    echo "✅ Archivo .env.dev.local encontrado"
    echo "📋 Variables configuradas:"
    grep -E "^(BACKEND_URL|FRONTEND_URL|POSTGRES_DB)=" .env.dev.local || echo "   No hay variables críticas configuradas"
else
    echo "⚠️ Archivo .env.dev.local no encontrado"
    echo "💡 Crear desde env.dev.server"
fi

echo ""

# ========================================
# RESUMEN FINAL
# ========================================
echo "🎯 RESUMEN DE VERIFICACIÓN:"
echo ""

# Contar errores y advertencias
ERRORS=$(grep -c "❌" <<< "$(cat $0)")
WARNINGS=$(grep -c "⚠️" <<< "$(cat $0)")

echo "📊 Estado general:"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "🎉 ¡Todo está funcionando perfectamente!"
elif [ $ERRORS -eq 0 ]; then
    echo "✅ Funcionando con algunas advertencias"
else
    echo "❌ Hay errores que necesitan atención"
fi

echo ""
echo "🔧 COMANDOS ÚTILES:"
echo "   Iniciar: docker-compose -f docker-compose.dev.yml up -d"
echo "   Ver logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "   Ver estado: docker-compose -f docker-compose.dev.yml ps"
echo "   Limpiar: ./scripts/clean-dev.sh"
echo "   Verificar BD: docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c 'SELECT version();'"

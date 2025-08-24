#!/bin/bash

# ========================================
# SCRIPT DE LIMPIEZA COMPLETA PARA DESARROLLO
# ========================================
# Este script limpia completamente el entorno de desarrollo
# ¡CUIDADO! Esto elimina TODOS los datos

set -e

echo "🧹 INICIANDO LIMPIEZA COMPLETA DEL ENTORNO DE DESARROLLO..."
echo "⚠️  ADVERTENCIA: Esto eliminará TODOS los datos y contenedores!"

read -p "¿Estás seguro de que quieres continuar? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Limpieza cancelada"
    exit 1
fi

echo "🛑 Deteniendo todos los servicios..."
docker-compose -f docker-compose.dev.yml down --remove-orphans --volumes || true

echo "🗑️ Eliminando contenedores..."
docker container prune -f

echo "🗑️ Eliminando imágenes..."
docker image prune -a -f

echo "🗑️ Eliminando volúmenes..."
docker volume prune -f

echo "🗑️ Eliminando redes..."
docker network prune -f

echo "🧹 Limpieza del sistema Docker..."
docker system prune -a -f

echo "📁 Limpiando archivos temporales..."
# Eliminar archivos de estado de la base de datos
rm -f /tmp/db-init-status.txt 2>/dev/null || true

# Limpiar logs de Docker
echo "📋 Limpiando logs..."
docker system prune -f

echo "✅ LIMPIEZA COMPLETADA EXITOSAMENTE!"
echo ""
echo "🎯 Para reiniciar el entorno de desarrollo:"
echo "   docker-compose -f docker-compose.dev.yml up --build -d"
echo ""
echo "📊 Para verificar el estado:"
echo "   docker-compose -f docker-compose.dev.yml ps"
echo ""
echo "🔍 Para ver logs:"
echo "   docker-compose -f docker-compose.dev.yml logs -f"

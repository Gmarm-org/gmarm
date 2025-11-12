#!/bin/bash

echo "🔧 REBUILD FORZADO DEL FRONTEND EN PRODUCCIÓN"
echo "=============================================="
echo ""

# Ir al directorio de producción
cd ~/deploy/prod || exit 1

echo "⏹️ Paso 1: Detener servicios..."
docker-compose -f docker-compose.prod.yml down

echo ""
echo "🗑️ Paso 2: Eliminar imágenes viejas del frontend..."
docker rmi gmarm-frontend-prod -f 2>/dev/null || echo "  (No había imagen previa)"

echo ""
echo "🧹 Paso 3: Limpiar caché de Docker..."
docker system prune -f

echo ""
echo "🔄 Paso 4: Rebuild COMPLETO del frontend (sin caché)..."
docker-compose -f docker-compose.prod.yml build --no-cache frontend

echo ""
echo "🚀 Paso 5: Levantar todos los servicios..."
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "⏳ Paso 6: Esperando 90 segundos a que servicios inicien..."
sleep 90

echo ""
echo "🔍 Paso 7: Verificando servicios..."
docker ps --filter name=gmarm

echo ""
echo "🏥 Paso 8: Health check..."
curl -s http://localhost:8080/api/health | jq || echo "Backend no responde aún"

echo ""
echo "✅ REBUILD COMPLETADO"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Abrir https://gmarm.com en modo incógnito"
echo "   2. Verificar que cambios estén visibles"
echo "   3. Limpiar caché del navegador con Ctrl+Shift+R"


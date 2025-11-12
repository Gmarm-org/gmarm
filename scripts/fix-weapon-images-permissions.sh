#!/bin/bash

echo "🔧 Corrigiendo permisos de imágenes de armas en PRODUCCIÓN..."
echo "============================================================"
echo ""

cd ~/deploy/prod || exit 1

# 1. Crear directorios si no existen
echo "📂 Paso 1: Creando directorios..."
mkdir -p ./uploads/images/weapons
mkdir -p ./uploads/images
mkdir -p ./documentacion/contratos_generados
mkdir -p ./documentacion/autorizaciones_generadas
mkdir -p ./logs

# 2. Dar permisos correctos
echo "🔐 Paso 2: Configurando permisos..."
sudo chown -R 1000:1000 ./uploads/
sudo chmod -R 755 ./uploads/

sudo chown -R 1000:1000 ./documentacion/
sudo chmod -R 755 ./documentacion/

sudo chown -R 1000:1000 ./logs/
sudo chmod -R 755 ./logs/

# 3. Verificar
echo ""
echo "📊 Paso 3: Verificando configuración..."
echo ""
echo "  📂 Contenido de uploads/images/weapons/:"
ls -la ./uploads/images/weapons/ 2>/dev/null || echo "     (vacío)"
echo ""
echo "  📊 Permisos de uploads/:"
ls -ld ./uploads/ 2>/dev/null
echo ""

# 4. Contar imágenes
IMAGEN_COUNT=$(find ./uploads/images/weapons/ -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.jpeg" \) 2>/dev/null | wc -l)
echo "  🖼️  Imágenes encontradas: $IMAGEN_COUNT"
echo ""

# 5. Reiniciar backend
echo "🔄 Paso 4: Reiniciando backend..."
docker-compose -f docker-compose.prod.yml restart backend

# 6. Esperar a que backend inicie
echo "⏳ Esperando 30 segundos a que backend inicie..."
sleep 30

# 7. Verificar que backend respondió
echo ""
echo "🏥 Paso 5: Verificando backend..."
HEALTH=$(curl -s http://localhost:8080/api/health)
if [ $? -eq 0 ]; then
    echo "✅ Backend respondiendo:"
    echo "$HEALTH" | jq || echo "$HEALTH"
else
    echo "❌ Backend no responde aún (espera otros 30 segundos)"
fi

echo ""
echo "============================================================"
echo "✅ CORRECCIÓN COMPLETADA"
echo "============================================================"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Si IMAGEN_COUNT = 0, re-subir imágenes desde Admin"
echo "   2. Probar subir una imagen desde Admin"
echo "   3. Verificar que Vendedor la puede ver"
echo ""
echo "🔍 Para verificar una imagen específica:"
echo "   curl -I http://localhost:8080/images/weapons/nombre-imagen.jpg"
echo ""


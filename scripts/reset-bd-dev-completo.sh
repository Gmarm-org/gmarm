#!/bin/bash

echo "🔄 RESET COMPLETO DE BASE DE DATOS DEV"
echo "======================================="
echo ""
echo "⚠️  Este script:"
echo "   1. Elimina completamente la base de datos (down -v)"
echo "   2. Recrea desde el SQL maestro"
echo "   3. Resetea TODAS las secuencias (IDs empiezan correctamente)"
echo ""

read -p "¿Continuar? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelado"
    exit 1
fi

echo ""
echo "🛑 Deteniendo servicios y eliminando volúmenes..."
docker-compose -f docker-compose.dev.yml down -v

echo ""
echo "🗑️  Limpiando sistema Docker..."
docker system prune -f

echo ""
echo "🚀 Iniciando solo PostgreSQL..."
docker-compose -f docker-compose.dev.yml up -d postgres_dev

echo ""
echo "⏳ Esperando a que PostgreSQL inicie..."
for i in {1..30}; do
  if docker exec gmarm-postgres-dev pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL listo después de $i intentos"
    break
  fi
  echo "   Intento $i/30..."
  sleep 2
done

echo ""
echo "💾 Verificando/creando base de datos..."
BD_EXISTS=$(docker exec gmarm-postgres-dev psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='gmarm_dev'" 2>/dev/null)

if [ "$BD_EXISTS" != "1" ]; then
    echo "📦 Creando base de datos..."
    docker exec gmarm-postgres-dev psql -U postgres -c "CREATE DATABASE gmarm_dev WITH ENCODING='UTF8' LC_COLLATE='C' LC_CTYPE='C';"
    
    echo "📥 Cargando SQL maestro (esto puede tardar 1-2 minutos)..."
    docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev < datos/00_gmarm_completo.sql
    
    if [ $? -eq 0 ]; then
        echo "✅ SQL maestro cargado correctamente"
    else
        echo "❌ Error cargando SQL maestro"
        exit 1
    fi
else
    echo "✅ Base de datos ya existe"
fi

echo ""
echo "🔧 Reseteando TODAS las secuencias..."

docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev <<'SQLEOF'

-- Resetear secuencias principales
SELECT setval('usuario_id_seq', COALESCE((SELECT MAX(id) FROM usuario), 1), true);
SELECT setval('rol_id_seq', COALESCE((SELECT MAX(id) FROM rol), 1), true);
SELECT setval('cliente_id_seq', COALESCE((SELECT MAX(id) FROM cliente), 1), true);
SELECT setval('arma_id_seq', COALESCE((SELECT MAX(id) FROM arma), 1), true);
SELECT setval('categoria_arma_id_seq', COALESCE((SELECT MAX(id) FROM categoria_arma), 1), true);
SELECT setval('arma_serie_id_seq', COALESCE((SELECT MAX(id) FROM arma_serie), 1), true);
SELECT setval('licencia_id_seq', COALESCE((SELECT MAX(id) FROM licencia), 1), true);
SELECT setval('tipo_cliente_id_seq', COALESCE((SELECT MAX(id) FROM tipo_cliente), 1), true);
SELECT setval('tipo_identificacion_id_seq', COALESCE((SELECT MAX(id) FROM tipo_identificacion), 1), true);
SELECT setval('tipo_importacion_id_seq', COALESCE((SELECT MAX(id) FROM tipo_importacion), 1), true);
SELECT setval('tipo_documento_id_seq', COALESCE((SELECT MAX(id) FROM tipo_documento), 1), true);
SELECT setval('pregunta_cliente_id_seq', COALESCE((SELECT MAX(id) FROM pregunta_cliente), 1), true);
SELECT setval('grupo_importacion_id_seq', COALESCE((SELECT MAX(id) FROM grupo_importacion), 1), true);
SELECT setval('solicitud_cliente_id_seq', COALESCE((SELECT MAX(id) FROM solicitud_cliente), 1), true);
SELECT setval('pago_id_seq', COALESCE((SELECT MAX(id) FROM pago), 1), true);
SELECT setval('factura_id_seq', COALESCE((SELECT MAX(id) FROM factura), 1), true);
SELECT setval('contrato_id_seq', COALESCE((SELECT MAX(id) FROM contrato), 1), true);
SELECT setval('configuracion_sistema_id_seq', COALESCE((SELECT MAX(id) FROM configuracion_sistema), 1), true);

SQLEOF

echo "✅ Secuencias reseteadas"

echo ""
echo "📊 Verificando datos y secuencias..."

# Verificar usuarios
USUARIOS=$(docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -tAc "SELECT COUNT(*) FROM usuario;" 2>/dev/null || echo "0")
echo "   Usuarios: $USUARIOS"

# Verificar próximo ID
NEXT_ID=$(docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -tAc "SELECT last_value FROM usuario_id_seq;" 2>/dev/null || echo "?")
echo "   Próximo ID usuario: $NEXT_ID"

# Mostrar primeros 5 usuarios
echo ""
echo "📋 Primeros 5 usuarios (IDs deben ser consecutivos):"
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "SELECT id, username, nombres, apellidos FROM usuario ORDER BY id LIMIT 10;"

echo ""
echo "🚀 Iniciando backend y frontend..."
docker-compose -f docker-compose.dev.yml up -d

echo ""
echo "⏳ Esperando servicios (30 segundos)..."
sleep 30

echo ""
echo "📊 Estado del sistema:"
docker stats --no-stream

echo ""
echo "======================================="
echo "✅ RESET COMPLETO DE BD FINALIZADO"
echo "======================================="
echo ""
echo "🎯 Próximo usuario que crees tendrá ID: $((NEXT_ID + 1))"
echo ""
echo "🔍 Verificar OOM:"
echo "   docker inspect gmarm-postgres-dev --format='OOMKilled={{.State.OOMKilled}}'"
echo ""


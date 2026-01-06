#!/bin/bash

# ========================================
# SCRIPT: RESET BD DESDE CERO
# ========================================
# Este script:
#   1. Elimina completamente la base de datos (down -v)
#   2. Recrea desde el SQL maestro
#   3. Elimina TODOS los documentos generados y subidos
#   4. Libera espacio en el servidor
#
# Uso:
#   ./scripts/reset-bd-desde-cero.sh [local|dev|prod]
#   Si no se especifica ambiente, usa 'local'
# ========================================

set -e  # Salir si hay error

AMBIENTE="${1:-local}"

case "$AMBIENTE" in
  local)
    DOCKER_COMPOSE_FILE="docker-compose.local.yml"
    DB_NAME="gmarm_local"
    DB_CONTAINER="gmarm-postgres-local"
    ;;
  dev)
    DOCKER_COMPOSE_FILE="docker-compose.dev.yml"
    DB_NAME="gmarm_dev"
    DB_CONTAINER="gmarm-postgres-dev"
    ;;
  prod)
    DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
    DB_NAME="gmarm_prod"
    DB_CONTAINER="gmarm-postgres-prod"
    ;;
  *)
    echo "❌ Ambiente no válido: $AMBIENTE"
    echo "   Usa: local, dev o prod"
    exit 1
    ;;
esac

echo "🔄 RESET COMPLETO DE BASE DE DATOS - AMBIENTE: $AMBIENTE"
echo "========================================================"
echo ""
echo "⚠️  ATENCIÓN: Este script:"
echo "   1. Elimina COMPLETAMENTE la base de datos (sin respaldos)"
echo "   2. Elimina TODOS los documentos generados y subidos"
echo "   3. Recrea la BD desde el SQL maestro"
echo "   4. Resetea todas las secuencias"
echo ""
echo "📁 Directorios que serán eliminados:"
echo "   - documentacion/* (contratos, documentos, autorizaciones)"
echo "   - uploads/* (archivos subidos por clientes)"
echo "   - backend/uploads/* (archivos temporales)"
echo ""

read -p "¿Estás seguro? Escribe 'SI' para continuar: " -r
echo ""
if [[ ! "$REPLY" == "SI" ]]; then
    echo "❌ Cancelado por el usuario"
    exit 1
fi

echo ""
echo "🛑 Paso 1/6: Deteniendo servicios y eliminando volúmenes..."
docker-compose -f "$DOCKER_COMPOSE_FILE" down -v

echo ""
echo "🗑️  Paso 2/6: Eliminando documentos generados y subidos..."

# Eliminar documentos de clientes
if [ -d "documentacion/documentos_cliente" ]; then
    echo "   Eliminando: documentacion/documentos_cliente"
    rm -rf "documentacion/documentos_cliente"/*
    find "documentacion/documentos_cliente" -type d -empty -delete 2>/dev/null || true
fi

# Eliminar contratos generados
if [ -d "documentacion/contratos_generados" ]; then
    echo "   Eliminando: documentacion/contratos_generados"
    rm -rf "documentacion/contratos_generados"/*
    find "documentacion/contratos_generados" -type d -empty -delete 2>/dev/null || true
fi

# Eliminar documentos de importación
if [ -d "documentacion/documentos_importacion" ]; then
    echo "   Eliminando: documentacion/documentos_importacion"
    rm -rf "documentacion/documentos_importacion"/*
    find "documentacion/documentos_importacion" -type d -empty -delete 2>/dev/null || true
fi

# Eliminar autorizaciones
if [ -d "documentacion/autorizaciones" ]; then
    echo "   Eliminando: documentacion/autorizaciones"
    rm -rf "documentacion/autorizaciones"/*
    find "documentacion/autorizaciones" -type d -empty -delete 2>/dev/null || true
fi

# Eliminar uploads de clientes
if [ -d "uploads/clientes" ]; then
    echo "   Eliminando: uploads/clientes"
    rm -rf "uploads/clientes"/*
    find "uploads/clientes" -type d -empty -delete 2>/dev/null || true
fi

# Eliminar imágenes de armas (mantener estructura)
if [ -d "uploads/images/weapons" ]; then
    echo "   Eliminando imágenes de armas en: uploads/images/weapons"
    find "uploads/images/weapons" -type f -delete 2>/dev/null || true
fi

# Eliminar uploads del backend
if [ -d "backend/uploads" ]; then
    echo "   Eliminando: backend/uploads"
    rm -rf "backend/uploads"/*
    find "backend/uploads" -type d -empty -delete 2>/dev/null || true
fi

# Calcular espacio liberado
echo ""
echo "📊 Espacio liberado:"
SPACE_FREED=$(du -sh documentacion uploads backend/uploads 2>/dev/null | awk '{sum+=$1} END {print sum}' || echo "0")
echo "   Aproximadamente: $SPACE_FREED"

echo ""
echo "🚀 Paso 3/6: Iniciando solo PostgreSQL..."
docker-compose -f "$DOCKER_COMPOSE_FILE" up -d postgres_"${AMBIENTE}" 2>/dev/null || docker-compose -f "$DOCKER_COMPOSE_FILE" up -d postgres 2>/dev/null

echo ""
echo "⏳ Paso 4/6: Esperando a que PostgreSQL inicie..."
for i in {1..30}; do
  if docker exec "$DB_CONTAINER" pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL listo después de $i intentos"
    break
  fi
  echo "   Intento $i/30..."
  sleep 2
done

echo ""
echo "💾 Paso 5/6: Recreando base de datos desde SQL maestro..."

# Eliminar base de datos si existe
echo "   Eliminando base de datos existente..."
docker exec "$DB_CONTAINER" psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true

# Crear nueva base de datos
echo "   Creando nueva base de datos con UTF-8..."
docker exec "$DB_CONTAINER" psql -U postgres -d postgres -c "CREATE DATABASE $DB_NAME WITH ENCODING='UTF8' LC_COLLATE='C.UTF-8' LC_CTYPE='C.UTF-8';"

# Cargar SQL maestro
echo "   Cargando SQL maestro (esto puede tardar 1-2 minutos)..."
if [ ! -f "datos/00_gmarm_completo.sql" ]; then
    echo "❌ Error: No se encuentra el archivo datos/00_gmarm_completo.sql"
    exit 1
fi

docker exec -i "$DB_CONTAINER" psql -U postgres -d "$DB_NAME" < datos/00_gmarm_completo.sql

if [ $? -eq 0 ]; then
    echo "✅ SQL maestro cargado correctamente"
else
    echo "❌ Error cargando SQL maestro"
    exit 1
fi

echo ""
echo "🔧 Paso 6/6: Verificando datos cargados..."

# Verificar datos
USUARIOS=$(docker exec "$DB_CONTAINER" psql -U postgres -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM usuario;" 2>/dev/null || echo "0")
ARMAS=$(docker exec "$DB_CONTAINER" psql -U postgres -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM arma;" 2>/dev/null || echo "0")
CLIENTES=$(docker exec "$DB_CONTAINER" psql -U postgres -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM cliente;" 2>/dev/null || echo "0")

echo "   ✅ Usuarios: $USUARIOS"
echo "   ✅ Armas: $ARMAS"
echo "   ✅ Clientes: $CLIENTES"

echo ""
echo "🚀 Iniciando todos los servicios..."
docker-compose -f "$DOCKER_COMPOSE_FILE" up -d

echo ""
echo "⏳ Esperando servicios (15 segundos)..."
sleep 15

echo ""
echo "========================================================"
echo "✅ RESET COMPLETO FINALIZADO"
echo "========================================================"
echo ""
echo "📊 Estado del sistema:"
docker-compose -f "$DOCKER_COMPOSE_FILE" ps

echo ""
echo "🎯 Base de datos lista desde cero"
echo "📁 Documentos y uploads eliminados"
echo ""
echo "💡 Próximos pasos:"
echo "   1. Verificar que los servicios estén corriendo: docker-compose -f $DOCKER_COMPOSE_FILE ps"
echo "   2. Acceder a la aplicación y probar funcionalidades"
echo ""


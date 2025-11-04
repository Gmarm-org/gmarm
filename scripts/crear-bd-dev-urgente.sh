#!/bin/bash

# ========================================
# CREAR BASE DE DATOS DEV - URGENTE
# ========================================
# Este script crea la BD gmarm_dev si no existe

set -e

echo "🚨 CREANDO BASE DE DATOS gmarm_dev..."
echo "=========================================="

# 1. Crear la base de datos
echo "1️⃣ Creando base de datos..."
docker exec -i gmarm-postgres-dev psql -U postgres -c "CREATE DATABASE gmarm_dev WITH ENCODING='UTF8' LC_COLLATE='C' LC_CTYPE='C';" || echo "⚠️ BD ya existe (ignorando error)"

# 2. Cargar datos
echo "2️⃣ Cargando datos del SQL maestro..."
cat datos/00_gmarm_completo.sql | docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev

# 3. Verificar datos
echo "3️⃣ Verificando datos..."
USUARIOS=$(docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -tAc "SELECT COUNT(*) FROM usuario;")
ARMAS=$(docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -tAc "SELECT COUNT(*) FROM arma;")
SERIES=$(docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -tAc "SELECT COUNT(*) FROM arma_serie;")

echo "📊 Datos cargados:"
echo "  Usuarios: $USUARIOS"
echo "  Armas: $ARMAS"  
echo "  Series: $SERIES"

if [ "$USUARIOS" -eq "0" ]; then
    echo "❌ ERROR: Base de datos vacía"
    exit 1
fi

# 4. Reiniciar backend para reconectar
echo "4️⃣ Reiniciando backend..."
docker-compose -f docker-compose.dev.yml restart backend_dev

echo ""
echo "✅ ¡BASE DE DATOS CREADA Y CARGADA EXITOSAMENTE!"
echo "=========================================="
echo ""
echo "Servicios:"
echo "  Backend:  http://72.167.52.14:8080"
echo "  Frontend: http://72.167.52.14:5173"
echo ""

exit 0


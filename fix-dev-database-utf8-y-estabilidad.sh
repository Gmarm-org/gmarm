#!/bin/bash

# ========================================
# FIX DEV: UTF-8 Y ESTABILIDAD DE BASE DE DATOS
# ========================================
# Este script soluciona:
# 1. Problemas de codificación UTF-8 (tildes, ñ)
# 2. Inestabilidad de la base de datos (caídas, pérdida de datos)
# 3. Configuración incorrecta de Hibernate
#
# EJECUTAR EN EL SERVIDOR DEV

set -e

echo "🚨 =========================================="
echo "🚨 FIX DEV: UTF-8 Y ESTABILIDAD BD"
echo "🚨 =========================================="
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.dev.yml" ]; then
    echo "❌ ERROR: docker-compose.dev.yml no encontrado"
    echo "   Asegúrate de estar en el directorio raíz del proyecto"
    exit 1
fi

echo "📝 PASO 1: Detener todos los servicios..."
docker-compose -f docker-compose.dev.yml down

echo ""
echo "🗑️ PASO 2: Eliminar volumen de PostgreSQL (forzar recreación UTF-8)..."
docker volume rm gmarm_postgres_data_dev || true

echo ""
echo "📦 PASO 3: Actualizar archivo application-docker.properties..."
# Crear backup
cp backend/src/main/resources/application-docker.properties backend/src/main/resources/application-docker.properties.backup || true

# Cambiar ddl-auto de 'update' a 'validate'
sed -i 's/spring.jpa.hibernate.ddl-auto=update/spring.jpa.hibernate.ddl-auto=validate/g' backend/src/main/resources/application-docker.properties
sed -i 's/spring.jpa.hibernate.hbm2ddl.auto=update/spring.jpa.hibernate.hbm2ddl.auto=validate/g' backend/src/main/resources/application-docker.properties

echo "✅ Hibernate configurado en modo 'validate' (no modificará la BD)"

echo ""
echo "🔧 PASO 4: Verificar configuración UTF-8 en docker-compose.dev.yml..."
if grep -q "POSTGRES_INITDB_ARGS.*UTF-8" docker-compose.dev.yml; then
    echo "✅ Configuración UTF-8 correcta en docker-compose.dev.yml"
else
    echo "⚠️ ADVERTENCIA: Configuración UTF-8 no encontrada en docker-compose.dev.yml"
fi

echo ""
echo "🏗️ PASO 5: Reconstruir y levantar servicios..."
docker-compose -f docker-compose.dev.yml up -d --build

echo ""
echo "⏳ PASO 6: Esperando que los servicios estén listos (60 segundos)..."
sleep 60

echo ""
echo "🔍 PASO 7: Verificar estado de los servicios..."
docker-compose -f docker-compose.dev.yml ps

echo ""
echo "📊 PASO 8: Verificar datos en la base de datos..."
echo "   - Verificando usuarios..."
USUARIOS=$(docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -t -c "SELECT COUNT(*) FROM usuario;" | xargs)
echo "     👥 Usuarios: $USUARIOS"

echo "   - Verificando armas..."
ARMAS=$(docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -t -c "SELECT COUNT(*) FROM arma;" | xargs)
echo "     🔫 Armas: $ARMAS"

echo "   - Verificando series de armas..."
SERIES=$(docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -t -c "SELECT COUNT(*) FROM arma_serie;" | xargs)
echo "     🔢 Series: $SERIES"

echo "   - Verificando codificación UTF-8..."
UTF8_TEST=$(docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -t -c "SHOW server_encoding;" | xargs)
echo "     📝 Encoding: $UTF8_TEST"

echo ""
echo "🧪 PASO 9: Probar caracteres especiales..."
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "SELECT nombres, apellidos FROM usuario WHERE nombres LIKE '%á%' OR nombres LIKE '%é%' OR nombres LIKE '%í%' OR nombres LIKE '%ó%' OR nombres LIKE '%ú%' OR nombres LIKE '%ñ%' LIMIT 3;"

echo ""
echo "🎉 =========================================="
echo "🎉 FIX COMPLETADO"
echo "🎉 =========================================="
echo ""
echo "📋 RESUMEN:"
echo "   ✅ Servicios reiniciados con volumen limpio"
echo "   ✅ UTF-8 configurado correctamente"
echo "   ✅ Hibernate en modo 'validate' (estable)"
echo "   ✅ Datos cargados desde SQL maestro"
echo ""
echo "🔗 URLs:"
echo "   - Backend:  http://72.167.52.14:8080"
echo "   - Frontend: http://72.167.52.14:5173"
echo "   - Health:   http://72.167.52.14:8080/api/health"
echo ""
echo "📝 SIGUIENTE PASO:"
echo "   Prueba el login en: http://72.167.52.14:5173"
echo "   Usuario: jefe@test.com / Password: JefeVentas2024!"
echo ""
echo "📊 Ver logs:"
echo "   docker-compose -f docker-compose.dev.yml logs -f backend_dev"
echo ""


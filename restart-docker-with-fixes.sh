#!/bin/bash

# =====================================================
# SCRIPT PARA REINICIAR DOCKER CON CORRECCIONES
# =====================================================

echo "🔄 Reiniciando contenedores Docker con correcciones de base de datos..."

# Detener y eliminar contenedores existentes
echo "⏹️  Deteniendo contenedores existentes..."
docker-compose -f docker-compose.dev.yml down

# Eliminar volumen de PostgreSQL para forzar recreación
echo "🗑️  Eliminando volumen de PostgreSQL para forzar recreación..."
docker volume rm gmarm_postgres_data_dev 2>/dev/null || true

# Reconstruir imágenes
echo "🔨 Reconstruyendo imágenes..."
docker-compose -f docker-compose.dev.yml build --no-cache

# Iniciar contenedores
echo "🚀 Iniciando contenedores..."
docker-compose -f docker-compose.dev.yml up -d

# Esperar a que PostgreSQL esté listo
echo "⏳ Esperando a que PostgreSQL esté listo..."
for i in {1..30}; do
    if docker exec gmarm-postgres-dev pg_isready -U postgres >/dev/null 2>&1; then
        echo "✅ PostgreSQL está listo!"
        break
    fi
    echo "⏳ Intento $i/30: PostgreSQL aún no está listo..."
    sleep 2
done

# Verificar que todos los contenedores estén funcionando
echo "🔍 Verificando estado de contenedores..."
docker-compose -f docker-compose.dev.yml ps

# Ejecutar script de verificación
echo "🔍 Ejecutando verificación de estructura..."
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_db -f /docker-entrypoint-initdb.d/05_verificacion_estructura.sql

echo "✅ ¡Reinicio completado! Los contenedores están funcionando con las correcciones aplicadas."
echo ""
echo "📋 URLs de acceso:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8080"
echo "   PostgreSQL: localhost:5432"
echo ""
echo "🔧 Para ver logs:"
echo "   docker-compose -f docker-compose.dev.yml logs -f" 
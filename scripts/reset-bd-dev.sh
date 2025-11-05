#!/bin/bash

echo "🔄 RESET DE BASE DE DATOS DEV"
echo "=============================="
echo ""
echo "⚠️  Este script:"
echo "   1. Elimina el volumen de PostgreSQL (borra toda la BD)"
echo "   2. Reinicia PostgreSQL con datos frescos del SQL maestro"
echo "   3. IDs empiezan desde 1"
echo ""

read -p "¿Continuar? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelado"
    exit 1
fi

echo ""
echo "🛑 Deteniendo servicios y eliminando volumen de BD..."
docker-compose -f docker-compose.dev.yml down -v

echo ""
echo "🚀 Iniciando solo PostgreSQL..."
docker-compose -f docker-compose.dev.yml up -d postgres_dev

echo ""
echo "⏳ Esperando a que PostgreSQL inicie (30 segundos)..."
sleep 30

echo ""
echo "💾 Verificando base de datos..."
for i in {1..10}; do
  if docker exec gmarm-postgres-dev pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL listo"
    break
  fi
  echo "   Intento $i/10..."
  sleep 3
done

# Verificar BD
BD_EXISTS=$(docker exec gmarm-postgres-dev psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='gmarm_dev'" 2>/dev/null)

if [ "$BD_EXISTS" = "1" ]; then
    echo "✅ Base de datos 'gmarm_dev' creada automáticamente"
    
    # Verificar datos
    USUARIOS=$(docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -tAc "SELECT COUNT(*) FROM usuario;" 2>/dev/null || echo "0")
    ARMAS=$(docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -tAc "SELECT COUNT(*) FROM arma;" 2>/dev/null || echo "0")
    
    echo "   Usuarios: $USUARIOS"
    echo "   Armas: $ARMAS"
else
    echo "⚠️  Base de datos no existe, creándola manualmente..."
    docker exec gmarm-postgres-dev psql -U postgres -c "CREATE DATABASE gmarm_dev WITH ENCODING='UTF8' LC_COLLATE='C' LC_CTYPE='C';"
    echo "📥 Cargando SQL maestro..."
    docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev < datos/00_gmarm_completo.sql
    echo "✅ Datos cargados"
fi

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
echo "=============================="
echo "✅ RESET DE BD COMPLETADO"
echo "=============================="
echo ""
echo "🔍 Verificar datos:"
echo "   docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c 'SELECT id, username FROM usuario ORDER BY id LIMIT 5;'"
echo ""
echo "🏥 Health check:"
echo "   curl http://localhost:8080/api/health"
echo ""


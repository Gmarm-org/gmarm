#!/bin/bash

echo "🔄 RESET SIMPLE DEL SISTEMA DEV"
echo "================================"
echo ""
echo "⚠️  Este script:"
echo "   1. Detiene todos los servicios"
echo "   2. Elimina volúmenes"
echo "   3. Reinicia con configuración optimizada (PostgreSQL 1.5GB)"
echo ""

read -p "¿Continuar? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelado"
    exit 1
fi

echo ""
echo "🛑 Deteniendo servicios..."
docker-compose -f docker-compose.dev.yml down -v

echo ""
echo "🧹 Limpiando sistema Docker..."
docker system prune -f

echo ""
echo "🚀 Iniciando servicios con nueva configuración..."
docker-compose -f docker-compose.dev.yml up -d --build

echo ""
echo "⏳ Esperando a que PostgreSQL inicie (30 segundos)..."
sleep 30

echo ""
echo "💾 Verificando base de datos..."
BD_EXISTS=$(docker exec gmarm-postgres-dev psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='gmarm_dev'" 2>/dev/null)

if [ "$BD_EXISTS" = "1" ]; then
    echo "✅ Base de datos existe"
    USUARIOS=$(docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -tAc "SELECT COUNT(*) FROM usuario;" 2>/dev/null || echo "0")
    echo "   Usuarios: $USUARIOS"
else
    echo "⚠️  Base de datos no existe, creándola..."
    docker exec gmarm-postgres-dev psql -U postgres -c "CREATE DATABASE gmarm_dev WITH ENCODING='UTF8' LC_COLLATE='C' LC_CTYPE='C';"
    echo "📥 Cargando SQL maestro..."
    docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev < datos/00_gmarm_completo.sql
fi

echo ""
echo "📊 Estado del sistema:"
docker stats --no-stream --format "table {{.Name}}\t{{CPUPerc}}\t{{MemUsage}}\t{{MemPerc}}"

echo ""
echo "✅ RESET COMPLETADO"
echo ""
echo "🔍 Verificar OOM Killer:"
echo "   docker inspect gmarm-postgres-dev --format='OOMKilled={{.State.OOMKilled}}'"
echo ""
echo "📈 Monitorear memoria:"
echo "   watch -n 2 'docker stats --no-stream'"
echo ""


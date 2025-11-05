#!/bin/bash

echo "🔍 DIAGNÓSTICO RÁPIDO"
echo "===================="
echo ""

echo "📦 Contenedores en ejecución:"
docker ps -a | grep gmarm

echo ""
echo "📋 Logs de PostgreSQL (si existe):"
docker logs gmarm-postgres-dev 2>&1 | tail -30 || echo "❌ Contenedor no existe"

echo ""
echo "📊 Estado de servicios Docker Compose:"
cd ~/deploy/dev
docker-compose -f docker-compose.dev.yml ps

echo ""
echo "🔍 Verificar configuración PostgreSQL:"
docker-compose -f docker-compose.dev.yml config | grep -A 5 "postgres_dev:"

echo ""


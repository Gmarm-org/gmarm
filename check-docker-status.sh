#!/bin/bash

# ========================================
# SCRIPT DE VERIFICACIÓN DE ESTADO DOCKER
# ========================================

echo "🔍 Verificando estado del sistema GMARM en Docker..."
echo ""

# Verificar contenedores
echo "📦 Estado de contenedores:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Verificar redes
echo "🌐 Redes Docker:"
docker network ls | grep gmarm
echo ""

# Verificar volúmenes
echo "💾 Volúmenes:"
docker volume ls | grep gmarm
echo ""

# Verificar recursos
echo "📊 Uso de recursos:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
echo ""

# Verificar conectividad
echo "🔗 Verificando conectividad:"

# Backend
echo -n "Backend (puerto 8080): "
if curl -s http://localhost:8080/api/health > /dev/null; then
    echo "✅ Funcionando"
else
    echo "❌ No responde"
fi

# Frontend
echo -n "Frontend (puerto 5173): "
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Funcionando"
else
    echo "❌ No responde"
fi

# PostgreSQL
echo -n "PostgreSQL (puerto 5432): "
if docker exec gmarm-postgres-dev pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ Funcionando"
else
    echo "❌ No responde"
fi

echo ""
echo "📋 URLs de acceso:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:8080/api"
echo "   Swagger UI: http://localhost:8080/swagger-ui.html"
echo ""
echo "🔑 Credenciales: admin / admin123" 
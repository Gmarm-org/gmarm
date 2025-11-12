#!/bin/bash
# Script para iniciar Keycloak en servidor Linux
# Uso: bash scripts/start-keycloak.sh

echo "🔐 Iniciando Keycloak..."

# Verificar si existe .env.keycloak
if [ ! -f .env.keycloak ]; then
    echo "⚠️  Creando .env.keycloak desde .env.keycloak.example..."
    cp .env.keycloak.example .env.keycloak
fi

# Levantar servicios
echo "📦 Levantando contenedores..."
docker-compose --env-file .env.keycloak -f docker-compose.keycloak.yml up -d

# Esperar a que Keycloak esté listo
echo "⏳ Esperando a que Keycloak esté listo..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s -f http://localhost:8180/health/ready > /dev/null 2>&1; then
        echo "✅ Keycloak está listo!"
        break
    fi
    
    attempt=$((attempt + 1))
    echo "   Intento $attempt de $max_attempts..."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ Timeout esperando a Keycloak. Verifica los logs:"
    echo "   docker logs gmarm-keycloak"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Keycloak Admin Console disponible en:"
echo "   🌐 URL: http://localhost:8180"
echo "   👤 Usuario: admin"
echo "   🔑 Password: admin123"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Abrir http://localhost:8180 en tu navegador"
echo "   2. Login con admin/admin123"
echo "   3. Seguir las instrucciones en INTEGRACION_KEYCLOAK.md (Paso 1.2)"
echo ""
echo "🛑 Para detener Keycloak:"
echo "   bash scripts/stop-keycloak.sh"
echo ""


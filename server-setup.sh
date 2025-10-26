#!/bin/bash

# ========================================
# SCRIPT SIMPLE PARA SERVIDOR UBUNTU
# ========================================
# Ejecutar este script desde PuTTY en el servidor

echo "🚀 Configurando GMARM en servidor Ubuntu..."

# 1. Verificar que estamos en el directorio correcto
echo "📁 Verificando directorio actual..."
pwd
ls -la

# 2. Verificar que Docker esté instalado
echo "🐳 Verificando Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Instalando..."
    sudo apt update
    sudo apt install -y docker.io docker-compose
    sudo usermod -aG docker $USER
    echo "✅ Docker instalado. Por favor reinicia la sesión SSH."
    exit 1
fi

# 3. Verificar que Docker Compose esté instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado. Instalando..."
    sudo apt install -y docker-compose
fi

echo "✅ Docker y Docker Compose están instalados"

# 4. Dar permisos a los scripts
echo "🔐 Dando permisos a scripts..."
if [ -f "setup-docker-dev.sh" ]; then
    chmod +x setup-docker-dev.sh
    echo "✅ setup-docker-dev.sh tiene permisos"
fi

if [ -f "check-docker-status.sh" ]; then
    chmod +x check-docker-status.sh
    echo "✅ check-docker-status.sh tiene permisos"
fi

if [ -f "deploy-server.sh" ]; then
    chmod +x deploy-server.sh
    echo "✅ deploy-server.sh tiene permisos"
fi

# 5. Verificar archivos de Docker Compose
echo "📋 Verificando archivos de configuración..."
if [ -f "docker-compose.dev.yml" ]; then
    echo "✅ docker-compose.dev.yml encontrado"
    COMPOSE_FILE="docker-compose.dev.yml"
elif [ -f "docker-compose.prod.yml" ]; then
    echo "✅ docker-compose.prod.yml encontrado"
    COMPOSE_FILE="docker-compose.prod.yml"
else
    echo "❌ No se encontraron archivos docker-compose"
    exit 1
fi

# 6. Detener contenedores existentes
echo "🛑 Deteniendo contenedores existentes..."
docker-compose -f $COMPOSE_FILE down --volumes --remove-orphans || true

# 7. Construir e iniciar
echo "🔨 Construyendo e iniciando servicios..."
docker-compose -f $COMPOSE_FILE build --no-cache
docker-compose -f $COMPOSE_FILE up -d

# 8. Esperar y verificar
echo "⏳ Esperando a que los servicios estén listos..."
sleep 30

echo "🔍 Verificando servicios..."
docker-compose -f $COMPOSE_FILE ps

echo ""
echo "🎉 ¡Configuración completada!"
echo ""
echo "🌐 URLs de acceso:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:8080/api"
echo "   Swagger UI: http://localhost:8080/swagger-ui.html"
echo ""
echo "🔑 Credenciales:"
echo "   admin / admin123"
echo "   vendedor1 / vendedor123"
echo "   test / test123"
echo ""
echo "📝 Comandos útiles:"
echo "   Ver logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "   Detener: docker-compose -f $COMPOSE_FILE down"
echo "   Reiniciar: docker-compose -f $COMPOSE_FILE restart" 
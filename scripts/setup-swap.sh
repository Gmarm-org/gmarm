#!/bin/bash

# ========================================
# SCRIPT PARA CONFIGURAR SWAP EN EL SERVIDOR
# ========================================
# Este script crea un archivo de SWAP de 2GB
# CRÍTICO para evitar que el OOM Killer mate PostgreSQL

set -e

echo "🔧 CONFIGURANDO SWAP EN EL SERVIDOR..."
echo "=========================================="

# Verificar si ya existe swap
SWAP_CURRENT=$(free -h | grep Swap | awk '{print $2}')
echo "📊 SWAP actual: $SWAP_CURRENT"

if [ "$SWAP_CURRENT" != "0B" ]; then
    echo "⚠️  Ya existe SWAP configurado"
    free -h
    exit 0
fi

# Verificar si se está ejecutando como root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Este script debe ejecutarse como root (usa sudo)"
    exit 1
fi

# Verificar espacio en disco
FREE_SPACE=$(df -BG / | tail -1 | awk '{print $4}' | sed 's/G//')
echo "💾 Espacio libre en disco: ${FREE_SPACE}GB"

if [ "$FREE_SPACE" -lt 3 ]; then
    echo "⚠️  Poco espacio en disco. Creando SWAP de 1GB..."
    SWAP_SIZE="1G"
else
    echo "✅ Espacio suficiente. Creando SWAP de 2GB..."
    SWAP_SIZE="2G"
fi

# Crear archivo de swap
echo "📝 Creando archivo de swap..."
sudo fallocate -l $SWAP_SIZE /swapfile

# Verificar que se creó
if [ ! -f /swapfile ]; then
    echo "❌ Error: No se pudo crear /swapfile"
    exit 1
fi

# Establecer permisos correctos
echo "🔐 Estableciendo permisos..."
sudo chmod 600 /swapfile

# Configurar como swap
echo "⚙️  Configurando como área de swap..."
sudo mkswap /swapfile

# Activar swap
echo "🚀 Activando swap..."
sudo swapon /swapfile

# Verificar que funciona
echo "✅ Verificando swap..."
free -h

# Hacer permanente (agregar a /etc/fstab)
if ! grep -q '/swapfile' /etc/fstab; then
    echo "📝 Agregando a /etc/fstab para que sea permanente..."
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
else
    echo "✅ Ya está en /etc/fstab"
fi

# Optimizar swappiness (qué tan agresivo usa swap)
echo "⚙️  Configurando swappiness..."
sudo sysctl vm.swappiness=10
echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf

# Configurar vfs_cache_pressure
sudo sysctl vm.vfs_cache_pressure=50
echo "vm.vfs_cache_pressure=50" | sudo tee -a /etc/sysctl.conf

echo ""
echo "=========================================="
echo "🎉 SWAP CONFIGURADO EXITOSAMENTE"
echo "=========================================="
echo ""
free -h
echo ""
echo "📋 Resumen:"
echo "  - Tamaño: $SWAP_SIZE"
echo "  - Ubicación: /swapfile"
echo "  - Swappiness: 10 (conservador)"
echo "  - Permanente: Sí (en /etc/fstab)"
echo ""
echo "⚠️  Ahora reinicia los contenedores:"
echo "  # Para ambiente local:"
echo "  docker-compose -f docker-compose.local.yml restart"
echo ""
echo "  # Para ambiente producción:"
echo "  docker-compose -f docker-compose.prod.yml restart"
echo ""

exit 0


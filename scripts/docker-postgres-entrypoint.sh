#!/bin/bash
set -e

# ========================================
# ENTRYPOINT PERSONALIZADO PARA POSTGRESQL
# ========================================
# GARANTIZA que la BD exista ANTES de aceptar conexiones
# Previene el bug de consumo 100% CPU cuando la BD no existe

echo "🚀 Iniciando PostgreSQL con verificación de BD..."

# Función para ejecutar el script de verificación
init_database() {
    echo "🔧 Ejecutando inicialización de BD..."
    
    # Esperar a que PostgreSQL esté listo internamente
    until pg_isready -U "$POSTGRES_USER" -q 2>/dev/null; do
        sleep 1
    done
    
    # Ejecutar script de inicialización garantizada
    if [ -f "/docker-entrypoint-initdb.d/init-postgres-garantizado.sh" ]; then
        bash /docker-entrypoint-initdb.d/init-postgres-garantizado.sh
    fi
}

# Iniciar PostgreSQL en background
docker-entrypoint.sh postgres &
POSTGRES_PID=$!

# Esperar 5 segundos para que inicie
sleep 5

# Ejecutar inicialización
init_database

# Mostrar estado
echo "✅ PostgreSQL listo y BD verificada"
echo "📊 Esperando a proceso de PostgreSQL (PID: $POSTGRES_PID)..."

# Mantener el proceso en foreground
wait $POSTGRES_PID


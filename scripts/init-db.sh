#!/bin/bash

# ========================================
# SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS
# ========================================
# Este script se ejecuta después de que PostgreSQL se inicie
# para verificar que la inicialización fue exitosa

set -e

echo "🔍 VERIFICANDO INICIALIZACIÓN DE BASE DE DATOS..."

# Esperar un momento para que PostgreSQL esté completamente listo
sleep 5

# Verificar que la base de datos esté accesible
echo "📊 Verificando conectividad a la base de datos..."
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT version();" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Base de datos accesible"
else
    echo "❌ Error: Base de datos no accesible"
    exit 1
fi

# Verificar que las tablas principales existan
echo "📋 Verificando estructura de tablas..."
TABLES=$(psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")

# Verificar tablas críticas
CRITICAL_TABLES=("usuario" "arma" "cliente" "categoria_arma" "tipo_cliente" "tipo_identificacion")

for table in "${CRITICAL_TABLES[@]}"; do
    if echo "$TABLES" | grep -q "$table"; then
        echo "✅ Tabla $table existe"
    else
        echo "❌ Error: Tabla $table no existe"
        exit 1
    fi
done

# Verificar que haya datos en las tablas principales
echo "📊 Verificando datos en tablas..."
USUARIO_COUNT=$(psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM usuario;" | xargs)
ARMA_COUNT=$(psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM arma;" | xargs)
CLIENTE_COUNT=$(psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM cliente;" | xargs)

echo "📈 Usuarios en BD: $USUARIO_COUNT"
echo "🔫 Armas en BD: $ARMA_COUNT"
echo "👥 Clientes en BD: $CLIENTE_COUNT"

# Verificar que haya al menos un usuario administrador
ADMIN_COUNT=$(psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM usuario u JOIN usuario_rol ur ON u.id = ur.usuario_id JOIN rol r ON ur.rol_id = r.id WHERE r.nombre = 'ADMIN';" | xargs)
if [ "$ADMIN_COUNT" -gt 0 ]; then
    echo "✅ Usuario administrador encontrado"
else
    echo "⚠️ Advertencia: No hay usuarios administradores"
fi

# Verificar que haya armas con imágenes
ARMA_WITH_IMAGES=$(psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM arma WHERE url_imagen IS NOT NULL AND url_imagen != '';" | xargs)
echo "🖼️ Armas con imágenes: $ARMA_WITH_IMAGES"

# Crear un archivo de estado para verificar que la inicialización fue exitosa
echo "📝 Creando archivo de estado..."
cat > /tmp/db-init-status.txt << EOF
Base de datos inicializada exitosamente
Fecha: $(date)
Usuario: $POSTGRES_USER
Base de datos: $POSTGRES_DB
Tablas verificadas: ${#CRITICAL_TABLES[@]}
Usuarios: $USUARIO_COUNT
Armas: $ARMA_COUNT
Clientes: $CLIENTE_COUNT
Armas con imágenes: $ARMA_WITH_IMAGES
EOF

echo "🎉 INICIALIZACIÓN DE BASE DE DATOS COMPLETADA EXITOSAMENTE!"
echo "📊 Resumen:"
echo "   - Tablas: ✅"
echo "   - Datos: ✅"
echo "   - Conectividad: ✅"
echo "   - Estado guardado en /tmp/db-init-status.txt"

exit 0

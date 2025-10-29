#!/bin/bash
# ========================================
# SCRIPT: Reset Development Database (Linux)
# ========================================
# Este script reinicia la base de datos de desarrollo desde 0
# con el SQL maestro completo

set -e  # Salir si cualquier comando falla

echo ""
echo "========================================"
echo "  REINICIAR BASE DE DATOS DESARROLLO"
echo "========================================"
echo ""

# Paso 1: Detener servicios y eliminar volúmenes
echo "📥 Paso 1: Deteniendo servicios y eliminando volúmenes..."
docker-compose -f docker-compose.dev.yml down -v

if [ $? -ne 0 ]; then
    echo "❌ Error deteniendo servicios"
    exit 1
fi

echo "✅ Servicios detenidos y volúmenes eliminados"
echo ""

# Paso 2: Levantar solo PostgreSQL
echo "🐘 Paso 2: Levantando PostgreSQL..."
docker-compose -f docker-compose.dev.yml up -d postgres_dev

if [ $? -ne 0 ]; then
    echo "❌ Error levantando PostgreSQL"
    exit 1
fi

echo "✅ PostgreSQL iniciado"
echo ""

# Paso 3: Esperar a que PostgreSQL esté listo
echo "⏳ Paso 3: Esperando a que PostgreSQL esté listo..."
max_retries=30
retries=0

while [ $retries -lt $max_retries ]; do
    if docker exec gmarm-postgres-dev pg_isready -U postgres > /dev/null 2>&1; then
        echo "✅ PostgreSQL está listo"
        break
    fi
    
    retries=$((retries + 1))
    echo "  Intento $retries/$max_retries..."
    sleep 2
done

if [ $retries -eq $max_retries ]; then
    echo "❌ PostgreSQL no respondió a tiempo"
    exit 1
fi

echo ""

# Paso 4: Crear la base de datos (si no existe)
echo "📝 Paso 4: Creando base de datos gmarm_dev..."
docker exec gmarm-postgres-dev psql -U postgres -c "CREATE DATABASE gmarm_dev;" 2>&1 | grep -v "already exists" || true

# Verificar que la base existe
if docker exec gmarm-postgres-dev psql -U postgres -lqt | cut -d \| -f 1 | grep -qw gmarm_dev; then
    echo "✅ Base de datos gmarm_dev disponible"
else
    echo "❌ Error: base de datos gmarm_dev no está disponible"
    exit 1
fi

echo ""

# Paso 5: Ejecutar SQL maestro
echo "📝 Paso 5: Ejecutando SQL maestro..."
cat datos/00_gmarm_completo.sql | docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev

if [ $? -ne 0 ]; then
    echo "❌ Error ejecutando SQL maestro"
    exit 1
fi

echo "✅ SQL maestro ejecutado exitosamente"
echo ""

# Paso 6: Verificar datos
echo "🔍 Paso 6: Verificando datos..."
echo ""

docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "
SELECT 'Tablas creadas:' as info, COUNT(*) as total FROM information_schema.tables WHERE table_schema = 'public';
SELECT 'Usuarios:' as info, COUNT(*) as total FROM usuario;
SELECT 'Clientes:' as info, COUNT(*) as total FROM cliente;
SELECT 'Armas:' as info, COUNT(*) as total FROM arma;
SELECT 'Tipos de Cliente:' as info, COUNT(*) as total FROM tipo_cliente;
"

echo ""
echo "✅ Verificación completada"
echo ""

# Paso 7: Limpiar archivos y documentos
echo "🗑️ Paso 7: Limpiando archivos subidos y documentos generados..."

# Limpiar documentos de clientes (mantener estructura de carpetas)
if [ -d "documentacion/documentos_cliente" ]; then
    echo "  Limpiando documentos de clientes..."
    find documentacion/documentos_cliente -mindepth 1 -type d -exec rm -rf {} + 2>/dev/null || true
    echo "  ✅ Documentos de clientes eliminados"
fi

# Limpiar contratos generados
if [ -d "documentacion/contratos_generados" ]; then
    echo "  Limpiando contratos generados..."
    find documentacion/contratos_generados -type f -name "*.pdf" -delete 2>/dev/null || true
    echo "  ✅ Contratos generados eliminados"
fi

# Limpiar uploads de clientes
if [ -d "uploads/clientes" ]; then
    echo "  Limpiando uploads de clientes..."
    find uploads/clientes -mindepth 1 -type d -exec rm -rf {} + 2>/dev/null || true
    echo "  ✅ Uploads de clientes eliminados"
fi

echo "✅ Limpieza de archivos completada"
echo ""

# Paso 8: Levantar servicios restantes
echo "🚀 Paso 8: Levantando servicios restantes..."
docker-compose -f docker-compose.dev.yml up -d

if [ $? -ne 0 ]; then
    echo "❌ Error levantando servicios"
    exit 1
fi

echo "✅ Todos los servicios levantados"
echo ""

# Resumen final
echo "========================================"
echo "  ✅ BASE DE DATOS REINICIADA"
echo "========================================"
echo ""
echo "📋 Servicios disponibles (Dev Server):"
echo "  • Frontend:  http://72.167.52.14:5173"
echo "  • Backend:   http://72.167.52.14:8080"
echo "  • PostgreSQL: 72.167.52.14:5432"
echo ""
echo "👤 Usuarios de prueba:"
echo "  • Admin:     admin@armasimportacion.com / admin123"
echo "  • Jefe:      jefe@test.com / admin123"
echo "  • Vendedor:  vendedor@test.com / admin123"
echo "  • Karolina:  karritogeova@hotmail.com / admin123"
echo "  • Rossy:     rossy-revelo@hotmail.com / admin123"
echo ""
echo "⏳ Espera ~30 segundos para que el backend inicie completamente"
echo ""


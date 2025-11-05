#!/bin/bash

echo "🔧 FIX DE SECUENCIAS - TODAS LAS TABLAS"
echo "========================================"
echo ""
echo "Este script resetea las secuencias de TODAS las tablas"
echo "para que los IDs empiecen desde el valor correcto."
echo ""

read -p "¿Continuar? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelado"
    exit 1
fi

echo ""
echo "🔧 Reseteando secuencias..."

# Ejecutar el fix de secuencias en PostgreSQL
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev <<'EOF'

-- Resetear secuencia de usuario
SELECT setval('usuario_id_seq', COALESCE((SELECT MAX(id) FROM usuario), 1), true);

-- Resetear secuencia de rol
SELECT setval('rol_id_seq', COALESCE((SELECT MAX(id) FROM rol), 1), true);

-- Resetear secuencia de cliente
SELECT setval('cliente_id_seq', COALESCE((SELECT MAX(id) FROM cliente), 1), true);

-- Resetear secuencia de arma
SELECT setval('arma_id_seq', COALESCE((SELECT MAX(id) FROM arma), 1), true);

-- Resetear secuencia de categoria_arma
SELECT setval('categoria_arma_id_seq', COALESCE((SELECT MAX(id) FROM categoria_arma), 1), true);

-- Resetear secuencia de arma_serie
SELECT setval('arma_serie_id_seq', COALESCE((SELECT MAX(id) FROM arma_serie), 1), true);

-- Resetear secuencia de licencia
SELECT setval('licencia_id_seq', COALESCE((SELECT MAX(id) FROM licencia), 1), true);

-- Resetear secuencia de tipo_cliente
SELECT setval('tipo_cliente_id_seq', COALESCE((SELECT MAX(id) FROM tipo_cliente), 1), true);

-- Resetear secuencia de tipo_identificacion
SELECT setval('tipo_identificacion_id_seq', COALESCE((SELECT MAX(id) FROM tipo_identificacion), 1), true);

-- Resetear secuencia de tipo_importacion
SELECT setval('tipo_importacion_id_seq', COALESCE((SELECT MAX(id) FROM tipo_importacion), 1), true);

-- Resetear secuencia de tipo_documento
SELECT setval('tipo_documento_id_seq', COALESCE((SELECT MAX(id) FROM tipo_documento), 1), true);

-- Resetear secuencia de pregunta_cliente
SELECT setval('pregunta_cliente_id_seq', COALESCE((SELECT MAX(id) FROM pregunta_cliente), 1), true);

-- Resetear secuencia de grupo_importacion
SELECT setval('grupo_importacion_id_seq', COALESCE((SELECT MAX(id) FROM grupo_importacion), 1), true);

-- Resetear secuencia de solicitud_cliente
SELECT setval('solicitud_cliente_id_seq', COALESCE((SELECT MAX(id) FROM solicitud_cliente), 1), true);

-- Resetear secuencia de pago
SELECT setval('pago_id_seq', COALESCE((SELECT MAX(id) FROM pago), 1), true);

-- Resetear secuencia de factura
SELECT setval('factura_id_seq', COALESCE((SELECT MAX(id) FROM factura), 1), true);

-- Resetear secuencia de contrato
SELECT setval('contrato_id_seq', COALESCE((SELECT MAX(id) FROM contrato), 1), true);

-- Resetear secuencia de configuracion_sistema
SELECT setval('configuracion_sistema_id_seq', COALESCE((SELECT MAX(id) FROM configuracion_sistema), 1), true);

-- Verificar secuencias actuales
SELECT 'usuario' as tabla, last_value FROM usuario_id_seq
UNION ALL
SELECT 'rol', last_value FROM rol_id_seq
UNION ALL
SELECT 'cliente', last_value FROM cliente_id_seq
UNION ALL
SELECT 'arma', last_value FROM arma_id_seq
UNION ALL
SELECT 'categoria_arma', last_value FROM categoria_arma_id_seq
UNION ALL
SELECT 'licencia', last_value FROM licencia_id_seq;

EOF

echo ""
echo "✅ Secuencias reseteadas correctamente"
echo ""
echo "🔍 Verificar próximo ID de usuario:"
echo "   docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c \"SELECT nextval('usuario_id_seq');\""
echo ""
echo "📊 Ver usuarios ordenados por ID:"
echo "   docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c \"SELECT id, username FROM usuario ORDER BY id;\""
echo ""


#!/bin/bash

echo "🔧 FIX DE SECUENCIAS - PRODUCCIÓN"
echo "=================================="
echo ""
echo "Este script resetea las secuencias de TODAS las tablas"
echo "para que los IDs continúen desde el valor correcto."
echo ""
echo "⚠️  ATENCIÓN: Este script es para PRODUCCIÓN"
echo ""

read -p "¿Continuar? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelado"
    exit 1
fi

echo ""
echo "🔧 Reseteando secuencias en PRODUCCIÓN..."

# Ejecutar el fix de secuencias en PostgreSQL PRODUCCIÓN
docker exec gmarm-postgres-prod psql -U postgres -d gmarm_prod <<'EOF'

-- Resetear secuencias principales usando GREATEST para asegurar mínimo 1
SELECT setval('rol_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM rol), 0), 1), true);
SELECT setval('usuario_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM usuario), 0), 1), true);
SELECT setval('usuario_rol_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM usuario_rol), 0), 1), true);
SELECT setval('tipo_cliente_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM tipo_cliente), 0), 1), true);
SELECT setval('tipo_identificacion_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM tipo_identificacion), 0), 1), true);
SELECT setval('tipo_proceso_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM tipo_proceso), 0), 1), true);
SELECT setval('tipo_importacion_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM tipo_importacion), 0), 1), true);
SELECT setval('tipo_cliente_importacion_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM tipo_cliente_importacion), 0), 1), true);
SELECT setval('cliente_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM cliente), 0), 1), true);
SELECT setval('preguntas_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM preguntas), 0), 1), true);
SELECT setval('respuestas_cliente_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM respuestas_cliente), 0), 1), true);
SELECT setval('tipo_documento_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM tipo_documento), 0), 1), true);
SELECT setval('documento_cliente_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM documento_cliente), 0), 1), true);

-- Tablas de armas
SELECT setval('categoria_arma_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM categoria_arma), 0), 1), true);
SELECT setval('arma_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM arma), 0), 1), true);
SELECT setval('arma_imagen_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM arma_imagen), 0), 1), true);
SELECT setval('arma_stock_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM arma_stock), 0), 1), true);
SELECT setval('arma_serie_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM arma_serie), 0), 1), true);
SELECT setval('arma_fisica_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM arma_fisica), 0), 1), true);
SELECT setval('cliente_arma_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM cliente_arma), 0), 1), true);

-- Tablas de accesorios
SELECT setval('accesorio_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM accesorio), 0), 1), true);
SELECT setval('accesorio_fisico_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM accesorio_fisico), 0), 1), true);
SELECT setval('cliente_accesorio_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM cliente_accesorio), 0), 1), true);

-- Tablas de pagos
SELECT setval('pago_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM pago), 0), 1), true);
SELECT setval('cuota_pago_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM cuota_pago), 0), 1), true);

-- Tablas de importación
SELECT setval('licencia_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM licencia), 0), 1), true);
SELECT setval('grupo_importacion_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM grupo_importacion), 0), 1), true);
SELECT setval('cliente_grupo_importacion_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM cliente_grupo_importacion), 0), 1), true);
SELECT setval('grupo_importacion_cupo_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM grupo_importacion_cupo), 0), 1), true);
SELECT setval('grupo_importacion_vendedor_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM grupo_importacion_vendedor), 0), 1), true);
SELECT setval('grupo_importacion_limite_categoria_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM grupo_importacion_limite_categoria), 0), 1), true);
SELECT setval('documento_grupo_importacion_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM documento_grupo_importacion), 0), 1), true);
SELECT setval('documento_generado_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM documento_generado), 0), 1), true);

-- Tablas de localización
SELECT setval('provincia_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM provincia), 0), 1), true);
SELECT setval('canton_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM canton), 0), 1), true);

-- Tablas del sistema
SELECT setval('configuracion_sistema_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM configuracion_sistema), 0), 1), true);
SELECT setval('notificacion_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM notificacion), 0), 1), true);
SELECT setval('email_verification_token_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM email_verification_token), 0), 1), true);

-- Verificar secuencias principales
SELECT 'usuario' as tabla, last_value FROM usuario_id_seq
UNION ALL
SELECT 'cliente', last_value FROM cliente_id_seq
UNION ALL
SELECT 'arma', last_value FROM arma_id_seq
UNION ALL
SELECT 'pago', last_value FROM pago_id_seq
UNION ALL
SELECT 'grupo_importacion', last_value FROM grupo_importacion_id_seq;

SELECT '✅ Secuencias reseteadas exitosamente' as info;

EOF

echo ""
echo "✅ Secuencias reseteadas correctamente"
echo ""
echo "🔍 Verificar próximo ID de cliente:"
echo "   docker exec gmarm-postgres-prod psql -U postgres -d gmarm_prod -c \"SELECT nextval('cliente_id_seq');\""
echo ""


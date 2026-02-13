-- =====================================================
-- Migration V1: Agregar configuraciones de edad mínima y cuotas máximas
-- Fecha: 2026-02-12
-- Descripción: Agrega EDAD_MINIMA_CLIENTE y NUMERO_MAXIMO_CUOTAS
--              a configuracion_sistema para eliminar hardcodes en backend
-- =====================================================

INSERT INTO configuracion_sistema (clave, valor, descripcion, editable)
VALUES
    ('EDAD_MINIMA_CLIENTE', '25', 'Edad mínima requerida para compra de armas', true),
    ('NUMERO_MAXIMO_CUOTAS', '12', 'Número máximo de cuotas permitido para pagos a crédito', true)
ON CONFLICT (clave) DO NOTHING;

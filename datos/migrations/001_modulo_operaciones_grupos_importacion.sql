-- ============================================================
-- MIGRACIÓN: Módulo de Operaciones - Grupos de Importación
-- Fecha: 2024-12-XX
-- Descripción: Agrega soporte para documentos de grupos de importación
--               y campos necesarios para el flujo de operaciones
-- ============================================================

-- 1. Eliminar tabla tipo_cliente_tipo_importacion (duplicada, no se usa)
DROP TABLE IF EXISTS tipo_cliente_tipo_importacion CASCADE;

-- 2. Agregar columna grupos_importacion a tipo_documento
ALTER TABLE tipo_documento 
ADD COLUMN IF NOT EXISTS grupos_importacion BOOLEAN DEFAULT false NOT NULL;

COMMENT ON COLUMN tipo_documento.grupos_importacion IS 
    'true si es para grupos de importación (tipo_proceso_id debe ser NULL), false si es para clientes (requiere tipo_proceso_id)';

-- 3. Agregar columna numero_previa_importacion a grupo_importacion
ALTER TABLE grupo_importacion 
ADD COLUMN IF NOT EXISTS numero_previa_importacion VARCHAR(100);

COMMENT ON COLUMN grupo_importacion.numero_previa_importacion IS 
    'Número de previa importación';

-- 4. Hacer tipo_proceso_id nullable en tipo_documento y grupo_importacion
ALTER TABLE tipo_documento 
ALTER COLUMN tipo_proceso_id DROP NOT NULL;

ALTER TABLE grupo_importacion 
ALTER COLUMN tipo_proceso_id DROP NOT NULL;

COMMENT ON COLUMN tipo_documento.tipo_proceso_id IS 
    'Tipo de proceso (requerido solo si grupos_importacion = false, debe ser NULL si grupos_importacion = true)';

COMMENT ON COLUMN grupo_importacion.tipo_proceso_id IS 
    'Tipo de proceso (opcional). Los grupos pueden tener cualquier tipo de cliente';

-- 5. Migrar documento_grupo_importacion para usar tipo_documento_id
ALTER TABLE documento_grupo_importacion 
ADD COLUMN IF NOT EXISTS tipo_documento_id BIGINT;

-- 6. Crear tipos de documento para grupos de importación
INSERT INTO tipo_documento (nombre, descripcion, obligatorio, estado, grupos_importacion, tipo_proceso_id)
VALUES
    ('Proforma a fabrica para importacion', 'Proforma recibida de la fábrica para la importación', true, true, true, NULL),
    ('Solicitar carta inspeccion de rastrillo', 'Carta de inspección de rastrillo', true, true, true, NULL),
    ('Documento de resolucion de importacion', 'Resolución de importación', true, true, true, NULL),
    ('Pedido de previa importacion', 'Pedido de previa importación', true, true, true, NULL),
    ('Retiro de Guia', 'Documento de retiro de guía', true, true, true, NULL),
    ('Liquidacion de importacion', 'Liquidación de importación', true, true, true, NULL),
    ('Documento recibido por comando conjunto', 'Documento recibido por comando conjunto', true, true, true, NULL)
ON CONFLICT DO NOTHING;

-- 7. Migrar datos existentes de documento_grupo_importacion
UPDATE documento_grupo_importacion dgi
SET tipo_documento_id = td.id
FROM tipo_documento td
WHERE dgi.tipo_documento_id IS NULL
  AND dgi.tipo_documento IS NOT NULL
  AND td.nombre = dgi.tipo_documento
  AND td.grupos_importacion = true;

-- 8. Agregar foreign key constraint
ALTER TABLE documento_grupo_importacion
DROP CONSTRAINT IF EXISTS fk_documento_grupo_importacion_tipo_documento;

ALTER TABLE documento_grupo_importacion
ADD CONSTRAINT fk_documento_grupo_importacion_tipo_documento
FOREIGN KEY (tipo_documento_id) 
REFERENCES tipo_documento(id);

-- 9. Corregir datos: documentos de grupos_importacion deben tener tipo_proceso_id = NULL
UPDATE tipo_documento 
SET tipo_proceso_id = NULL 
WHERE grupos_importacion = true 
  AND tipo_proceso_id IS NOT NULL;

-- 10. Agregar índice único para evitar que un cliente esté en múltiples grupos activos
DROP INDEX IF EXISTS uk_cliente_grupo_importacion_activo;

CREATE UNIQUE INDEX uk_cliente_grupo_importacion_activo
ON cliente_grupo_importacion (cliente_id)
WHERE estado NOT IN ('COMPLETADO', 'CANCELADO');

COMMENT ON INDEX uk_cliente_grupo_importacion_activo IS 
    'Evita que un cliente esté asignado a múltiples grupos activos simultáneamente';

-- 11. Actualizar configuraciones de expoferia
-- Cambiar EXPOFERIA_ACTIVA a false
UPDATE configuracion_sistema 
SET valor = 'false' 
WHERE clave = 'EXPOFERIA_ACTIVA';

-- Renombrar claves de coordinador (eliminar sufijo _EXPOFERIA)
UPDATE configuracion_sistema 
SET clave = 'COORDINADOR_NOMBRE' 
WHERE clave = 'COORDINADOR_NOMBRE_EXPOFERIA';

UPDATE configuracion_sistema 
SET clave = 'COORDINADOR_CARGO' 
WHERE clave = 'COORDINADOR_CARGO_EXPOFERIA';

UPDATE configuracion_sistema 
SET clave = 'COORDINADOR_DIRECCION' 
WHERE clave = 'COORDINADOR_DIRECCION_EXPOFERIA';

-- Eliminar EXPOFERIA_NOMBRE (no es necesario)
DELETE FROM configuracion_sistema 
WHERE clave = 'EXPOFERIA_NOMBRE';

-- 12. Actualizar todas las armas del plan piloto para que expoferia = false
UPDATE arma 
SET expoferia = false 
WHERE expoferia = true;
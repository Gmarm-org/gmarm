-- =====================================================
-- ACTUALIZACIÓN DE ESTADO DE CLIENTE
-- Versión: 1.0
-- Fecha: 2024-12-31
-- Descripción: Actualizaciones para manejar el estado del cliente según el frontend
-- =====================================================

-- =====================================================
-- 1. ACTUALIZAR ENUM DE ESTADO DE CLIENTE
-- =====================================================

-- Crear un tipo ENUM para el estado del cliente
DO $$ BEGIN
    CREATE TYPE estado_cliente_enum AS ENUM (
        'FALTAN_DOCUMENTOS',
        'BLOQUEADO', 
        'LISTO_IMPORTACION',
        'INACTIVO',
        'ACTIVO'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. ACTUALIZAR TABLA CLIENTE
-- =====================================================

-- Agregar columna para vendedor_id si no existe
ALTER TABLE cliente 
ADD COLUMN IF NOT EXISTS vendedor_id INTEGER REFERENCES usuario(id);

-- Actualizar el tipo de la columna estado para usar el ENUM
ALTER TABLE cliente 
ALTER COLUMN estado TYPE VARCHAR(30);

-- Agregar constraint para validar los valores del estado
ALTER TABLE cliente 
ADD CONSTRAINT chk_cliente_estado 
CHECK (estado IN ('FALTAN_DOCUMENTOS', 'BLOQUEADO', 'LISTO_IMPORTACION', 'INACTIVO', 'ACTIVO'));

-- =====================================================
-- 3. ACTUALIZAR TABLA RESPUESTA_CLIENTE
-- =====================================================

-- Agregar campos adicionales para las respuestas
ALTER TABLE respuesta_cliente 
ADD COLUMN IF NOT EXISTS tipo_respuesta VARCHAR(20) DEFAULT 'TEXTO',
ADD COLUMN IF NOT EXISTS pregunta_texto TEXT;

-- Crear índice para optimizar consultas por cliente
CREATE INDEX IF NOT EXISTS idx_respuesta_cliente_cliente ON respuesta_cliente(cliente_id);

-- =====================================================
-- 4. ACTUALIZAR TABLA DOCUMENTO_CLIENTE
-- =====================================================

-- Agregar campos adicionales para documentos
ALTER TABLE documento_cliente 
ADD COLUMN IF NOT EXISTS nombre_archivo VARCHAR(255),
ADD COLUMN IF NOT EXISTS tipo_mime VARCHAR(100),
ADD COLUMN IF NOT EXISTS tamano_bytes BIGINT;

-- Crear índice para optimizar consultas por cliente y estado
CREATE INDEX IF NOT EXISTS idx_documento_cliente_estado ON documento_cliente(cliente_id, estado);

-- =====================================================
-- 5. ACTUALIZAR DATOS EXISTENTES
-- =====================================================

-- Actualizar clientes existentes para que tengan un estado válido
UPDATE cliente 
SET estado = 'FALTAN_DOCUMENTOS' 
WHERE estado NOT IN ('FALTAN_DOCUMENTOS', 'BLOQUEADO', 'LISTO_IMPORTACION', 'INACTIVO', 'ACTIVO')
   OR estado IS NULL;

-- =====================================================
-- 6. CREAR FUNCIÓN PARA DETERMINAR ESTADO DE CLIENTE
-- =====================================================

CREATE OR REPLACE FUNCTION determinar_estado_cliente(p_cliente_id INTEGER)
RETURNS VARCHAR(30) AS $$
DECLARE
    v_estado VARCHAR(30) := 'FALTAN_DOCUMENTOS';
    v_tiene_documentos BOOLEAN := FALSE;
    v_esta_bloqueado BOOLEAN := FALSE;
    v_tiene_arma_asignada BOOLEAN := FALSE;
BEGIN
    -- Verificar si tiene documentos cargados
    SELECT EXISTS(
        SELECT 1 FROM documento_cliente dc
        WHERE dc.cliente_id = p_cliente_id 
        AND dc.estado = 'APROBADO'
    ) INTO v_tiene_documentos;
    
    -- Verificar si está bloqueado por respuestas
    SELECT EXISTS(
        SELECT 1 FROM respuesta_cliente rc
        WHERE rc.cliente_id = p_cliente_id 
        AND rc.pregunta_texto LIKE '%denuncias de violencia%'
        AND rc.respuesta = 'SI'
    ) INTO v_esta_bloqueado;
    
    -- Verificar si tiene arma asignada
    SELECT EXISTS(
        SELECT 1 FROM asignacion_arma aa
        WHERE aa.cliente_id = p_cliente_id
    ) INTO v_tiene_arma_asignada;
    
    -- Determinar estado
    IF v_esta_bloqueado THEN
        v_estado := 'BLOQUEADO';
    ELSIF v_tiene_documentos AND v_tiene_arma_asignada THEN
        v_estado := 'LISTO_IMPORTACION';
    ELSIF v_tiene_documentos THEN
        v_estado := 'FALTAN_DOCUMENTOS'; -- Faltan documentos o arma
    ELSE
        v_estado := 'FALTAN_DOCUMENTOS';
    END IF;
    
    RETURN v_estado;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. CREAR TRIGGER PARA ACTUALIZAR ESTADO AUTOMÁTICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION actualizar_estado_cliente_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar el estado del cliente cuando cambien documentos o respuestas
    UPDATE cliente 
    SET estado = determinar_estado_cliente(NEW.cliente_id),
        fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE id = NEW.cliente_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para actualizar estado automáticamente
DROP TRIGGER IF EXISTS trigger_actualizar_estado_documento ON documento_cliente;
CREATE TRIGGER trigger_actualizar_estado_documento
    AFTER INSERT OR UPDATE OR DELETE ON documento_cliente
    FOR EACH ROW EXECUTE FUNCTION actualizar_estado_cliente_trigger();

DROP TRIGGER IF EXISTS trigger_actualizar_estado_respuesta ON respuesta_cliente;
CREATE TRIGGER trigger_actualizar_estado_respuesta
    AFTER INSERT OR UPDATE OR DELETE ON respuesta_cliente
    FOR EACH ROW EXECUTE FUNCTION actualizar_estado_cliente_trigger();

DROP TRIGGER IF EXISTS trigger_actualizar_estado_asignacion ON asignacion_arma;
CREATE TRIGGER trigger_actualizar_estado_asignacion
    AFTER INSERT OR UPDATE OR DELETE ON asignacion_arma
    FOR EACH ROW EXECUTE FUNCTION actualizar_estado_cliente_trigger();

-- =====================================================
-- 8. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON FUNCTION determinar_estado_cliente IS 'Función que determina el estado de un cliente basado en documentos, respuestas y asignaciones de armas';
COMMENT ON FUNCTION actualizar_estado_cliente_trigger IS 'Trigger que actualiza automáticamente el estado del cliente cuando cambian documentos, respuestas o asignaciones';

-- =====================================================
-- 9. EJEMPLO DE USO
-- =====================================================

-- Ejemplo: Determinar estado de un cliente específico
-- SELECT determinar_estado_cliente(1);

-- Ejemplo: Actualizar estado de todos los clientes
-- UPDATE cliente SET estado = determinar_estado_cliente(id); 
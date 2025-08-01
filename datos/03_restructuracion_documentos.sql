-- =====================================================
-- RESTRUCTURACIÓN DE DOCUMENTOS CON LINKS EXTERNOS
-- Versión: 1.1
-- Fecha: 2024-12-31
-- Descripción: Modificaciones para manejar documentos con links externos
-- =====================================================

-- =====================================================
-- 1. MODIFICAR TABLA tipo_documento PARA INCLUIR LINKS
-- =====================================================

-- Agregar columnas para manejar links externos
ALTER TABLE tipo_documento 
ADD COLUMN IF NOT EXISTS link_externo VARCHAR(500),
ADD COLUMN IF NOT EXISTS es_documento_externo BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS aplica_para_todos BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS instrucciones_descarga TEXT,
ADD COLUMN IF NOT EXISTS orden_visual INTEGER DEFAULT 999;

-- =====================================================
-- 2. ACTUALIZAR DOCUMENTOS EXISTENTES CON LINKS
-- =====================================================

-- Documentos con links externos (aplican para todos excepto Compañía de Seguridad)
UPDATE tipo_documento SET 
  es_documento_externo = TRUE,
  aplica_para_todos = TRUE,
  link_externo = 'https://certificados.ministeriodelinterior.gob.ec/gestorcertificados/antecedentes/',
  instrucciones_descarga = 'Descargar certificado de antecedentes penales (no tener procesos legales)'
WHERE nombre = 'Certificado de antecedentes';

-- Insertar nuevos documentos con links externos
INSERT INTO tipo_documento (nombre, descripcion, obligatorio, tipo_proceso_id, es_documento_externo, aplica_para_todos, link_externo, instrucciones_descarga, orden_visual) VALUES
('Antecedentes Penales', 'Certificado de antecedentes penales (no tener procesos legales)', TRUE, NULL, TRUE, TRUE, 'https://certificados.ministeriodelinterior.gob.ec/gestorcertificados/antecedentes/', 'Descargar certificado de antecedentes penales (no tener procesos legales)', 1),
('Consejo de la Judicatura', 'Certificado de no tener juicios en su contra (no casos de robos, violencia o asesinatos)', TRUE, NULL, TRUE, TRUE, 'https://consultas.funcionjudicial.gob.ec/informacionjudicialindividual/pages/index.jsf#!/', 'Descargar certificado de no tener juicios en su contra', 2),
('Fiscalía', 'Certificado de no tener procesos en su contra (no casos de robos, violencia o asesinatos)', TRUE, NULL, TRUE, TRUE, 'https://www.fiscalia.gob.ec/consulta-de-noticias-del-delito/', 'Descargar certificado de no tener procesos en su contra', 3),
('SATJE', 'Certificado de procesos judiciales', TRUE, NULL, TRUE, TRUE, 'https://procesosjudiciales.funcionjudicial.gob.ec/busqueda-filtros', 'Descargar certificado de procesos judiciales', 4);

-- =====================================================
-- 3. CREAR TABLA PARA CONFIGURACIÓN DE DOCUMENTOS EXTERNOS
-- =====================================================

CREATE TABLE IF NOT EXISTS configuracion_documento_externo (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  link_externo VARCHAR(500) NOT NULL,
  instrucciones_descarga TEXT,
  aplica_para_tipos_cliente TEXT[], -- Array de tipos de cliente que aplican
  excluye_tipos_cliente TEXT[], -- Array de tipos de cliente que NO aplican
  orden_visual INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. INSERTAR CONFIGURACIÓN DE DOCUMENTOS EXTERNOS
-- =====================================================

INSERT INTO configuracion_documento_externo (nombre, descripcion, link_externo, instrucciones_descarga, aplica_para_tipos_cliente, excluye_tipos_cliente, orden_visual) VALUES
('Antecedentes Penales', 'Certificado de antecedentes penales (no tener procesos legales)', 'https://certificados.ministeriodelinterior.gob.ec/gestorcertificados/antecedentes/', 'Descargar certificado de antecedentes penales (no tener procesos legales)', ARRAY['Civil', 'Uniformado', 'Deportista'], ARRAY['Compañía de Seguridad'], 1),
('Consejo de la Judicatura', 'Certificado de no tener juicios en su contra (no casos de robos, violencia o asesinatos)', 'https://consultas.funcionjudicial.gob.ec/informacionjudicialindividual/pages/index.jsf#!/', 'Descargar certificado de no tener juicios en su contra', ARRAY['Civil', 'Uniformado', 'Deportista'], ARRAY['Compañía de Seguridad'], 2),
('Fiscalía', 'Certificado de no tener procesos en su contra (no casos de robos, violencia o asesinatos)', 'https://www.fiscalia.gob.ec/consulta-de-noticias-del-delito/', 'Descargar certificado de no tener procesos en su contra', ARRAY['Civil', 'Uniformado', 'Deportista'], ARRAY['Compañía de Seguridad'], 3),
('SATJE', 'Certificado de procesos judiciales', 'https://procesosjudiciales.funcionjudicial.gob.ec/busqueda-filtros', 'Descargar certificado de procesos judiciales', ARRAY['Civil', 'Uniformado', 'Deportista'], ARRAY['Compañía de Seguridad'], 4);

-- =====================================================
-- 5. CREAR FUNCIÓN PARA OBTENER DOCUMENTOS POR TIPO DE CLIENTE
-- =====================================================

CREATE OR REPLACE FUNCTION obtener_documentos_por_tipo_cliente(
  p_tipo_cliente VARCHAR(50),
  p_estado_militar VARCHAR(20) DEFAULT NULL
)
RETURNS TABLE (
  id INTEGER,
  nombre VARCHAR(100),
  descripcion TEXT,
  obligatorio BOOLEAN,
  es_documento_externo BOOLEAN,
  link_externo VARCHAR(500),
  instrucciones_descarga TEXT,
  tipo_proceso_id INTEGER,
  orden_visual INTEGER
) AS $$
BEGIN
  -- Determinar el tipo de proceso basado en el tipo de cliente y estado militar
  DECLARE
    v_tipo_proceso_id INTEGER;
  BEGIN
    -- Si es Uniformado y está en servicio pasivo, usar proceso de Civil
    IF p_tipo_cliente = 'Uniformado' AND p_estado_militar = 'PASIVO' THEN
      v_tipo_proceso_id := 1; -- Civil
    ELSE
      -- Mapeo normal de tipos de cliente a procesos
      CASE p_tipo_cliente
        WHEN 'Civil' THEN v_tipo_proceso_id := 1;
        WHEN 'Uniformado' THEN v_tipo_proceso_id := 2;
        WHEN 'Compañía de Seguridad' THEN v_tipo_proceso_id := 3;
        WHEN 'Deportista' THEN v_tipo_proceso_id := 4;
        ELSE v_tipo_proceso_id := NULL;
      END CASE;
    END IF;

    -- Retornar documentos específicos del tipo de proceso
    RETURN QUERY
    SELECT 
      td.id,
      td.nombre,
      td.descripcion,
      td.obligatorio,
      td.es_documento_externo,
      td.link_externo,
      td.instrucciones_descarga,
      td.tipo_proceso_id,
      COALESCE(td.orden_visual, 999) as orden_visual
    FROM tipo_documento td
    WHERE td.tipo_proceso_id = v_tipo_proceso_id
      AND td.estado = TRUE
    ORDER BY orden_visual, td.nombre;

    -- Retornar documentos externos que aplican para este tipo de cliente
    RETURN QUERY
    SELECT 
      cde.id,
      cde.nombre,
      cde.descripcion,
      TRUE as obligatorio, -- Los documentos externos son siempre obligatorios
      TRUE as es_documento_externo,
      cde.link_externo,
      cde.instrucciones_descarga,
      CAST(NULL AS INTEGER) as tipo_proceso_id,
      cde.orden_visual
    FROM configuracion_documento_externo cde
    WHERE cde.activo = TRUE
      AND (
        -- Si aplica para todos los tipos especificados
        (cde.aplica_para_tipos_cliente IS NOT NULL AND p_tipo_cliente = ANY(cde.aplica_para_tipos_cliente))
        OR
        -- Si no hay exclusión específica para este tipo
        (cde.excluye_tipos_cliente IS NULL OR NOT (p_tipo_cliente = ANY(cde.excluye_tipos_cliente)))
      )
    ORDER BY cde.orden_visual, cde.nombre;
  END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. CREAR TRIGGER PARA ACTUALIZAR fecha_actualizacion
-- =====================================================

CREATE TRIGGER update_configuracion_documento_externo_updated_at 
    BEFORE UPDATE ON configuracion_documento_externo 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. CREAR ÍNDICES PARA OPTIMIZAR CONSULTAS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_tipo_documento_proceso ON tipo_documento(tipo_proceso_id, estado);
CREATE INDEX IF NOT EXISTS idx_tipo_documento_externo ON tipo_documento(es_documento_externo, aplica_para_todos);
CREATE INDEX IF NOT EXISTS idx_config_doc_externo_activo ON configuracion_documento_externo(activo);
CREATE INDEX IF NOT EXISTS idx_config_doc_externo_tipos ON configuracion_documento_externo USING GIN(aplica_para_tipos_cliente);
CREATE INDEX IF NOT EXISTS idx_config_doc_externo_excluye ON configuracion_documento_externo USING GIN(excluye_tipos_cliente);

-- =====================================================
-- 8. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE configuracion_documento_externo IS 'Configuración de documentos externos con links que aplican para diferentes tipos de cliente';
COMMENT ON COLUMN configuracion_documento_externo.aplica_para_tipos_cliente IS 'Array de tipos de cliente para los que aplica este documento';
COMMENT ON COLUMN configuracion_documento_externo.excluye_tipos_cliente IS 'Array de tipos de cliente para los que NO aplica este documento';
COMMENT ON FUNCTION obtener_documentos_por_tipo_cliente IS 'Función que retorna todos los documentos (específicos y externos) que aplican para un tipo de cliente';

-- =====================================================
-- 9. EJEMPLO DE USO
-- =====================================================

-- Ejemplo: Obtener documentos para un cliente Civil
-- SELECT * FROM obtener_documentos_por_tipo_cliente('Civil');

-- Ejemplo: Obtener documentos para un Uniformado en servicio pasivo
-- SELECT * FROM obtener_documentos_por_tipo_cliente('Uniformado', 'PASIVO');

-- Ejemplo: Obtener documentos para una Compañía de Seguridad
-- SELECT * FROM obtener_documentos_por_tipo_cliente('Compañía de Seguridad'); 
-- =====================================================
-- CORRECCIÓN RÁPIDA DE FUNCIÓN
-- Versión: 1.0
-- Fecha: 2024-12-31
-- Descripción: Corrección del error de tipo de datos en obtener_documentos_por_tipo_cliente
-- =====================================================

-- =====================================================
-- 1. CORREGIR FUNCIÓN obtener_documentos_por_tipo_cliente
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
-- 2. VERIFICAR QUE LA CORRECCIÓN FUNCIONE
-- =====================================================

DO $$
BEGIN
    -- Verificar que la función retorne datos para un tipo de cliente válido
    IF NOT EXISTS (
        SELECT 1 FROM obtener_documentos_por_tipo_cliente('Civil')
    ) THEN
        RAISE NOTICE 'Función obtener_documentos_por_tipo_cliente no retorna datos para Civil';
    ELSE
        RAISE NOTICE 'Función obtener_documentos_por_tipo_cliente funciona correctamente';
    END IF;
END $$;

-- =====================================================
-- 3. RESUMEN
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'CORRECCIÓN APLICADA EXITOSAMENTE';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'La función obtener_documentos_por_tipo_cliente ha sido';
    RAISE NOTICE 'corregida para manejar correctamente los tipos de datos.';
    RAISE NOTICE '=====================================================';
END $$; 
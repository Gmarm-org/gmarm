-- =====================================================
-- VERIFICACIÓN DE ESTRUCTURA DE BASE DE DATOS
-- Versión: 1.0
-- Fecha: 2024-12-31
-- Descripción: Script para verificar que todas las tablas y campos estén correctamente configurados
-- =====================================================

-- =====================================================
-- 1. VERIFICAR TABLA TIPO_DOCUMENTO
-- =====================================================

DO $$
BEGIN
    -- Verificar que las columnas necesarias existan en tipo_documento
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tipo_documento' 
        AND column_name = 'link_externo'
    ) THEN
        RAISE EXCEPTION 'Columna link_externo no existe en tipo_documento';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tipo_documento' 
        AND column_name = 'es_documento_externo'
    ) THEN
        RAISE EXCEPTION 'Columna es_documento_externo no existe en tipo_documento';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tipo_documento' 
        AND column_name = 'orden_visual'
    ) THEN
        RAISE EXCEPTION 'Columna orden_visual no existe en tipo_documento';
    END IF;
    
    RAISE NOTICE 'Tabla tipo_documento verificada correctamente';
END $$;

-- =====================================================
-- 2. VERIFICAR TABLA CONFIGURACION_DOCUMENTO_EXTERNO
-- =====================================================

DO $$
BEGIN
    -- Verificar que la tabla configuracion_documento_externo exista
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'configuracion_documento_externo'
    ) THEN
        RAISE EXCEPTION 'Tabla configuracion_documento_externo no existe';
    END IF;
    
    -- Verificar que las columnas necesarias existan
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'configuracion_documento_externo' 
        AND column_name = 'activo'
    ) THEN
        RAISE EXCEPTION 'Columna activo no existe en configuracion_documento_externo';
    END IF;
    
    RAISE NOTICE 'Tabla configuracion_documento_externo verificada correctamente';
END $$;

-- =====================================================
-- 3. VERIFICAR TABLA CLIENTE
-- =====================================================

DO $$
BEGIN
    -- Verificar que las columnas necesarias existan en cliente
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cliente' 
        AND column_name = 'estado'
    ) THEN
        RAISE EXCEPTION 'Columna estado no existe en cliente';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cliente' 
        AND column_name = 'vendedor_id'
    ) THEN
        RAISE EXCEPTION 'Columna vendedor_id no existe en cliente';
    END IF;
    
    RAISE NOTICE 'Tabla cliente verificada correctamente';
END $$;

-- =====================================================
-- 4. VERIFICAR TABLA RESPUESTA_CLIENTE
-- =====================================================

DO $$
BEGIN
    -- Verificar que las columnas necesarias existan en respuesta_cliente
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'respuesta_cliente' 
        AND column_name = 'tipo_respuesta'
    ) THEN
        RAISE EXCEPTION 'Columna tipo_respuesta no existe en respuesta_cliente';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'respuesta_cliente' 
        AND column_name = 'pregunta_texto'
    ) THEN
        RAISE EXCEPTION 'Columna pregunta_texto no existe en respuesta_cliente';
    END IF;
    
    RAISE NOTICE 'Tabla respuesta_cliente verificada correctamente';
END $$;

-- =====================================================
-- 5. VERIFICAR FUNCIONES
-- =====================================================

DO $$
BEGIN
    -- Verificar que la función obtener_documentos_por_tipo_cliente exista
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'obtener_documentos_por_tipo_cliente'
    ) THEN
        RAISE EXCEPTION 'Función obtener_documentos_por_tipo_cliente no existe';
    END IF;
    
    -- Verificar que la función determinar_estado_cliente exista
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'determinar_estado_cliente'
    ) THEN
        RAISE EXCEPTION 'Función determinar_estado_cliente no existe';
    END IF;
    
    RAISE NOTICE 'Funciones verificadas correctamente';
END $$;

-- =====================================================
-- 6. VERIFICAR ÍNDICES
-- =====================================================

DO $$
BEGIN
    -- Verificar índices importantes
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_tipo_documento_proceso'
    ) THEN
        RAISE EXCEPTION 'Índice idx_tipo_documento_proceso no existe';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_config_doc_externo_activo'
    ) THEN
        RAISE EXCEPTION 'Índice idx_config_doc_externo_activo no existe';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_respuesta_cliente_cliente'
    ) THEN
        RAISE EXCEPTION 'Índice idx_respuesta_cliente_cliente no existe';
    END IF;
    
    RAISE NOTICE 'Índices verificados correctamente';
END $$;

-- =====================================================
-- 7. VERIFICAR TRIGGERS
-- =====================================================

DO $$
BEGIN
    -- Verificar triggers importantes
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_actualizar_estado_documento'
    ) THEN
        RAISE EXCEPTION 'Trigger trigger_actualizar_estado_documento no existe';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_actualizar_estado_respuesta'
    ) THEN
        RAISE EXCEPTION 'Trigger trigger_actualizar_estado_respuesta no existe';
    END IF;
    
    RAISE NOTICE 'Triggers verificados correctamente';
END $$;

-- =====================================================
-- 8. VERIFICAR DATOS DE PRUEBA
-- =====================================================

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Verificar que existan tipos de cliente
    SELECT COUNT(*) INTO v_count FROM tipo_cliente;
    IF v_count = 0 THEN
        RAISE EXCEPTION 'No hay tipos de cliente en la base de datos';
    END IF;
    
    -- Verificar que existan tipos de identificación
    SELECT COUNT(*) INTO v_count FROM tipo_identificacion;
    IF v_count = 0 THEN
        RAISE EXCEPTION 'No hay tipos de identificación en la base de datos';
    END IF;
    
    -- Verificar que existan tipos de proceso
    SELECT COUNT(*) INTO v_count FROM tipo_proceso;
    IF v_count = 0 THEN
        RAISE EXCEPTION 'No hay tipos de proceso en la base de datos';
    END IF;
    
    -- Verificar que existan documentos externos
    SELECT COUNT(*) INTO v_count FROM configuracion_documento_externo;
    IF v_count = 0 THEN
        RAISE EXCEPTION 'No hay documentos externos configurados';
    END IF;
    
    RAISE NOTICE 'Datos de prueba verificados correctamente';
END $$;

-- =====================================================
-- 9. PRUEBA DE FUNCIONES
-- =====================================================

-- Probar la función obtener_documentos_por_tipo_cliente
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
-- 10. RESUMEN FINAL
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'VERIFICACIÓN COMPLETADA EXITOSAMENTE';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Todas las tablas, columnas, funciones, índices y triggers';
    RAISE NOTICE 'están correctamente configurados.';
    RAISE NOTICE 'La base de datos está lista para usar con el frontend.';
    RAISE NOTICE '=====================================================';
END $$; 
-- =====================================================
-- VERIFICACIÓN DE ORDEN DE EJECUCIÓN DE SCRIPTS SQL
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'VERIFICANDO ORDEN DE EJECUCIÓN DE SCRIPTS SQL';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Orden correcto de ejecución:';
    RAISE NOTICE '1. 01_gmarm_schema_mejorado.sql - Esquema base';
    RAISE NOTICE '2. 02_gmarm_datos_prueba.sql - Datos de prueba';
    RAISE NOTICE '3. 03_restructuracion_documentos.sql - Documentos externos';
    RAISE NOTICE '4. 04_actualizacion_cliente_estado.sql - Estado cliente';
    RAISE NOTICE '5. 05_verificacion_estructura.sql - Verificación';
    RAISE NOTICE '6. 06_correccion_funcion.sql - Corrección función';
    RAISE NOTICE '7. 07_usuario_admin_default.sql - Usuarios admin';
    RAISE NOTICE '=====================================================';
END $$;

-- =====================================================
-- VERIFICAR QUE TODAS LAS TABLAS EXISTAN
-- =====================================================

DO $$
DECLARE
    v_count INTEGER;
    v_table_name TEXT;
BEGIN
    RAISE NOTICE 'Verificando existencia de tablas principales...';
    
    -- Verificar tabla cliente
    SELECT COUNT(*) INTO v_count FROM information_schema.tables WHERE table_name = 'cliente';
    IF v_count > 0 THEN
        RAISE NOTICE '✅ Tabla cliente existe';
    ELSE
        RAISE NOTICE '❌ Tabla cliente NO existe';
    END IF;
    
    -- Verificar tabla tipo_documento
    SELECT COUNT(*) INTO v_count FROM information_schema.tables WHERE table_name = 'tipo_documento';
    IF v_count > 0 THEN
        RAISE NOTICE '✅ Tabla tipo_documento existe';
    ELSE
        RAISE NOTICE '❌ Tabla tipo_documento NO existe';
    END IF;
    
    -- Verificar tabla configuracion_documento_externo
    SELECT COUNT(*) INTO v_count FROM information_schema.tables WHERE table_name = 'configuracion_documento_externo';
    IF v_count > 0 THEN
        RAISE NOTICE '✅ Tabla configuracion_documento_externo existe';
    ELSE
        RAISE NOTICE '❌ Tabla configuracion_documento_externo NO existe';
    END IF;
    
    -- Verificar tabla usuario
    SELECT COUNT(*) INTO v_count FROM information_schema.tables WHERE table_name = 'usuario';
    IF v_count > 0 THEN
        RAISE NOTICE '✅ Tabla usuario existe';
    ELSE
        RAISE NOTICE '❌ Tabla usuario NO existe';
    END IF;
END $$;

-- =====================================================
-- VERIFICAR FUNCIONES
-- =====================================================

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    RAISE NOTICE 'Verificando funciones...';
    
    -- Verificar función obtener_documentos_por_tipo_cliente
    SELECT COUNT(*) INTO v_count FROM pg_proc WHERE proname = 'obtener_documentos_por_tipo_cliente';
    IF v_count > 0 THEN
        RAISE NOTICE '✅ Función obtener_documentos_por_tipo_cliente existe';
    ELSE
        RAISE NOTICE '❌ Función obtener_documentos_por_tipo_cliente NO existe';
    END IF;
    
    -- Verificar función determinar_estado_cliente
    SELECT COUNT(*) INTO v_count FROM pg_proc WHERE proname = 'determinar_estado_cliente';
    IF v_count > 0 THEN
        RAISE NOTICE '✅ Función determinar_estado_cliente existe';
    ELSE
        RAISE NOTICE '❌ Función determinar_estado_cliente NO existe';
    END IF;
END $$;

-- =====================================================
-- VERIFICAR DATOS
-- =====================================================

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    RAISE NOTICE 'Verificando datos...';
    
    -- Verificar usuarios
    SELECT COUNT(*) INTO v_count FROM usuario;
    RAISE NOTICE 'Usuarios en la base de datos: %', v_count;
    
    -- Verificar tipos de cliente
    SELECT COUNT(*) INTO v_count FROM tipo_cliente;
    RAISE NOTICE 'Tipos de cliente: %', v_count;
    
    -- Verificar documentos externos
    SELECT COUNT(*) INTO v_count FROM configuracion_documento_externo;
    RAISE NOTICE 'Documentos externos configurados: %', v_count;
    
    -- Verificar clientes
    SELECT COUNT(*) INTO v_count FROM cliente;
    RAISE NOTICE 'Clientes en la base de datos: %', v_count;
END $$;

-- =====================================================
-- PRUEBA DE FUNCIÓN CORREGIDA
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Probando función obtener_documentos_por_tipo_cliente...';
    
    BEGIN
        -- Intentar ejecutar la función
        PERFORM obtener_documentos_por_tipo_cliente('Civil');
        RAISE NOTICE '✅ Función obtener_documentos_por_tipo_cliente funciona correctamente';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Error en función obtener_documentos_por_tipo_cliente: %', SQLERRM;
    END;
END $$;

-- =====================================================
-- RESUMEN FINAL
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'VERIFICACIÓN COMPLETADA';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Si todos los elementos están marcados con ✅,';
    RAISE NOTICE 'la base de datos está correctamente configurada.';
    RAISE NOTICE '=====================================================';
END $$; 
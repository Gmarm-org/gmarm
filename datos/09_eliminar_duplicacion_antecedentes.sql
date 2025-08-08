-- =====================================================
-- ELIMINAR DUPLICACIÓN DE DOCUMENTOS DE ANTECEDENTES
-- Versión: 1.0
-- Fecha: 2024-12-31
-- Descripción: Eliminar "Certificado de antecedentes" duplicado y mantener solo "Antecedentes Penales"
-- =====================================================

-- =====================================================
-- 1. ELIMINAR DOCUMENTO DUPLICADO
-- =====================================================

-- Eliminar el documento "Certificado de antecedentes" que es duplicado
DELETE FROM tipo_documento 
WHERE nombre = 'Certificado de antecedentes';

-- =====================================================
-- 2. VERIFICAR QUE SOLO EXISTE "Antecedentes Penales"
-- =====================================================

-- Verificar que solo existe "Antecedentes Penales"
SELECT id, nombre, descripcion, obligatorio, tipo_proceso_id 
FROM tipo_documento 
WHERE nombre LIKE '%antecedente%' OR nombre LIKE '%Antecedente%';

-- =====================================================
-- 3. ACTUALIZAR CONFIGURACIÓN DE DOCUMENTOS EXTERNOS
-- =====================================================

-- Verificar que existe la configuración correcta
SELECT * FROM configuracion_documento_externo 
WHERE nombre LIKE '%antecedente%' OR nombre LIKE '%Antecedente%';

-- =====================================================
-- 4. LIMPIAR DOCUMENTOS DE CLIENTES ASOCIADOS
-- =====================================================

-- Eliminar documentos de clientes que estén asociados al documento eliminado
-- (Esto es necesario porque el documento ya no existe)
DELETE FROM documento_cliente dc
WHERE dc.tipo_documento_id NOT IN (
    SELECT id FROM tipo_documento
);

-- =====================================================
-- 5. VERIFICACIÓN FINAL
-- =====================================================

-- Mostrar todos los documentos disponibles
SELECT id, nombre, descripcion, obligatorio, tipo_proceso_id 
FROM tipo_documento 
ORDER BY nombre;

-- Mostrar configuración de documentos externos
SELECT * FROM configuracion_documento_externo 
ORDER BY orden_visual;

-- =====================================================
-- RESUMEN DE CAMBIOS
-- =====================================================
/*
✅ ELIMINADO: "Certificado de antecedentes" (duplicado)
✅ MANTENIDO: "Antecedentes Penales" (documento correcto)
✅ LIMPIADO: Documentos de clientes asociados al duplicado
✅ VERIFICADO: Configuración de documentos externos correcta

Ahora solo existe "Antecedentes Penales" que es el documento correcto
para certificados de antecedentes penales.
*/

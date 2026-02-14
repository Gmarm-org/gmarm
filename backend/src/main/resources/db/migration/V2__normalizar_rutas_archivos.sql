-- Normalizar rutas absolutas a relativas en todas las tablas de archivos.
-- Las rutas deben ser relativas al directorio base (app.documents.upload-dir).
-- Ejemplo: "/app/documentacion/documentos_cliente/documentos_clientes/1234/..." → "documentos_clientes/1234/..."

-- documento_cliente: quitar prefijos absolutos
UPDATE documento_cliente
SET ruta_archivo = REPLACE(ruta_archivo, '/app/documentacion/documentos_cliente/', '')
WHERE ruta_archivo LIKE '/app/documentacion/documentos_cliente/%';

UPDATE documento_cliente
SET ruta_archivo = REPLACE(ruta_archivo, '/app/documentacion/', '')
WHERE ruta_archivo LIKE '/app/documentacion/%';

-- documento_generado: mismo tratamiento
UPDATE documento_generado
SET ruta_archivo = REPLACE(ruta_archivo, '/app/documentacion/documentos_cliente/', '')
WHERE ruta_archivo LIKE '/app/documentacion/documentos_cliente/%';

UPDATE documento_generado
SET ruta_archivo = REPLACE(ruta_archivo, '/app/documentacion/', '')
WHERE ruta_archivo LIKE '/app/documentacion/%';

-- documento_grupo_importacion: mismo tratamiento
UPDATE documento_grupo_importacion
SET ruta_archivo = REPLACE(ruta_archivo, '/app/documentacion/documentos_cliente/', '')
WHERE ruta_archivo LIKE '/app/documentacion/documentos_cliente/%';

UPDATE documento_grupo_importacion
SET ruta_archivo = REPLACE(ruta_archivo, '/app/documentacion/', '')
WHERE ruta_archivo LIKE '/app/documentacion/%';

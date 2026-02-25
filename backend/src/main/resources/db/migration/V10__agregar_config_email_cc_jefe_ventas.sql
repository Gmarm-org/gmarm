-- V10: Agregar configuración EMAIL_CC_JEFE_VENTAS
-- Email para CC en documentos generados y contratos firmados

INSERT INTO configuracion_sistema (clave, valor, descripcion, editable, fecha_creacion, fecha_actualizacion)
VALUES ('EMAIL_CC_JEFE_VENTAS', 'valeria.benitez@seznam.cz', 'Email del jefe de ventas para CC en documentos y contratos', true, NOW(), NOW())
ON CONFLICT (clave) DO NOTHING;

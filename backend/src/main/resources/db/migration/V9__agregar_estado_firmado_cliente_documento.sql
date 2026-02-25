-- V9: Agregar estado FIRMADO_CLIENTE al constraint de documento_generado
-- Permite flujo de firma en 2 pasos: cliente firma primero, luego importador

ALTER TABLE documento_generado DROP CONSTRAINT IF EXISTS chk_documento_generado_estado;
ALTER TABLE documento_generado ADD CONSTRAINT chk_documento_generado_estado
    CHECK (estado IN ('PENDIENTE', 'GENERADO', 'FIRMADO_CLIENTE', 'FIRMADO', 'ENVIADO', 'ENTREGADO', 'RECHAZADO', 'ANULADO'));

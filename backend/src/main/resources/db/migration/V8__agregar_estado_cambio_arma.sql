-- V8: Agregar estado CAMBIO_ARMA al constraint de cliente_arma
-- y REEMPLAZADO como estado válido para pago

-- Actualizar constraint de cliente_arma para incluir nuevos estados
ALTER TABLE cliente_arma DROP CONSTRAINT IF EXISTS chk_cliente_arma_estado;
ALTER TABLE cliente_arma ADD CONSTRAINT chk_cliente_arma_estado
    CHECK (estado IN ('DISPONIBLE', 'RESERVADA', 'ASIGNADA', 'CANCELADA', 'COMPLETADA', 'REASIGNADO', 'EN_ESPERA', 'CAMBIO_ARMA'));

-- V5: Agregar estado EN_ESPERA a cliente_arma
-- Armas reservadas sin grupo de importación disponible quedan en espera

ALTER TABLE cliente_arma DROP CONSTRAINT IF EXISTS chk_cliente_arma_estado;
ALTER TABLE cliente_arma ADD CONSTRAINT chk_cliente_arma_estado
    CHECK (estado IN ('DISPONIBLE', 'RESERVADA', 'EN_ESPERA', 'ASIGNADA', 'CANCELADA', 'COMPLETADA', 'REASIGNADO'));

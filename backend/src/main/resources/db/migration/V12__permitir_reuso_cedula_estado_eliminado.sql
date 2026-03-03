-- V12: Permitir reuso de cédula + agregar estado ELIMINADO
-- Cambia la restricción UNIQUE de numero_identificacion a un índice parcial
-- que solo aplica a clientes en estados activos (excluye ELIMINADO y PROCESO_COMPLETADO)

-- 1. Eliminar la restricción UNIQUE actual
ALTER TABLE cliente DROP CONSTRAINT IF EXISTS cliente_numero_identificacion_key;

-- 2. Crear índice parcial: solo un cliente activo por cédula
-- Permite múltiples registros con la misma cédula si los anteriores están ELIMINADO o PROCESO_COMPLETADO
CREATE UNIQUE INDEX uq_cliente_numero_identificacion_activo
ON cliente (numero_identificacion)
WHERE estado NOT IN ('ELIMINADO', 'PROCESO_COMPLETADO');

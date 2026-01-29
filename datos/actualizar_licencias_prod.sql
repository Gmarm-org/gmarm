-- =====================================================
-- ACTUALIZACIÓN DE LICENCIAS EN PRODUCCIÓN
-- =====================================================
-- Este script elimina las licencias antiguas y carga las 5 nuevas
-- EJECUTAR CON CUIDADO: Solo para pruebas en producción
-- =====================================================

BEGIN;

-- 1. Eliminar licencias antiguas (por seguridad, solo si no están en uso)
DELETE FROM licencia WHERE numero IN ('LIC001', 'LIC002', 'LIC003', 'LIC004', 'LIC005', 'LIC006');

-- 2. Insertar las 5 nuevas licencias
INSERT INTO licencia (numero, nombre, ruc, cuenta_bancaria, nombre_banco, tipo_cuenta, cedula_cuenta, email, telefono, cupo_total, cupo_disponible, cupo_civil, cupo_militar, cupo_empresa, cupo_deportista, estado, estado_ocupacion, fecha_vencimiento) VALUES
('LIC001', 'GUERRERO MARTINEZ JOSE LUIS', '1707815922001', '8151263', 'INTERNACIONAL', 'AHORRO', '1707815922', 'joseluis@guerreromartinez.com', '0999999999', 25, 25, 25, 0, 0, 0, true, 'DISPONIBLE', '2050-12-31'),
('LIC002', 'MULLER BENITEZ NICOLE PAMELA', '1713978540001', '2212737882', 'PICHINCHA', 'AHORRO', '1713978540', 'vbenitez@hotmail.com', '0999999999', 25, 25, 25, 0, 0, 0, true, 'DISPONIBLE', '2050-12-31'),
('LIC003', 'ENDARA UNDA FRANKLIN GEOVANNY', '1721770632001', '2100300998', 'PICHINCHA', 'CORRIENTE', '1721770632', 'f.endara@hotmail.com', '0999999999', 25, 25, 25, 0, 0, 0, true, 'DISPONIBLE', '2050-12-31'),
('LIC004', 'LOYAGA CORREA MARCIA NATHALY', '1725831950001', '29282140', 'GUAYAQUIL', 'AHORRO', '1725831950', 'marcia.loyaga@example.com', '0999999999', 25, 25, 25, 0, 0, 0, true, 'DISPONIBLE', '2050-12-31'),
('LIC005', 'SIMOGUE S.A.S.', '0993392212001', '2212359266', 'PICHINCHA', 'AHORRO', '1314955061', 'simogue.sas@gmail.com', '0999999999', 100, 100, 0, 0, 100, 0, true, 'DISPONIBLE', '2050-12-31');

-- 3. Verificar las licencias insertadas
SELECT numero, nombre, ruc, cuenta_bancaria, nombre_banco FROM licencia ORDER BY numero;

COMMIT;

-- =====================================================
-- Para ejecutar en producción:
-- =====================================================
-- cat datos/actualizar_licencias_prod.sql | docker exec -i gmarm-postgres-prod psql -U postgres -d gmarm_prod
-- =====================================================

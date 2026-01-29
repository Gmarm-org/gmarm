-- =====================================================
-- ACTUALIZACIÓN DE LICENCIAS EN PRODUCCIÓN
-- =====================================================
-- Este script:
-- 1. Agrega columnas provincia_id y canton_id a la tabla licencia
-- 2. Elimina las licencias antiguas
-- 3. Inserta las 5 nuevas licencias con foreign keys a provincia/canton
-- EJECUTAR CON CUIDADO: Solo para pruebas en producción
-- =====================================================

BEGIN;

-- 1. Agregar columnas provincia_id y canton_id con foreign keys si no existen
ALTER TABLE licencia ADD COLUMN IF NOT EXISTS provincia_id BIGINT REFERENCES provincia(id);
ALTER TABLE licencia ADD COLUMN IF NOT EXISTS canton_id BIGINT REFERENCES canton(id);

-- 2. Eliminar licencias antiguas (por seguridad, solo si no están en uso)
DELETE FROM licencia WHERE numero IN ('LIC001', 'LIC002', 'LIC003', 'LIC004', 'LIC005', 'LIC006');

-- 3. Insertar las 5 nuevas licencias con foreign keys a provincia/canton
INSERT INTO licencia (numero, nombre, ruc, cuenta_bancaria, nombre_banco, tipo_cuenta, cedula_cuenta, email, telefono, provincia_id, canton_id, cupo_total, cupo_disponible, cupo_civil, cupo_militar, cupo_empresa, cupo_deportista, estado, estado_ocupacion, fecha_vencimiento) VALUES
('LIC001', 'GUERRERO MARTINEZ JOSE LUIS', '1707815922001', '8151263', 'INTERNACIONAL', 'AHORRO', '1707815922', 'joseluis@guerreromartinez.com', '0999999999', (SELECT id FROM provincia WHERE codigo = 'PIC'), (SELECT id FROM canton WHERE codigo = 'QUIT' AND provincia_id = (SELECT id FROM provincia WHERE codigo = 'PIC')), 25, 25, 25, 0, 0, 0, true, 'DISPONIBLE', '2050-12-31'),
('LIC002', 'MULLER BENITEZ NICOLE PAMELA', '1713978540001', '2212737882', 'PICHINCHA', 'AHORRO', '1713978540', 'vbenitez@hotmail.com', '0999999999', (SELECT id FROM provincia WHERE codigo = 'PIC'), (SELECT id FROM canton WHERE codigo = 'QUIT' AND provincia_id = (SELECT id FROM provincia WHERE codigo = 'PIC')), 25, 25, 25, 0, 0, 0, true, 'DISPONIBLE', '2050-12-31'),
('LIC003', 'ENDARA UNDA FRANKLIN GEOVANNY', '1721770632001', '2100300998', 'PICHINCHA', 'CORRIENTE', '1721770632', 'f.endara@hotmail.com', '0999999999', (SELECT id FROM provincia WHERE codigo = 'PIC'), (SELECT id FROM canton WHERE codigo = 'QUIT' AND provincia_id = (SELECT id FROM provincia WHERE codigo = 'PIC')), 25, 25, 25, 0, 0, 0, true, 'DISPONIBLE', '2050-12-31'),
('LIC004', 'LOYAGA CORREA MARCIA NATHALY', '1725831950001', '29282140', 'GUAYAQUIL', 'AHORRO', '1725831950', 'marcia.loyaga@example.com', '0999999999', (SELECT id FROM provincia WHERE codigo = 'PIC'), (SELECT id FROM canton WHERE codigo = 'QUIT' AND provincia_id = (SELECT id FROM provincia WHERE codigo = 'PIC')), 25, 25, 25, 0, 0, 0, true, 'DISPONIBLE', '2050-12-31'),
('LIC005', 'SIMOGUE S.A.S.', '0993392212001', '2212359266', 'PICHINCHA', 'AHORRO', '1314955061', 'simogue.sas@gmail.com', '0999999999', (SELECT id FROM provincia WHERE codigo = 'GUA'), (SELECT id FROM canton WHERE codigo = 'GUAY' AND provincia_id = (SELECT id FROM provincia WHERE codigo = 'GUA')), 100, 100, 0, 0, 100, 0, true, 'DISPONIBLE', '2050-12-31');

-- 4. Verificar las licencias insertadas con nombres de provincia y cantón
SELECT 
    l.numero, 
    l.nombre, 
    p.nombre as provincia, 
    c.nombre as canton, 
    l.cuenta_bancaria, 
    l.nombre_banco 
FROM licencia l
LEFT JOIN provincia p ON l.provincia_id = p.id
LEFT JOIN canton c ON l.canton_id = c.id
ORDER BY l.numero;

COMMIT;

-- =====================================================
-- Para ejecutar en producción:
-- =====================================================
-- cat datos/actualizar_licencias_prod.sql | docker exec -i gmarm-postgres-prod psql -U postgres -d gmarm_prod
-- =====================================================

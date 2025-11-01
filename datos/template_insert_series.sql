-- =====================================================
-- TEMPLATE: Insertar Series de Armas
-- =====================================================
-- Tabla: arma_serie
-- Columnas: numero_serie, arma_id, estado, observaciones
-- 
-- IMPORTANTE: 
-- - numero_serie debe ser ÚNICO
-- - arma_id se obtiene buscando el código del arma
-- - estado puede ser: 'DISPONIBLE', 'RESERVADA', 'ASIGNADA', 'VENDIDA'
-- - ON CONFLICT evita duplicados si ejecutas el script varias veces
-- =====================================================

INSERT INTO arma_serie (numero_serie, arma_id, estado, observaciones) VALUES

-- ========== CZ P-09 C NOCTURNE ==========
('SERIE001', (SELECT id FROM arma WHERE codigo = 'CZ-P09-C-NOCTURNE-PLAN-PILOTO'), 'DISPONIBLE', '2 alimentadoras'),
('SERIE002', (SELECT id FROM arma WHERE codigo = 'CZ-P09-C-NOCTURNE-PLAN-PILOTO'), 'DISPONIBLE', '2 alimentadoras'),
('SERIE003', (SELECT id FROM arma WHERE codigo = 'CZ-P09-C-NOCTURNE-PLAN-PILOTO'), 'DISPONIBLE', '2 alimentadoras'),

-- ========== CZ P-09 C NOCTURNE SNIPER GREY ==========
('SERIE101', (SELECT id FROM arma WHERE codigo = 'CZ-P09-C-NOCTURNE-SNIPER-GRIS-PLAN-PILOTO'), 'DISPONIBLE', '2 alimentadoras'),
('SERIE102', (SELECT id FROM arma WHERE codigo = 'CZ-P09-C-NOCTURNE-SNIPER-GRIS-PLAN-PILOTO'), 'DISPONIBLE', '2 alimentadoras'),

-- ========== CZ P-09 F Nocturne FDE ==========
('SERIE201', (SELECT id FROM arma WHERE codigo = 'CZ-P09-F-NOCTURNE-FDE-PLAN-PILOTO'), 'DISPONIBLE', '2 alimentadoras'),
('SERIE202', (SELECT id FROM arma WHERE codigo = 'CZ-P09-F-NOCTURNE-FDE-PLAN-PILOTO'), 'DISPONIBLE', '2 alimentadoras'),

-- ========== CZ P-09 F Nocturne OD Green ==========
('SERIE301', (SELECT id FROM arma WHERE codigo = 'CZ-P09-F-NOCTURNE-OD-VERDE-PLAN-PILOTO'), 'DISPONIBLE', '2 alimentadoras'),
('SERIE302', (SELECT id FROM arma WHERE codigo = 'CZ-P09-F-NOCTURNE-OD-VERDE-PLAN-PILOTO'), 'DISPONIBLE', '2 alimentadoras'),

-- ========== CZ P-10 C ==========
('SERIE401', (SELECT id FROM arma WHERE codigo = 'CZ-P10-C-PLAN-PILOTO'), 'DISPONIBLE', '2 alimentadoras'),
('SERIE402', (SELECT id FROM arma WHERE codigo = 'CZ-P10-C-PLAN-PILOTO'), 'DISPONIBLE', '2 alimentadoras'),

-- ========== CZ P-10 C OR ==========
('SERIE501', (SELECT id FROM arma WHERE codigo = 'CZ-P10-C-OR-PLAN-PILOTO'), 'DISPONIBLE', '2 alimentadoras'),

-- ========== CZ P-10 C OR FDE ==========
('SERIE601', (SELECT id FROM arma WHERE codigo = 'CZ-P10-C-OR-FDE-CERAKOTE-PLAN-PILOTO'), 'DISPONIBLE', '2 alimentadoras'),

-- ========== CZ P-10 F ==========
('SERIE701', (SELECT id FROM arma WHERE codigo = 'CZ-P10-F-PLAN-PILOTO'), 'DISPONIBLE', '2 alimentadoras'),
('SERIE702', (SELECT id FROM arma WHERE codigo = 'CZ-P10-F-PLAN-PILOTO'), 'DISPONIBLE', '2 alimentadoras'),

-- ========== CZ P-10 F FDE ==========
('SERIE801', (SELECT id FROM arma WHERE codigo = 'CZ-P10-F-FDE-PLAN-PILOTO'), 'DISPONIBLE', '2 alimentadoras'),

-- ========== CZ P-10 F MIRAS TRITIUM ==========
('SERIE901', (SELECT id FROM arma WHERE codigo = 'CZ-P10-F-MIRAS-TRITIO-PLAN-PILOTO'), 'DISPONIBLE', '2 alimentadoras'),

-- ========== CZ P-10 F OR ==========
('SERIE1001', (SELECT id FROM arma WHERE codigo = 'CZ-P10-F-OR-PLAN-PILOTO'), 'DISPONIBLE', '2 alimentadoras'),

-- ========== CZ P-10 S ==========
('SERIE1101', (SELECT id FROM arma WHERE codigo = 'CZ-P10-S-PLAN-PILOTO'), 'DISPONIBLE', '2 alimentadoras'),

-- ========== CZ P-10 SC ==========
('SERIE1201', (SELECT id FROM arma WHERE codigo = 'CZ-P10-SC-PLAN-PILOTO'), 'DISPONIBLE', '2 alimentadoras'),

-- ========== CZ P-10 SC FDE ==========
('SERIE1301', (SELECT id FROM arma WHERE codigo = 'CZ-P10-SC-FDE-PLAN-PILOTO'), 'DISPONIBLE', '2 alimentadoras'),

-- ========== CZ P-10 SC URBAN ==========
('SERIE1401', (SELECT id FROM arma WHERE codigo = 'CZ-P10-SC-URBAN-PLAN-PILOTO'), 'DISPONIBLE', '2 alimentadoras'),

-- ========== CZ Shadow 2 Carry ==========
('SERIE1501', (SELECT id FROM arma WHERE codigo = 'CZ-SHADOW-2-CARRY-PLAN-PILOTO'), 'DISPONIBLE', '2 alimentadoras'),

-- ========== CZ Shadow 2 Compact OR ==========
('SERIE1601', (SELECT id FROM arma WHERE codigo = 'CZ-SHADOW-2-COMPACT-OR-PLAN-PILOTO'), 'DISPONIBLE', '2 alimentadoras')

-- IMPORTANTE: ON CONFLICT evita duplicados
ON CONFLICT (numero_serie) DO NOTHING;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Contar total de series insertadas
SELECT COUNT(*) as total_series FROM arma_serie;

-- Ver series por modelo
SELECT 
    a.codigo,
    a.nombre,
    COUNT(aser.id) as total_series,
    SUM(CASE WHEN aser.estado = 'DISPONIBLE' THEN 1 ELSE 0 END) as disponibles
FROM arma a
LEFT JOIN arma_serie aser ON a.id = aser.arma_id
WHERE a.codigo LIKE '%PLAN-PILOTO%'
GROUP BY a.id, a.codigo, a.nombre
ORDER BY a.nombre;


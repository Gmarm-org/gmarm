-- Script para actualizar la tabla licencia con campos adicionales del sistema
-- Ejecutar después de tener los datos base de licencias

-- Agregar columnas adicionales para el sistema de gestión
ALTER TABLE licencia 
ADD COLUMN IF NOT EXISTS tipo_licencia VARCHAR(50),
ADD COLUMN IF NOT EXISTS descripcion TEXT,
ADD COLUMN IF NOT EXISTS fecha_emision DATE,
ADD COLUMN IF NOT EXISTS cupo_total INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cupo_disponible INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cupo_civil INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cupo_militar INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cupo_empresa INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cupo_deportista INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS observaciones TEXT,
ADD COLUMN IF NOT EXISTS usuario_actualizador_id BIGINT,
ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'ACTIVA',
ADD COLUMN IF NOT EXISTS usuario_creador_id BIGINT,
ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Agregar foreign keys si no existen
DO $$
BEGIN
    -- Verificar si la constraint ya existe antes de agregarla
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_licencia_usuario_actualizador' 
        AND table_name = 'licencia'
    ) THEN
        ALTER TABLE licencia 
        ADD CONSTRAINT fk_licencia_usuario_actualizador 
        FOREIGN KEY (usuario_actualizador_id) REFERENCES usuario(id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_licencia_usuario_creador' 
        AND table_name = 'licencia'
    ) THEN
        ALTER TABLE licencia 
        ADD CONSTRAINT fk_licencia_usuario_creador 
        FOREIGN KEY (usuario_creador_id) REFERENCES usuario(id);
    END IF;
END $$;

-- Actualizar las licencias existentes con valores por defecto
UPDATE licencia SET 
    tipo_licencia = CASE 
        WHEN ruc LIKE '09%' THEN 'IMPORTACION_EMPRESA'
        WHEN nombre ILIKE '%militar%' THEN 'IMPORTACION_MILITAR'
        WHEN nombre ILIKE '%deportista%' THEN 'IMPORTACION_DEPORTISTA'
        ELSE 'IMPORTACION_CIVIL'
    END,
    descripcion = CONCAT('Licencia de importación para ', nombre),
    fecha_emision = CURRENT_DATE,
    cupo_total = CASE 
        WHEN ruc LIKE '09%' THEN 100  -- Empresas
        WHEN nombre ILIKE '%militar%' THEN 50   -- Militares
        WHEN nombre ILIKE '%deportista%' THEN 200 -- Deportistas
        ELSE 25  -- Civiles
    END,
    cupo_disponible = CASE 
        WHEN ruc LIKE '09%' THEN 100  -- Empresas
        WHEN nombre ILIKE '%militar%' THEN 50   -- Militares
        WHEN nombre ILIKE '%deportista%' THEN 200 -- Deportistas
        ELSE 25  -- Civiles
    END,
    cupo_civil = CASE 
        WHEN ruc LIKE '09%' THEN 0
        WHEN nombre ILIKE '%militar%' THEN 0
        WHEN nombre ILIKE '%deportista%' THEN 0
        ELSE 25
    END,
    cupo_militar = CASE 
        WHEN ruc LIKE '09%' THEN 0
        WHEN nombre ILIKE '%militar%' THEN 50
        WHEN nombre ILIKE '%deportista%' THEN 0
        ELSE 0
    END,
    cupo_empresa = CASE 
        WHEN ruc LIKE '09%' THEN 100
        WHEN nombre ILIKE '%militar%' THEN 0
        WHEN nombre ILIKE '%deportista%' THEN 0
        ELSE 0
    END,
    cupo_deportista = CASE 
        WHEN ruc LIKE '09%' THEN 0
        WHEN nombre ILIKE '%militar%' THEN 0
        WHEN nombre ILIKE '%deportista%' THEN 200
        ELSE 0
    END,
    observaciones = 'Licencia migrada del sistema anterior',
    usuario_creador_id = (SELECT id FROM usuario WHERE rol = 'ADMIN' LIMIT 1),
    estado = CASE 
        WHEN fecha_vencimiento < CURRENT_DATE THEN 'VENCIDA'
        ELSE 'ACTIVA'
    END
WHERE tipo_licencia IS NULL;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_licencia_numero ON licencia(numero);
CREATE INDEX IF NOT EXISTS idx_licencia_tipo ON licencia(tipo_licencia);
CREATE INDEX IF NOT EXISTS idx_licencia_estado ON licencia(estado);
CREATE INDEX IF NOT EXISTS idx_licencia_fecha_vencimiento ON licencia(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_licencia_ruc ON licencia(ruc);

-- Verificar la actualización
SELECT 
    numero,
    nombre,
    tipo_licencia,
    cupo_total,
    cupo_disponible,
    cupo_civil,
    cupo_militar,
    cupo_empresa,
    cupo_deportista,
    estado,
    fecha_vencimiento
FROM licencia
ORDER BY numero; 
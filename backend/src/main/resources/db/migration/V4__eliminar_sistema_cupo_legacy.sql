-- V4: Eliminar sistema legacy de cupos por tipo de cliente
-- Los cupos ahora se gestionan por categoría de arma (grupo_importacion_limite_categoria)

-- Eliminar tabla grupo_importacion_cupo (ya no se usa)
DROP TABLE IF EXISTS grupo_importacion_cupo CASCADE;

-- Eliminar columna cupo_disponible de grupo_importacion (nunca se decrementaba)
ALTER TABLE grupo_importacion DROP COLUMN IF EXISTS cupo_disponible;

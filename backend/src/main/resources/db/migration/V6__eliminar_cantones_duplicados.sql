-- V6: Eliminar cantones duplicados (Quito y Guayaquil insertados dos veces)
-- El primer INSERT (cantones principales) creó los IDs que usan las licencias.
-- El segundo INSERT (catálogo completo por provincia) duplicó Quito y Guayaquil.

-- 1. Reasignar referencias de licencia que apunten al duplicado hacia el original
UPDATE licencia
SET canton_id = sub.min_id
FROM (
    SELECT nombre, codigo, provincia_id, MIN(id) AS min_id
    FROM canton
    WHERE (nombre = 'Quito' AND codigo = 'QUIT')
       OR (nombre = 'Guayaquil' AND codigo = 'GUAY')
    GROUP BY nombre, codigo, provincia_id
    HAVING COUNT(*) > 1
) sub
WHERE licencia.canton_id IN (
    SELECT c.id FROM canton c
    WHERE ((c.nombre = 'Quito' AND c.codigo = 'QUIT') OR (c.nombre = 'Guayaquil' AND c.codigo = 'GUAY'))
      AND c.id != sub.min_id
      AND c.nombre = sub.nombre
      AND c.codigo = sub.codigo
);

-- 2. Eliminar los cantones duplicados (conservar el de menor ID)
DELETE FROM canton
WHERE id IN (
    SELECT c.id
    FROM canton c
    INNER JOIN (
        SELECT nombre, codigo, provincia_id, MIN(id) AS min_id
        FROM canton
        GROUP BY nombre, codigo, provincia_id
        HAVING COUNT(*) > 1
    ) dup ON c.nombre = dup.nombre
         AND c.codigo = dup.codigo
         AND c.provincia_id = dup.provincia_id
         AND c.id != dup.min_id
);

-- 3. Agregar unique constraint para evitar duplicados futuros
ALTER TABLE canton ADD CONSTRAINT uq_canton_codigo_provincia UNIQUE (codigo, provincia_id);

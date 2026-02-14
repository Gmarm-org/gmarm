-- Eliminar recibos duplicados en documento_generado.
-- Cuando existen múltiples registros RECIBO con el mismo nombre para el mismo cliente,
-- se conserva solo el más reciente (mayor ID) y se eliminan los demás.

DELETE FROM documento_generado
WHERE id IN (
    SELECT dg.id
    FROM documento_generado dg
    INNER JOIN (
        SELECT cliente_id, nombre, MAX(id) AS max_id
        FROM documento_generado
        WHERE tipo_documento = 'RECIBO'
        GROUP BY cliente_id, nombre
        HAVING COUNT(*) > 1
    ) dup ON dg.cliente_id = dup.cliente_id
         AND dg.nombre = dup.nombre
         AND dg.id < dup.max_id
    WHERE dg.tipo_documento = 'RECIBO'
);

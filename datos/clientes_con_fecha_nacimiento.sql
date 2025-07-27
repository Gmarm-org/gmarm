-- =====================================================
-- ACTUALIZACIÓN DE CLIENTES CON FECHAS DE NACIMIENTO
-- Para pruebas de validación de edad (mínimo 25 años)
-- =====================================================

-- Actualizar clientes existentes con fechas de nacimiento para pruebas
-- Estos datos son solo para pruebas y deben ser reemplazados con datos reales

-- Cliente mayor de 25 años (PUEDE COMPRAR)
UPDATE cliente 
SET fecha_nacimiento = '1990-05-15'
WHERE nombres = 'JUAN' AND apellidos = 'PÉREZ';

-- Cliente mayor de 25 años (PUEDE COMPRAR)
UPDATE cliente 
SET fecha_nacimiento = '1985-03-20'
WHERE nombres = 'CARLOS' AND apellidos = 'RAMÍREZ';

-- Cliente menor de 25 años (NO PUEDE COMPRAR)
UPDATE cliente 
SET fecha_nacimiento = '2002-12-03'
WHERE nombres = 'ANA' AND apellidos = 'GÓMEZ';

-- Cliente menor de 25 años (NO PUEDE COMPRAR)
UPDATE cliente 
SET fecha_nacimiento = '2005-06-15'
WHERE nombres = 'LUIS' AND apellidos = 'MARTÍNEZ';

-- Cliente justo en el límite (25 años) - PUEDE COMPRAR
UPDATE cliente 
SET fecha_nacimiento = '1999-01-01'
WHERE nombres = 'MARÍA' AND apellidos = 'LÓPEZ';

-- Cliente mayor de 25 años (PUEDE COMPRAR)
UPDATE cliente 
SET fecha_nacimiento = '1988-11-20'
WHERE nombres = 'ROBERTO' AND apellidos = 'SÁNCHEZ';

-- Cliente menor de 25 años (NO PUEDE COMPRAR)
UPDATE cliente 
SET fecha_nacimiento = '2003-08-10'
WHERE nombres = 'SOFÍA' AND apellidos = 'RODRÍGUEZ';

-- Cliente mayor de 25 años (PUEDE COMPRAR)
UPDATE cliente 
SET fecha_nacimiento = '1992-04-05'
WHERE nombres = 'DIEGO' AND apellidos = 'MORALES';

-- Verificar las actualizaciones
SELECT 
    id,
    nombres,
    apellidos,
    fecha_nacimiento,
    CASE 
        WHEN fecha_nacimiento IS NULL THEN 'Fecha no especificada'
        WHEN fecha_nacimiento <= CURRENT_DATE - INTERVAL '25 years' THEN 'PUEDE COMPRAR'
        ELSE 'NO PUEDE COMPRAR'
    END as estado_compra,
    CASE 
        WHEN fecha_nacimiento IS NULL THEN NULL
        ELSE EXTRACT(YEAR FROM AGE(CURRENT_DATE, fecha_nacimiento))
    END as edad
FROM cliente 
WHERE fecha_nacimiento IS NOT NULL
ORDER BY fecha_nacimiento; 
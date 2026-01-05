-- =====================================================
-- SCRIPT PARA CORREGIR CARACTERES MAL CODIFICADOS (UTF-8)
-- =====================================================
-- Este script corrige caracteres especiales que se corrompieron
-- debido a codificación incorrecta en la base de datos
-- =====================================================

-- Configurar codificación UTF-8
SET client_encoding = 'UTF8';

-- =====================================================
-- CORRECCIÓN DE CARACTERES EN TABLAS PRINCIPALES
-- =====================================================

-- Tabla: usuario
-- Corregir nombres y apellidos
UPDATE usuario 
SET 
    nombres = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        nombres,
        'Ã¡', 'á'), 'Ã©', 'é'), 'Ã­', 'í'), 'Ã³', 'ó'), 'Ãº', 'ú'),
        'Ã', 'Á'), 'Ã‰', 'É'), 'Ã', 'Í'), 'Ã"', 'Ó'), 'Ãš', 'Ú'),
    apellidos = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        apellidos,
        'Ã¡', 'á'), 'Ã©', 'é'), 'Ã­', 'í'), 'Ã³', 'ó'), 'Ãº', 'ú'),
        'Ã', 'Á'), 'Ã‰', 'É'), 'Ã', 'Í'), 'Ã"', 'Ó'), 'Ãš', 'Ú'),
    direccion = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        direccion,
        'Ã¡', 'á'), 'Ã©', 'é'), 'Ã­', 'í'), 'Ã³', 'ó'), 'Ãº', 'ú'),
        'Ã', 'Á'), 'Ã‰', 'É'), 'Ã', 'Í'), 'Ã"', 'Ó'), 'Ãš', 'Ú')
WHERE nombres LIKE '%Ã%' OR apellidos LIKE '%Ã%' OR direccion LIKE '%Ã%';

-- Tabla: cliente
UPDATE cliente 
SET 
    nombres = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        nombres,
        'Ã¡', 'á'), 'Ã©', 'é'), 'Ã­', 'í'), 'Ã³', 'ó'), 'Ãº', 'ú'),
        'Ã', 'Á'), 'Ã‰', 'É'), 'Ã', 'Í'), 'Ã"', 'Ó'), 'Ãš', 'Ú'),
    apellidos = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        apellidos,
        'Ã¡', 'á'), 'Ã©', 'é'), 'Ã­', 'í'), 'Ã³', 'ó'), 'Ãº', 'ú'),
        'Ã', 'Á'), 'Ã‰', 'É'), 'Ã', 'Í'), 'Ã"', 'Ó'), 'Ãš', 'Ú'),
    direccion = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        direccion,
        'Ã¡', 'á'), 'Ã©', 'é'), 'Ã­', 'í'), 'Ã³', 'ó'), 'Ãº', 'ú'),
        'Ã', 'Á'), 'Ã‰', 'É'), 'Ã', 'Í'), 'Ã"', 'Ó'), 'Ãš', 'Ú')
WHERE nombres LIKE '%Ã%' OR apellidos LIKE '%Ã%' OR direccion LIKE '%Ã%';

-- Tabla: provincia
UPDATE provincia 
SET nombre = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    nombre,
    'Ã¡', 'á'), 'Ã©', 'é'), 'Ã­', 'í'), 'Ã³', 'ó'), 'Ãº', 'ú'),
    'Ã', 'Á'), 'Ã‰', 'É'), 'Ã', 'Í'), 'Ã"', 'Ó'), 'Ãš', 'Ú')
WHERE nombre LIKE '%Ã%';

-- Tabla: canton
UPDATE canton 
SET nombre = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    nombre,
    'Ã¡', 'á'), 'Ã©', 'é'), 'Ã­', 'í'), 'Ã³', 'ó'), 'Ãº', 'ú'),
    'Ã', 'Á'), 'Ã‰', 'É'), 'Ã', 'Í'), 'Ã"', 'Ó'), 'Ãš', 'Ú')
WHERE nombre LIKE '%Ã%';

-- Tabla: tipo_cliente
UPDATE tipo_cliente 
SET nombre = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    nombre,
    'Ã¡', 'á'), 'Ã©', 'é'), 'Ã­', 'í'), 'Ã³', 'ó'), 'Ãº', 'ú'),
    'Ã', 'Á'), 'Ã‰', 'É'), 'Ã', 'Í'), 'Ã"', 'Ó'), 'Ãš', 'Ú')
WHERE nombre LIKE '%Ã%';

-- Tabla: tipo_documento
UPDATE tipo_documento 
SET nombre = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    nombre,
    'Ã¡', 'á'), 'Ã©', 'é'), 'Ã­', 'í'), 'Ã³', 'ó'), 'Ãº', 'ú'),
    'Ã', 'Á'), 'Ã‰', 'É'), 'Ã', 'Í'), 'Ã"', 'Ó'), 'Ãš', 'Ú')
WHERE nombre LIKE '%Ã%';

-- Tabla: configuracion_sistema
UPDATE configuracion_sistema 
SET 
    clave = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        clave,
        'Ã¡', 'á'), 'Ã©', 'é'), 'Ã­', 'í'), 'Ã³', 'ó'), 'Ãº', 'ú'),
        'Ã', 'Á'), 'Ã‰', 'É'), 'Ã', 'Í'), 'Ã"', 'Ó'), 'Ãš', 'Ú'),
    valor = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        valor,
        'Ã¡', 'á'), 'Ã©', 'é'), 'Ã­', 'í'), 'Ã³', 'ó'), 'Ãº', 'ú'),
        'Ã', 'Á'), 'Ã‰', 'É'), 'Ã', 'Í'), 'Ã"', 'Ó'), 'Ãš', 'Ú'),
    descripcion = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        descripcion,
        'Ã¡', 'á'), 'Ã©', 'é'), 'Ã­', 'í'), 'Ã³', 'ó'), 'Ãº', 'ú'),
        'Ã', 'Á'), 'Ã‰', 'É'), 'Ã', 'Í'), 'Ã"', 'Ó'), 'Ãš', 'Ú')
WHERE clave LIKE '%Ã%' OR valor LIKE '%Ã%' OR descripcion LIKE '%Ã%';

-- Tabla: arma
UPDATE arma 
SET nombre = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    nombre,
    'Ã¡', 'á'), 'Ã©', 'é'), 'Ã­', 'í'), 'Ã³', 'ó'), 'Ãº', 'ú'),
    'Ã', 'Á'), 'Ã‰', 'É'), 'Ã', 'Í'), 'Ã"', 'Ó'), 'Ãš', 'Ú')
WHERE nombre LIKE '%Ã%';

-- Tabla: categoria_arma
UPDATE categoria_arma 
SET nombre = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    nombre,
    'Ã¡', 'á'), 'Ã©', 'é'), 'Ã­', 'í'), 'Ã³', 'ó'), 'Ãº', 'ú'),
    'Ã', 'Á'), 'Ã‰', 'É'), 'Ã', 'Í'), 'Ã"', 'Ó'), 'Ãš', 'Ú')
WHERE nombre LIKE '%Ã%';

-- Tabla: preguntas
UPDATE preguntas 
SET 
    pregunta = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        pregunta,
        'Ã¡', 'á'), 'Ã©', 'é'), 'Ã­', 'í'), 'Ã³', 'ó'), 'Ãº', 'ú'),
        'Ã', 'Á'), 'Ã‰', 'É'), 'Ã', 'Í'), 'Ã"', 'Ó'), 'Ãš', 'Ú')
WHERE pregunta LIKE '%Ã%';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

SELECT 'Correccion de caracteres UTF-8 completada' as info;
SELECT 'Verificar datos corregidos:' as mensaje;
SELECT COUNT(*) as registros_con_caracteres_especiales FROM cliente WHERE nombres LIKE '%á%' OR nombres LIKE '%é%' OR nombres LIKE '%í%' OR nombres LIKE '%ó%' OR nombres LIKE '%ú%';


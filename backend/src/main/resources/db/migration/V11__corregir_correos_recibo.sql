-- V11: Corregir email de Valeria en CORREOS_RECIBO
-- El email valeria@gmarm.com no existe, el correcto es valeria.benitez@seznam.cz

UPDATE configuracion_sistema
SET valor = '["joseluis@guerreromartinez.com", "valeria.benitez@seznam.cz"]',
    fecha_actualizacion = NOW()
WHERE clave = 'CORREOS_RECIBO';

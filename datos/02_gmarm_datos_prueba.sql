-- =====================================================
-- GMARM - DATOS DE PRUEBA
-- Versión: 1.0
-- Fecha: 2024-12-01
-- Descripción: Datos de prueba para desarrollo
-- =====================================================

-- =====================================================
-- DATOS DE CATÁLOGOS INICIALES
-- =====================================================

-- Tipos de cliente
INSERT INTO tipo_cliente (nombre, codigo, descripcion) VALUES
('Civil', 'CIV', 'Persona natural civil'),
('Militar Fuerza Terrestre', 'MIL', 'Personal activo de fuerzas armadas terrestre'),
('Militar Fuerza Naval', 'NAV', 'Personal activo de fuerzas armadas naval'),
('Militar Fuerza Aerea', 'AER', 'Personal activo de fuerzas armadas aereas'),
('Uniformado Policial', 'POL', 'Personal activo de fuerza policial'),
('Empresa Seguridad', 'EMP', 'Compañía de seguridad privada'),
('Deportista', 'DEP', 'Deportista');

-- Tipos de identificación
INSERT INTO tipo_identificacion (nombre, codigo, descripcion) VALUES
('Cédula de Identidad', 'CED', 'Documento de identificación personal'),
('Registro Único de Contribuyentes', 'RUC', 'Identificación tributaria');

-- Tipos de proceso
INSERT INTO tipo_proceso (nombre, codigo, descripcion) VALUES
('Cupo Civil', 'CUPO_CIV', 'Proceso para importación por cupo civil'),
('Extracupo Uniformado', 'EXC_MIL', 'Proceso para importación por extracupo militar/policial'),
('Extracupo Empresa', 'EXC_EMP', 'Proceso para importación por extracupo empresa seguridad'),
('Cupo Deportista', 'CUPO_DEP', 'Proceso para importación por cupo civil deportista');

-- Tipos de importación
INSERT INTO tipo_importacion (nombre, cupo_maximo, descripcion) VALUES
('Cupo', 25, 'Importación regular para personas naturales'),
('Extracupo Uniformado', 1000, 'Importación especial para personal uniformado'),
('Extracupo Compania', 1000, 'Importación especial para empresas');

-- Relación tipos de importacion con tipo de cliente
INSERT INTO tipo_cliente_importacion (tipo_cliente_id, tipo_importacion_id) VALUES
(1, 1), -- Civil -> Cupo Civil
(2, 2), -- Terrestre -> Extracupo Uniformado
(3, 2), -- Naval -> Extracupo Uniformado
(4, 2), -- Aerea -> Extracupo Uniformado
(5, 2), -- Policial -> Extracupo Uniformado
(6, 3), -- Empresa Seguridad -> Extracupo Empresa
(7, 1); -- Deportista -> Cupo Deportista

-- Configuración del sistema
INSERT INTO configuracion_sistema (clave, valor, descripcion, editable) VALUES
('EMAIL_NOTIFICACIONES', 'notificaciones@gmarm.com', 'Email para enviar notificaciones', TRUE),
('DIAS_VALIDEZ_DOCUMENTOS', '30', 'Días de validez para documentos subidos', TRUE),
('PORCENTAJE_ANTICIPO', '40', 'Porcentaje de anticipo requerido', TRUE),
('IVA', '15', 'Porcentaje de IVA aplicable', FALSE),
('EDAD_MINIMA_CLIENTE', '25', 'Edad mínima para clientes', FALSE),
('MAX_INTENTOS_LOGIN', '3', 'Máximo intentos de login antes de bloquear', FALSE);

-- Roles del sistema
INSERT INTO rol (nombre, descripcion, tipo_rol_vendedor) VALUES
('Vendedor', 'Registro de clientes y selección de armas catálogo', 'LIBRE'),
('Dirección de Ventas', 'Aprobación de solicitudes y creación de grupos de importación', NULL),
('Operaciones', 'Gestión de importación y documentación', NULL),
('Finanzas', 'Gestión de pagos y facturación', NULL),
('Administrador', 'Acceso completo al sistema', NULL);

-- Usuario administrador inicial (password: admin123)
INSERT INTO usuario (username, email, password_hash, nombres, apellidos, telefono_principal, direccion) VALUES
('admin', 'admin@gmarm.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', 'ADMINISTRADOR', 'SISTEMA', '0987654321', 'QUITO, ECUADOR');

-- Asignar rol de administrador
INSERT INTO usuario_rol (usuario_id, rol_id) VALUES
(1, 5);

-- Usuarios de prueba
INSERT INTO usuario (username, email, password_hash, nombres, apellidos, telefono_principal, direccion) VALUES
('vendedor1', 'vendedor1@gmarm.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', 'JUAN CARLOS', 'PÉREZ LÓPEZ', '0987654322', 'GUAYAQUIL, ECUADOR'),
('vendedor2', 'vendedor2@gmarm.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', 'MARÍA ELENA', 'GONZÁLEZ RODRÍGUEZ', '0987654324', 'CUENCA, ECUADOR'),
('direccion_ventas', 'direccion.ventas@gmarm.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', 'CARLOS ALBERTO', 'MARTÍNEZ VARGAS', '0987654325', 'QUITO, ECUADOR'),
('operaciones', 'operaciones@gmarm.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', 'ANA LUCÍA', 'SALAZAR MENDIETA', '0987654327', 'QUITO, ECUADOR'),
('finanzas', 'finanzas@gmarm.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', 'ROBERTO ANTONIO', 'HERRERA CASTILLO', '0987654328', 'QUITO, ECUADOR');

-- Asignar roles a usuarios de prueba
INSERT INTO usuario_rol (usuario_id, rol_id) VALUES
(2, 1), -- vendedor1 -> Vendedor
(3, 1), -- vendedor2 -> Vendedor
(4, 2), -- direccion_ventas -> Dirección de Ventas
(5, 3), -- operaciones -> Operaciones
(6, 4); -- finanzas -> Finanzas

-- LICENCIAS
INSERT INTO licencia (numero, nombre, ruc, cuenta_bancaria, nombre_banco, tipo_cuenta, cedula_cuenta, email, telefono, fecha_vencimiento) VALUES
('LIC001', 'LEITON PORTILLA CORALIA SALOME', '1725781254', '2200614031', 'PICHINCHA', 'AHORROS', '1725781254', 'frank_gun@hotmail.com', '0000000000', '2050-12-31'),
('LIC002', 'SILVA ACOSTA FRANCISCO JAVIER', '1714597414', '3020513304', 'PICHINCHA', 'AHORROS', '1714597414', 'frank_gun@hotmail.com', '0000000000', '2050-12-31'),
('LIC003', 'MULLER BENITEZ NICOLE PAMELA', '1713978540', '2212737882', 'PICHINCHA', 'AHORROS', '1713978540', 'vbenitez@hotmail.com', '0000000000', '2050-12-31'),
('LIC004', 'SIMOGUE S.A.S.', '0993392212001', '2212359266', 'PICHINCHA', 'AHORROS', '0993392212001', 'simogue.sas@gmail.com', '0000000000', '2050-12-31'),
('LIC005', 'GUERRERO MARTINEZ JOSE LUIS', '1707815922', '8151263', 'INTERNACIONAL', 'AHORROS', '1707815922', 'joseluis@guerreromartinez.com', '0000000000', '2050-12-31'),
('LIC006', 'ENDARA UNDA FRANKLIN GEOVANNY', '1721770632', '2100300998', 'PICHINCHA', 'CORRIENTE', '1721770632', 'f.endara@hotmail.com', '0000000000', '2050-12-31');

-- Planes de pago
INSERT INTO plan_pago (nombre, tipo_cliente_id, numero_cuotas, descripcion) VALUES
('Contado Civil', 1, 1, 'Pago al contado para clientes civiles'),
('2 Cuotas Civil', 1, 2, 'Pago en 2 cuotas para clientes civiles'),
('Contado Militar', 2, 1, 'Pago al contado para personal militar'),
('6 Cuotas Militar', 2, 6, 'Pago en 6 cuotas para personal militar'),
('Contado Empresa', 6, 1, 'Pago al contado para empresas');

-- Preguntas para clientes civiles 
INSERT INTO pregunta_cliente (tipo_proceso_id, pregunta, obligatoria, orden) VALUES
(1, '¿Tiene cuenta en el Sicoar?', TRUE, 1),
(1, '¿La dirección en Sicoar coincide con su domicilio actual?', TRUE, 2),
(1, '¿Ha tenido o tiene armas registradas?', TRUE, 3),
(1, '¿Tiene denuncias de violencia de género o intrafamiliar?', TRUE, 4);

-- Preguntas para militares/policías
INSERT INTO pregunta_cliente (tipo_proceso_id, pregunta, obligatoria, orden) VALUES
(2, '¿Tiene cuenta en el Sicoar?', TRUE, 1),
(2, '¿Tiene credencial Ispol o IsFA vigente?', TRUE, 2),
(2, '¿Ya tiene firma electrónica habilitada?', TRUE, 3),
(2, '¿Tiene certificado de servicio activo?', FALSE, 4),
(2, '¿Ha tenido o tiene armas registradas?', TRUE, 5),
(2, '¿Tiene denuncias de violencia de género o intrafamiliar?', TRUE, 6);

-- Preguntas para empresas
INSERT INTO pregunta_cliente (tipo_proceso_id, pregunta, obligatoria, orden) VALUES
(3, 'Nombramiento del representante legal', TRUE, 1),
(3, 'Permiso de operaciones vigente', TRUE, 2),
(3, 'Autorización de tenencia de armas', TRUE, 3);

-- Preguntas para deportistas
INSERT INTO pregunta_cliente (tipo_proceso_id, pregunta, obligatoria, orden) VALUES
(4, '¿Tiene cuenta en el Sicoar?', TRUE, 1),
(4, '¿La dirección en Sicoar coincide con su domicilio actual?', TRUE, 2),
(4, '¿Ha tenido o tiene armas registradas?', TRUE, 3),
(4, '¿Tiene denuncias de violencia de género o intrafamiliar?', TRUE, 4),
(4, 'Credencial de club deportivo vigente', TRUE, 5),
(4, 'Credencial de tenencia de armas', TRUE, 6);

-- Tipos de documento
INSERT INTO tipo_documento (nombre, descripcion, obligatorio, tipo_proceso_id) VALUES
('Copia de cédula', 'Copia legible de la cédula de identidad', TRUE, 1),
('Formulario de solicitud', 'Formulario completo de solicitud de importación', FALSE, 1),
('Certificado de antecedentes', 'Certificado de antecedentes penales', FALSE, 1),
('Credencial Club deportista', 'Credencial de club solo para deportistas', FALSE, 4),
('Credencial militar', 'Credencial vigente de institución armada', FALSE, 2),
('Certificado de servicio activo', 'Certificado de servicio activo vigente', FALSE, 2),
('Cédula del representante legal', 'Cédula del representante legal', FALSE, 3),
('Nombramiento representante legal', 'Documento que acredita representación legal', FALSE, 3),
('Permiso de funcionamiento', 'Permiso de funcionamiento vigente', FALSE, 3);

-- Insertar categorías de armas
INSERT INTO categoria_arma (nombre, descripcion) VALUES
('PISTOLA', 'Armas cortas de puño'),
('ESCOPETA', 'Armas largas para perdigones'),
('CARABINA', 'Armas largas de corto alcance'),
('RIFLE', 'Armas largas de precisión');

-- Insertar modelos de armas
INSERT INTO modelo_arma (codigo, nombre, categoria_id, calibre, capacidad, precio_referencia) VALUES
-- Pistolas
('CZ-P09-C-NOC', 'CZ P09 C NOCTURNE', (SELECT id FROM categoria_arma WHERE nombre = 'PISTOLA'), '9MM', '15 municiones', 0.00),
('CZ-P09-F-NOC', 'CZ P09 F NOCTURNE', (SELECT id FROM categoria_arma WHERE nombre = 'PISTOLA'), '9MM', '19 municiones', 0.00),
('CZ-P10-M', 'CZ P10 M', (SELECT id FROM categoria_arma WHERE nombre = 'PISTOLA'), '9MM', '7 municiones', 0.00),
('CZ-P10-S', 'CZ P10 S', (SELECT id FROM categoria_arma WHERE nombre = 'PISTOLA'), '9MM', '12 municiones', 0.00),
('CZ-P10-S-OR', 'CZ P 10 S OR', (SELECT id FROM categoria_arma WHERE nombre = 'PISTOLA'), '9MM', '12 municiones', 0.00),
('CZ-P10-C', 'CZ P10 C', (SELECT id FROM categoria_arma WHERE nombre = 'PISTOLA'), '9MM', '15 municiones', 0.00),
('CZ-P10-C-OR', 'CZ P10 C OR', (SELECT id FROM categoria_arma WHERE nombre = 'PISTOLA'), '9MM', '15 municiones', 0.00),
('CZ-P10-F', 'CZ P10 F', (SELECT id FROM categoria_arma WHERE nombre = 'PISTOLA'), '9MM', '19 municiones', 0.00),
('CZ-P10-F-OR', 'CZ P10 F OR', (SELECT id FROM categoria_arma WHERE nombre = 'PISTOLA'), '9MM', '19 municiones', 0.00),
('CZ-P10-C-FDE-OR', 'CZ P10 C FDE OR', (SELECT id FROM categoria_arma WHERE nombre = 'PISTOLA'), '9MM', '15 municiones', 0.00),
('CZ-75-COMPACT', 'CZ 75 COMPACT', (SELECT id FROM categoria_arma WHERE nombre = 'PISTOLA'), '9MM', '15 municiones', 0.00),
('CZ-75-SP01-SHADOW', 'CZ 75 SP 01 SHADOW', (SELECT id FROM categoria_arma WHERE nombre = 'PISTOLA'), '9MM', '19 municiones', 0.00),
('CZ-SHADOW-2', 'CZ SHADOW 2', (SELECT id FROM categoria_arma WHERE nombre = 'PISTOLA'), '9MM', '19 municiones', 0.00),
('CZ-SHADOW-2-OR', 'CZ SHADOW 2 OR', (SELECT id FROM categoria_arma WHERE nombre = 'PISTOLA'), '9MM', '19 municiones', 0.00),
('CZ-SHADOW-2-SA', 'CZ SHADOW 2 SA', (SELECT id FROM categoria_arma WHERE nombre = 'PISTOLA'), '9MM', '19 municiones', 0.00),
('CZ-SHADOW-2-URBAN-GREY', 'CZ SHADOW 2 URBAN GREY', (SELECT id FROM categoria_arma WHERE nombre = 'PISTOLA'), '9MM', '19 municiones', 0.00),
('CZ-SHADOW-2-COMPACT-OR', 'CZ SHADOW 2 COMPACT OR', (SELECT id FROM categoria_arma WHERE nombre = 'PISTOLA'), '9MM', '15 municiones', 0.00),
('CZ-SHADOW-2-TARGET', 'CZ SHADOW 2 TARGET', (SELECT id FROM categoria_arma WHERE nombre = 'PISTOLA'), '9MM', '19 municiones', 0.00),
('CZ-SHADOW-2-ORANGE-OR', 'CZ SHADOW 2 ORANGE OR', (SELECT id FROM categoria_arma WHERE nombre = 'PISTOLA'), '9MM', '19 municiones', 0.00),
('CZ-TS2', 'CZ TS2', (SELECT id FROM categoria_arma WHERE nombre = 'PISTOLA'), '9MM', '20 municiones', 0.00),
('CZ-TS2-RACING-GREEN', 'CZ TS2 RACING GREEN', (SELECT id FROM categoria_arma WHERE nombre = 'PISTOLA'), '9MM', '20 municiones', 0.00),
('CZ-TS2-BRONZE', 'CZ TS 2 BRONZE', (SELECT id FROM categoria_arma WHERE nombre = 'PISTOLA'), '9MM', '20 municiones', 0.00),
('CZ-TS2-ORANGE-BULL', 'CZ TS 2 ORANGE BULL', (SELECT id FROM categoria_arma WHERE nombre = 'PISTOLA'), '9MM', '20 municiones', 0.00),

-- Escopetas
('CZ-612-HD', 'CZ 612 HOME DEFENSE', (SELECT id FROM categoria_arma WHERE nombre = 'ESCOPETA'), '12 GA', '5 cartuchos', 0.00),
('CZ-1012', 'CZ 1012', (SELECT id FROM categoria_arma WHERE nombre = 'ESCOPETA'), '12 GA', '5 cartuchos', 0.00),
('CZ-1012-SYN', 'CZ 1012 SYNTHETIC', (SELECT id FROM categoria_arma WHERE nombre = 'ESCOPETA'), '12 GA', '5 cartuchos', 0.00),
('CZ-612-FIELD', 'CZ 612 FIELD', (SELECT id FROM categoria_arma WHERE nombre = 'ESCOPETA'), '12 GA', '5 cartuchos', 0.00),
('CZ-SUPREME-FIELD', 'CZ SUPREME FIELD', (SELECT id FROM categoria_arma WHERE nombre = 'ESCOPETA'), '12 GA', '2 cartuchos', 0.00),
('CZ-RED-HEAD-PRM', 'CZ RED HEAD PREMIER', (SELECT id FROM categoria_arma WHERE nombre = 'ESCOPETA'), '12 GA', '2 cartuchos', 0.00),
('CZ-RED-HEAD-PRM-TGT', 'CZ RED HEAD PREMIER TRGET', (SELECT id FROM categoria_arma WHERE nombre = 'ESCOPETA'), '12 GA', '2 cartuchos', 0.00),

-- Carabinas
('SCORPION-EVO-3-S1-8', 'SCORPIO EVO 3 S1 8 PULGADAS', (SELECT id FROM categoria_arma WHERE nombre = 'CARABINA'), '9MM', '20 municiones', 0.00),
('SCORPION-EVO-3-S1-16', 'SCORPIO EVO 3 S1 16 PULGADAS', (SELECT id FROM categoria_arma WHERE nombre = 'CARABINA'), '9MM', '30 municiones', 0.00),
('CZ-457-SYN', 'CZ 457 SYNTHETIC', (SELECT id FROM categoria_arma WHERE nombre = 'CARABINA'), '22 lr.', '5 municiones', 0.00),
('CZ-457-SYN-SET', 'CZ 457 SYNTHETIC SET', (SELECT id FROM categoria_arma WHERE nombre = 'CARABINA'), '22 lr.', '5 municiones', 0.00),
('CZ-457-STN', 'CZ 457 STAINLESS', (SELECT id FROM categoria_arma WHERE nombre = 'CARABINA'), '22 lr.', '5 municiones', 0.00),
('CZ-457-ROYAL', 'CZ 457 Royal', (SELECT id FROM categoria_arma WHERE nombre = 'CARABINA'), '22 lr.', '5 municiones', 0.00),
('CZ-457-AMER', 'CZ 457 American', (SELECT id FROM categoria_arma WHERE nombre = 'CARABINA'), '22 lr.', '5 municiones', 0.00),
('CZ-457-CARBON', 'CZ 457 CARBON', (SELECT id FROM categoria_arma WHERE nombre = 'CARABINA'), '21 lr.', '5 municiones', 0.00),
('CZ-LPR', 'CZ LPR', (SELECT id FROM categoria_arma WHERE nombre = 'CARABINA'), '22 lr.', '5 municiones', 0.00),
('CZ-MDT', 'CZ MDT', (SELECT id FROM categoria_arma WHERE nombre = 'CARABINA'), '22 lr.', '5 municiones', 0.00),

-- Rifles
('CZ-600-LUX-308', 'CZ 600 LUX', (SELECT id FROM categoria_arma WHERE nombre = 'RIFLE'), '.308 WINCHESTER', '5 municiones', 0.00),
('CZ-600-LUX-223', 'CZ 600 LUX', (SELECT id FROM categoria_arma WHERE nombre = 'RIFLE'), '.223 REMINGTON', '5 municiones', 0.00),
('CZ-600-AMER-308', 'CZ 600 AMERICAN', (SELECT id FROM categoria_arma WHERE nombre = 'RIFLE'), '.308 WINCHESTER', '5 municiones', 0.00),
('CZ-600-AMER-223', 'CZ 600 AMERICAN', (SELECT id FROM categoria_arma WHERE nombre = 'RIFLE'), '.223 REMINGTON', '5 municiones', 0.00),
('CZ-600-ALPHA-308', 'CZ 600 ALPHA', (SELECT id FROM categoria_arma WHERE nombre = 'RIFLE'), '.308 WINCHESTER', '5 municiones', 0.00),
('CZ-600-ALPHA-223', 'CZ 600 APLPHA', (SELECT id FROM categoria_arma WHERE nombre = 'RIFLE'), '.223 REMINGTON', '5 municiones', 0.00),
('CZ-600-ERGO-308', 'CZ 600 ERGO', (SELECT id FROM categoria_arma WHERE nombre = 'RIFLE'), '.308 WINCHESTER', '5 municiones', 0.00),
('CZ-600-ERGO-223', 'CZ 600 ERGO', (SELECT id FROM categoria_arma WHERE nombre = 'RIFLE'), '.223 REMINGTON', '5 municiones', 0.00),
('CZ-600-RANGE-308', 'CZ 600 RANGE', (SELECT id FROM categoria_arma WHERE nombre = 'RIFLE'), '.308 WINCHESTER', '5 municiones', 0.00),
('CZ-600-RANGE-223', 'CZ 600 RANGE', (SELECT id FROM categoria_arma WHERE nombre = 'RIFLE'), '.223 REMINGTON', '5 municiones', 0.00),
('CZ-TSR', 'CZ TSR', (SELECT id FROM categoria_arma WHERE nombre = 'RIFLE'), '.308 WINCHESTER', '5 municiones', 0.00);

-- Insertar tipos de accesorios
INSERT INTO tipo_accesorio (nombre, descripcion) VALUES
('Cargador', 'Cargadores adicionales para armas'),
('Mira', 'Miras y sistemas de puntería'),
('Corredera', 'Correderas y piezas de repuesto'),
('Empuñadura', 'Empuñaduras y adaptadores'),
('Soporte', 'Soportes y rieles accesorios'),
('Municion', 'Cajas de Municion'),
('Camiseta','Camiseta con logotipo'),
('Gorra','Gorra con logotipo');

-- Insertar accesorios específicos
INSERT INTO accesorio (codigo, nombre, tipo_id, precio_referencia) VALUES
('CZ-P09-CARG', 'Cargador CZ P09/P07 15 balas', (SELECT id FROM tipo_accesorio WHERE nombre = 'Cargador'), 0.00),
('CZ-P10-CARG', 'Cargador CZ P10 15 balas', (SELECT id FROM tipo_accesorio WHERE nombre = 'Cargador'), 0.00),
('CZ-RIFLE-MIRA', 'Mira telescópica CZ Rifle', (SELECT id FROM tipo_accesorio WHERE nombre = 'Mira'), 0.00);

-- =====================================================
-- CLIENTES DE PRUEBA
-- =====================================================

-- Cliente Civil
INSERT INTO cliente (
    tipo_identificacion_id, tipo_cliente_id, numero_identificacion, 
    nombres, apellidos, fecha_nacimiento, direccion, provincia, canton,
    email, telefono_principal, telefono_secundario, usuario_creador_id
) VALUES (
    (SELECT id FROM tipo_identificacion WHERE codigo = 'CED'),
    (SELECT id FROM tipo_cliente WHERE codigo = 'CIV'),
    '1200120012',
    'JUAN CARLOS',
    'MARTÍNEZ LÓPEZ',
    '1985-03-15',
    'AV. AMAZONAS N45-123',
    'PICHINCHA',
    'QUITO',
    'juan.martinez@email.com',
    '0987654321',
    '0987654322',
    2
);

-- Cliente Militar
INSERT INTO cliente (
    tipo_identificacion_id, tipo_cliente_id, numero_identificacion,
    nombres, apellidos, fecha_nacimiento, direccion, provincia, canton,
    email, telefono_principal, estado_militar, usuario_creador_id
) VALUES (
    (SELECT id FROM tipo_identificacion WHERE codigo = 'CED'),
    (SELECT id FROM tipo_cliente WHERE codigo = 'MIL'),
    '1100110011',
    'CARLOS ALBERTO',
    'RODRÍGUEZ VARGAS',
    '1980-07-22',
    'CALLE 10 DE AGOSTO N23-45',
    'PICHINCHA',
    'QUITO',
    'carlos.rodriguez@email.com',
    '0987654323',
    'ACTIVO',
    2
);

-- Cliente Empresa (Representante Legal + Datos de Empresa)
INSERT INTO cliente (
    tipo_identificacion_id, tipo_cliente_id, numero_identificacion,
    nombres, apellidos, fecha_nacimiento, direccion, provincia, canton,
    email, telefono_principal, telefono_secundario, representante_legal,
    ruc, nombre_empresa, direccion_fiscal, provincia_empresa, canton_empresa,
    telefono_referencia, correo_empresa, usuario_creador_id
) VALUES (
    (SELECT id FROM tipo_identificacion WHERE codigo = 'CED'),
    (SELECT id FROM tipo_cliente WHERE codigo = 'EMP'),
    '1712345678',
    'MARÍA ELENA',
    'GONZÁLEZ RODRÍGUEZ',
    '1982-11-15',
    'AV. 9 DE OCTUBRE N123-456',
    'GUAYAS',
    'GUAYAQUIL',
    'maria.gonzalez@email.com',
    '0987654324',
    '0987654326',
    'MARÍA ELENA GONZÁLEZ RODRÍGUEZ',
    '0991234567001',
    'SEGURIDAD INTEGRAL S.A.',
    'AV. 9 DE OCTUBRE N123-456, OFICINA 45',
    'GUAYAS',
    'GUAYAQUIL',
    '0987654325',
    'info@seguridadintegral.com',
    3
);

-- Cliente Empresa 2 (Representante Legal + Datos de Empresa)
INSERT INTO cliente (
    tipo_identificacion_id, tipo_cliente_id, numero_identificacion,
    nombres, apellidos, fecha_nacimiento, direccion, provincia, canton,
    email, telefono_principal, telefono_secundario, representante_legal,
    ruc, nombre_empresa, direccion_fiscal, provincia_empresa, canton_empresa,
    telefono_referencia, correo_empresa, usuario_creador_id
) VALUES (
    (SELECT id FROM tipo_identificacion WHERE codigo = 'CED'),
    (SELECT id FROM tipo_cliente WHERE codigo = 'EMP'),
    '1723456789',
    'ROBERTO ANTONIO',
    'HERRERA CASTILLO',
    '1978-05-20',
    'AV. PRINCIPAL N789-012',
    'PICHINCHA',
    'QUITO',
    'roberto.herrera@email.com',
    '0987654327',
    '0987654328',
    'ROBERTO ANTONIO HERRERA CASTILLO',
    '0999876543001',
    'PROTECCIÓN TOTAL S.A.',
    'AV. PRINCIPAL N789-012, EDIFICIO CORPORATIVO',
    'PICHINCHA',
    'QUITO',
    '0987654329',
    'contacto@protecciontotal.com',
    2
);

-- =====================================================
-- GRUPOS DE IMPORTACIÓN DE PRUEBA
-- =====================================================

INSERT INTO grupo_importacion (
    codigo, licencia_id, tipo_proceso_id, usuario_creador_id, estado
) VALUES (
    'GI-2024-001',
    (SELECT id FROM licencia WHERE numero = 'LIC001'),
    (SELECT id FROM tipo_proceso WHERE codigo = 'CUPO_CIV'),
    4,
    'EN_PROCESO'
);

INSERT INTO grupo_importacion (
    codigo, licencia_id, tipo_proceso_id, usuario_creador_id, estado
) VALUES (
    'GI-2024-002',
    (SELECT id FROM licencia WHERE numero = 'LIC002'),
    (SELECT id FROM tipo_proceso WHERE codigo = 'EXC_MIL'),
    4,
    'EN_PROCESO'
);

-- =====================================================
-- ASIGNACIONES DE PRUEBA
-- =====================================================

-- Asignación de arma a cliente civil
INSERT INTO asignacion_arma (
    cliente_id, grupo_importacion_id, modelo_arma_id, cantidad, precio_unitario, estado
) VALUES (
    (SELECT id FROM cliente WHERE numero_identificacion = '1200120012'),
    (SELECT id FROM grupo_importacion WHERE codigo = 'GI-2024-001'),
    (SELECT id FROM modelo_arma WHERE codigo = 'CZ-P10-C'),
    1,
    1500.00,
    'RESERVADO'
);

-- Asignación de arma a cliente militar
INSERT INTO asignacion_arma (
    cliente_id, grupo_importacion_id, modelo_arma_id, cantidad, precio_unitario, estado
) VALUES (
    (SELECT id FROM cliente WHERE numero_identificacion = '1100110011'),
    (SELECT id FROM grupo_importacion WHERE codigo = 'GI-2024-002'),
    (SELECT id FROM modelo_arma WHERE codigo = 'CZ-SHADOW-2'),
    1,
    2000.00,
    'RESERVADO'
);

-- =====================================================
-- RESPUESTAS DE CLIENTES DE PRUEBA
-- =====================================================

-- Respuestas del cliente civil
INSERT INTO respuesta_cliente (cliente_id, pregunta_id, respuesta) VALUES
((SELECT id FROM cliente WHERE numero_identificacion = '1200120012'), 1, 'Sí'),
((SELECT id FROM cliente WHERE numero_identificacion = '1200120012'), 2, 'Sí'),
((SELECT id FROM cliente WHERE numero_identificacion = '1200120012'), 3, 'No'),
((SELECT id FROM cliente WHERE numero_identificacion = '1200120012'), 4, 'No');

-- Respuestas del cliente militar
INSERT INTO respuesta_cliente (cliente_id, pregunta_id, respuesta) VALUES
((SELECT id FROM cliente WHERE numero_identificacion = '1100110011'), 5, 'Sí'),
((SELECT id FROM cliente WHERE numero_identificacion = '1100110011'), 6, 'Sí'),
((SELECT id FROM cliente WHERE numero_identificacion = '1100110011'), 7, 'Sí'),
((SELECT id FROM cliente WHERE numero_identificacion = '1100110011'), 8, 'Sí'),
((SELECT id FROM cliente WHERE numero_identificacion = '1100110011'), 9, 'No'),
((SELECT id FROM cliente WHERE numero_identificacion = '1100110011'), 10, 'No');
-- =====================================================
-- NOTIFICACIONES DE PRUEBA
-- =====================================================

INSERT INTO notificacion (usuario_id, titulo, mensaje, accion_url) VALUES
(2, 'Nuevo cliente registrado', 'Se ha registrado un nuevo cliente civil', '/clientes/1'),
(3, 'Asignación de arma', 'Se ha asignado una CZ P10 C a un cliente', '/asignaciones/1'),
(4, 'Grupo de importación creado', 'Se ha creado el grupo GI-2024-001', '/grupos/1');

-- =====================================================
-- DOCUMENTOS GENERADOS DE PRUEBA
-- =====================================================

INSERT INTO documento_generado (tipo, cliente_id, numero_documento, url_archivo, usuario_generador_id) VALUES
('SOLICITUD_IMPORTACION', (SELECT id FROM cliente WHERE numero_identificacion = '1200120012'), 'SOL-2024-001', '/documentos/solicitud_2024_001.pdf', 4),
('CERTIFICADO_ANTECEDENTES', (SELECT id FROM cliente WHERE numero_identificacion = '1200120012'), 'ANT-2024-001', '/documentos/antecedentes_2024_001.pdf', 4); 
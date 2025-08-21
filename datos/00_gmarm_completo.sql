-- =====================================================
-- GMARM - SCRIPT MAESTRO COMPLETO
-- =====================================================
-- Este script contiene TODO: esquema, datos y configuraciones
-- Es IDEMPOTENTE: se puede ejecutar múltiples veces sin errores
-- Reemplaza todos los scripts individuales anteriores
-- =====================================================

-- =====================================================
-- 1. CREACIÓN DE TABLAS (si no existen)
-- =====================================================

-- Tabla de roles
CREATE TABLE IF NOT EXISTS rol (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    tipo_rol_vendedor VARCHAR(20),
    estado BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuario (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono_principal VARCHAR(20),
    telefono_secundario VARCHAR(20),
    direccion TEXT,
    foto VARCHAR(255),
    estado VARCHAR(20) DEFAULT 'ACTIVO',
    bloqueado BOOLEAN DEFAULT false,
    intentos_login INTEGER DEFAULT 0,
    ultimo_intento TIMESTAMP,
    ultimo_login TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de relación usuario-rol
CREATE TABLE IF NOT EXISTS usuario_rol (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    rol_id INTEGER NOT NULL REFERENCES rol(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true,
    UNIQUE(usuario_id, rol_id)
);

-- Tabla de tipos de cliente
CREATE TABLE IF NOT EXISTS tipo_cliente (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    descripcion TEXT,
    estado BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de tipos de identificación
CREATE TABLE IF NOT EXISTS tipo_identificacion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    descripcion TEXT,
    estado BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de tipos de proceso
CREATE TABLE IF NOT EXISTS tipo_proceso (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    descripcion TEXT,
    estado BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de tipos de importación
CREATE TABLE IF NOT EXISTS tipo_importacion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    cupo_maximo INTEGER NOT NULL,
    descripcion TEXT,
    estado BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de relación tipo_cliente-importacion
CREATE TABLE IF NOT EXISTS tipo_cliente_importacion (
    id SERIAL PRIMARY KEY,
    tipo_cliente_id INTEGER NOT NULL REFERENCES tipo_cliente(id),
    tipo_importacion_id INTEGER NOT NULL REFERENCES tipo_importacion(id),
    UNIQUE(tipo_cliente_id, tipo_importacion_id)
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS cliente (
    id SERIAL PRIMARY KEY,
    numero_identificacion VARCHAR(20) NOT NULL,
    tipo_identificacion_id INTEGER NOT NULL REFERENCES tipo_identificacion(id),
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    telefono_principal VARCHAR(20),
    telefono_secundario VARCHAR(20),
    direccion TEXT,
    fecha_nacimiento DATE,
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    aprobado BOOLEAN DEFAULT false,
    fecha_aprobacion TIMESTAMP,
    usuario_aprobador_id INTEGER REFERENCES usuario(id),
    tipo_cliente_id INTEGER NOT NULL REFERENCES tipo_cliente(id),
    usuario_creador_id INTEGER NOT NULL REFERENCES usuario(id),
    usuario_actualizador_id INTEGER REFERENCES usuario(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Campos para proceso de aprobación del jefe de ventas
    proceso_completado BOOLEAN DEFAULT false,
    aprobado_por_jefe_ventas BOOLEAN DEFAULT NULL,
    motivo_rechazo VARCHAR(500) DEFAULT NULL,
    fecha_rechazo TIMESTAMP DEFAULT NULL,
    -- Campos de ubicación
    provincia VARCHAR(100),
    canton VARCHAR(100),
    -- Información de representante legal (para empresas)
    representante_legal VARCHAR(100),
    -- Información de empresa (solo para tipo empresa)
    ruc VARCHAR(13),
    nombre_empresa VARCHAR(255),
    direccion_fiscal VARCHAR(255),
    telefono_referencia VARCHAR(15),
    correo_empresa VARCHAR(100),
    provincia_empresa VARCHAR(100),
    canton_empresa VARCHAR(100),
    -- Información militar (solo para uniformados - militares y policías, NULL para otros tipos)
    estado_militar VARCHAR(20) DEFAULT NULL
);

-- Tabla de preguntas para clientes
CREATE TABLE IF NOT EXISTS pregunta_cliente (
    id SERIAL PRIMARY KEY,
    tipo_proceso_id INTEGER NOT NULL REFERENCES tipo_proceso(id),
    pregunta TEXT NOT NULL,
    obligatoria BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    estado BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de respuestas de clientes
CREATE TABLE IF NOT EXISTS respuesta_cliente (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
    pregunta_id INTEGER NOT NULL REFERENCES pregunta_cliente(id),
    respuesta TEXT NOT NULL,
    fecha_respuesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo_respuesta VARCHAR(20) DEFAULT 'TEXTO',
    obligatoria BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de tipos de documento
CREATE TABLE IF NOT EXISTS tipo_documento (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    obligatorio BOOLEAN DEFAULT false,
    tipo_proceso_id INTEGER REFERENCES tipo_proceso(id),
    estado BOOLEAN DEFAULT true,
    url_documento VARCHAR(500),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de documentos de clientes
CREATE TABLE IF NOT EXISTS documento_cliente (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
    tipo_documento_id INTEGER NOT NULL REFERENCES tipo_documento(id),
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo VARCHAR(500) NOT NULL,
    tamanio_bytes BIGINT,
    descripcion TEXT,
    url_archivo VARCHAR(500),
    fecha_carga TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    usuario_carga_id INTEGER NOT NULL REFERENCES usuario(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de categorías de armas (estructura simplificada)
CREATE TABLE IF NOT EXISTS categoria_arma (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    estado BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de armas (estructura simplificada, sin referencias circulares)
CREATE TABLE IF NOT EXISTS arma (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    calibre VARCHAR(20),
    capacidad INTEGER,
    precio_referencia DECIMAL(10,2),
    categoria_id INTEGER NOT NULL REFERENCES categoria_arma(id),
    url_imagen VARCHAR(500),
    url_producto VARCHAR(500),
    estado BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de armas físicas (referencia a arma simplificada)
CREATE TABLE IF NOT EXISTS arma_fisica (
    id SERIAL PRIMARY KEY,
    numero_serie VARCHAR(100) UNIQUE NOT NULL,
    arma_id INTEGER NOT NULL REFERENCES arma(id),
    estado VARCHAR(20) DEFAULT 'DISPONIBLE',
    fecha_asignacion TIMESTAMP,
    cliente_id INTEGER REFERENCES cliente(id),
    grupo_importacion_id INTEGER,
    usuario_asignador_id INTEGER REFERENCES usuario(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de accesorios físicos
CREATE TABLE IF NOT EXISTS accesorio_fisico (
    id SERIAL PRIMARY KEY,
    numero_serie VARCHAR(100) UNIQUE NOT NULL,
    accesorio_id INTEGER,
    estado VARCHAR(20) DEFAULT 'DISPONIBLE',
    fecha_asignacion TIMESTAMP,
    cliente_id INTEGER REFERENCES cliente(id),
    grupo_importacion_id INTEGER,
    usuario_asignador_id INTEGER REFERENCES usuario(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de asignaciones de armas (referencia a arma simplificada)
CREATE TABLE IF NOT EXISTS asignacion_arma (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
    arma_id INTEGER NOT NULL REFERENCES arma(id),
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2),
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    grupo_importacion_id INTEGER,
    usuario_asignador_id INTEGER NOT NULL REFERENCES usuario(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de relación cliente-arma (cuando un cliente elige)
CREATE TABLE IF NOT EXISTS cliente_arma (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
    arma_id INTEGER NOT NULL REFERENCES arma(id) ON DELETE CASCADE,
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2),
    estado VARCHAR(20) DEFAULT 'RESERVADO',
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de asignaciones de accesorios
CREATE TABLE IF NOT EXISTS asignacion_accesorio (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
    accesorio_id INTEGER NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2),
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    grupo_importacion_id INTEGER,
    usuario_asignador_id INTEGER NOT NULL REFERENCES usuario(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de grupos de importación
CREATE TABLE IF NOT EXISTS grupo_importacion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(20) DEFAULT 'EN_PREPARACION',
    fecha_inicio DATE,
    fecha_fin DATE,
    cupo_total INTEGER,
    cupo_disponible INTEGER,
    usuario_creador_id INTEGER NOT NULL REFERENCES usuario(id),
    tipo_importacion_id INTEGER REFERENCES tipo_importacion(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS pago (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
    monto DECIMAL(10,2) NOT NULL,
    tipo_pago VARCHAR(20) NOT NULL,
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    fecha_pago TIMESTAMP,
    referencia_pago VARCHAR(100),
    usuario_confirmador_id INTEGER REFERENCES usuario(id),
    plan_pago_id INTEGER,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de planes de pago
CREATE TABLE IF NOT EXISTS plan_pago (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo_cliente_id INTEGER REFERENCES tipo_cliente(id),
    numero_cuotas INTEGER DEFAULT 1,
    descripcion TEXT,
    estado BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de licencias
CREATE TABLE IF NOT EXISTS licencia (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    ruc VARCHAR(20),
    cuenta_bancaria VARCHAR(50),
    nombre_banco VARCHAR(100),
    tipo_cuenta VARCHAR(20),
    cedula_cuenta VARCHAR(20),
    email VARCHAR(100),
    telefono VARCHAR(20),
    tipo_licencia VARCHAR(50),
    cupo_total INTEGER,
    cupo_disponible INTEGER,
    cupo_civil INTEGER,
    cupo_militar INTEGER,
    cupo_empresa INTEGER,
    cupo_deportista INTEGER,
    estado VARCHAR(20) DEFAULT 'ACTIVA',
    fecha_vencimiento DATE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de configuración del sistema
CREATE TABLE IF NOT EXISTS configuracion_sistema (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    editable BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de provincias
CREATE TABLE IF NOT EXISTS provincia (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    estado BOOLEAN DEFAULT true
);

-- Tabla de cantones
CREATE TABLE IF NOT EXISTS canton (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(10) NOT NULL,
    estado BOOLEAN DEFAULT true,
    provincia_id INTEGER NOT NULL REFERENCES provincia(id) ON DELETE CASCADE
);

-- =====================================================
-- 2. CREACIÓN DE ÍNDICES
-- =====================================================

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_usuario_username ON usuario(username);
CREATE INDEX IF NOT EXISTS idx_usuario_email ON usuario(email);
CREATE INDEX IF NOT EXISTS idx_cliente_identificacion ON cliente(numero_identificacion);
CREATE INDEX IF NOT EXISTS idx_cliente_estado ON cliente(estado);
CREATE INDEX IF NOT EXISTS idx_cliente_usuario_creador ON cliente(usuario_creador_id);
CREATE INDEX IF NOT EXISTS idx_respuesta_cliente_cliente ON respuesta_cliente(cliente_id);
CREATE INDEX IF NOT EXISTS idx_documento_cliente_cliente ON documento_cliente(cliente_id);
CREATE INDEX IF NOT EXISTS idx_asignacion_arma_cliente ON asignacion_arma(cliente_id);
CREATE INDEX IF NOT EXISTS idx_arma_fisica_numero_serie ON arma_fisica(numero_serie);
CREATE INDEX IF NOT EXISTS idx_arma_fisica_estado ON arma_fisica(estado);
CREATE INDEX IF NOT EXISTS idx_pago_cliente ON pago(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pago_estado ON pago(estado);
CREATE INDEX IF NOT EXISTS idx_provincia_codigo ON provincia(codigo);
CREATE INDEX IF NOT EXISTS idx_canton_provincia ON canton(provincia_id);
CREATE INDEX IF NOT EXISTS idx_canton_codigo ON canton(codigo);

-- =====================================================
-- 3. INSERCIÓN DE DATOS BASE (solo si no existen)
-- =====================================================

-- Insertar roles del sistema
INSERT INTO rol (codigo, nombre, descripcion, tipo_rol_vendedor, estado) VALUES
('ADMIN', 'Administrador', 'Acceso completo al sistema', NULL, true),
('VENDOR', 'Vendedor', 'Registro de clientes y selección de armas catálogo', 'LIBRE', true),
('SALES_CHIEF', 'Jefe de Ventas', 'Aprobación de solicitudes y creación de grupos de importación', 'FIJO', true),
('FINANCE', 'Finanzas', 'Gestión de pagos y facturación', NULL, true),
('OPERATIONS', 'Operaciones', 'Gestión de importación y documentación', NULL, true)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar tipos de cliente
INSERT INTO tipo_cliente (nombre, codigo, descripcion, estado) VALUES
('Civil', 'CIV', 'Persona natural civil', true),
('Militar Fuerza Terrestre', 'MIL', 'Personal activo de fuerzas armadas terrestre', true),
('Militar Fuerza Naval', 'NAV', 'Personal activo de fuerzas armadas naval', true),
('Militar Fuerza Aerea', 'AER', 'Personal activo de fuerzas armadas aereas', true),
('Uniformado Policial', 'POL', 'Personal activo de fuerza policial', true),
('Compañía de Seguridad', 'EMP', 'Compañía de seguridad privada', true),
('Deportista', 'DEP', 'Deportista', true)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar tipos de identificación
INSERT INTO tipo_identificacion (nombre, codigo, descripcion, estado) VALUES
('Cédula de Identidad', 'CED', 'Documento de identificación personal', true),
('RUC', 'RUC', 'Registro Único de Contribuyentes', true)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar tipos de proceso
INSERT INTO tipo_proceso (nombre, codigo, descripcion, estado) VALUES
('Cupo Civil', 'CUPO_CIV', 'Proceso para importación por cupo civil', true),
('Extracupo Uniformado', 'EXC_MIL', 'Proceso para importación por extracupo militar/policial', true),
('Extracupo Empresa', 'EXC_EMP', 'Proceso para importación por extracupo compañía de seguridad', true),
('Cupo Deportista', 'CUPO_DEP', 'Proceso para importación por cupo civil deportista', true)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar tipos de importación
INSERT INTO tipo_importacion (nombre, cupo_maximo, descripcion, estado) VALUES
('Cupo Civil', 25, 'Importación regular para personas naturales civiles', true),
('Extracupo Uniformado', 1000, 'Importación especial para personal uniformado militar y policial', true),
('Extracupo Compania', 1000, 'Importación especial para empresas de seguridad', true),
('Cupo Deportista', 25, 'Importación regular para deportistas', true)
ON CONFLICT (id) DO NOTHING;

-- Insertar relación tipos de importacion con tipo de cliente
INSERT INTO tipo_cliente_importacion (tipo_cliente_id, tipo_importacion_id) VALUES
(1, 1), (2, 2), (3, 2), (4, 2), (5, 2), (6, 3), (7, 1)
ON CONFLICT DO NOTHING;

-- Insertar tipos de documento
INSERT INTO tipo_documento (nombre, descripcion, obligatorio, tipo_proceso_id, estado, url_documento) VALUES
-- Documentos para Cupo Civil
('Copia de cédula', 'Copia legible de la cédula de identidad', true, 1, true, NULL),
('Formulario de solicitud', 'Formulario completo de solicitud de importación', true, 1, true, NULL),
-- Documentos universales para Cupo Civil
('Antecedentes Penales', 'Certificado de antecedentes penales del Ministerio del Interior', true, 1, true, 'https://certificados.ministeriodelinterior.gob.ec/gestorcertificados/antecedentes/'),
('Consejo de la Judicatura', 'Certificado de no tener juicios o casos de robos/violencia/as esinatos', true, 1, true, 'https://consultas.funcionjudicial.gob.ec/informacionjudicialindividual/pages/index.jsf#!/'),
('Fiscalía', 'Certificado de no tener procesos por robos/violencia/as esinatos', true, 1, true, 'https://www.fiscalia.gob.ec/consultade-noticias-del-delito/'),
('SATJE', 'Certificado de procesos judiciales', true, 1, true, 'https://procesosjudiciales.funcionjudicial.gob.ec/busqueda-filtros'),

-- Documentos para Extracupo Uniformado
('Credencial militar/policial', 'Credencial vigente de institución armada o policial', true, 2, true, NULL),
('Certificado de servicio activo', 'Certificado de servicio activo vigente', true, 2, true, NULL),
('Copia de cédula', 'Copia legible de la cédula de identidad', true, 2, true, NULL),
('Formulario de solicitud', 'Formulario completo de solicitud de importación', true, 2, true, NULL),
-- Documentos universales para Extracupo Uniformado
('Antecedentes Penales', 'Certificado de antecedentes penales del Ministerio del Interior', true, 2, true, 'https://certificados.ministeriodelinterior.gob.ec/gestorcertificados/antecedentes/'),
('Consejo de la Judicatura', 'Certificado de no tener juicios o casos de robos/violencia/as esinatos', true, 2, true, 'https://consultas.funcionjudicial.gob.ec/informacionjudicialindividual/pages/index.jsf#!/'),
('Fiscalía', 'Certificado de no tener procesos por robos/violencia/as esinatos', true, 2, true, 'https://www.fiscalia.gob.ec/consultade-noticias-del-delito/'),
('SATJE', 'Certificado de procesos judiciales', true, 2, true, 'https://procesosjudiciales.funcionjudicial.gob.ec/busqueda-filtros'),

-- Documentos para Extracupo Empresa (solo específicos, no universales)
('Cédula del representante legal', 'Cédula del representante legal', true, 3, true, NULL),
('Nombramiento representante legal', 'Documento que acredita representación legal', true, 3, true, NULL),
('Permiso de funcionamiento', 'Permiso de funcionamiento vigente', true, 3, true, NULL),
('RUC de la empresa', 'RUC activo de la empresa', true, 3, true, NULL),
('Formulario de solicitud', 'Formulario completo de solicitud de importación', true, 3, true, NULL),

-- Documentos para Cupo Deportista
('Copia de cédula', 'Copia legible de la cédula de identidad', true, 4, true, NULL),
('Formulario de solicitud', 'Formulario completo de solicitud de importación', true, 4, true, NULL),
('Credencial de club deportivo', 'Credencial de club deportivo vigente', true, 4, true, NULL),
('Credencial de tenencia de armas', 'Credencial de tenencia de armas vigente', true, 4, true, NULL),
-- Documentos universales para Cupo Deportista
('Antecedentes Penales', 'Certificado de antecedentes penales del Ministerio del Interior', true, 4, true, 'https://certificados.ministeriodelinterior.gob.ec/gestorcertificados/antecedentes/'),
('Consejo de la Judicatura', 'Certificado de no tener juicios o casos de robos/violencia/as esinatos', true, 4, true, 'https://consultas.funcionjudicial.gob.ec/informacionjudicialindividual/pages/index.jsf#!/'),
('Fiscalía', 'Certificado de no tener procesos por robos/violencia/as esinatos', true, 4, true, 'https://www.fiscalia.gob.ec/consultade-noticias-del-delito/'),
('SATJE', 'Certificado de procesos judiciales', true, 4, true, 'https://procesosjudiciales.funcionjudicial.gob.ec/busqueda-filtros')
ON CONFLICT (id) DO NOTHING;

-- Insertar categorías de armas
INSERT INTO categoria_arma (nombre, descripcion, codigo, estado) VALUES
('PISTOLA', 'Armas cortas de puño', 'PIST', true),
('ESCOPETA', 'Armas largas para perdigones', 'ESCO', true),
('RIFLE', 'Armas largas de precisión', 'RIFL', true)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar armas (Catálogo CZ actualizado - SIN EXTENSIONES PARA FLEXIBILIDAD)
INSERT INTO arma (codigo, nombre, calibre, capacidad, precio_referencia, categoria_id, url_imagen, url_producto, estado) VALUES
-- Pistolas CZ P09
('CZ-P09-NOCTURNE', 'CZ P09 C NOCTURNE', '9MM', 15, 1200.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-P09-NOCTURNE', 'https://czfirearms.com/pistols/p09-nocturne', true),
('CZ-P09-OR', 'CZ P09 OR', '9MM', 15, 1250.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-P09-OR', 'https://czfirearms.com/pistols/p09-or', true),
('CZ-P09-PORTADO', 'CZ P09 Portado', '9MM', 15, 1300.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-P09-PORTADO', 'https://czfirearms.com/pistols/p09-portado', true),
('CZ-P09-URBAN', 'CZ P09 URBAN GREY', '9MM', 15, 1250.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-P09-URBAN', 'https://czfirearms.com/pistols/p09-urban', true),
('CZ-P09-COMPACT', 'CZ P09 COMPACT', '9MM', 12, 1200.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-P09-COMPACT', 'https://czfirearms.com/pistols/p09-compact', true),
('CZ-P09-SUBCOMPACT', 'CZ P09 SUBCOMPACT', '9MM', 10, 1150.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-P09-SUBCOMPACT', 'https://czfirearms.com/pistols/p09-subcompact', true),
('CZ-P09-TACTICAL', 'CZ P09 TACTICAL', '9MM', 15, 1350.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-P09-TACTICAL', 'https://czfirearms.com/pistols/p09-tactical', true),
('CZ-P09-SPORT', 'CZ P09 SPORT', '9MM', 15, 1400.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-P09-SPORT', 'https://czfirearms.com/pistols/p09-sport', true),
('CZ-P09-COMPETITION', 'CZ P09 COMPETITION', '9MM', 15, 1500.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-P09-COMPETITION', 'https://czfirearms.com/pistols/p09-competition', true),

-- Pistolas CZ P10
('CZ-P10-M', 'CZ P10 M', '9MM', 7, 1100.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-P10-M', 'https://czfirearms.com/pistols/p10-m', true),
('CZ-P10-FDE', 'CZ P10 FDE', '9MM', 15, 1150.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-P10-FDE', 'https://czfirearms.com/pistols/p10-fde', true),
('CZ-P10-TARGET', 'CZ P10 TARGET 5', '9MM', 17, 1400.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-P10-TARGET', 'https://czfirearms.com/pistols/p10-target', true),
('CZ-P10-C', 'CZ P10 C', '9MM', 15, 1200.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-P10-C', 'https://czfirearms.com/pistols/p10-c', true),
('CZ-P10-F', 'CZ P10 F', '9MM', 19, 1250.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-P10-F', 'https://czfirearms.com/pistols/p10-f', true),
('CZ-P10-S', 'CZ P10 S', '9MM', 12, 1100.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-P10-S', 'https://czfirearms.com/pistols/p10-s', true),
('CZ-P10-COMPACT', 'CZ P10 COMPACT', '9MM', 15, 1200.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-P10-COMPACT', 'https://czfirearms.com/pistols/p10-compact', true),
('CZ-P10-TACTICAL', 'CZ P10 TACTICAL', '9MM', 15, 1300.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-P10-TACTICAL', 'https://czfirearms.com/pistols/p10-tactical', true),
('CZ-P10-SPORT', 'CZ P10 SPORT', '9MM', 15, 1350.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-P10-SPORT', 'https://czfirearms.com/pistols/p10-sport', true),
('CZ-P10-COMPETITION', 'CZ P10 COMPETITION', '9MM', 15, 1400.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-P10-COMPETITION', 'https://czfirearms.com/pistols/p10-competition', true),

-- Pistolas CZ SHADOW 2
('CZ-SHADOW-2', 'CZ SHADOW 2', '9MM', 19, 1500.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-SHADOW-2', 'https://czfirearms.com/pistols/shadow-2', true),
('CZ-SHADOW-2-URBAN', 'CZ SHADOW 2 URBAN GREY', '9MM', 19, 1550.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-SHADOW-2-URBAN', 'https://czfirearms.com/pistols/shadow-2-urban', true),
('CZ-SHADOW-2-COMPACT', 'CZ SHADOW 2 COMPACT', '9MM', 16, 1450.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-SHADOW-2-COMPACT', 'https://czfirearms.com/pistols/shadow-2-compact', true),
('CZ-SHADOW-2-ORANGE', 'CZ SHADOW 2 ORANGE', '9MM', 19, 1600.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-SHADOW-2-ORANGE', 'https://czfirearms.com/pistols/shadow-2-orange', true),
('CZ-SHADOW-2-BLUE', 'CZ SHADOW 2 BLUE', '9MM', 19, 1550.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-SHADOW-2-BLUE', 'https://czfirearms.com/pistols/shadow-2-blue', true),
('CZ-SHADOW-2-GREEN', 'CZ SHADOW 2 GREEN', '9MM', 19, 1550.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-SHADOW-2-GREEN', 'https://czfirearms.com/pistols/shadow-2-green', true),
('CZ-SHADOW-2-RED', 'CZ SHADOW 2 RED', '9MM', 19, 1550.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-SHADOW-2-RED', 'https://czfirearms.com/pistols/shadow-2-red', true),
('CZ-SHADOW-2-BLACK', 'CZ SHADOW 2 BLACK', '9MM', 19, 1500.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-SHADOW-2-BLACK', 'https://czfirearms.com/pistols/shadow-2-black', true),
('CZ-SHADOW-2-COMPETITION', 'CZ SHADOW 2 COMPETITION', '9MM', 19, 1700.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-SHADOW-2-COMPETITION', 'https://czfirearms.com/pistols/shadow-2-competition', true),

-- Pistola CZ TS2 RACING
('CZ-TS2-RACING', 'CZ TS2 RACING GREEN', '9MM', 20, 1800.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-TS2-RACING', 'https://czfirearms.com/pistols/ts2-racing', true)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar preguntas para clientes civiles
INSERT INTO pregunta_cliente (tipo_proceso_id, pregunta, obligatoria, orden, estado) VALUES
(1, '¿Tiene cuenta en el Sicoar?', true, 1, true),
(1, '¿La dirección en Sicoar coincide con su domicilio actual?', true, 2, true),
(1, '¿Ha tenido o tiene armas registradas?', true, 3, true)
ON CONFLICT (id) DO NOTHING;

-- Insertar preguntas para militares/policías
INSERT INTO pregunta_cliente (tipo_proceso_id, pregunta, obligatoria, orden, estado) VALUES
(2, '¿Tiene cuenta en el Sicoar?', true, 1, true),
(2, '¿Tiene credencial Ispol o IsFA vigente?', true, 2, true),
(2, '¿Ya tiene firma electrónica habilitada?', true, 3, true),
(2, '¿Tiene certificado de servicio activo?', false, 4, true),
(2, '¿Ha tenido o tiene armas registradas?', true, 5, true)
ON CONFLICT (id) DO NOTHING;

-- Insertar preguntas para empresas
INSERT INTO pregunta_cliente (tipo_proceso_id, pregunta, obligatoria, orden, estado) VALUES
(3, '¿Tiene nombramiento del representante legal vigente?', true, 1, true),
(3, '¿Tiene permiso de operaciones vigente?', true, 2, true),
(3, '¿Tiene autorización de tenencia de armas?', true, 3, true),
(3, '¿La empresa está registrada en el SRI?', true, 4, true),
(3, '¿Tiene RUC activo?', true, 5, true)
ON CONFLICT (id) DO NOTHING;

-- Insertar preguntas para deportistas
INSERT INTO pregunta_cliente (tipo_proceso_id, pregunta, obligatoria, orden, estado) VALUES
(4, '¿Tiene cuenta en el Sicoar?', true, 1, true),
(4, '¿La dirección en Sicoar coincide con su domicilio actual?', true, 2, true),
(4, '¿Ha tenido o tiene armas registradas?', true, 3, true),
(4, 'Credencial de club deportivo vigente', true, 4, true),
(4, 'Credencial de tenencia de armas', true, 5, true)
ON CONFLICT (id) DO NOTHING;

-- Insertar planes de pago
INSERT INTO plan_pago (nombre, tipo_cliente_id, numero_cuotas, descripcion, estado) VALUES
('Contado Civil', 1, 1, 'Pago al contado para clientes civiles', true),
('2 Cuotas Civil', 1, 2, 'Pago en 2 cuotas para clientes civiles', true),
('Contado Militar', 2, 1, 'Pago al contado para personal militar', true),
('6 Cuotas Militar', 2, 6, 'Pago en 6 cuotas para personal militar', true),
('Contado Empresa', 6, 1, 'Pago al contado para empresas', true)
ON CONFLICT (id) DO NOTHING;

-- Insertar licencias
INSERT INTO licencia (numero, nombre, ruc, cuenta_bancaria, nombre_banco, tipo_cuenta, cedula_cuenta, email, telefono, tipo_licencia, cupo_total, cupo_disponible, cupo_civil, cupo_militar, cupo_empresa, cupo_deportista, estado, fecha_vencimiento) VALUES
('LIC001', 'LEITON PORTILLA CORALIA SALOME', '1725781254', '2200614031', 'PICHINCHA', 'AHORROS', '1725781254', 'frank_gun@hotmail.com', '0000000000', 'IMPORTACION_CIVIL', 25, 25, 25, 0, 0, 0, 'ACTIVA', '2050-12-31'),
('LIC002', 'SILVA ACOSTA FRANCISCO JAVIER', '1714597414', '3020513304', 'PICHINCHA', 'AHORROS', '1714597414', 'frank_gun@hotmail.com', '0000000000', 'IMPORTACION_CIVIL', 25, 25, 25, 0, 0, 0, 'ACTIVA', '2050-12-31'),
('LIC003', 'MULLER BENITEZ NICOLE PAMELA', '1713978540', '2212737882', 'PICHINCHA', 'AHORROS', '1713978540', 'vbenitez@hotmail.com', '0000000000', 'IMPORTACION_CIVIL', 25, 25, 25, 0, 0, 0, 'ACTIVA', '2050-12-31'),
('LIC004', 'SIMOGUE S.A.S.', '0993392212001', '2212359266', 'PICHINCHA', 'AHORROS', '0993392212001', 'simogue.sas@gmail.com', '0000000000', 'IMPORTACION_EMPRESA', 100, 100, 0, 0, 100, 0, 'ACTIVA', '2050-12-31'),
('LIC005', 'GUERRERO MARTINEZ JOSE LUIS', '1707815922', '8151263', 'INTERNACIONAL', 'AHORROS', '1707815922', 'joseluis@guerreromartinez.com', '0000000000', 'IMPORTACION_CIVIL', 25, 25, 25, 0, 0, 0, 'ACTIVA', '2050-12-31'),
('LIC006', 'ENDARA UNDA FRANKLIN GEOVANNY', '1721770632', '2100300998', 'PICHINCHA', 'CORRIENTE', '1721770632', 'f.endara@hotmail.com', '0000000000', 'IMPORTACION_CIVIL', 25, 25, 25, 0, 0, 0, 'ACTIVA', '2050-12-31')
ON CONFLICT (numero) DO NOTHING;

-- Insertar configuración del sistema
INSERT INTO configuracion_sistema (clave, valor, descripcion, editable) VALUES
('EMAIL_NOTIFICACIONES', 'notificaciones@gmarm.com', 'Email para enviar notificaciones', true),
('DIAS_VALIDEZ_DOCUMENTOS', '30', 'Días de validez para documentos subidos', true),
('PORCENTAJE_ANTICIPO', '40', 'Porcentaje de anticipo requerido', true),
('IVA', '15', 'Porcentaje de IVA aplicable', false),
('EDAD_MINIMA_CLIENTE', '25', 'Edad mínima para clientes', false),
('MAX_INTENTOS_LOGIN', '3', 'Máximo intentos de login antes de bloquear', false)
ON CONFLICT (clave) DO NOTHING;

-- =====================================================
-- 4. INSERCIÓN DE DATOS DE LOCALIZACIÓN
-- =====================================================

-- Insertar provincias de Ecuador
INSERT INTO provincia (nombre, codigo, estado) VALUES
('Azuay', 'AZU', true),
('Bolívar', 'BOL', true),
('Cañar', 'CAN', true),
('Carchi', 'CAR', true),
('Chimborazo', 'CHI', true),
('Cotopaxi', 'COT', true),
('El Oro', 'ORE', true),
('Esmeraldas', 'ESM', true),
('Galápagos', 'GAL', true),
('Guayas', 'GUA', true),
('Imbabura', 'IMB', true),
('Loja', 'LOJ', true),
('Los Ríos', 'LRI', true),
('Manabí', 'MAN', true),
('Morona Santiago', 'MSA', true),
('Napo', 'NAP', true),
('Orellana', 'ORE', true),
('Pastaza', 'PAS', true),
('Pichincha', 'PIC', true),
('Santa Elena', 'SEL', true),
('Santo Domingo de los Tsáchilas', 'SDT', true),
('Sucumbíos', 'SUC', true),
('Tungurahua', 'TUN', true),
('Zamora Chinchipe', 'ZCH', true)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar cantones por provincia
-- AZUAY
INSERT INTO canton (nombre, codigo, estado, provincia_id) VALUES
('Cuenca', 'CUEN', true, (SELECT id FROM provincia WHERE codigo = 'AZU')),
('Gualaceo', 'GUAL', true, (SELECT id FROM provincia WHERE codigo = 'AZU')),
('Paute', 'PAUT', true, (SELECT id FROM provincia WHERE codigo = 'AZU')),
('Chordeleg', 'CHOR', true, (SELECT id FROM provincia WHERE codigo = 'AZU')),
('Sigsig', 'SIGS', true, (SELECT id FROM provincia WHERE codigo = 'AZU')),
('Girón', 'GIRON', true, (SELECT id FROM provincia WHERE codigo = 'AZU')),
('San Fernando', 'SFER', true, (SELECT id FROM provincia WHERE codigo = 'AZU')),
('Santa Isabel', 'SISA', true, (SELECT id FROM provincia WHERE codigo = 'AZU')),
('Nabón', 'NABO', true, (SELECT id FROM provincia WHERE codigo = 'AZU')),
('Oña', 'ONA', true, (SELECT id FROM provincia WHERE codigo = 'AZU')),
('El Pan', 'ELPA', true, (SELECT id FROM provincia WHERE codigo = 'AZU')),
('Sevilla de Oro', 'SEOR', true, (SELECT id FROM provincia WHERE codigo = 'AZU')),
('Guachapala', 'GUAC', true, (SELECT id FROM provincia WHERE codigo = 'AZU')),
('Camilo Ponce Enríquez', 'CPEN', true, (SELECT id FROM provincia WHERE codigo = 'AZU'))
ON CONFLICT DO NOTHING;

-- BOLÍVAR
INSERT INTO canton (nombre, codigo, estado, provincia_id) VALUES
('Guaranda', 'GUAR', true, (SELECT id FROM provincia WHERE codigo = 'BOL')),
('Chillanes', 'CHIL', true, (SELECT id FROM provincia WHERE codigo = 'BOL')),
('Chimbo', 'CHIM', true, (SELECT id FROM provincia WHERE codigo = 'BOL')),
('Echeandía', 'ECHE', true, (SELECT id FROM provincia WHERE codigo = 'BOL')),
('San Miguel', 'SMIG', true, (SELECT id FROM provincia WHERE codigo = 'BOL')),
('Caluma', 'CALU', true, (SELECT id FROM provincia WHERE codigo = 'BOL')),
('Las Naves', 'LNAV', true, (SELECT id FROM provincia WHERE codigo = 'BOL'))
ON CONFLICT DO NOTHING;

-- CAÑAR
INSERT INTO canton (nombre, codigo, estado, provincia_id) VALUES
('Azogues', 'AZOG', true, (SELECT id FROM provincia WHERE codigo = 'CAN')),
('Cañar', 'CAN', true, (SELECT id FROM provincia WHERE codigo = 'CAN')),
('La Troncal', 'LTRO', true, (SELECT id FROM provincia WHERE codigo = 'CAN')),
('El Tambo', 'ETAM', true, (SELECT id FROM provincia WHERE codigo = 'CAN')),
('Déleg', 'DELE', true, (SELECT id FROM provincia WHERE codigo = 'CAN')),
('Suscal', 'SUSC', true, (SELECT id FROM provincia WHERE codigo = 'CAN'))
ON CONFLICT DO NOTHING;

-- CARCHI
INSERT INTO canton (nombre, codigo, estado, provincia_id) VALUES
('Tulcán', 'TULC', true, (SELECT id FROM provincia WHERE codigo = 'CAR')),
('Montúfar', 'MONT', true, (SELECT id FROM provincia WHERE codigo = 'CAR')),
('Espejo', 'ESPE', true, (SELECT id FROM provincia WHERE codigo = 'CAR')),
('Mira', 'MIRA', true, (SELECT id FROM provincia WHERE codigo = 'CAR')),
('San Pedro de Huaca', 'SPHU', true, (SELECT id FROM provincia WHERE codigo = 'CAR')),
('Bolívar', 'BOLI', true, (SELECT id FROM provincia WHERE codigo = 'CAR'))
ON CONFLICT DO NOTHING;

-- CHIMBORAZO
INSERT INTO canton (nombre, codigo, estado, provincia_id) VALUES
('Riobamba', 'RIOB', true, (SELECT id FROM provincia WHERE codigo = 'CHI')),
('Alausí', 'ALAU', true, (SELECT id FROM provincia WHERE codigo = 'CHI')),
('Colta', 'COLT', true, (SELECT id FROM provincia WHERE codigo = 'CHI')),
('Cumandá', 'CUMA', true, (SELECT id FROM provincia WHERE codigo = 'CHI')),
('Guamote', 'GUAM', true, (SELECT id FROM provincia WHERE codigo = 'CHI')),
('Guano', 'GUAN', true, (SELECT id FROM provincia WHERE codigo = 'CHI')),
('Pallatanga', 'PALL', true, (SELECT id FROM provincia WHERE codigo = 'CHI')),
('Penipe', 'PENI', true, (SELECT id FROM provincia WHERE codigo = 'CHI')),
('Chunchi', 'CHUN', true, (SELECT id FROM provincia WHERE codigo = 'CHI'))
ON CONFLICT DO NOTHING;

-- COTOPAXI
INSERT INTO canton (nombre, codigo, estado, provincia_id) VALUES
('Latacunga', 'LATA', true, (SELECT id FROM provincia WHERE codigo = 'COT')),
('La Maná', 'LMAN', true, (SELECT id FROM provincia WHERE codigo = 'COT')),
('Pangua', 'PANG', true, (SELECT id FROM provincia WHERE codigo = 'COT')),
('Pujilí', 'PUJI', true, (SELECT id FROM provincia WHERE codigo = 'COT')),
('Salcedo', 'SALC', true, (SELECT id FROM provincia WHERE codigo = 'COT')),
('Saquisilí', 'SAQU', true, (SELECT id FROM provincia WHERE codigo = 'COT')),
('Sigchos', 'SIGC', true, (SELECT id FROM provincia WHERE codigo = 'COT'))
ON CONFLICT DO NOTHING;

-- EL ORO
INSERT INTO canton (nombre, codigo, estado, provincia_id) VALUES
('Machala', 'MACH', true, (SELECT id FROM provincia WHERE codigo = 'ORE')),
('Arenillas', 'AREN', true, (SELECT id FROM provincia WHERE codigo = 'ORE')),
('Atahualpa', 'ATAH', true, (SELECT id FROM provincia WHERE codigo = 'ORE')),
('Balsas', 'BALS', true, (SELECT id FROM provincia WHERE codigo = 'ORE')),
('Chilla', 'CHIL', true, (SELECT id FROM provincia WHERE codigo = 'ORE')),
('El Guabo', 'EGUA', true, (SELECT id FROM provincia WHERE codigo = 'ORE')),
('Huaquillas', 'HUAQ', true, (SELECT id FROM provincia WHERE codigo = 'ORE')),
('Marcabelí', 'MARC', true, (SELECT id FROM provincia WHERE codigo = 'ORE')),
('Pasaje', 'PASA', true, (SELECT id FROM provincia WHERE codigo = 'ORE')),
('Piñas', 'PINAS', true, (SELECT id FROM provincia WHERE codigo = 'ORE')),
('Portovelo', 'PORTO', true, (SELECT id FROM provincia WHERE codigo = 'ORE')),
('Santa Rosa', 'SROS', true, (SELECT id FROM provincia WHERE codigo = 'ORE')),
('Zaruma', 'ZARU', true, (SELECT id FROM provincia WHERE codigo = 'ORE')),
('Las Lajas', 'LLAJ', true, (SELECT id FROM provincia WHERE codigo = 'ORE'))
ON CONFLICT DO NOTHING;

-- ESMERALDAS
INSERT INTO canton (nombre, codigo, estado, provincia_id) VALUES
('Esmeraldas', 'ESME', true, (SELECT id FROM provincia WHERE codigo = 'ESM')),
('Eloy Alfaro', 'EALF', true, (SELECT id FROM provincia WHERE codigo = 'ESM')),
('Muisne', 'MUIS', true, (SELECT id FROM provincia WHERE codigo = 'ESM')),
('Quinindé', 'QUIN', true, (SELECT id FROM provincia WHERE codigo = 'ESM')),
('San Lorenzo', 'SLOR', true, (SELECT id FROM provincia WHERE codigo = 'ESM')),
('Atacames', 'ATAC', true, (SELECT id FROM provincia WHERE codigo = 'ESM')),
('Rioverde', 'RIOV', true, (SELECT id FROM provincia WHERE codigo = 'ESM'))
ON CONFLICT DO NOTHING;

-- GALÁPAGOS
INSERT INTO canton (nombre, codigo, estado, provincia_id) VALUES
('San Cristóbal', 'SCRI', true, (SELECT id FROM provincia WHERE codigo = 'GAL')),
('Isabela', 'ISAB', true, (SELECT id FROM provincia WHERE codigo = 'GAL')),
('Santa Cruz', 'SCRU', true, (SELECT id FROM provincia WHERE codigo = 'GAL'))
ON CONFLICT DO NOTHING;

-- GUAYAS
INSERT INTO canton (nombre, codigo, estado, provincia_id) VALUES
('Guayaquil', 'GUAY', true, (SELECT id FROM provincia WHERE codigo = 'GUA')),
('Alfredo Baquerizo Moreno', 'ABMO', true, (SELECT id FROM provincia WHERE codigo = 'GUA')),
('Balao', 'BALAO', true, (SELECT id FROM provincia WHERE codigo = 'GUA')),
('Balzar', 'BALZ', true, (SELECT id FROM provincia WHERE codigo = 'GUA')),
('Colimes', 'COLI', true, (SELECT id FROM provincia WHERE codigo = 'GUA')),
('Daule', 'DAUL', true, (SELECT id FROM provincia WHERE codigo = 'GUA')),
('Durán', 'DURA', true, (SELECT id FROM provincia WHERE codigo = 'GUA')),
('El Triunfo', 'ETRI', true, (SELECT id FROM provincia WHERE codigo = 'GUA')),
('Empalme', 'EMPA', true, (SELECT id FROM provincia WHERE codigo = 'GUA')),
('El Empalme', 'EEMP', true, (SELECT id FROM provincia WHERE codigo = 'GUA')),
('Guayas', 'GUAS', true, (SELECT id FROM provincia WHERE codigo = 'GUA')),
('Milagro', 'MILA', true, (SELECT id FROM provincia WHERE codigo = 'GUA')),
('Naranjal', 'NARA', true, (SELECT id FROM provincia WHERE codigo = 'GUA')),
('Naranjito', 'NARJ', true, (SELECT id FROM provincia WHERE codigo = 'GUA')),
('Nobol', 'NOBO', true, (SELECT id FROM provincia WHERE codigo = 'GUA')),
('Palestina', 'PALE', true, (SELECT id FROM provincia WHERE codigo = 'GUA')),
('Pedro Carbo', 'PCAR', true, (SELECT id FROM provincia WHERE codigo = 'GUA')),
('Playas', 'PLAY', true, (SELECT id FROM provincia WHERE codigo = 'GUA')),
('Salitre', 'SALI', true, (SELECT id FROM provincia WHERE codigo = 'GUA')),
('Samborondón', 'SAMB', true, (SELECT id FROM provincia WHERE codigo = 'GUA')),
('Santa Lucía', 'SLUC', true, (SELECT id FROM provincia WHERE codigo = 'GUA')),
('Simón Bolívar', 'SBOL', true, (SELECT id FROM provincia WHERE codigo = 'GUA')),
('Yaguachi', 'YAGU', true, (SELECT id FROM provincia WHERE codigo = 'GUA')),
('General Antonio Elizalde', 'GAEL', true, (SELECT id FROM provincia WHERE codigo = 'GUA')),
('Isidro Ayora', 'IAYO', true, (SELECT id FROM provincia WHERE codigo = 'GUA')),
('Lomas de Sargentillo', 'LSAR', true, (SELECT id FROM provincia WHERE codigo = 'GUA')),
('Marcelo Maridueña', 'MMAR', true, (SELECT id FROM provincia WHERE codigo = 'GUA'))
ON CONFLICT DO NOTHING;

-- IMBABURA
INSERT INTO canton (nombre, codigo, estado, provincia_id) VALUES
('Ibarra', 'IBAR', true, (SELECT id FROM provincia WHERE codigo = 'IMB')),
('Antonio Ante', 'AANT', true, (SELECT id FROM provincia WHERE codigo = 'IMB')),
('Cotacachi', 'COTA', true, (SELECT id FROM provincia WHERE codigo = 'IMB')),
('Otavalo', 'OTAV', true, (SELECT id FROM provincia WHERE codigo = 'IMB')),
('Pimampiro', 'PIMA', true, (SELECT id FROM provincia WHERE codigo = 'IMB')),
('San Miguel de Urcuquí', 'SMUR', true, (SELECT id FROM provincia WHERE codigo = 'IMB'))
ON CONFLICT DO NOTHING;

-- LOJA
INSERT INTO canton (nombre, codigo, estado, provincia_id) VALUES
('Loja', 'LOJA', true, (SELECT id FROM provincia WHERE codigo = 'LOJ')),
('Calvas', 'CALV', true, (SELECT id FROM provincia WHERE codigo = 'LOJ')),
('Catamayo', 'CATA', true, (SELECT id FROM provincia WHERE codigo = 'LOJ')),
('Celica', 'CELI', true, (SELECT id FROM provincia WHERE codigo = 'LOJ')),
('Chaguarpamba', 'CHAG', true, (SELECT id FROM provincia WHERE codigo = 'LOJ')),
('Espíndola', 'ESPI', true, (SELECT id FROM provincia WHERE codigo = 'LOJ')),
('Gonzanamá', 'GONZ', true, (SELECT id FROM provincia WHERE codigo = 'LOJ')),
('Macará', 'MACA', true, (SELECT id FROM provincia WHERE codigo = 'LOJ')),
('Paltas', 'PALT', true, (SELECT id FROM provincia WHERE codigo = 'LOJ')),
('Puyango', 'PUYA', true, (SELECT id FROM provincia WHERE codigo = 'LOJ')),
('Saraguro', 'SARA', true, (SELECT id FROM provincia WHERE codigo = 'LOJ')),
('Sozoranga', 'SOZO', true, (SELECT id FROM provincia WHERE codigo = 'LOJ')),
('Zapotillo', 'ZAPO', true, (SELECT id FROM provincia WHERE codigo = 'LOJ')),
('Pindal', 'PIND', true, (SELECT id FROM provincia WHERE codigo = 'LOJ')),
('Quilanga', 'QUIL', true, (SELECT id FROM provincia WHERE codigo = 'LOJ')),
('Olmedo', 'OLME', true, (SELECT id FROM provincia WHERE codigo = 'LOJ'))
ON CONFLICT DO NOTHING;

-- LOS RÍOS
INSERT INTO canton (nombre, codigo, estado, provincia_id) VALUES
('Babahoyo', 'BABA', true, (SELECT id FROM provincia WHERE codigo = 'LRI')),
('Baba', 'BAB', true, (SELECT id FROM provincia WHERE codigo = 'LRI')),
('Montalvo', 'MONT', true, (SELECT id FROM provincia WHERE codigo = 'LRI')),
('Puebloviejo', 'PUEB', true, (SELECT id FROM provincia WHERE codigo = 'LRI')),
('Quevedo', 'QUEV', true, (SELECT id FROM provincia WHERE codigo = 'LRI')),
('Urdaneta', 'URDA', true, (SELECT id FROM provincia WHERE codigo = 'LRI')),
('Ventanas', 'VENT', true, (SELECT id FROM provincia WHERE codigo = 'LRI')),
('Vínces', 'VINC', true, (SELECT id FROM provincia WHERE codigo = 'LRI')),
('Palenque', 'PALE', true, (SELECT id FROM provincia WHERE codigo = 'LRI')),
('Buena Fe', 'BFEE', true, (SELECT id FROM provincia WHERE codigo = 'LRI')),
('Valencia', 'VALE', true, (SELECT id FROM provincia WHERE codigo = 'LRI')),
('Mocache', 'MOCA', true, (SELECT id FROM provincia WHERE codigo = 'LRI')),
('Quinsaloma', 'QUIN', true, (SELECT id FROM provincia WHERE codigo = 'LRI'))
ON CONFLICT DO NOTHING;

-- MANABÍ
INSERT INTO canton (nombre, codigo, estado, provincia_id) VALUES
('Portoviejo', 'PORTO', true, (SELECT id FROM provincia WHERE codigo = 'MAN')),
('Bolívar', 'BOLI', true, (SELECT id FROM provincia WHERE codigo = 'MAN')),
('Chone', 'CHON', true, (SELECT id FROM provincia WHERE codigo = 'MAN')),
('El Carmen', 'ECAR', true, (SELECT id FROM provincia WHERE codigo = 'MAN')),
('Flavio Alfaro', 'FALF', true, (SELECT id FROM provincia WHERE codigo = 'MAN')),
('Jipijapa', 'JIPI', true, (SELECT id FROM provincia WHERE codigo = 'MAN')),
('Junín', 'JUNI', true, (SELECT id FROM provincia WHERE codigo = 'MAN')),
('Manta', 'MANT', true, (SELECT id FROM provincia WHERE codigo = 'MAN')),
('Montecristi', 'MONC', true, (SELECT id FROM provincia WHERE codigo = 'MAN')),
('Paján', 'PAJA', true, (SELECT id FROM provincia WHERE codigo = 'MAN')),
('Pichincha', 'PICH', true, (SELECT id FROM provincia WHERE codigo = 'MAN')),
('Rocafuerte', 'ROCA', true, (SELECT id FROM provincia WHERE codigo = 'MAN')),
('Santa Ana', 'SANA', true, (SELECT id FROM provincia WHERE codigo = 'MAN')),
('Sucre', 'SUCR', true, (SELECT id FROM provincia WHERE codigo = 'MAN')),
('Tosagua', 'TOSA', true, (SELECT id FROM provincia WHERE codigo = 'MAN')),
('24 de Mayo', '24MA', true, (SELECT id FROM provincia WHERE codigo = 'MAN')),
('Pedernales', 'PEDE', true, (SELECT id FROM provincia WHERE codigo = 'MAN')),
('Olmedo', 'OLME', true, (SELECT id FROM provincia WHERE codigo = 'MAN')),
('Puerto López', 'PLOP', true, (SELECT id FROM provincia WHERE codigo = 'MAN')),
('Jama', 'JAMA', true, (SELECT id FROM provincia WHERE codigo = 'MAN')),
('Jaramijó', 'JARJ', true, (SELECT id FROM provincia WHERE codigo = 'MAN')),
('San Vicente', 'SVIC', true, (SELECT id FROM provincia WHERE codigo = 'MAN'))
ON CONFLICT DO NOTHING;

-- MORONA SANTIAGO
INSERT INTO canton (nombre, codigo, estado, provincia_id) VALUES
('Macas', 'MACA', true, (SELECT id FROM provincia WHERE codigo = 'MSA')),
('Gualaquiza', 'GUAL', true, (SELECT id FROM provincia WHERE codigo = 'MSA')),
('Limon Indanza', 'LIND', true, (SELECT id FROM provincia WHERE codigo = 'MSA')),
('Palora', 'PALO', true, (SELECT id FROM provincia WHERE codigo = 'MSA')),
('Santiago', 'SANT', true, (SELECT id FROM provincia WHERE codigo = 'MSA')),
('Sucúa', 'SUCU', true, (SELECT id FROM provincia WHERE codigo = 'MSA')),
('Huamboya', 'HUAM', true, (SELECT id FROM provincia WHERE codigo = 'MSA')),
('San Juan Bosco', 'SJBO', true, (SELECT id FROM provincia WHERE codigo = 'MSA')),
('Taisha', 'TAIS', true, (SELECT id FROM provincia WHERE codigo = 'MSA')),
('Logroño', 'LOGR', true, (SELECT id FROM provincia WHERE codigo = 'MSA')),
('Pablo Sexto', 'PSEX', true, (SELECT id FROM provincia WHERE codigo = 'MSA')),
('Tiwintza', 'TIWI', true, (SELECT id FROM provincia WHERE codigo = 'MSA'))
ON CONFLICT DO NOTHING;

-- NAPO
INSERT INTO canton (nombre, codigo, estado, provincia_id) VALUES
('Tena', 'TENA', true, (SELECT id FROM provincia WHERE codigo = 'NAP')),
('Archidona', 'ARCH', true, (SELECT id FROM provincia WHERE codigo = 'NAP')),
('El Chaco', 'ECHA', true, (SELECT id FROM provincia WHERE codigo = 'NAP')),
('Quijos', 'QUIJ', true, (SELECT id FROM provincia WHERE codigo = 'NAP')),
('Carlos Julio Arosemena Tola', 'CJAT', true, (SELECT id FROM provincia WHERE codigo = 'NAP'))
ON CONFLICT DO NOTHING;

-- ORELLANA
INSERT INTO canton (nombre, codigo, estado, provincia_id) VALUES
('Francisco de Orellana', 'FORE', true, (SELECT id FROM provincia WHERE codigo = 'ORE')),
('Aguarico', 'AGUA', true, (SELECT id FROM provincia WHERE codigo = 'ORE')),
('La Joya de los Sachas', 'LJSA', true, (SELECT id FROM provincia WHERE codigo = 'ORE')),
('Loreto', 'LORE', true, (SELECT id FROM provincia WHERE codigo = 'ORE'))
ON CONFLICT DO NOTHING;

-- PASTAZA
INSERT INTO canton (nombre, codigo, estado, provincia_id) VALUES
('Pastaza', 'PAST', true, (SELECT id FROM provincia WHERE codigo = 'PAS')),
('Mera', 'MERA', true, (SELECT id FROM provincia WHERE codigo = 'PAS')),
('Santa Clara', 'SCLA', true, (SELECT id FROM provincia WHERE codigo = 'PAS')),
('Arajuno', 'ARAJ', true, (SELECT id FROM provincia WHERE codigo = 'PAS'))
ON CONFLICT DO NOTHING;

-- PICHINCHA
INSERT INTO canton (nombre, codigo, estado, provincia_id) VALUES
('Quito', 'QUIT', true, (SELECT id FROM provincia WHERE codigo = 'PIC')),
('Cayambe', 'CAYA', true, (SELECT id FROM provincia WHERE codigo = 'PIC')),
('Mejía', 'MEJI', true, (SELECT id FROM provincia WHERE codigo = 'PIC')),
('Pedro Moncayo', 'PMON', true, (SELECT id FROM provincia WHERE codigo = 'PIC')),
('Rumiñahui', 'RUMI', true, (SELECT id FROM provincia WHERE codigo = 'PIC')),
('San Miguel de los Bancos', 'SMB', true, (SELECT id FROM provincia WHERE codigo = 'PIC')),
('Pedro Vicente Maldonado', 'PVMA', true, (SELECT id FROM provincia WHERE codigo = 'PIC')),
('Puerto Quito', 'PQUI', true, (SELECT id FROM provincia WHERE codigo = 'PIC'))
ON CONFLICT DO NOTHING;

-- SANTA ELENA
INSERT INTO canton (nombre, codigo, estado, provincia_id) VALUES
('Santa Elena', 'SEL', true, (SELECT id FROM provincia WHERE codigo = 'SEL')),
('La Libertad', 'LLIB', true, (SELECT id FROM provincia WHERE codigo = 'SEL')),
('Salinas', 'SALI', true, (SELECT id FROM provincia WHERE codigo = 'SEL'))
ON CONFLICT DO NOTHING;

-- SANTO DOMINGO DE LOS TSÁCHILAS
INSERT INTO canton (nombre, codigo, estado, provincia_id) VALUES
('Santo Domingo', 'SDOM', true, (SELECT id FROM provincia WHERE codigo = 'SDT')),
('La Concordia', 'LCON', true, (SELECT id FROM provincia WHERE codigo = 'SDT'))
ON CONFLICT DO NOTHING;

-- SUCUMBÍOS
INSERT INTO canton (nombre, codigo, estado, provincia_id) VALUES
('Nueva Loja', 'NLOJ', true, (SELECT id FROM provincia WHERE codigo = 'SUC')),
('Cascales', 'CASC', true, (SELECT id FROM provincia WHERE codigo = 'SUC')),
('Cuyabeno', 'CUYA', true, (SELECT id FROM provincia WHERE codigo = 'SUC')),
('Gonzalo Pizarro', 'GPIZ', true, (SELECT id FROM provincia WHERE codigo = 'SUC')),
('Lago Agrio', 'LAGO', true, (SELECT id FROM provincia WHERE codigo = 'SUC')),
('Putumayo', 'PUTU', true, (SELECT id FROM provincia WHERE codigo = 'SUC')),
('Shushufindi', 'SHUS', true, (SELECT id FROM provincia WHERE codigo = 'SUC')),
('Sucumbíos', 'SUCU', true, (SELECT id FROM provincia WHERE codigo = 'SUC'))
ON CONFLICT DO NOTHING;

-- TUNGURAHUA
INSERT INTO canton (nombre, codigo, estado, provincia_id) VALUES
('Ambato', 'AMBA', true, (SELECT id FROM provincia WHERE codigo = 'TUN')),
('Baños de Agua Santa', 'BANO', true, (SELECT id FROM provincia WHERE codigo = 'TUN')),
('Cevallos', 'CEVA', true, (SELECT id FROM provincia WHERE codigo = 'TUN')),
('Mocha', 'MOCH', true, (SELECT id FROM provincia WHERE codigo = 'TUN')),
('Patate', 'PATA', true, (SELECT id FROM provincia WHERE codigo = 'TUN')),
('Quero', 'QUER', true, (SELECT id FROM provincia WHERE codigo = 'TUN')),
('San Pedro de Pelileo', 'SPPE', true, (SELECT id FROM provincia WHERE codigo = 'TUN')),
('Santiago de Píllaro', 'SDPI', true, (SELECT id FROM provincia WHERE codigo = 'TUN')),
('Tisaleo', 'TISA', true, (SELECT id FROM provincia WHERE codigo = 'TUN')),
('Pelileo', 'PELI', true, (SELECT id FROM provincia WHERE codigo = 'TUN'))
ON CONFLICT DO NOTHING;

-- ZAMORA CHINCHIPE
INSERT INTO canton (nombre, codigo, estado, provincia_id) VALUES
('Zamora', 'ZAMO', true, (SELECT id FROM provincia WHERE codigo = 'ZCH')),
('Chinchipe', 'CHIN', true, (SELECT id FROM provincia WHERE codigo = 'ZCH')),
('Nangaritza', 'NANG', true, (SELECT id FROM provincia WHERE codigo = 'ZCH')),
('Yacuambi', 'YACU', true, (SELECT id FROM provincia WHERE codigo = 'ZCH')),
('Yantzaza', 'YANT', true, (SELECT id FROM provincia WHERE codigo = 'ZCH')),
('El Pangui', 'EPAN', true, (SELECT id FROM provincia WHERE codigo = 'ZCH')),
('Centinela del Cóndor', 'CCON', true, (SELECT id FROM provincia WHERE codigo = 'ZCH')),
('Palanda', 'PALA', true, (SELECT id FROM provincia WHERE codigo = 'ZCH'))
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. INSERCIÓN DE USUARIOS (solo si no existen)
-- =====================================================

-- Usuario administrador (password: admin123)
INSERT INTO usuario (username, email, password_hash, nombres, apellidos, telefono_principal, direccion, estado) VALUES
('admin', 'admin@armasimportacion.com', 'admin123', 'ADMINISTRADOR', 'SISTEMA', '0999999999', 'QUITO, ECUADOR', 'ACTIVO')
ON CONFLICT (username) DO NOTHING;

-- Usuarios de prueba (password: admin123)
INSERT INTO usuario (username, email, password_hash, nombres, apellidos, telefono_principal, direccion, estado) VALUES
('vendedor', 'vendedor@test.com', 'admin123', 'Juan', 'Vendedor', '0987654321', 'Guayaquil, Ecuador', 'ACTIVO'),
('jefe', 'jefe@test.com', 'admin123', 'María', 'Jefe Ventas', '0987654322', 'Quito, Ecuador', 'ACTIVO'),
('finanzas', 'finanzas@test.com', 'admin123', 'Carlos', 'Finanzas', '0987654323', 'Cuenca, Ecuador', 'ACTIVO'),
('operaciones', 'operaciones@test.com', 'admin123', 'Ana', 'Operaciones', '0987654324', 'Manta, Ecuador', 'ACTIVO')
ON CONFLICT (username) DO NOTHING;

-- Asignar roles a usuarios
INSERT INTO usuario_rol (usuario_id, rol_id, activo) VALUES
((SELECT id FROM usuario WHERE username = 'admin'), (SELECT id FROM rol WHERE codigo = 'ADMIN'), true),
((SELECT id FROM usuario WHERE username = 'vendedor'), (SELECT id FROM rol WHERE codigo = 'VENDOR'), true),
((SELECT id FROM usuario WHERE username = 'jefe'), (SELECT id FROM rol WHERE codigo = 'SALES_CHIEF'), true),
((SELECT id FROM usuario WHERE username = 'finanzas'), (SELECT id FROM rol WHERE codigo = 'FINANCE'), true),
((SELECT id FROM usuario WHERE username = 'operaciones'), (SELECT id FROM rol WHERE codigo = 'OPERATIONS'), true)
ON CONFLICT (usuario_id, rol_id) DO NOTHING;

-- =====================================================
-- 6. VERIFICACIÓN FINAL
-- =====================================================

-- Mostrar resumen de lo creado
SELECT '=== RESUMEN DE INSTALACIÓN ===' as info;
SELECT 'Usuarios creados:' as info, COUNT(*) as total FROM usuario;
SELECT 'Roles creados:' as info, COUNT(*) as total FROM rol;
SELECT 'Tipos de cliente:' as info, COUNT(*) as total FROM tipo_cliente;
SELECT 'Tipos de proceso:' as info, COUNT(*) as total FROM tipo_proceso;
SELECT 'Categorías de armas:' as info, COUNT(*) as total FROM categoria_arma;
SELECT 'Armas:' as info, COUNT(*) as total FROM arma;
SELECT 'Licencias:' as info, COUNT(*) as total FROM licencia;
SELECT 'Provincias:' as info, COUNT(*) as total FROM provincia;
SELECT 'Cantones:' as info, COUNT(*) as total FROM canton;

-- Mostrar credenciales de acceso
SELECT '=== CREDENCIALES DE ACCESO ===' as info;
SELECT 'Admin:' as usuario, 'admin@armasimportacion.com / admin123' as credenciales;
SELECT 'Vendedor:' as usuario, 'vendedor@test.com / admin123' as credenciales;
SELECT 'Jefe Ventas:' as usuario, 'jefe@test.com / admin123' as credenciales;
SELECT 'Finanzas:' as usuario, 'finanzas@test.com / admin123' as credenciales;
SELECT 'Operaciones:' as usuario, 'operaciones@test.com / admin123' as credenciales;

SELECT '=== INSTALACIÓN COMPLETADA ===' as info;
SELECT 'La base de datos está lista para usar con el frontend.' as mensaje;

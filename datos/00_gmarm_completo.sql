-- =====================================================
-- GMARM - SCRIPT MAESTRO COMPLETO
-- =====================================================
-- Este script contiene TODO: esquema, datos y configuraciones
-- Es IDEMPOTENTE: se puede ejecutar múltiples veces sin errores
-- Reemplaza todos los scripts individuales anteriores
-- =====================================================

-- Configurar codificación UTF-8 para caracteres especiales
SET client_encoding = 'UTF8';

-- Corregir caracteres especiales que pueden corromperse durante la inserción
-- (Esto asegura que los caracteres se muestren correctamente)

-- =====================================================
-- 0. LIMPIEZA DE TABLAS OBSOLETAS (si existen)
-- =====================================================
-- Eliminar tablas que ya no se usan (de migraciones anteriores)

DROP TABLE IF EXISTS tipo_cliente_tipo_importacion CASCADE;
DROP TABLE IF EXISTS tipo_cliente_importacion CASCADE;

-- =====================================================
-- 1. CREACión DE TABLAS (si no existen)
-- =====================================================

-- Tabla de roles
CREATE TABLE IF NOT EXISTS rol (
    id BIGSERIAL PRIMARY KEY,
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
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono_principal VARCHAR(20),
    telefono_secundario VARCHAR(20),
    direccion TEXT,
    foto VARCHAR(255),
    estado BOOLEAN DEFAULT true, -- true = ACTIVO, false = INACTIVO
    bloqueado BOOLEAN DEFAULT false,
    intentos_login INTEGER DEFAULT 0,
    ultimo_intento TIMESTAMP,
    ultimo_login TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de relación usuario-rol
CREATE TABLE IF NOT EXISTS usuario_rol (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    rol_id BIGINT NOT NULL REFERENCES rol(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true,
    UNIQUE(usuario_id, rol_id)
);

-- Tabla de tipos de cliente
CREATE TABLE IF NOT EXISTS tipo_cliente (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    descripcion TEXT,
    estado BOOLEAN DEFAULT true,
    es_militar BOOLEAN DEFAULT false,
    es_policia BOOLEAN DEFAULT false,
    es_empresa BOOLEAN DEFAULT false,
    es_deportista BOOLEAN DEFAULT false,
    es_civil BOOLEAN DEFAULT false,
    requiere_issfa BOOLEAN DEFAULT false,
    tipo_proceso_id BIGINT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de tipos de identificación
CREATE TABLE IF NOT EXISTS tipo_identificacion (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    descripcion TEXT,
    estado BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de tipos de proceso
CREATE TABLE IF NOT EXISTS tipo_proceso (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    descripcion TEXT,
    estado BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agregar constraint de foreign key después de crear tipo_proceso (si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_tipo_cliente_tipo_proceso'
    ) THEN
        ALTER TABLE tipo_cliente ADD CONSTRAINT fk_tipo_cliente_tipo_proceso 
            FOREIGN KEY (tipo_proceso_id) REFERENCES tipo_proceso(id);
    END IF;
END $$;

-- Tabla de tipos de importación
CREATE TABLE IF NOT EXISTS tipo_importacion (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(50),
    nombre VARCHAR(100) NOT NULL,
    cupo_maximo INTEGER NOT NULL,
    descripcion TEXT,
    estado BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de relación tipo_cliente-importacion
-- NOTA: Esta tabla es necesaria para la relación @ManyToMany en TipoCliente.java
CREATE TABLE IF NOT EXISTS tipo_cliente_importacion (
    id BIGSERIAL PRIMARY KEY,
    tipo_cliente_id BIGINT NOT NULL REFERENCES tipo_cliente(id),
    tipo_importacion_id BIGINT NOT NULL REFERENCES tipo_importacion(id),
    UNIQUE(tipo_cliente_id, tipo_importacion_id)
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS cliente (
    id BIGSERIAL PRIMARY KEY,
    numero_identificacion VARCHAR(50) NOT NULL UNIQUE,
    tipo_identificacion_id BIGINT NOT NULL REFERENCES tipo_identificacion(id),
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    telefono_principal VARCHAR(20),
    telefono_secundario VARCHAR(20),
    direccion TEXT,
    fecha_nacimiento DATE,
    estado VARCHAR(50) DEFAULT 'PENDIENTE',
    aprobado BOOLEAN DEFAULT false,
    fecha_aprobacion TIMESTAMP,
    usuario_aprobador_id BIGINT REFERENCES usuario(id),
    tipo_cliente_id BIGINT NOT NULL REFERENCES tipo_cliente(id),
    usuario_creador_id BIGINT NOT NULL REFERENCES usuario(id),
    usuario_actualizador_id BIGINT REFERENCES usuario(id),
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
    estado_militar VARCHAR(20) DEFAULT NULL,
    codigo_issfa VARCHAR(50) DEFAULT NULL, -- Para militares
    codigo_isspol VARCHAR(50) DEFAULT NULL, -- Para policías
    rango VARCHAR(100) DEFAULT NULL, -- Rango militar/policial (opcional)
    -- verificación de correo electrónico
    email_verificado BOOLEAN DEFAULT NULL
);

COMMENT ON COLUMN cliente.email_verificado IS 
    'Indica si el correo electrónico del cliente ha sido verificado mediante el enlace enviado por email';

-- Tabla de preguntas del sistema
CREATE TABLE IF NOT EXISTS preguntas (
    id BIGSERIAL PRIMARY KEY,
    tipo_proceso_id BIGINT NOT NULL REFERENCES tipo_proceso(id),
    pregunta TEXT NOT NULL,
    obligatoria BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    estado BOOLEAN DEFAULT true,
    tipo_respuesta VARCHAR(20) DEFAULT 'TEXTO',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de respuestas de clientes
CREATE TABLE IF NOT EXISTS respuestas_cliente (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
    pregunta_id BIGINT NOT NULL REFERENCES preguntas(id),
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
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    obligatorio BOOLEAN DEFAULT false,
    tipo_proceso_id BIGINT REFERENCES tipo_proceso(id), -- NULL si es para grupos de importación
    estado BOOLEAN DEFAULT true,
    url_documento VARCHAR(500),
    grupos_importacion BOOLEAN DEFAULT false NOT NULL, -- true si es para grupos, false si es para clientes
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON COLUMN tipo_documento.grupos_importacion IS 
    'true si es para grupos de importación (tipo_proceso_id debe ser NULL), false si es para clientes (puede tener tipo_proceso_id o NULL para todos)';
COMMENT ON COLUMN tipo_documento.tipo_proceso_id IS 
    'Tipo de proceso (requerido solo si grupos_importacion = false, debe ser NULL si grupos_importacion = true)';

-- Tabla de documentos de clientes
CREATE TABLE IF NOT EXISTS documento_cliente (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
    tipo_documento_id BIGINT NOT NULL REFERENCES tipo_documento(id),
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo VARCHAR(500) NOT NULL,
    tamanio_archivo BIGINT,
    descripcion TEXT,
    url_archivo VARCHAR(500),
    fecha_carga TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    usuario_carga_id BIGINT NOT NULL REFERENCES usuario(id),
    usuario_revision_id BIGINT REFERENCES usuario(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_revision TIMESTAMP,
    tipo_archivo VARCHAR(100),
    observaciones TEXT
);

-- Tabla de categorías de armas (estructura simplificada)
CREATE TABLE IF NOT EXISTS categoria_arma (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    estado BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de armas (estructura simplificada, sin referencias circulares)
CREATE TABLE IF NOT EXISTS arma (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    modelo VARCHAR(100) NOT NULL, -- Cambiado de nombre a modelo
    marca VARCHAR(100), -- Nuevo campo
    alimentadora VARCHAR(50), -- Nuevo campo
    color VARCHAR(100),
    calibre VARCHAR(20),
    capacidad BIGINT,
    precio_referencia DECIMAL(10,2),
    categoria_id BIGINT NOT NULL REFERENCES categoria_arma(id),
    url_imagen VARCHAR(500),
    url_producto VARCHAR(500),
    estado BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de imágenes de armas (múltiples imágenes por arma)
CREATE TABLE IF NOT EXISTS arma_imagen (
    id BIGSERIAL PRIMARY KEY,
    arma_id BIGINT NOT NULL REFERENCES arma(id) ON DELETE CASCADE,
    url_imagen VARCHAR(500) NOT NULL,
    orden INTEGER DEFAULT 1,
    es_principal BOOLEAN DEFAULT false,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- índice para mejorar consultas de imágenes por arma
CREATE INDEX IF NOT EXISTS idx_arma_imagen_arma_id ON arma_imagen(arma_id);
CREATE INDEX IF NOT EXISTS idx_arma_imagen_orden ON arma_imagen(arma_id, orden);

-- Tabla de stock de armas (inventario simple y escalable)
CREATE TABLE IF NOT EXISTS arma_stock (
    id BIGSERIAL PRIMARY KEY,
    arma_id BIGINT NOT NULL REFERENCES arma(id) ON DELETE CASCADE,
    modelo VARCHAR(100), -- Sincronizado con arma.modelo para facilitar consultas
    marca VARCHAR(100), -- Sincronizado con arma.marca para facilitar consultas
    alimentadora VARCHAR(50), -- Sincronizado con arma.alimentadora para facilitar consultas
    cantidad_total INTEGER NOT NULL DEFAULT 0,
    cantidad_disponible INTEGER NOT NULL DEFAULT 0,
    precio_venta DECIMAL(10,2) NOT NULL,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint para evitar duplicados
    CONSTRAINT uk_arma_stock_arma_id UNIQUE (arma_id),
    CONSTRAINT chk_arma_stock_cantidad_total CHECK (cantidad_total >= 0),
    CONSTRAINT chk_arma_stock_cantidad_disponible CHECK (cantidad_disponible >= 0),
    CONSTRAINT chk_arma_stock_precio_venta CHECK (precio_venta > 0)
);

-- Tabla de Números de serie de armas
-- Esta tabla almacena todos los Números de serie únicos de armas f?sicas
-- Se carga desde Excel y se asigna a clientes a trav?s de cliente_arma
-- NOTA: La foreign key a cliente_arma se agrega despu�s de crear esa tabla
CREATE TABLE IF NOT EXISTS arma_serie (
    id BIGSERIAL PRIMARY KEY,
    numero_serie VARCHAR(100) UNIQUE NOT NULL,  -- número de serie ?nico del arma f?sica
    arma_id BIGINT NOT NULL REFERENCES arma(id) ON DELETE CASCADE,  -- Arma del CatÃ¡logo
    estado VARCHAR(20) DEFAULT 'DISPONIBLE',  -- DISPONIBLE, ASIGNADO, VENDIDO, BAJA
    fecha_carga TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Cu?ndo se carg? desde Excel
    fecha_asignacion TIMESTAMP,  -- Cu?ndo se asign? a un cliente
    cliente_arma_id BIGINT,  -- relación con la reserva del cliente (FK se agrega despu�s)
    usuario_asignador_id BIGINT REFERENCES usuario(id),  -- Usuario que asign? la serie
    lote VARCHAR(50),  -- Lote o grupo de importación (opcional, deprecated - usar grupo_importacion_id)
    grupo_importacion_id BIGINT,  -- Grupo de importación al que pertenece esta serie (FK se agrega despu�s)
    licencia_id BIGINT,  -- Licencia asociada al grupo de importación (FK se agrega despu�s)
    observaciones TEXT,  -- Observaciones adicionales
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_arma_serie_estado CHECK (estado IN ('DISPONIBLE', 'ASIGNADO', 'VENDIDO', 'BAJA'))
);

-- índices para optimizar búsquedas (sin cliente_arma_id por ahora)
CREATE INDEX IF NOT EXISTS idx_arma_serie_arma_id ON arma_serie(arma_id);
CREATE INDEX IF NOT EXISTS idx_arma_serie_estado ON arma_serie(estado);

-- Tabla de armas f?sicas (referencia a arma simplificada)
CREATE TABLE IF NOT EXISTS arma_fisica (
    id BIGSERIAL PRIMARY KEY,
    numero_serie VARCHAR(100) UNIQUE NOT NULL,
    arma_id BIGINT NOT NULL REFERENCES arma(id),
    estado VARCHAR(20) DEFAULT 'DISPONIBLE',
    fecha_asignacion TIMESTAMP,
    cliente_id BIGINT REFERENCES cliente(id),
    grupo_importacion_id BIGINT,
    usuario_asignador_id BIGINT REFERENCES usuario(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de accesorios
CREATE TABLE IF NOT EXISTS accesorio (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(50),
    precio_referencia DECIMAL(10,2),
    estado BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de accesorios f?sicos
CREATE TABLE IF NOT EXISTS accesorio_fisico (
    id BIGSERIAL PRIMARY KEY,
    numero_serie VARCHAR(100) UNIQUE NOT NULL,
    accesorio_id BIGINT REFERENCES accesorio(id),
    estado VARCHAR(20) DEFAULT 'DISPONIBLE',
    fecha_asignacion TIMESTAMP,
    cliente_id BIGINT REFERENCES cliente(id),
    grupo_importacion_id BIGINT,
    usuario_asignador_id BIGINT REFERENCES usuario(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- Tabla de relación cliente-arma (cuando un cliente elige)
CREATE TABLE IF NOT EXISTS cliente_arma (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
    arma_id BIGINT NOT NULL REFERENCES arma(id) ON DELETE CASCADE,
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2),
    estado VARCHAR(20) DEFAULT 'RESERVADA',
    numero_serie VARCHAR(100),
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint para estados v?lidos
    CONSTRAINT chk_cliente_arma_estado CHECK (estado IN ('DISPONIBLE', 'RESERVADA', 'ASIGNADA', 'CANCELADA', 'COMPLETADA', 'REASIGNADO'))
);

-- Tabla de relación cliente-accesorio (cuando un cliente elige)
CREATE TABLE IF NOT EXISTS cliente_accesorio (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
    accesorio_id BIGINT NOT NULL REFERENCES accesorio(id) ON DELETE CASCADE,
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2),
    estado VARCHAR(20) DEFAULT 'RESERVADO',
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);





-- Tabla de pagos (RESUMEN DEL PLAN)
CREATE TABLE IF NOT EXISTS pago (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
    subtotal DECIMAL(10,2),  -- Precio sin IVA
    monto_iva DECIMAL(10,2),  -- Monto del IVA
    monto_total DECIMAL(10,2) NOT NULL,  -- Total con IVA (subtotal + monto_iva)
    tipo_pago VARCHAR(20) NOT NULL,
    numero_cuotas INTEGER DEFAULT 1,
    monto_cuota DECIMAL(10,2),
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    monto_pagado DECIMAL(10,2) DEFAULT 0,
    monto_pendiente DECIMAL(10,2),
    cuota_actual INTEGER DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de cuotas de pago (DETALLE DE CADA CUOTA)
CREATE TABLE IF NOT EXISTS cuota_pago (
    id BIGSERIAL PRIMARY KEY,
    pago_id BIGINT NOT NULL REFERENCES pago(id) ON DELETE CASCADE,
    numero_cuota INTEGER NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    fecha_pago TIMESTAMP,
    referencia_pago VARCHAR(100),
    numero_recibo VARCHAR(100), -- número de recibo (reemplaza "número de Comprobante")
    comprobante_archivo VARCHAR(500), -- Ruta del archivo PDF/foto del comprobante
    observaciones TEXT, -- Observaciones adicionales
    usuario_confirmador_id BIGINT REFERENCES usuario(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tablas de localización (DEBEN estar ANTES de licencia)
CREATE TABLE IF NOT EXISTS provincia (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    estado BOOLEAN DEFAULT true
);

-- Tabla de cantones
CREATE TABLE IF NOT EXISTS canton (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(10) NOT NULL,
    estado BOOLEAN DEFAULT true,
    provincia_id BIGINT NOT NULL REFERENCES provincia(id) ON DELETE CASCADE
);

-- Tabla de licencias
CREATE TABLE IF NOT EXISTS licencia (
    id BIGSERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    titulo VARCHAR(200), -- Nuevo campo
    ruc VARCHAR(20),
    cuenta_bancaria VARCHAR(50),
    nombre_banco VARCHAR(100),
    tipo_cuenta VARCHAR(20),
    cedula_cuenta VARCHAR(20),
    email VARCHAR(100),
    telefono VARCHAR(20),
    provincia_id BIGINT REFERENCES provincia(id), -- Provincia del importador
    canton_id BIGINT REFERENCES canton(id), -- Cantón del importador
    cupo_total BIGINT,
    cupo_disponible BIGINT,
    cupo_civil BIGINT,
    cupo_militar BIGINT,
    cupo_empresa BIGINT,
    cupo_deportista BIGINT,
    descripcion TEXT,
    fecha_emision DATE,
    observaciones TEXT,
    estado BOOLEAN DEFAULT true, -- true = ACTIVA, false = INACTIVA
    estado_ocupacion VARCHAR(20) DEFAULT 'DISPONIBLE', -- DISPONIBLE, BLOQUEADA
    fecha_vencimiento DATE,
    usuario_creador_id BIGINT REFERENCES usuario(id),
    usuario_actualizador_id BIGINT REFERENCES usuario(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NOTA: La tabla tipo_cliente_tipo_importacion fue eliminada (no se usa)
-- Los tipos de cliente ya tienen relación directa con tipo_proceso

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notificacion (
    id BIGSERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(30) NOT NULL DEFAULT 'SISTEMA',
    estado VARCHAR(20) NOT NULL DEFAULT 'NO_LEIDA',
    fecha_lectura TIMESTAMP,
    usuario_destinatario_id BIGINT NOT NULL REFERENCES usuario(id),
    usuario_remitente_id BIGINT REFERENCES usuario(id),
    url_redireccion VARCHAR(500),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de configuraci?n del sistema
CREATE TABLE IF NOT EXISTS configuracion_sistema (
    id BIGSERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    editable BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de grupos de importación
CREATE TABLE IF NOT EXISTS grupo_importacion (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    licencia_id BIGINT NOT NULL REFERENCES licencia(id),
    tipo_proceso_id BIGINT REFERENCES tipo_proceso(id), -- Opcional: los grupos pueden tener cualquier tipo de cliente
    tipo_grupo VARCHAR(20) NOT NULL DEFAULT 'CUPO', -- CUPO o JUSTIFICATIVO
    tra VARCHAR(20) UNIQUE, -- TRA-XXXXXXXXXX (formato: TRA- seguido de Números)
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    cupo_total INTEGER NOT NULL,
    cupo_disponible INTEGER NOT NULL,
    codigo VARCHAR(20) UNIQUE,
    fecha_estimada_llegada DATE,
    costo_total DECIMAL(10,2),
    numero_previa_importacion VARCHAR(100), -- número de previa importación
    observaciones TEXT,
    usuario_actualizador_id BIGINT REFERENCES usuario(id),
    estado VARCHAR(30) DEFAULT 'EN_PREPARACION',
    usuario_creador_id BIGINT NOT NULL REFERENCES usuario(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_tipo_grupo CHECK (tipo_grupo IN ('CUPO', 'JUSTIFICATIVO'))
);

-- Tabla de procesos del grupo de importación (checklist)
CREATE TABLE IF NOT EXISTS grupo_importacion_proceso (
    id BIGSERIAL PRIMARY KEY,
    grupo_importacion_id BIGINT NOT NULL REFERENCES grupo_importacion(id) ON DELETE CASCADE,
    etapa VARCHAR(50) NOT NULL,
    fecha_planificada DATE,
    completado BOOLEAN DEFAULT false,
    fecha_completado TIMESTAMP,
    fecha_ultima_alerta TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(grupo_importacion_id, etapa)
);

COMMENT ON COLUMN grupo_importacion.tipo_proceso_id IS 
    'Tipo de proceso (opcional). Los grupos pueden tener cualquier tipo de cliente';
COMMENT ON COLUMN grupo_importacion.numero_previa_importacion IS 
    'número de previa importación';

-- Tabla de relación cliente-grupo de importación
CREATE TABLE IF NOT EXISTS cliente_grupo_importacion (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
    grupo_importacion_id BIGINT NOT NULL REFERENCES grupo_importacion(id) ON DELETE CASCADE,
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    fecha_asignacion TIMESTAMP,
    usuario_asignador_id BIGINT REFERENCES usuario(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de cupos por tipo de cliente en grupo de importación
CREATE TABLE IF NOT EXISTS grupo_importacion_cupo (
    id BIGSERIAL PRIMARY KEY,
    grupo_importacion_id BIGINT NOT NULL REFERENCES grupo_importacion(id) ON DELETE CASCADE,
    licencia_id BIGINT NOT NULL REFERENCES licencia(id),
    tipo_cliente VARCHAR(20) NOT NULL, -- CIVIL, MILITAR, EMPRESA, DEPORTISTA
    cupo_consumido INTEGER NOT NULL, -- Cuánto consume este grupo (25 civiles, 28 uniformados, etc.)
    cupo_disponible_licencia INTEGER NOT NULL, -- Cuánto queda disponible en la licencia
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de relación grupo de importación - vendedores (muchos a muchos)
CREATE TABLE IF NOT EXISTS grupo_importacion_vendedor (
    id BIGSERIAL PRIMARY KEY,
    grupo_importacion_id BIGINT NOT NULL REFERENCES grupo_importacion(id) ON DELETE CASCADE,
    vendedor_id BIGINT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    limite_armas INTEGER DEFAULT 0, -- Límite de armas por vendedor en este grupo
    activo BOOLEAN DEFAULT true,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(grupo_importacion_id, vendedor_id)
);

-- Tabla de Límites por categor?a para grupos de tipo CUPO
CREATE TABLE IF NOT EXISTS grupo_importacion_limite_categoria (
    id BIGSERIAL PRIMARY KEY,
    grupo_importacion_id BIGINT NOT NULL REFERENCES grupo_importacion(id) ON DELETE CASCADE,
    categoria_arma_id BIGINT NOT NULL REFERENCES categoria_arma(id) ON DELETE CASCADE,
    limite_maximo INTEGER NOT NULL DEFAULT 0, -- Límite máximo de armas de esta categor?a
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(grupo_importacion_id, categoria_arma_id)
);

-- Tabla de documentos del grupo de importación
CREATE TABLE IF NOT EXISTS documento_grupo_importacion (
    id BIGSERIAL PRIMARY KEY,
    grupo_importacion_id BIGINT NOT NULL REFERENCES grupo_importacion(id) ON DELETE CASCADE,
    tipo_documento_id BIGINT REFERENCES tipo_documento(id), -- Referencia al tipo de documento
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo VARCHAR(500) NOT NULL,
    tamanio_bytes BIGINT,
    descripcion TEXT,
    nombre VARCHAR(255),
    url_archivo VARCHAR(500),
    tipo_documento VARCHAR(50), -- Mantener por compatibilidad, pero usar tipo_documento_id
    fecha_carga TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT,
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    usuario_carga_id BIGINT NOT NULL REFERENCES usuario(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_documento_grupo_importacion_tipo_documento
        FOREIGN KEY (tipo_documento_id) REFERENCES tipo_documento(id)
);

-- Tabla de tokens de verificación de correo electrónico
CREATE TABLE IF NOT EXISTS email_verification_token (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(36) NOT NULL UNIQUE,
    cliente_id BIGINT NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_verification_token_token ON email_verification_token(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_token_cliente ON email_verification_token(cliente_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_token_expires ON email_verification_token(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_verification_token_used ON email_verification_token(used);

-- Comentarios descriptivos para tabla de verificación de email
COMMENT ON TABLE email_verification_token IS 
    'Tokens únicos y temporales para verificación de correo electrónico de clientes. Expiran en 48 horas y son de un solo uso.';

COMMENT ON COLUMN email_verification_token.token IS 
    'Token UUID único generado para cada solicitud de verificación';

COMMENT ON COLUMN email_verification_token.cliente_id IS 
    'Referencia al cliente que debe verificar su correo';

COMMENT ON COLUMN email_verification_token.expires_at IS 
    'Fecha y hora de expiración del token (48 horas desde la creación)';

COMMENT ON COLUMN email_verification_token.used IS 
    'Indica si el token ya fue utilizado para verificar el correo';

COMMENT ON COLUMN email_verification_token.used_at IS 
    'Fecha y hora en que el token fue utilizado';

-- Tabla de documentos generados por el sistema
CREATE TABLE IF NOT EXISTS documento_generado (
    id BIGSERIAL PRIMARY KEY,
    tipo_documento VARCHAR(50) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo VARCHAR(500) NOT NULL,
    tamanio_bytes BIGINT,
    descripcion TEXT,
    nombre VARCHAR(255),
    url_archivo VARCHAR(500),
    fecha_generacion TIMESTAMP,
    fecha_firma TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    cliente_id BIGINT REFERENCES cliente(id),
    grupo_importacion_id BIGINT REFERENCES grupo_importacion(id),
    usuario_generador_id BIGINT NOT NULL REFERENCES usuario(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. CREACI?N DE ?NDICES
-- =====================================================

-- índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_usuario_username ON usuario(username);
CREATE INDEX IF NOT EXISTS idx_usuario_email ON usuario(email);
CREATE INDEX IF NOT EXISTS idx_cliente_identificacion ON cliente(numero_identificacion);
CREATE INDEX IF NOT EXISTS idx_cliente_estado ON cliente(estado);
CREATE INDEX IF NOT EXISTS idx_cliente_usuario_creador ON cliente(usuario_creador_id);
CREATE INDEX IF NOT EXISTS idx_respuestas_cliente_cliente ON respuestas_cliente(cliente_id);
CREATE INDEX IF NOT EXISTS idx_documento_cliente_cliente ON documento_cliente(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_arma_cliente ON cliente_arma(cliente_id);
CREATE INDEX IF NOT EXISTS idx_documento_grupo_importacion_grupo ON documento_grupo_importacion(grupo_importacion_id);
CREATE INDEX IF NOT EXISTS idx_documento_grupo_importacion_tipo_documento ON documento_grupo_importacion(tipo_documento_id);

-- índice ?nico para evitar que un cliente est�? en múltiples grupos activos
CREATE UNIQUE INDEX IF NOT EXISTS uk_cliente_grupo_importacion_activo
ON cliente_grupo_importacion (cliente_id)
WHERE estado NOT IN ('COMPLETADO', 'CANCELADO');

COMMENT ON INDEX uk_cliente_grupo_importacion_activo IS 
    'Evita que un cliente est� asignado a m�ltiples grupos activos simult�neamente';
CREATE INDEX IF NOT EXISTS idx_arma_fisica_numero_serie ON arma_fisica(numero_serie);
CREATE INDEX IF NOT EXISTS idx_arma_fisica_estado ON arma_fisica(estado);

-- índices para sistema de pagos
CREATE INDEX IF NOT EXISTS idx_pago_cliente ON pago(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pago_estado ON pago(estado);
CREATE INDEX IF NOT EXISTS idx_pago_tipo ON pago(tipo_pago);
CREATE INDEX IF NOT EXISTS idx_pago_cuota_actual ON pago(cuota_actual);
CREATE INDEX IF NOT EXISTS idx_cuota_pago_pago ON cuota_pago(pago_id);
CREATE INDEX IF NOT EXISTS idx_cuota_pago_estado ON cuota_pago(estado);
CREATE INDEX IF NOT EXISTS idx_cuota_pago_vencimiento ON cuota_pago(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_provincia_codigo ON provincia(codigo);
CREATE INDEX IF NOT EXISTS idx_canton_provincia ON canton(provincia_id);
CREATE INDEX IF NOT EXISTS idx_canton_codigo ON canton(codigo);

-- =====================================================
-- 2. CONSTRAINTS ADICIONALES (despu�s de crear todas las tablas)
-- =====================================================

-- Agregar foreign keys de arma_serie despu�s de crear las tablas relacionadas
DO $$ 
BEGIN
    -- FK a cliente_arma
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_arma_serie_cliente_arma'
    ) THEN
        ALTER TABLE arma_serie ADD CONSTRAINT fk_arma_serie_cliente_arma 
            FOREIGN KEY (cliente_arma_id) REFERENCES cliente_arma(id);
        CREATE INDEX IF NOT EXISTS idx_arma_serie_cliente_arma_id ON arma_serie(cliente_arma_id);
    END IF;
    
    -- FK a grupo_importacion
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_arma_serie_grupo_importacion'
    ) THEN
        ALTER TABLE arma_serie ADD CONSTRAINT fk_arma_serie_grupo_importacion 
            FOREIGN KEY (grupo_importacion_id) REFERENCES grupo_importacion(id);
        CREATE INDEX IF NOT EXISTS idx_arma_serie_grupo_importacion_id ON arma_serie(grupo_importacion_id);
    END IF;
    
    -- FK a licencia
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_arma_serie_licencia'
    ) THEN
        ALTER TABLE arma_serie ADD CONSTRAINT fk_arma_serie_licencia 
            FOREIGN KEY (licencia_id) REFERENCES licencia(id);
        CREATE INDEX IF NOT EXISTS idx_arma_serie_licencia_id ON arma_serie(licencia_id);
    END IF;
END $$;

-- =====================================================
-- 3. inserción DE DATOS BASE (solo si no existen)
-- =====================================================

-- Insertar roles del sistema
INSERT INTO rol (codigo, nombre, descripcion, tipo_rol_vendedor, estado) VALUES
('ADMIN', 'Administrador', 'Acceso completo al sistema', NULL, true),
('VENDOR', 'Vendedor', 'Registro de clientes y selección de armas catálogo', 'LIBRE', true),
('SALES_CHIEF', 'Jefe de Ventas', 'aprobación de solicitudes y creación de grupos de importación', 'FIJO', true),
('FINANCE', 'Finanzas', 'Gestión de pagos y facturación', NULL, true),
('OPERATIONS', 'Operaciones', 'Gestión de importación y documentación', NULL, true)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar tipos de proceso PRIMERO (para las foreign keys)
INSERT INTO tipo_proceso (nombre, codigo, descripcion, estado) VALUES
('Cupo Civil', 'CUPO_CIV', 'Proceso para importación por cupo civil', true),
('Extracupo Uniformado', 'EXC_MIL', 'Proceso para importación por extracupo militar/policial', true),
('Extracupo Empresa', 'EXC_EMP', 'Proceso para importación por extracupo compañía de seguridad', true),
('Cupo Deportista', 'CUPO_DEP', 'Proceso para importación por cupo civil deportista', true)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar tipos de cliente
INSERT INTO tipo_cliente (nombre, codigo, descripcion, estado, es_militar, es_policia, es_empresa, es_deportista, es_civil, requiere_issfa, tipo_proceso_id) VALUES
('Civil', 'CIV', 'Persona natural civil', true, false, false, false, false, true, false, 1),
('Militar Fuerza Terrestre', 'MIL', 'Personal activo de fuerzas armadas terrestre', true, true, false, false, false, false, true, 2),
('Militar Fuerza Naval', 'NAV', 'Personal activo de fuerzas armadas naval', true, true, false, false, false, false, true, 2),
('Militar Fuerza Aérea', 'AER', 'Personal activo de fuerzas armadas aéreas', true, true, false, false, false, false, true, 2),
('Uniformado Policial', 'POL', 'Personal activo de fuerza policial', true, false, true, false, false, false, false, 2),
('compañía de Seguridad', 'EMP', 'compañía de seguridad privada', true, false, false, true, false, false, false, 3),
('Deportista', 'DEP', 'Deportista', true, false, false, false, true, false, false, 4)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar tipos de identificación
INSERT INTO tipo_identificacion (nombre, codigo, descripcion, estado) VALUES
('Cédula de Identidad', 'CED', 'Documento de identificación personal', true),
('RUC', 'RUC', 'Registro único de Contribuyentes', true)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar tipos de importación evitando duplicados
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM tipo_importacion) THEN
        INSERT INTO tipo_importacion (nombre, cupo_maximo, descripcion, estado) VALUES
        ('Cupo Civil', 25, 'importación regular para personas naturales civiles', true),
        ('Extracupo Uniformado', 1000, 'importación especial para personal uniformado militar y policial', true),
        ('Extracupo Compania', 1000, 'importación especial para empresas de seguridad', true),
        ('Cupo Deportista', 1000, 'importación regular para deportistas', true);
    END IF;
END $$;

-- Insertar relación tipos de importacion con tipo de cliente
-- NOTA: La tabla tipo_cliente_importacion fue eliminada
-- Los tipos de cliente ya tienen relación directa con tipo_proceso
-- INSERT INTO tipo_cliente_importacion (tipo_cliente_id, tipo_importacion_id) VALUES
-- (1, 1), (2, 2), (3, 2), (4, 2), (5, 2), (6, 3), (7, 1), (8, 2)
-- ON CONFLICT DO NOTHING;

-- Insertar tipos de documento
-- Insertar documentos evitando duplicados con WHERE NOT EXISTS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM tipo_documento WHERE tipo_proceso_id = 1) THEN
        INSERT INTO tipo_documento (nombre, descripcion, obligatorio, tipo_proceso_id, estado, url_documento, grupos_importacion) VALUES
        -- Documentos para Cupo Civil
        ('Copia de Cédula', 'Copia legible de la Cédula de identidad', true, 1, true, NULL, false),
        -- Documentos universales para Cupo Civil
        ('Antecedentes Penales', 'Certificado de antecedentes penales del Ministerio del Interior', true, 1, true, 'https://certificados.ministeriodelinterior.gob.ec/gestorcertificados/antecedentes/', false),
        ('Consejo de la Judicatura', 'Certificado de no tener juicios o casos de robos/violencia/as esinatos', true, 1, true, 'https://consultas.funcionjudicial.gob.ec/informacionjudicialindividual/pages/index.jsf#!/', false),
        ('Fiscalía', 'Certificado de no tener procesos por robos/violencia/as esinatos', true, 1, true, 'https://www.fiscalia.gob.ec/accesibilidad/consulta-de-noticias-del-delito/', false),
        ('SATJE', 'Certificado de procesos judiciales', true, 1, true, 'https://procesosjudiciales.funcionjudicial.gob.ec/busqueda-filtros', false);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM tipo_documento WHERE tipo_proceso_id = 2) THEN
        INSERT INTO tipo_documento (nombre, descripcion, obligatorio, tipo_proceso_id, estado, url_documento, grupos_importacion) VALUES
        -- Documentos para Extracupo Uniformado
        ('Credencial militar/policial', 'Credencial vigente de institución armada o policial', true, 2, true, NULL, false),
        ('Certificado de servicio activo', 'Certificado de servicio activo vigente', true, 2, true, NULL, false),
        ('Copia de Cédula', 'Copia legible de la Cédula de identidad', true, 2, true, NULL, false),
        -- Documentos universales para Extracupo Uniformado
        ('Antecedentes Penales', 'Certificado de antecedentes penales del Ministerio del Interior', true, 2, true, 'https://certificados.ministeriodelinterior.gob.ec/gestorcertificados/antecedentes/', false),
        ('Consejo de la Judicatura', 'Certificado de no tener juicios o casos de robos/violencia/as esinatos', true, 2, true, 'https://consultas.funcionjudicial.gob.ec/informacionjudicialindividual/pages/index.jsf#!/', false),
        ('Fiscalía', 'Certificado de no tener procesos por robos/violencia/as esinatos', true, 2, true, 'https://www.fiscalia.gob.ec/accesibilidad/consulta-de-noticias-del-delito/', false),
        ('SATJE', 'Certificado de procesos judiciales', true, 2, true, 'https://procesosjudiciales.funcionjudicial.gob.ec/busqueda-filtros', false);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM tipo_documento WHERE tipo_proceso_id = 3) THEN
        INSERT INTO tipo_documento (nombre, descripcion, obligatorio, tipo_proceso_id, estado, url_documento, grupos_importacion) VALUES
        -- Documentos para Extracupo Empresa (solo espec?ficos, no universales)
        ('Cédula del representante legal', 'Cédula del representante legal', true, 3, true, NULL, false),
        ('Nombramiento representante legal', 'Documento que acredita representaci?n legal', true, 3, true, NULL, false),
        ('Permiso de funcionamiento', 'Permiso de funcionamiento vigente', true, 3, true, NULL, false),
        ('RUC de la empresa', 'RUC activo de la empresa', true, 3, true, NULL, false);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM tipo_documento WHERE tipo_proceso_id = 4) THEN
        INSERT INTO tipo_documento (nombre, descripcion, obligatorio, tipo_proceso_id, estado, url_documento, grupos_importacion) VALUES
        -- Documentos para Cupo Deportista
        ('Cédula en PDF y papeleta de votación', 'Cédula de identidad en formato PDF y papeleta de votación', true, 4, true, NULL, false),
        ('Permiso de Deportista otorgado por CCFFAA', 'Permiso de deportista otorgado por las Comandancias Conjuntas de las Fuerzas Armadas (CCFFAA)', true, 4, true, NULL, false),
        ('Documento del Club de Tiro que certifique estar al día en sus cuotas y afiliado al mismo', 'Documento del Club de Tiro que certifique que el deportista est� al día en sus cuotas y afiliado al mismo', true, 4, true, NULL, false),
        -- Documentos universales para Cupo Deportista
        ('SATJE', 'Certificado de procesos judiciales', true, 4, true, 'https://procesosjudiciales.funcionjudicial.gob.ec/busqueda-filtros', false),
        ('Fiscalía', 'Certificado de no tener procesos por robos/violencia/as esinatos', true, 4, true, 'https://www.fiscalia.gob.ec/accesibilidad/consulta-de-noticias-del-delito/', false),
        ('Consejo de la Judicatura', 'Certificado de no tener juicios o casos de robos/violencia/as esinatos', true, 4, true, 'https://consultas.funcionjudicial.gob.ec/informacionjudicialindividual/pages/index.jsf#!/', false),
        ('Antecedentes Penales', 'Certificado de antecedentes penales del Ministerio del Interior', true, 4, true, 'https://certificados.ministeriodelinterior.gob.ec/gestorcertificados/antecedentes/', false);
    END IF;
    
    -- Documentos para grupos de importación (grupos_importacion = true, tipo_proceso_id = NULL)
    IF NOT EXISTS (SELECT 1 FROM tipo_documento WHERE grupos_importacion = true) THEN
        INSERT INTO tipo_documento (nombre, descripcion, obligatorio, estado, grupos_importacion, tipo_proceso_id) VALUES
        ('Proforma a fabrica para importacion', 'Proforma recibida de la fábrica para la importación', true, true, true, NULL),
        ('Solicitar carta inspeccion de rastrillo', 'Carta de inspección de rastrillo', true, true, true, NULL),
        ('Documento de resolucion de importacion', 'Resolución de importación', true, true, true, NULL),
        ('Pedido de previa importacion', 'Pedido de previa importación', true, true, true, NULL),
        ('Retiro de Guia', 'Documento de retiro de guía', true, true, true, NULL),
        ('Liquidacion de importacion', 'Liquidación de importación', true, true, true, NULL),
        ('Documento recibido por comando conjunto', 'Documento recibido por comando conjunto', true, true, true, NULL);
    END IF;
    
    -- Documentos finales para clientes (aplicables a todos los tipos de proceso, tipo_proceso_id = NULL)
    IF NOT EXISTS (SELECT 1 FROM tipo_documento WHERE nombre = 'Resolución para migrar serie al cliente') THEN
        INSERT INTO tipo_documento (nombre, descripcion, obligatorio, estado, grupos_importacion, tipo_proceso_id) VALUES
        ('Resolución para migrar serie al cliente', 
         'Resolución que autoriza la migración del número de serie del arma al cliente. Documento requerido antes de la entrega.', 
         true, 
         true, 
         false,  -- Es para clientes, NO para grupos de importación
         NULL),  -- Aplicable a todos los tipos de proceso
        ('guía de libre tránsito', 
         'guía que permite el libre tránsito del arma desde el punto de llegada hasta el cliente. Documento requerido para la entrega final.', 
         true, 
         true, 
         false,  -- Es para clientes, NO para grupos de importación
         NULL);  -- Aplicable a todos los tipos de proceso
    END IF;
END $$;

-- Insertar categorías de armas
-- NOTA: Se usa singular (PISTOLA, ESCOPETA) para evitar duplicados
INSERT INTO categoria_arma (nombre, descripcion, codigo, estado, fecha_creacion) VALUES
('PISTOLA', 'Armas cortas de puño', 'PIST', true, NOW()),
('ESCOPETA', 'Armas largas para perdigones', 'ESCO', true, NOW()),
('RIFLE', 'Armas largas de precisión', 'RIFL', true, NOW()),
('CARABINAS .22', 'Carabinas calibre .22', 'CAR22', true, NOW()),
('CARABINAS 9MM', 'Carabinas calibre 9MM', 'CAR9MM', true, NOW())
ON CONFLICT (codigo) DO NOTHING;

-- Eliminar categorías duplicadas en plural si existen
DELETE FROM categoria_arma WHERE codigo IN ('PISTOLAS', 'ESCOPETAS');

-- Insertar armas (CatÃ¡logo CZ real - basado en archivos existentes)
INSERT INTO arma (codigo, modelo, marca, alimentadora, calibre, capacidad, precio_referencia, categoria_id, url_imagen, url_producto, estado) VALUES
-- Pistolas CZ P09 (basadas en archivos reales)
('CZ-P09-C-NOCTURNE', 'CZ P09 C NOCTURNE', 'CZ', '2 (DOS)', '9MM', 15, 1200.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-P09-C-NOCTURNE.png', 'https://czfirearms.com/pistols/p09-nocturne', true),
('CZ-P09-F-NOCTURNE', 'CZ P09 F NOCTURNE', 'CZ', '2 (DOS)', '9MM', 15, 1250.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-P09-F-NOCTURNE.png', 'https://czfirearms.com/pistols/p09-nocturne', true),
('CZ-P09-F-FDE', 'CZ P09 F FDE', 'CZ', '2 (DOS)', '9MM', 15, 1250.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/P09-F-FDE.png', 'https://czfirearms.com/pistols/p09-fde', true),
('CZ-P09-C-FDE', 'CZ P09 C FDE', 'CZ', '2 (DOS)', '9MM', 12, 1200.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/P09-C-FDE.webp', 'https://czfirearms.com/pistols/p09-fde', true),
('CZ-P09-F-OD-VERDE', 'CZ P09 F OD Verde', 'CZ', '2 (DOS)', '9MM', 15, 1300.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/P09-F-OD-Verde.webp', 'https://czfirearms.com/pistols/p09-od-verde', true),
('CZ-P09-C-FRANCOTIRADOR-GRIS', 'CZ P09 C Francotirador Gris', 'CZ', '2 (DOS)', '9MM', 12, 1350.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/P09-C-Francotirador-Gris.webp', 'https://czfirearms.com/pistols/p09-francotirador', true),

-- Pistolas CZ P10 (basadas en archivos reales)
('CZ-P10-M', 'CZ P10 M', 'CZ', '2 (DOS)', '9MM', 7, 1100.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-P10-M.webp', 'https://czfirearms.com/pistols/p10-m', true),
('CZ-P10-C', 'CZ P10 C', 'CZ', '2 (DOS)', '9MM', 15, 1200.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-P10-C.png', 'https://czfirearms.com/pistols/p10-c', true),
('CZ-P10-C-OR', 'CZ P10 C OR', 'CZ', '2 (DOS)', '9MM', 15, 1250.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-P10-C-OR.png', 'https://czfirearms.com/pistols/p10-c-or', true),
('CZ-P10-C-FDE-OR', 'CZ P10 C FDE OR', 'CZ', '2 (DOS)', '9MM', 15, 1250.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-P10-C-FDE-OR.png', 'https://czfirearms.com/pistols/p10-c-fde-or', true),
('CZ-P10-F', 'CZ P10 F', 'CZ', '2 (DOS)', '9MM', 19, 1250.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-P10-F.png', 'https://czfirearms.com/pistols/p10-f', true),
('CZ-P10-F-OR', 'CZ P10 F OR', 'CZ', '2 (DOS)', '9MM', 19, 1300.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-P10-F-OR.png', 'https://czfirearms.com/pistols/p10-f-or', true),
('CZ-P10-F-MIRAS-TRITIO', 'CZ P10 F Miras Tritio', 'CZ', '2 (DOS)', '9MM', 19, 1350.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/P10-F-miras-tritio.jpg', 'https://czfirearms.com/pistols/p10-f-miras', true),
('CZ-P10-S', 'CZ P10 S', 'CZ', '2 (DOS)', '9MM', 12, 1100.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-P10-S.png', 'https://czfirearms.com/pistols/p10-s', true),
('CZ-P10-S-OR', 'CZ P10 S OR', 'CZ', '2 (DOS)', '9MM', 12, 1150.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-P-10-S-OR.png', 'https://czfirearms.com/pistols/p10-s-or', true),
('P10-C-OR-PORTADO', 'P10 C OR Portado', 'CZ', '2 (DOS)', '9MM', 15, 1300.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/P10-C-OR-Portado.png', 'https://czfirearms.com/pistols/p10-c-or-portado', true),

-- Pistolas CZ SHADOW 2 (basadas en archivos reales)
('CZ-SHADOW-2', 'CZ SHADOW 2', 'CZ', '2 (DOS)', '9MM', 19, 1500.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-SHADOW-2.png', 'https://czfirearms.com/pistols/shadow-2', true),
('CZ-SHADOW-2-URBAN-GREY', 'CZ SHADOW 2 URBAN GREY', 'CZ', '2 (DOS)', '9MM', 19, 1550.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-SHADOW-2-URBAN-GREY.png', 'https://czfirearms.com/pistols/shadow-2-urban', true),
('CZ-SHADOW-2-COMPACT-OR', 'CZ SHADOW 2 COMPACT OR', 'CZ', '2 (DOS)', '9MM', 16, 1450.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-SHADOW-2-COMPACT-OR.jpg', 'https://czfirearms.com/pistols/shadow-2-compact-or', true),
('CZ-SHADOW-2-ORANGE-OR', 'CZ SHADOW 2 ORANGE OR', 'CZ', '2 (DOS)', '9MM', 19, 1600.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-SHADOW-2-ORANGE-OR.png', 'https://czfirearms.com/pistols/shadow-2-orange-or', true),
('CZ-SHADOW-2-TARGET-5', 'CZ SHADOW 2 TARGET 5', 'CZ', '2 (DOS)', '9MM', 19, 1650.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-SHADOW-2-TARGET-5.png', 'https://czfirearms.com/pistols/shadow-2-target-5', true),
('CZ-SHADOW-2-TARGET-6', 'CZ SHADOW 2 TARGET 6', 'CZ', '2 (DOS)', '9MM', 19, 1700.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-SHADOW-2-TARGET-6.png', 'https://czfirearms.com/pistols/shadow-2-target-6', true),
('CZ-SHADOW-2-SA', 'CZ SHADOW 2 SA', 'CZ', '2 (DOS)', '9MM', 19, 1550.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-SHADOW-2-SA.png', 'https://czfirearms.com/pistols/shadow-2-sa', true),

-- Pistolas CZ 75 (basadas en archivos reales)
('CZ-75-B', 'CZ 75 B', 'CZ', '2 (DOS)', '9MM', 16, 1400.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-75-B.jpg', 'https://czfirearms.com/pistols/75-b', true),
('CZ-75-COMPACT', 'CZ 75 COMPACT', 'CZ', '2 (DOS)', '9MM', 14, 1350.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-75-COMPACT.jpg', 'https://czfirearms.com/pistols/75-compact', true),
('CZ-75-SP-01-SHADOW', 'CZ 75 SP-01 SHADOW', 'CZ', '2 (DOS)', '9MM', 18, 1600.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-75-SP-01-SHADOW.jpg', 'https://czfirearms.com/pistols/75-sp-01-shadow', true),

-- Pistolas CZ TS2 (basadas en archivos reales)
('CZ-TS2', 'CZ TS2', 'CZ', '2 (DOS)', '9MM', 20, 1800.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-TS2.png', 'https://czfirearms.com/pistols/ts2', true),
('CZ-TS2-RACING-GREEN', 'CZ TS2 RACING GREEN', 'CZ', '2 (DOS)', '9MM', 20, 1850.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-TS2-RACING-GREEN.png', 'https://czfirearms.com/pistols/ts2-racing-green', true),
('CZ-TS-2-ORANGE-BULL', 'CZ TS-2 ORANGE BULL', 'CZ', '2 (DOS)', '9MM', 20, 1900.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-TS-2-ORANGE-BULL.png', 'https://czfirearms.com/pistols/ts-2-orange-bull', true),
('CZ-TS-2-BRONZE', 'CZ TS-2 BRONZE', 'CZ', '2 (DOS)', '9MM', 20, 1850.00, (SELECT id FROM categoria_arma WHERE codigo = 'PIST'), '/images/weapons/CZ-TS-2-BRONZE.png', 'https://czfirearms.com/pistols/ts-2-bronze', true)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar preguntas para clientes civiles
-- Insertar preguntas evitando duplicados con WHERE NOT EXISTS
-- Preguntas para civiles (tipo_proceso_id = 1)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM preguntas WHERE tipo_proceso_id = 1) THEN
        INSERT INTO preguntas (tipo_proceso_id, pregunta, obligatoria, orden, estado, tipo_respuesta) VALUES
        (1, '¿Tiene cuenta en el Sicoar?', true, 1, true, 'SI_NO'),
        (1, '¿Ha tenido o tiene armas registradas?', true, 2, true, 'SI_NO');
    END IF;
END $$;

-- Preguntas para militares/policías (tipo_proceso_id = 2)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM preguntas WHERE tipo_proceso_id = 2) THEN
        INSERT INTO preguntas (tipo_proceso_id, pregunta, obligatoria, orden, estado, tipo_respuesta) VALUES
        (2, '¿Tiene cuenta en el Sicoar?', true, 1, true, 'SI_NO'),
        (2, '¿Tiene credencial Ispol o IsFA vigente?', true, 2, true, 'SI_NO'),
        (2, '¿Ya tiene firma electrónica habilitada?', true, 3, true, 'SI_NO'),
        (2, '¿Tiene certificado de servicio activo?', false, 4, true, 'SI_NO'),
        (2, '¿Ha tenido o tiene armas registradas?', true, 5, true, 'SI_NO');
    END IF;
END $$;

-- Preguntas para empresas (tipo_proceso_id = 3)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM preguntas WHERE tipo_proceso_id = 3) THEN
        INSERT INTO preguntas (tipo_proceso_id, pregunta, obligatoria, orden, estado, tipo_respuesta) VALUES
        (3, '¿Tiene nombramiento del representante legal vigente?', true, 1, true, 'SI_NO'),
        (3, '¿Tiene permiso de operaciones vigente?', true, 2, true, 'SI_NO'),
        (3, '¿Tiene autorización de tenencia de armas?', true, 3, true, 'SI_NO'),
        (3, '¿La empresa esta registrada en el SRI?', true, 4, true, 'SI_NO'),
        (3, '¿Tiene RUC activo?', true, 5, true, 'SI_NO');
    END IF;
END $$;

-- Preguntas para deportistas (tipo_proceso_id = 4)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM preguntas WHERE tipo_proceso_id = 4) THEN
        INSERT INTO preguntas (tipo_proceso_id, pregunta, obligatoria, orden, estado, tipo_respuesta) VALUES
        (4, '¿Tiene cuenta en el Sicoar?', true, 1, true, 'SI_NO'),
        (4, '¿Ha tenido o tiene armas registradas?', true, 2, true, 'SI_NO');
    END IF;
END $$;

-- =====================================================
-- 3.5. DATOS DE LOCALIZACIÓN (ANTES DE LICENCIAS)
-- =====================================================
-- IMPORTANTE: Las provincias y cantones DEBEN insertarse ANTES de las licencias
-- porque licencia tiene foreign keys a provincia_id y canton_id

-- Insertar TODAS las provincias de Ecuador
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

-- Insertar cantones principales (Quito y Guayaquil son los más usados)
INSERT INTO canton (nombre, codigo, estado, provincia_id) VALUES
('Quito', 'QUIT', true, (SELECT id FROM provincia WHERE codigo = 'PIC')),
('Guayaquil', 'GUAY', true, (SELECT id FROM provincia WHERE codigo = 'GUA'))
ON CONFLICT DO NOTHING;

-- Insertar licencias
INSERT INTO licencia (numero, nombre, ruc, cuenta_bancaria, nombre_banco, tipo_cuenta, cedula_cuenta, email, telefono, provincia_id, canton_id, cupo_total, cupo_disponible, cupo_civil, cupo_militar, cupo_empresa, cupo_deportista, estado, estado_ocupacion, fecha_vencimiento) VALUES
('LIC001', 'GUERRERO MARTINEZ JOSE LUIS', '1707815922001', '8151263', 'INTERNACIONAL', 'AHORRO', '1707815922', 'joseluis@guerreromartinez.com', '0999999999', (SELECT id FROM provincia WHERE codigo = 'PIC'), (SELECT id FROM canton WHERE codigo = 'QUIT' AND provincia_id = (SELECT id FROM provincia WHERE codigo = 'PIC')), 25, 25, 25, 0, 0, 0, true, 'DISPONIBLE', '2050-12-31'),
('LIC002', 'MULLER BENITEZ NICOLE PAMELA', '1713978540001', '2212737882', 'PICHINCHA', 'AHORRO', '1713978540', 'vbenitez@hotmail.com', '0999999999', (SELECT id FROM provincia WHERE codigo = 'PIC'), (SELECT id FROM canton WHERE codigo = 'QUIT' AND provincia_id = (SELECT id FROM provincia WHERE codigo = 'PIC')), 25, 25, 25, 0, 0, 0, true, 'DISPONIBLE', '2050-12-31'),
('LIC003', 'ENDARA UNDA FRANKLIN GEOVANNY', '1721770632001', '2100300998', 'PICHINCHA', 'CORRIENTE', '1721770632', 'f.endara@hotmail.com', '0999999999', (SELECT id FROM provincia WHERE codigo = 'PIC'), (SELECT id FROM canton WHERE codigo = 'QUIT' AND provincia_id = (SELECT id FROM provincia WHERE codigo = 'PIC')), 25, 25, 25, 0, 0, 0, true, 'DISPONIBLE', '2050-12-31'),
('LIC004', 'LOYAGA CORREA MARCIA NATHALY', '1725831950001', '29282140', 'GUAYAQUIL', 'AHORRO', '1725831950', 'marcia.loyaga@example.com', '0999999999', (SELECT id FROM provincia WHERE codigo = 'PIC'), (SELECT id FROM canton WHERE codigo = 'QUIT' AND provincia_id = (SELECT id FROM provincia WHERE codigo = 'PIC')), 25, 25, 25, 0, 0, 0, true, 'DISPONIBLE', '2050-12-31'),
('LIC005', 'SIMOGUE S.A.S.', '0993392212001', '2212359266', 'PICHINCHA', 'AHORRO', '1314955061', 'simogue.sas@gmail.com', '0999999999', (SELECT id FROM provincia WHERE codigo = 'GUA'), (SELECT id FROM canton WHERE codigo = 'GUAY' AND provincia_id = (SELECT id FROM provincia WHERE codigo = 'GUA')), 100, 100, 0, 0, 100, 0, true, 'DISPONIBLE', '2050-12-31')
ON CONFLICT (numero) DO NOTHING;

-- Insertar configuraci?n del sistema
INSERT INTO configuracion_sistema (clave, valor, descripcion, editable) VALUES
('EMAIL_NOTIFICACIONES', 'gmarm.notificacion@gmail.com', 'Email para enviar notificaciones', true),
-- Configuraci?n SMTP para envío de emails
('SMTP_HOST', 'smtp.gmail.com', 'Servidor SMTP para envío de emails', true),
('SMTP_PORT', '587', 'Puerto del servidor SMTP (587=TLS, 465=SSL)', true),
('SMTP_USERNAME', 'gmarm.notificacion@gmail.com', 'Usuario SMTP (email de la cuenta)', true),
('SMTP_PASSWORD', 'vxdacadmloeecjiz', 'Contraseña de aplicación SMTP (NO la Contraseña normal)', true),
('SMTP_AUTH', 'true', 'Requiere autenticación SMTP (true/false)', true),
('SMTP_STARTTLS', 'true', 'Habilitar STARTTLS (true/false)', true),
-- Correos que reciben copia de recibos de pago (adem?s del cliente)
-- Formato: JSON array de strings, ej: ["email1@example.com", "email2@example.com"]
-- Tambi?n acepta separado por comas: "email1@example.com, email2@example.com"
('CORREOS_RECIBO', '["joseluis@guerreromartinez.com", "valeria@gmarm.com"]', 'Lista de correos electrónicos que reciben copia automática de los recibos de pago. Se envía además del correo del cliente. Formato: JSON array o separado por comas. Ejemplo: ["email1@example.com", "email2@example.com"] o "email1@example.com, email2@example.com"', true),
('DIAS_VALIDEZ_DOCUMENTOS', '30', 'días de validez para documentos subidos', true),
('PORCENTAJE_ANTICIPO', '40', 'Porcentaje de anticipo requerido', true),
('IVA', '15', 'Porcentaje de IVA aplicable', true),
('EDAD_MINIMA_CLIENTE', '25', 'Edad mínima para clientes', true),
('MAX_INTENTOS_LOGIN', '3', 'máximo intentos de login antes de bloquear', true),
('TIPOS_PAGO_VALIDOS', 'CONTADO,CUOTAS', 'Tipos de pago válidos en el sistema', true),
('MAX_CUOTAS_PERMITIDAS', '6', 'máximo número de cuotas permitidas', true),
('MIN_MONTO_CUOTA', '100.00', 'Monto minimo por cuota', true),
('DIAS_ALERTA_PROCESO_IMPORTACION', '7', 'Días de anticipación para alertas de procesos de importación', true),
-- Configuración de EXPOFERIA eliminada - ya no se usa en el sistema
('COORDINADOR_NOMBRE', 'TCRN.EMT.AVC. JULIO VILLALTA ESPINOZA', 'Nombre completo del coordinador militar', true),
('COORDINADOR_CARGO', 'COORDINADOR MILITAR CENTRO "PICHINCHA"', 'Cargo del coordinador militar', true),
('COORDINADOR_DIRECCION', 'COMANDO CONJUNTO DE LAS FUERZA ARMADAS', 'Dirección cargo del coordinador militar', true),
-- Cupos por defecto de licencias de importación (valores constantes)
('CUPO_DEFAULT_CIVIL', '25', 'Cupo por defecto para clientes civiles en licencias de importación', false),
('CUPO_DEFAULT_MILITAR', '1000', 'Cupo por defecto para clientes uniformados (militares) en licencias de importación', false),
('CUPO_DEFAULT_EMPRESA', '1000', 'Cupo por defecto para empresas de seguridad en licencias de importación', false),
('CUPO_DEFAULT_DEPORTISTA', '1000', 'Cupo por defecto para deportistas en licencias de importación', false)
ON CONFLICT (clave) DO NOTHING;

-- =====================================================
-- 4. inserción DE DATOS DE LOCALIZACión
-- =====================================================

-- =====================================================
-- SISTEMA DE PAGOS - EXPLICACI?N
-- =====================================================
-- El sistema de pagos funciona de la siguiente manera:
-- 
-- 1. TABLA 'pago': Resumen del plan de pago del cliente
--    - monto_total: Cuánto debe pagar en total
--    - tipo_pago: 'CONTADO' o 'CUOTAS'
--    - numero_cuotas: Cu?ntas cuotas tiene (1 para contado)
--    - monto_cuota: Monto de cada cuota
--    - monto_pagado: Cuánto ya pag?
--    - monto_pendiente: Cuánto le falta (calculado automáticamente)
--    - cuota_actual: En qu? cuota va el cliente
-- 
-- 2. TABLA 'cuota_pago': Detalle de cada cuota individual
--    - pago_id: Referencia al plan de pago
--    - numero_cuota: número de la cuota (1, 2, 3, 4, 5, 6)
--    - monto: Monto espec?fico de esta cuota
--    - fecha_vencimiento: Cu?ndo vence
--    - estado: 'PENDIENTE', 'PAGADA', 'VENCIDA'
--    - fecha_pago: Cu?ndo se pag? (NULL si no se ha pagado)
--    - referencia_pago: Referencia del pago (transferencia, etc.)
--    - usuario_confirmador_id: Qui?n confirm? el pago
-- 
-- EJEMPLO DE USO:
-- Cliente compra arma por $1200 en 3 cuotas:
-- - pago: monto_total=1200, tipo_pago='CUOTAS', numero_cuotas=3, monto_cuota=400
-- - cuota_pago: 3 registros con montos de $400 cada uno
-- 
-- =====================================================

-- =====================================================
-- SISTEMA DE CUPOS Y LICENCIAS - EXPLICACI?N
-- =====================================================
-- El sistema de cupos funciona de la siguiente manera:
-- 
-- 1. TABLA 'licencia': Define los cupos disponibles por tipo de cliente
--    - Todas las licencias son del mismo tipo: IMPORTACION_ARMAS
--    - cupo_civil: máximo 25 armas para clientes civiles
--    - cupo_militar: máximo 1000 armas para uniformados
--    - cupo_empresa: máximo 1000 armas para empresas de seguridad
--    - cupo_deportista: máximo 1000 armas para deportistas
--    - estado_ocupacion: 'DISPONIBLE' o 'BLOQUEADA'
-- 
-- 2. TABLA 'grupo_importacion_cupo': Controla el consumo de cupos por grupo
--    - licencia_id: Qu? licencia se est�? usando
--    - tipo_cliente: Para qu? tipo de cliente se consume
--    - cupo_consumido: Cuánto consume este grupo espec?fico
--    - cupo_disponible_licencia: Cuánto queda disponible en la licencia
-- 
-- FLUJO DE TRABAJO:
-- 1. Se crea un grupo de importación
-- 2. Se asigna una licencia disponible (estado = 'DISPONIBLE')
-- 3. La licencia pasa a estado 'BLOQUEADA'
-- 4. Se registran los cupos consumidos por tipo de cliente
-- 5. Al terminar el proceso, la licencia se libera (estado = 'DISPONIBLE')
-- 6. Los cupos se resetean a sus valores iniciales
-- 
-- EJEMPLO:
-- Licencia "Jose Torres" tiene: 25 civiles, 1000 uniformados, 1000 empresas, 1000 deportistas
-- Grupo consume: 25 civiles, 28 uniformados, 3 empresas, 0 deportistas
-- Durante el proceso: Licencia BLOQUEADA
-- Al terminar: Licencia DISPONIBLE con cupos originales restaurados
-- 
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
('Santo Domingo de los Ts?chilas', 'SDT', true),
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
('Camilo Ponce Enriquez', 'CPEN', true, (SELECT id FROM provincia WHERE codigo = 'AZU'))
ON CONFLICT DO NOTHING;

-- BOL?VAR
INSERT INTO canton (nombre, codigo, estado, provincia_id) VALUES
('Guaranda', 'GUAR', true, (SELECT id FROM provincia WHERE codigo = 'BOL')),
('Chillanes', 'CHIL', true, (SELECT id FROM provincia WHERE codigo = 'BOL')),
('Chimbo', 'CHIM', true, (SELECT id FROM provincia WHERE codigo = 'BOL')),
('Echeandía', 'ECHE', true, (SELECT id FROM provincia WHERE codigo = 'BOL')),
('San Miguel', 'SMIG', true, (SELECT id FROM provincia WHERE codigo = 'BOL')),
('Caluma', 'CALU', true, (SELECT id FROM provincia WHERE codigo = 'BOL')),
('Las Naves', 'LNAV', true, (SELECT id FROM provincia WHERE codigo = 'BOL'))
ON CONFLICT DO NOTHING;

-- CA?AR
INSERT INTO canton (nombre, codigo, estado, provincia_id) VALUES
('Azogues', 'AZOG', true, (SELECT id FROM provincia WHERE codigo = 'CAN')),
('Cañar', 'CAN', true, (SELECT id FROM provincia WHERE codigo = 'CAN')),
('La Troncal', 'LTRO', true, (SELECT id FROM provincia WHERE codigo = 'CAN')),
('El Tambo', 'ETAM', true, (SELECT id FROM provincia WHERE codigo = 'CAN')),
('Deleg', 'DELE', true, (SELECT id FROM provincia WHERE codigo = 'CAN')),
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

-- GALAPAGOS
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
('Gonzanamí', 'GONZ', true, (SELECT id FROM provincia WHERE codigo = 'LOJ')),
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

-- LOS R?OS
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

-- MANAB?
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

-- SANTO DOMINGO DE LOS TS?CHILAS
INSERT INTO canton (nombre, codigo, estado, provincia_id) VALUES
('Santo Domingo', 'SDOM', true, (SELECT id FROM provincia WHERE codigo = 'SDT')),
('La Concordia', 'LCON', true, (SELECT id FROM provincia WHERE codigo = 'SDT'))
ON CONFLICT DO NOTHING;

-- SUCUMB?OS
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
-- 5. inserción DE USUARIOS (solo si no existen)
-- =====================================================

-- Usuario administrador (password: admin123)
INSERT INTO usuario (bloqueado, intentos_login, fecha_creacion, telefono_principal, estado, username, apellidos, email, nombres, direccion, password_hash) VALUES
(false, 0, NOW(), '0999999999', true, 'admin', 'SISTEMA', 'admin@armasimportacion.com', 'ADMINISTRADOR', 'QUITO, ECUADOR', 'admin123')
ON CONFLICT (username) DO NOTHING;

-- Usuarios de prueba (password: admin123)
INSERT INTO usuario (bloqueado, intentos_login, fecha_creacion, telefono_principal, estado, username, apellidos, email, nombres, direccion, password_hash) VALUES
(false, 0, NOW(), '0987654321', true, 'vendedor', 'Vendedor', 'vendedor@test.com', 'Juan', 'Guayaquil, Ecuador', 'admin123'),
(false, 0, NOW(), '0987654322', true, 'jefe', 'Jefe Ventas', 'jefe@test.com', 'María', 'Quito, Ecuador', 'admin123'),
(false, 0, NOW(), '0987654323', true, 'finanzas', 'Finanzas', 'finanzas@test.com', 'Carlos', 'Cuenca, Ecuador', 'admin123'),
(false, 0, NOW(), '0987654324', true, 'operaciones', 'Operaciones', 'operaciones@test.com', 'Ana', 'Manta, Ecuador', 'admin123')
ON CONFLICT (username) DO NOTHING;

-- Asignar roles a usuarios
INSERT INTO usuario_rol (usuario_id, rol_id) VALUES
((SELECT id FROM usuario WHERE username = 'admin'), (SELECT id FROM rol WHERE codigo = 'ADMIN')),
((SELECT id FROM usuario WHERE username = 'vendedor'), (SELECT id FROM rol WHERE codigo = 'VENDOR')),
((SELECT id FROM usuario WHERE username = 'jefe'), (SELECT id FROM rol WHERE codigo = 'SALES_CHIEF')),
((SELECT id FROM usuario WHERE username = 'finanzas'), (SELECT id FROM rol WHERE codigo = 'FINANCE')),
((SELECT id FROM usuario WHERE username = 'operaciones'), (SELECT id FROM rol WHERE codigo = 'OPERATIONS'))
ON CONFLICT (usuario_id, rol_id) DO NOTHING;


-- =====================================================
-- 5.5. MIGRACI?N DE imágenes (url_imagen ? arma_imagen)
-- =====================================================

-- Migrar todas las url_imagen existentes a la tabla arma_imagen
INSERT INTO arma_imagen (arma_id, url_imagen, orden, es_principal, descripcion, fecha_creacion, fecha_actualizacion)
SELECT 
    id as arma_id,
    url_imagen,
    1 as orden,
    true as es_principal,
    'Imagen principal' as descripcion,
    CURRENT_TIMESTAMP as fecha_creacion,
    CURRENT_TIMESTAMP as fecha_actualizacion
FROM arma
WHERE url_imagen IS NOT NULL 
  AND url_imagen != ''
  AND NOT EXISTS (
      SELECT 1 FROM arma_imagen ai 
      WHERE ai.arma_id = arma.id 
      AND ai.es_principal = true
  );

-- Agregar placeholder para armas sin imagen
INSERT INTO arma_imagen (arma_id, url_imagen, orden, es_principal, descripcion, fecha_creacion, fecha_actualizacion)
SELECT 
    a.id as arma_id,
    '/images/weapons/default-weapon.svg' as url_imagen,
    1 as orden,
    true as es_principal,
    'Imagen por defecto' as descripcion,
    CURRENT_TIMESTAMP as fecha_creacion,
    CURRENT_TIMESTAMP as fecha_actualizacion
FROM arma a
WHERE NOT EXISTS (
    SELECT 1 FROM arma_imagen ai WHERE ai.arma_id = a.id
);


-- =====================================================
-- 6. verificación FINAL
-- =====================================================

-- Mostrar resumen de lo creado
SELECT '=== RESUMEN DE INSTALACI?N ===' as info;
SELECT 'Usuarios creados:' as info, COUNT(*) as total FROM usuario;
SELECT 'Roles creados:' as info, COUNT(*) as total FROM rol;
SELECT 'Tipos de cliente:' as info, COUNT(*) as total FROM tipo_cliente;
SELECT 'Tipos de proceso:' as info, COUNT(*) as total FROM tipo_proceso;
SELECT 'categorías de armas:' as info, COUNT(*) as total FROM categoria_arma;
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

SELECT '=== INSTALACI?N COMPLETADA ===' as info;
SELECT 'La base de datos está lista para usar con el frontend.' as mensaje;

-- ========================================
-- DATOS ADICIONALES PARA DESARROLLO
-- ========================================
-- Agregados automáticamente para tener un ambiente de desarrollo completo

-- ========================================
-- VENDEDORES
-- ========================================

-- 2. Rossy Revelo
INSERT INTO usuario (
    bloqueado, intentos_login, fecha_creacion, telefono_principal, estado,
    username, apellidos, email, nombres, direccion, password_hash
) VALUES (
    false, 0, NOW(), '0999999999', true,
    'rossy.revelo', 'Revelo', 'rossy-revelo@hotmail.com',
    'Rossy', 'Quito, Ecuador', 'admin123'
) ON CONFLICT (email) DO UPDATE SET 
    nombres = EXCLUDED.nombres, apellidos = EXCLUDED.apellidos, username = EXCLUDED.username, estado = true;

-- Asignar rol VENDOR a vendedores
INSERT INTO usuario_rol (usuario_id, rol_id, activo, fecha_asignacion)
SELECT u.id, r.id, true, NOW()
FROM usuario u
CROSS JOIN rol r
WHERE u.email = 'rossy-revelo@hotmail.com' AND r.codigo = 'VENDOR'
ON CONFLICT (usuario_id, rol_id) DO UPDATE SET activo = true;

-- Usuario: Franklin Endara (Finanzas y Jefe de Ventas)
INSERT INTO usuario (
    bloqueado, intentos_login, fecha_creacion, telefono_principal, estado,
    username, apellidos, email, nombres, direccion, password_hash
) VALUES (
    false, 0, NOW(), '0999999998', true,
    'franklin.endara', 'Endara', 'franklin.endara@hotmail.com',
    'Franklin', 'Quito, Ecuador', 'admin123'
) ON CONFLICT (username) DO UPDATE
SET 
    email = 'franklin.endara@hotmail.com',
    nombres = 'Franklin',
    apellidos = 'Endara',
    estado = true;

-- Asignar roles a franklin.endara (FINANCE y SALES_CHIEF)
INSERT INTO usuario_rol (usuario_id, rol_id, activo, fecha_asignacion)
SELECT u.id, r.id, true, NOW()
FROM usuario u
CROSS JOIN rol r
WHERE u.email = 'franklin.endara@hotmail.com' AND r.codigo IN ('FINANCE', 'SALES_CHIEF')
ON CONFLICT (usuario_id, rol_id) DO UPDATE SET activo = true;

-- ========================================
-- migración DE imágenes A TABLA arma_imagen
-- ========================================

-- Migrar url_imagen existentes a arma_imagen como imagen principal
INSERT INTO arma_imagen (arma_id, url_imagen, orden, es_principal, descripcion, fecha_creacion, fecha_actualizacion)
SELECT 
    id, url_imagen, 1, true,
    'Imagen principal (migrada)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM arma
WHERE url_imagen IS NOT NULL AND url_imagen != ''
  AND NOT EXISTS (SELECT 1 FROM arma_imagen ai WHERE ai.arma_id = arma.id AND ai.es_principal = true)
ON CONFLICT DO NOTHING;

-- Agregar placeholder para armas sin imagen
INSERT INTO arma_imagen (arma_id, url_imagen, orden, es_principal, descripcion)
SELECT 
    id, '/images/weapons/placeholder.jpg', 1, true, 'Imagen no disponible'
FROM arma
WHERE NOT EXISTS (SELECT 1 FROM arma_imagen ai WHERE ai.arma_id = arma.id)
ON CONFLICT DO NOTHING;

-- ========================================
-- verificación FINAL
-- ========================================

SELECT '=== INSTALACION COMPLETADA - AMBIENTE DESARROLLO ===' as info;
SELECT 'La base de datos esta lista con todos los datos de desarrollo.' as mensaje;

-- Mostrar usuarios y roles
SELECT 
    u.nombres || ' ' || u.apellidos as usuario,
    u.email,
    STRING_AGG(r.codigo, ', ') as roles
FROM usuario u
LEFT JOIN usuario_rol ur ON u.id = ur.usuario_id
LEFT JOIN rol r ON ur.rol_id = r.id
GROUP BY u.id, u.nombres, u.apellidos, u.email
ORDER BY u.id;

-- Mostrar estad?sticas
SELECT 'Total de usuarios:' as info, COUNT(*) as total FROM usuario;
SELECT 'Total de clientes:' as info, COUNT(*) as total FROM cliente;
SELECT 'Total de armas:' as info, COUNT(*) as total FROM arma;
SELECT 'Total de imagenes de armas:' as info, COUNT(*) as total FROM arma_imagen;
SELECT 'Armas con multiples imagenes:' as info, COUNT(DISTINCT arma_id) as total 
FROM arma_imagen 
GROUP BY arma_id 
HAVING COUNT(*) > 1;

-- ========================================
-- RESET DE SECUENCIAS PARA IDs CONTINUOS
-- ========================================
-- CRITICO: Sin est�o, los IDs saltan despu�s de resets
-- Este bloque asegura que los pr?ximos IDs generados sean consecutivos

SELECT 'Reseteando secuencias de PostgreSQL...' as info;

-- Resetear secuencias principales 
-- El tercer par?metro 'true' asegura que el pr?ximo ID ser? MAX(id) + 1 (continuaci?n)
-- GREATEST asegura que el valor m?nimo sea 1 (PostgreSQL no permite 0 en setval)
-- CR?TICO: Este bloque debe ejecutarse despu�s de insertar todos los datos

-- Tablas principales
SELECT setval('rol_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM rol), 0), 1), true);
SELECT setval('usuario_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM usuario), 0), 1), true);
SELECT setval('usuario_rol_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM usuario_rol), 0), 1), true);
SELECT setval('tipo_cliente_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM tipo_cliente), 0), 1), true);
SELECT setval('tipo_identificacion_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM tipo_identificacion), 0), 1), true);
SELECT setval('tipo_proceso_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM tipo_proceso), 0), 1), true);
SELECT setval('tipo_importacion_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM tipo_importacion), 0), 1), true);
SELECT setval('tipo_cliente_importacion_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM tipo_cliente_importacion), 0), 1), true);
SELECT setval('cliente_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM cliente), 0), 1), true);
SELECT setval('preguntas_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM preguntas), 0), 1), true);
SELECT setval('respuestas_cliente_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM respuestas_cliente), 0), 1), true);
SELECT setval('tipo_documento_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM tipo_documento), 0), 1), true);
SELECT setval('documento_cliente_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM documento_cliente), 0), 1), true);

-- Tablas de armas
SELECT setval('categoria_arma_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM categoria_arma), 0), 1), true);
SELECT setval('arma_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM arma), 0), 1), true);
SELECT setval('arma_imagen_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM arma_imagen), 0), 1), true);
SELECT setval('arma_stock_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM arma_stock), 0), 1), true);
SELECT setval('arma_serie_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM arma_serie), 0), 1), true);
SELECT setval('arma_fisica_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM arma_fisica), 0), 1), true);
SELECT setval('cliente_arma_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM cliente_arma), 0), 1), true);

-- Tablas de accesorios
SELECT setval('accesorio_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM accesorio), 0), 1), true);
SELECT setval('accesorio_fisico_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM accesorio_fisico), 0), 1), true);
SELECT setval('cliente_accesorio_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM cliente_accesorio), 0), 1), true);

-- Tablas de pagos
SELECT setval('pago_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM pago), 0), 1), true);
SELECT setval('cuota_pago_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM cuota_pago), 0), 1), true);

-- Tablas de importación
SELECT setval('licencia_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM licencia), 0), 1), true);
SELECT setval('grupo_importacion_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM grupo_importacion), 0), 1), true);
SELECT setval('cliente_grupo_importacion_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM cliente_grupo_importacion), 0), 1), true);
SELECT setval('grupo_importacion_cupo_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM grupo_importacion_cupo), 0), 1), true);
SELECT setval('grupo_importacion_proceso_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM grupo_importacion_proceso), 0), 1), true);
SELECT setval('grupo_importacion_vendedor_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM grupo_importacion_vendedor), 0), 1), true);
SELECT setval('grupo_importacion_limite_categoria_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM grupo_importacion_limite_categoria), 0), 1), true);
SELECT setval('documento_grupo_importacion_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM documento_grupo_importacion), 0), 1), true);
SELECT setval('documento_generado_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM documento_generado), 0), 1), true);

-- Tablas de localizaci?n
SELECT setval('provincia_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM provincia), 0), 1), true);
SELECT setval('canton_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM canton), 0), 1), true);

-- Tablas del sistema
SELECT setval('configuracion_sistema_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM configuracion_sistema), 0), 1), true);
SELECT setval('notificacion_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM notificacion), 0), 1), true);
SELECT setval('email_verification_token_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM email_verification_token), 0), 1), true);

SELECT 'Secuencias reseteadas exitosamente' as info;
SELECT 'El proximo ID generado sera consecutivo' as mensaje;

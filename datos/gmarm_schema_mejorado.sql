-- =====================================================
-- GMARM - ESQUEMA DE BASE DE DATOS MEJORADO
-- Versión: 1.0
-- Fecha: 2024-12-01
-- Descripción: Esquema completo con mejoras y datos de prueba
-- =====================================================

-- =====================================================
-- TABLAS DE CONFIGURACIÓN BÁSICA
-- =====================================================

CREATE TABLE tipo_cliente (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  codigo VARCHAR(10) NOT NULL UNIQUE,
  descripcion VARCHAR(255),
  estado BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tipo_identificacion (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  codigo VARCHAR(10) NOT NULL UNIQUE,
  descripcion VARCHAR(255),
  estado BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tipo_proceso (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  codigo VARCHAR(10) NOT NULL UNIQUE,
  descripcion VARCHAR(255),
  estado BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tipo_importacion (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  cupo_maximo INTEGER NOT NULL,
  descripcion VARCHAR(255),
  estado BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tipo_cliente_importacion (
  tipo_cliente_id INTEGER NOT NULL,
  tipo_importacion_id INTEGER NOT NULL,
  PRIMARY KEY (tipo_cliente_id, tipo_importacion_id),
  FOREIGN KEY (tipo_cliente_id) REFERENCES tipo_cliente(id),
  FOREIGN KEY (tipo_importacion_id) REFERENCES tipo_importacion(id)
);

-- =====================================================
-- CONFIGURACIÓN DEL SISTEMA
-- =====================================================

CREATE TABLE configuracion_sistema (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(50) NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  descripcion VARCHAR(255),
  editable BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- LICENCIAS
-- =====================================================

CREATE TABLE licencia (
  id SERIAL PRIMARY KEY,
  numero VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(255) NOT NULL,
  ruc VARCHAR(13) NOT NULL,
  cuenta_bancaria VARCHAR(30) NOT NULL,
  nombre_banco VARCHAR(255) NOT NULL,
  tipo_cuenta VARCHAR(255) NOT NULL,
  cedula_cuenta VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefono VARCHAR(10) NOT NULL,
  fecha_vencimiento DATE,
  estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- USUARIOS Y ROLES
-- =====================================================

CREATE TABLE usuario (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  foto VARCHAR(255),
  telefono_principal VARCHAR(10) NOT NULL,
  telefono_secundario VARCHAR(10),
  direccion VARCHAR(255) NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  ultimo_login TIMESTAMP,
  estado VARCHAR(20) DEFAULT 'ACTIVO' NOT NULL,
  intentos_login INTEGER DEFAULT 0,
  ultimo_intento TIMESTAMP,
  bloqueado BOOLEAN DEFAULT false,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rol (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT,
  tipo_rol_vendedor VARCHAR(50),
  estado BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuario_rol (
  usuario_id INTEGER NOT NULL,
  rol_id INTEGER NOT NULL,
  fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (usuario_id, rol_id),
  FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
  FOREIGN KEY (rol_id) REFERENCES rol(id) ON DELETE CASCADE
);

-- =====================================================
-- CLIENTES (MEJORADO)
-- =====================================================

CREATE TABLE cliente (
  id SERIAL PRIMARY KEY,
  tipo_identificacion_id INTEGER NOT NULL REFERENCES tipo_identificacion(id),
  tipo_cliente_id INTEGER NOT NULL REFERENCES tipo_cliente(id),
  numero_identificacion VARCHAR(20) NOT NULL,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100),
  fecha_nacimiento DATE,
  direccion VARCHAR(255) NOT NULL,
  provincia VARCHAR(100),
  canton VARCHAR(100),
  email VARCHAR(100) NOT NULL,
  telefono_principal VARCHAR(15) NOT NULL,
  telefono_secundario VARCHAR(15),
  representante_legal VARCHAR(100),
  -- Campos para empresa
  ruc VARCHAR(13),
  nombre_empresa VARCHAR(255),
  direccion_fiscal VARCHAR(255),
  telefono_referencia VARCHAR(15),
  correo_empresa VARCHAR(100),
  provincia_empresa VARCHAR(100),
  canton_empresa VARCHAR(100),
  -- Campo para estado militar
  estado_militar VARCHAR(20) DEFAULT 'ACTIVO',
  -- Auditoría
  usuario_creador_id INTEGER NOT NULL REFERENCES usuario(id),
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  usuario_actualizador_id INTEGER REFERENCES usuario(id),
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
  CONSTRAINT uk_cliente_identificacion UNIQUE (tipo_identificacion_id, numero_identificacion)
);

-- =====================================================
-- PREGUNTAS Y RESPUESTAS
-- =====================================================

CREATE TABLE pregunta_cliente (
  id SERIAL PRIMARY KEY,
  tipo_proceso_id INTEGER NOT NULL REFERENCES tipo_proceso(id),
  pregunta TEXT NOT NULL,
  obligatoria BOOLEAN NOT NULL DEFAULT TRUE,
  orden INTEGER NOT NULL,
  estado BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE respuesta_cliente (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES cliente(id),
  pregunta_id INTEGER NOT NULL REFERENCES pregunta_cliente(id),
  respuesta TEXT NOT NULL,
  fecha_respuesta TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- GRUPOS DE IMPORTACIÓN
-- =====================================================

CREATE TABLE grupo_importacion (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  licencia_id INTEGER NOT NULL REFERENCES licencia(id),
  tipo_proceso_id INTEGER NOT NULL REFERENCES tipo_proceso(id),
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_cierre TIMESTAMP,
  usuario_creador_id INTEGER NOT NULL REFERENCES usuario(id),
  estado VARCHAR(20) NOT NULL DEFAULT 'EN_PROCESO',
  observaciones TEXT,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cliente_grupo_importacion (
  cliente_id INTEGER NOT NULL REFERENCES cliente(id),
  grupo_importacion_id INTEGER NOT NULL REFERENCES grupo_importacion(id),
  fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  usuario_asignador_id INTEGER NOT NULL REFERENCES usuario(id),
  PRIMARY KEY (cliente_id, grupo_importacion_id)
);

CREATE TABLE grupo_importacion_cupo (
  id SERIAL PRIMARY KEY,
  grupo_importacion_id INTEGER NOT NULL REFERENCES grupo_importacion(id),
  tipo_importacion_id INTEGER NOT NULL REFERENCES tipo_importacion(id),
  codigo VARCHAR(20),
  cupo_asignado INTEGER NOT NULL,
  cupo_utilizado INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (grupo_importacion_id) REFERENCES grupo_importacion(id),
  FOREIGN KEY (tipo_importacion_id) REFERENCES tipo_importacion(id),
  UNIQUE (grupo_importacion_id, tipo_importacion_id)
);

-- =====================================================
-- ARMAS Y ACCESORIOS
-- =====================================================

CREATE TABLE categoria_arma (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  descripcion VARCHAR(255),
  estado BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE modelo_arma (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  categoria_id INTEGER REFERENCES categoria_arma(id),
  calibre VARCHAR(50) NOT NULL,
  capacidad VARCHAR(50),
  precio_referencia DECIMAL(10,2) NOT NULL,
  imagen_url VARCHAR(255),
  descripcion TEXT,
  estado VARCHAR(50) NOT NULL DEFAULT 'DISPONIBLE',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tipo_accesorio (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  descripcion VARCHAR(255),
  estado BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE accesorio (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  tipo_id INTEGER REFERENCES tipo_accesorio(id),
  precio_referencia DECIMAL(10,2) NOT NULL,
  imagen_url VARCHAR(255),
  descripcion TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INVENTARIO FÍSICO
-- =====================================================

CREATE TABLE arma_fisica (
  id SERIAL PRIMARY KEY,
  modelo_arma_id INTEGER NOT NULL REFERENCES modelo_arma(id),
  numero_serie VARCHAR(50) UNIQUE,
  grupo_importacion_id INTEGER NOT NULL REFERENCES grupo_importacion(id),
  estado VARCHAR(20) NOT NULL DEFAULT 'EN_BODEGA',
  fecha_ingreso TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_salida TIMESTAMP,
  cliente_asignado_id INTEGER REFERENCES cliente(id),
  observaciones TEXT
);

CREATE TABLE accesorio_fisico (
  id SERIAL PRIMARY KEY,
  tipo_accesorio_id INTEGER NOT NULL REFERENCES tipo_accesorio(id),
  modelo_arma_id INTEGER REFERENCES modelo_arma(id),
  numero_serie VARCHAR(50),
  grupo_importacion_id INTEGER NOT NULL REFERENCES grupo_importacion(id),
  estado VARCHAR(20) NOT NULL DEFAULT 'EN_BODEGA',
  fecha_ingreso TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_salida TIMESTAMP,
  cliente_asignado_id INTEGER REFERENCES cliente(id),
  observaciones TEXT
);

-- =====================================================
-- ASIGNACIONES
-- =====================================================

CREATE TABLE asignacion_arma (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES cliente(id),
  grupo_importacion_id INTEGER NOT NULL REFERENCES grupo_importacion(id),
  modelo_arma_id INTEGER NOT NULL REFERENCES modelo_arma(id),
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10,2),
  fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado VARCHAR(20) NOT NULL DEFAULT 'RESERVADO'
);

CREATE TABLE asignacion_accesorio (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES cliente(id),
  grupo_importacion_id INTEGER NOT NULL REFERENCES grupo_importacion(id),
  accesorio_id INTEGER NOT NULL REFERENCES accesorio(id),
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10,2),
  fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado VARCHAR(20) NOT NULL DEFAULT 'RESERVADO'
);

-- =====================================================
-- DOCUMENTOS
-- =====================================================

CREATE TABLE tipo_documento (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  obligatorio BOOLEAN NOT NULL DEFAULT TRUE,
  tipo_proceso_id INTEGER REFERENCES tipo_proceso(id),
  estado BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE documento_cliente (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES cliente(id),
  tipo_documento_id INTEGER NOT NULL REFERENCES tipo_documento(id),
  url_archivo VARCHAR(255) NOT NULL,
  fecha_carga TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  usuario_carga_id INTEGER NOT NULL REFERENCES usuario(id),
  estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
  observaciones TEXT
);

CREATE TABLE documento_grupo_importacion (
  id SERIAL PRIMARY KEY,
  grupo_importacion_id INTEGER NOT NULL REFERENCES grupo_importacion(id),
  tipo_documento_id INTEGER NOT NULL REFERENCES tipo_documento(id),
  url_archivo VARCHAR(255) NOT NULL,
  fecha_carga TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  usuario_carga_id INTEGER NOT NULL REFERENCES usuario(id),
  estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
  observaciones TEXT
);

-- =====================================================
-- PAGOS Y PLANES
-- =====================================================

CREATE TABLE plan_pago (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  tipo_cliente_id INTEGER REFERENCES tipo_cliente(id),
  numero_cuotas INTEGER NOT NULL,
  descripcion TEXT,
  estado BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pago (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES cliente(id),
  plan_pago_id INTEGER REFERENCES plan_pago(id),
  numero_comprobante VARCHAR(50) NOT NULL UNIQUE,
  monto_total DECIMAL(10,2) NOT NULL,
  saldo_pendiente DECIMAL(10,2) NOT NULL,
  metodo_pago VARCHAR(50) NOT NULL,
  fecha_pago TIMESTAMP,
  estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
  observaciones TEXT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cuota_pago (
  id SERIAL PRIMARY KEY,
  pago_id INTEGER NOT NULL REFERENCES pago(id),
  numero_cuota INTEGER NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  fecha_pago DATE,
  estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
  interes DECIMAL(10,2) DEFAULT 0
);

-- =====================================================
-- NOTIFICACIONES Y DOCUMENTOS GENERADOS
-- =====================================================

CREATE TABLE notificacion (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuario(id),
  titulo VARCHAR(100) NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT FALSE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accion_url VARCHAR(255)
);

CREATE TABLE documento_generado (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL,
  cliente_id INTEGER REFERENCES cliente(id),
  grupo_importacion_id INTEGER REFERENCES grupo_importacion(id),
  numero_documento VARCHAR(50) NOT NULL UNIQUE,
  url_archivo VARCHAR(255) NOT NULL,
  fecha_generacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  usuario_generador_id INTEGER NOT NULL REFERENCES usuario(id)
);

-- =====================================================
-- ÍNDICES PARA MEJORAR EL RENDIMIENTO
-- =====================================================

CREATE INDEX idx_cliente_tipo_identificacion ON cliente(tipo_identificacion_id);
CREATE INDEX idx_cliente_tipo_cliente ON cliente(tipo_cliente_id);
CREATE INDEX idx_cliente_email ON cliente(email);
CREATE INDEX idx_cliente_estado ON cliente(estado);
CREATE INDEX idx_cliente_fecha_creacion ON cliente(fecha_creacion);
CREATE INDEX idx_cliente_usuario_creador ON cliente(usuario_creador_id);

CREATE INDEX idx_usuario_username ON usuario(username);
CREATE INDEX idx_usuario_email ON usuario(email);
CREATE INDEX idx_usuario_estado ON usuario(estado);

CREATE INDEX idx_grupo_importacion_licencia ON grupo_importacion(licencia_id);
CREATE INDEX idx_grupo_importacion_proceso ON grupo_importacion(tipo_proceso_id);
CREATE INDEX idx_grupo_importacion_estado ON grupo_importacion(estado);

CREATE INDEX idx_asignacion_cliente ON asignacion_arma(cliente_id);
CREATE INDEX idx_asignacion_grupo ON asignacion_arma(grupo_importacion_id);
CREATE INDEX idx_asignacion_modelo ON asignacion_arma(modelo_arma_id);

CREATE INDEX idx_documento_cliente ON documento_cliente(cliente_id, estado);
CREATE INDEX idx_documento_grupo_importacion ON documento_grupo_importacion(grupo_importacion_id, estado);

CREATE INDEX idx_arma_fisica_grupo ON arma_fisica(grupo_importacion_id);
CREATE INDEX idx_arma_fisica_cliente ON arma_fisica(cliente_asignado_id);
CREATE INDEX idx_arma_fisica_modelo ON arma_fisica(modelo_arma_id);

CREATE INDEX idx_accesorio_fisico_grupo ON accesorio_fisico(grupo_importacion_id);
CREATE INDEX idx_accesorio_fisico_cliente ON accesorio_fisico(cliente_asignado_id);

-- =====================================================
-- CONSTRAINTS DE VALIDACIÓN
-- =====================================================

-- Validación de edad mínima (25 años)
ALTER TABLE cliente ADD CONSTRAINT chk_edad_cliente 
    CHECK (fecha_nacimiento IS NULL OR fecha_nacimiento <= CURRENT_DATE - INTERVAL '25 years');

-- Validación de formato de email
ALTER TABLE cliente ADD CONSTRAINT chk_email_cliente 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Validación de teléfono (solo números)
ALTER TABLE cliente ADD CONSTRAINT chk_telefono_cliente 
    CHECK (telefono_principal ~ '^[0-9]{10}$');

-- Validación de RUC (13 dígitos)
ALTER TABLE cliente ADD CONSTRAINT chk_ruc_cliente 
    CHECK (ruc IS NULL OR ruc ~ '^[0-9]{13}$');

-- Validación de cédula (10 dígitos)
ALTER TABLE cliente ADD CONSTRAINT chk_cedula_cliente 
    CHECK (numero_identificacion ~ '^[0-9]{10}$' OR numero_identificacion ~ '^[0-9]{13}$');

-- =====================================================
-- TRIGGERS PARA AUDITORÍA
-- =====================================================

-- Función para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar fecha_actualizacion automáticamente
CREATE TRIGGER update_tipo_cliente_updated_at 
    BEFORE UPDATE ON tipo_cliente 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tipo_identificacion_updated_at 
    BEFORE UPDATE ON tipo_identificacion 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tipo_proceso_updated_at 
    BEFORE UPDATE ON tipo_proceso 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tipo_importacion_updated_at 
    BEFORE UPDATE ON tipo_importacion 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuracion_sistema_updated_at 
    BEFORE UPDATE ON configuracion_sistema 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_licencia_updated_at 
    BEFORE UPDATE ON licencia 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuario_updated_at 
    BEFORE UPDATE ON usuario 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rol_updated_at 
    BEFORE UPDATE ON rol 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cliente_updated_at 
    BEFORE UPDATE ON cliente 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pregunta_cliente_updated_at 
    BEFORE UPDATE ON pregunta_cliente 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grupo_importacion_updated_at 
    BEFORE UPDATE ON grupo_importacion 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categoria_arma_updated_at 
    BEFORE UPDATE ON categoria_arma 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modelo_arma_updated_at 
    BEFORE UPDATE ON modelo_arma 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tipo_accesorio_updated_at 
    BEFORE UPDATE ON tipo_accesorio 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accesorio_updated_at 
    BEFORE UPDATE ON accesorio 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tipo_documento_updated_at 
    BEFORE UPDATE ON tipo_documento 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plan_pago_updated_at 
    BEFORE UPDATE ON plan_pago 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pago_updated_at 
    BEFORE UPDATE ON pago 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
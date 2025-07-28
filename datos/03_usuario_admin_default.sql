-- ========================================
-- USUARIO ADMINISTRADOR POR DEFECTO
-- ========================================
-- Script para crear un usuario administrador por defecto
-- Ejecutar después de crear las tablas y roles

-- Insertar roles si no existen
INSERT INTO rol (nombre, descripcion, tipo_rol_vendedor, estado, fecha_creacion) 
VALUES 
    ('ADMIN', 'Acceso completo al sistema', NULL, true, CURRENT_TIMESTAMP),
    ('VENDEDOR', 'Registro de clientes y selección de armas catálogo', 'LIBRE', true, CURRENT_TIMESTAMP),
    ('JEFE_VENTAS', 'Aprobación de solicitudes y creación de grupos de importación', 'FIJO', true, CURRENT_TIMESTAMP),
    ('FINANZAS', 'Gestión de pagos y facturación', NULL, true, CURRENT_TIMESTAMP),
    ('OPERACIONES', 'Gestión de importación y documentación', NULL, true, CURRENT_TIMESTAMP)
ON CONFLICT (nombre) DO NOTHING;

-- Insertar usuario administrador por defecto
-- Password: admin123 (hasheado con BCrypt)
INSERT INTO usuario (
    username, 
    email, 
    password_hash, 
    nombres, 
    apellidos, 
    telefono_principal, 
    direccion, 
    estado, 
    fecha_creacion
) VALUES (
    'admin',
    'admin@armasimportacion.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
    'Administrador',
    'Sistema',
    '0999999999',
    'Quito, Ecuador',
    'ACTIVO',
    CURRENT_TIMESTAMP
) ON CONFLICT (username) DO NOTHING;

-- Asignar rol de administrador al usuario admin
INSERT INTO usuario_rol (usuario_id, rol_id, fecha_asignacion, activo)
SELECT 
    u.id,
    r.id,
    CURRENT_TIMESTAMP,
    true
FROM usuario u, rol r
WHERE u.username = 'admin' AND r.nombre = 'ADMIN'
ON CONFLICT (usuario_id, rol_id) DO NOTHING;

-- Insertar usuarios de prueba adicionales
INSERT INTO usuario (
    username, 
    email, 
    password_hash, 
    nombres, 
    apellidos, 
    telefono_principal, 
    direccion, 
    estado, 
    fecha_creacion
) VALUES 
    ('vendedor', 'vendedor@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Juan', 'Vendedor', '0987654321', 'Guayaquil, Ecuador', 'ACTIVO', CURRENT_TIMESTAMP),
    ('jefe', 'jefe@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'María', 'Jefe Ventas', '0987654322', 'Quito, Ecuador', 'ACTIVO', CURRENT_TIMESTAMP),
    ('finanzas', 'finanzas@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Carlos', 'Finanzas', '0987654323', 'Cuenca, Ecuador', 'ACTIVO', CURRENT_TIMESTAMP),
    ('operaciones', 'operaciones@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ana', 'Operaciones', '0987654324', 'Manta, Ecuador', 'ACTIVO', CURRENT_TIMESTAMP)
ON CONFLICT (username) DO NOTHING;

-- Asignar roles a usuarios de prueba
INSERT INTO usuario_rol (usuario_id, rol_id, fecha_asignacion, activo)
SELECT 
    u.id,
    r.id,
    CURRENT_TIMESTAMP,
    true
FROM usuario u, rol r
WHERE 
    (u.username = 'vendedor' AND r.nombre = 'VENDEDOR') OR
    (u.username = 'jefe' AND r.nombre = 'JEFE_VENTAS') OR
    (u.username = 'finanzas' AND r.nombre = 'FINANZAS') OR
    (u.username = 'operaciones' AND r.nombre = 'OPERACIONES')
ON CONFLICT (usuario_id, rol_id) DO NOTHING;

-- Insertar datos de prueba para tipos de cliente
INSERT INTO tipo_cliente (nombre, codigo, descripcion, estado, fecha_creacion)
VALUES 
    ('Civil', 'CIV', 'Cliente civil con cédula', true, CURRENT_TIMESTAMP),
    ('Militar', 'MIL', 'Personal militar activo', true, CURRENT_TIMESTAMP),
    ('Empresa Seguridad', 'EMP', 'Empresa de seguridad privada', true, CURRENT_TIMESTAMP),
    ('Deportista', 'DEP', 'Deportista federado', true, CURRENT_TIMESTAMP)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar datos de prueba para tipos de identificación
INSERT INTO tipo_identificacion (nombre, codigo, descripcion, estado, fecha_creacion)
VALUES 
    ('Cédula', 'CED', 'Cédula de identidad ecuatoriana', true, CURRENT_TIMESTAMP),
    ('RUC', 'RUC', 'Registro Único de Contribuyentes', true, CURRENT_TIMESTAMP),
    ('Pasaporte', 'PAS', 'Pasaporte ecuatoriano', true, CURRENT_TIMESTAMP)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar datos de prueba para tipos de proceso
INSERT INTO tipo_proceso (nombre, codigo, descripcion, estado, fecha_creacion)
VALUES 
    ('Cupo Civil', 'CUPO_CIV', 'Proceso de importación para cupo civil', true, CURRENT_TIMESTAMP),
    ('Excepción Militar', 'EXC_MIL', 'Proceso de importación para excepción militar', true, CURRENT_TIMESTAMP)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar datos de prueba para categorías de armas
INSERT INTO categoria_arma (nombre, descripcion, estado, fecha_creacion)
VALUES 
    ('Pistolas', 'Pistolas semiautomáticas', true, CURRENT_TIMESTAMP),
    ('Rifles', 'Rifles de caza y deporte', true, CURRENT_TIMESTAMP),
    ('Escopetas', 'Escopetas de caza', true, CURRENT_TIMESTAMP);

-- Insertar datos de prueba para modelos de armas
INSERT INTO modelo_arma (codigo, nombre, calibre, capacidad, precio_referencia, categoria_id, estado, fecha_creacion)
SELECT 
    'GLOCK-17',
    'Glock 17',
    '9mm',
    17,
    1200.00,
    c.id,
    true,
    CURRENT_TIMESTAMP
FROM categoria_arma c WHERE c.nombre = 'Pistolas'
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO modelo_arma (codigo, nombre, calibre, capacidad, precio_referencia, categoria_id, estado, fecha_creacion)
SELECT 
    'AR-15',
    'AR-15 Sport',
    '5.56mm',
    30,
    2500.00,
    c.id,
    true,
    CURRENT_TIMESTAMP
FROM categoria_arma c WHERE c.nombre = 'Rifles'
ON CONFLICT (codigo) DO NOTHING;

-- Mostrar información de los usuarios creados
SELECT 
    'USUARIOS CREADOS:' as info,
    '' as detail
UNION ALL
SELECT 
    'Admin:' as info,
    'admin@armasimportacion.com / admin123' as detail
UNION ALL
SELECT 
    'Vendedor:' as info,
    'vendedor@test.com / admin123' as detail
UNION ALL
SELECT 
    'Jefe Ventas:' as info,
    'jefe@test.com / admin123' as detail
UNION ALL
SELECT 
    'Finanzas:' as info,
    'finanzas@test.com / admin123' as detail
UNION ALL
SELECT 
    'Operaciones:' as info,
    'operaciones@test.com / admin123' as detail; 
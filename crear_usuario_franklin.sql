-- Script para crear usuario Franklin Endara con roles FINANZAS y JEFE DE VENTAS
-- Email: franklin.endara@hotmail.com
-- Password: admin123 (por defecto)

-- 1. Crear el usuario
INSERT INTO usuario (
    bloqueado, 
    intentos_login, 
    fecha_creacion, 
    telefono_principal, 
    estado, 
    username, 
    apellidos, 
    email, 
    nombres, 
    direccion, 
    password_hash
) VALUES (
    false, 
    0, 
    NOW(), 
    '0999999998', 
    'ACTIVO', 
    'franklin.endara', 
    'Endara', 
    'franklin.endara@hotmail.com', 
    'Franklin', 
    'Quito, Ecuador', 
    'admin123'
) ON CONFLICT (username) DO UPDATE
SET 
    email = 'franklin.endara@hotmail.com',
    nombres = 'Franklin',
    apellidos = 'Endara',
    estado = 'ACTIVO',
    fecha_creacion = NOW();

-- 2. Asignar rol FINANCE (Finanzas)
INSERT INTO usuario_rol (usuario_id, rol_id, activo, fecha_asignacion)
SELECT 
    u.id, 
    r.id, 
    true, 
    NOW()
FROM usuario u
CROSS JOIN rol r
WHERE u.username = 'franklin.endara'
    AND r.codigo = 'FINANCE'
ON CONFLICT (usuario_id, rol_id) DO UPDATE
SET 
    activo = true,
    fecha_asignacion = NOW();

-- 3. Asignar rol SALES_CHIEF (Jefe de Ventas)
INSERT INTO usuario_rol (usuario_id, rol_id, activo, fecha_asignacion)
SELECT 
    u.id, 
    r.id, 
    true, 
    NOW()
FROM usuario u
CROSS JOIN rol r
WHERE u.username = 'franklin.endara'
    AND r.codigo = 'SALES_CHIEF'
ON CONFLICT (usuario_id, rol_id) DO UPDATE
SET 
    activo = true,
    fecha_asignacion = NOW();

-- 4. Verificar creación
SELECT 
    u.id,
    u.username,
    u.email,
    u.nombres,
    u.apellidos,
    u.estado,
    r.codigo AS rol_codigo,
    r.nombre AS rol_nombre,
    ur.activo AS rol_activo
FROM usuario u
INNER JOIN usuario_rol ur ON u.id = ur.usuario_id
INNER JOIN rol r ON ur.rol_id = r.id
WHERE u.username = 'franklin.endara'
ORDER BY r.codigo;


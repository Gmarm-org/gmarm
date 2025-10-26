# 🔧 FIX: Admin sin Roles - No puede acceder al sistema

## ❌ Problema

El usuario administrador aparece sin roles asignados:
```
Usuario: ADMINISTRADOR SISTEMA
Email: admin@armasimportacion.com
Roles: (vacío)
```

Y muestra error: "Lo sentimos, no tienes los permisos necesarios para acceder a esta sección del sistema."

---

## 🔍 Causa

La base de datos en el servidor no tiene los roles asignados correctamente a los usuarios. Esto puede pasar si:
1. La base de datos se creó pero el SQL maestro no se ejecutó completamente
2. Hubo un error durante la inicialización
3. Los datos fueron borrados accidentalmente

---

## ✅ SOLUCIÓN RÁPIDA (Opción 1): Re-ejecutar SQL Maestro

### En el servidor de desarrollo:

```bash
# 1. Conectarse al servidor
ssh ubuntu@72.167.52.14

# 2. Ir al directorio del proyecto
cd /home/ubuntu/deploy/dev

# 3. Ejecutar el SQL maestro completo
cat datos/00_gmarm_completo.sql | docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev

# 4. Verificar que los roles se asignaron
docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "
SELECT u.nombre_completo, u.email, STRING_AGG(r.codigo, ', ') as roles
FROM usuario u
LEFT JOIN usuario_rol ur ON u.id = ur.usuario_id
LEFT JOIN rol r ON ur.rol_id = r.id
GROUP BY u.id, u.nombre_completo, u.email
ORDER BY u.nombre_completo;
"
```

**Resultado esperado:**
```
      nombre_completo      |            email             |    roles
---------------------------+------------------------------+-------------
 ADMINISTRADOR SISTEMA     | admin@armasimportacion.com  | ADMIN
 Finanzas Test            | finanzas@test.com            | FINANCE
 Jefe Test                | jefe@test.com                | SALES_CHIEF
 Juan Vendedor            | vendedor@test.com            | VENDOR
 Operaciones Test         | operaciones@test.com         | OPERATIONS
```

---

## ✅ SOLUCIÓN ALTERNATIVA (Opción 2): Script de Fix

### Ejecutar script específico de corrección:

```bash
# En el servidor
cd /home/ubuntu/deploy/dev

# Ejecutar script de fix
cat datos/fix_admin_roles.sql | docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev
```

---

## ✅ SOLUCIÓN DEFINITIVA (Opción 3): Reset Completo

Si las opciones anteriores no funcionan, hacer reset completo de la BD:

```bash
# En el servidor
cd /home/ubuntu/deploy/dev

# Usar el script de reset
chmod +x scripts/reset-dev-db.sh
./scripts/reset-dev-db.sh

# O manualmente:
docker-compose -f docker-compose.dev.yml down -v
docker volume rm gmarm_postgres_data_dev
docker-compose -f docker-compose.dev.yml up -d --build

# Esperar 2-3 minutos para que todo inicie
sleep 180

# Verificar que los datos están correctos
docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "SELECT COUNT(*) FROM usuario;"
docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "SELECT COUNT(*) FROM usuario_rol;"
```

---

## 🔍 Verificación Post-Fix

### 1. Verificar en la base de datos:

```bash
# Conectarse a PostgreSQL
docker exec -it gmarm-postgres-dev psql -U postgres -d gmarm_dev

# Verificar usuarios y roles
SELECT 
    u.nombre_completo,
    u.email,
    STRING_AGG(r.codigo, ', ') as roles,
    COUNT(ur.id) as num_roles
FROM usuario u
LEFT JOIN usuario_rol ur ON u.id = ur.usuario_id
LEFT JOIN rol r ON ur.rol_id = r.id
GROUP BY u.id, u.nombre_completo, u.email
ORDER BY u.nombre_completo;

-- Salir de psql
\q
```

### 2. Probar en el navegador:

1. **Logout**: Si estás logueado, hacer logout
   - URL: http://72.167.52.14:5173/login
   - En el navegador, borrar cookies/cache o usar ventana incógnita

2. **Login nuevamente**:
   - Email: `admin@armasimportacion.com`
   - Password: `admin123`

3. **Verificar roles**:
   - Deberías ver el dashboard de administrador
   - NO deberías ver mensaje de "sin permisos"

---

## 🚨 Si el Problema Persiste

### Verificar que el backend está retornando los roles correctamente:

```bash
# 1. Login y obtener token
curl -X POST http://72.167.52.14:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@armasimportacion.com",
    "password": "admin123"
  }'

# Copiar el token de la respuesta

# 2. Verificar usuario actual (usar el token copiado)
curl -X GET http://72.167.52.14:8080/api/auth/me \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

**Respuesta esperada:**
```json
{
  "id": 1,
  "nombreCompleto": "ADMINISTRADOR SISTEMA",
  "email": "admin@armasimportacion.com",
  "roles": [
    {
      "id": 1,
      "rol": {
        "id": 1,
        "codigo": "ADMIN",
        "nombre": "Administrador"
      }
    }
  ]
}
```

---

## 🔄 Problema: No puedo volver al login

Si estás atrapado en la página de "sin permisos" y no puedes volver al login:

### Solución 1: URL directa
```
http://72.167.52.14:5173/login
```

### Solución 2: Borrar localStorage y cookies

En el navegador, presiona F12 (Developer Tools), luego en la consola:

```javascript
// Borrar todo el localStorage
localStorage.clear();

// Borrar token específico
localStorage.removeItem('token');

// Recargar página
location.href = '/login';
```

### Solución 3: Ventana incógnita
- Abre una nueva ventana en modo incógnito/privado
- Ve a: http://72.167.52.14:5173/login

### Solución 4: Borrar cache del navegador
- Chrome: Ctrl + Shift + Delete → Borrar todo
- Firefox: Ctrl + Shift + Delete → Borrar todo
- Edge: Ctrl + Shift + Delete → Borrar todo

---

## 📝 Prevención Futura

Para evitar este problema:

### 1. Asegurar que el SQL maestro se ejecuta completamente:

Verificar en `docker-compose.dev.yml`:

```yaml
services:
  postgres_dev:
    # ...
    volumes:
      - postgres_data_dev:/var/lib/postgresql/data
      - ./datos/00_gmarm_completo.sql:/docker-entrypoint-initdb.d/init.sql:ro
```

### 2. Verificar logs de PostgreSQL al iniciar:

```bash
docker logs gmarm-postgres-dev --tail 100
```

Debe mostrar:
```
=== RESUMEN DE INSTALACIÓN ===
Usuarios creados: 5
Roles creados: 5
...
```

### 3. Agregar verificación automática al deployment:

En `deploy-server.sh`, después de iniciar servicios:

```bash
# Verificar que hay usuarios con roles
ROLES_COUNT=$(docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -t -c "SELECT COUNT(*) FROM usuario_rol;")

if [ "$ROLES_COUNT" -lt 5 ]; then
    echo "⚠️ WARNING: Pocos roles asignados, re-ejecutando SQL maestro..."
    cat datos/00_gmarm_completo.sql | docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev
fi
```

---

## 🆘 Resumen de Comandos

```bash
# OPCIÓN 1: Re-ejecutar SQL maestro (MÁS RÁPIDO)
cat datos/00_gmarm_completo.sql | docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev

# OPCIÓN 2: Script de fix específico
cat datos/fix_admin_roles.sql | docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev

# OPCIÓN 3: Reset completo (MÁS SEGURO)
docker-compose -f docker-compose.dev.yml down -v && \
docker volume rm gmarm_postgres_data_dev && \
docker-compose -f docker-compose.dev.yml up -d --build

# VERIFICACIÓN
docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "
SELECT u.nombre_completo, u.email, STRING_AGG(r.codigo, ', ') as roles
FROM usuario u
LEFT JOIN usuario_rol ur ON u.id = ur.usuario_id
LEFT JOIN rol r ON ur.rol_id = r.id
GROUP BY u.id, u.nombre_completo, u.email;
"
```

---

**✅ Después de aplicar cualquiera de estas soluciones, haz logout y login nuevamente en el navegador.**

*Última actualización: Octubre 2024*

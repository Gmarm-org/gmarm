# 👥 Agregar Vendedores para Fase Piloto

## 📋 Vendedores a Agregar

| Nombre | Email | Rol | Password Temporal |
|--------|-------|-----|-------------------|
| Karolina Pazmiño | karritogeova@hotmail.com | VENDOR | admin123 |
| Rossy Revelo | rossy-revelo@hotmail.com | VENDOR | admin123 |

⚠️ **IMPORTANTE:** Las contraseñas deben ser cambiadas en la primera sesión por seguridad.

---

## 🚀 EJECUCIÓN EN SERVIDOR DE DESARROLLO

### Opción 1: Ejecutar desde el servidor

```bash
# 1. SSH al servidor
ssh ubuntu@72.167.52.14

# 2. Ir al directorio del proyecto
cd /home/ubuntu/deploy/dev

# 3. Pull los últimos cambios (incluye el script SQL)
git pull origin dev

# 4. Ejecutar el script SQL
cat datos/add_vendedores_piloto.sql | docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev

# 5. Verificar que se agregaron correctamente
docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "
SELECT u.nombres, u.apellidos, u.email, r.codigo as rol
FROM usuario u
INNER JOIN usuario_rol ur ON u.id = ur.usuario_id
INNER JOIN rol r ON ur.rol_id = r.id
WHERE u.email IN ('karritogeova@hotmail.com', 'rossy-revelo@hotmail.com');
"
```

**Resultado esperado:**
```
  nombres  | apellidos |           email              | rol
-----------+-----------+------------------------------+--------
 Karolina  | Pazmiño   | karritogeova@hotmail.com     | VENDOR
 Rossy     | Revelo    | rossy-revelo@hotmail.com     | VENDOR
```

---

### Opción 2: Ejecutar localmente (si tienes acceso directo a la BD)

```bash
# Desde tu máquina local
psql -h 72.167.52.14 -U postgres -d gmarm_dev -f datos/add_vendedores_piloto.sql
```

---

## ✅ Verificación Post-Ejecución

### 1. Verificar en la Base de Datos

```bash
# Ver todos los vendedores
docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "
SELECT 
    u.id,
    u.nombres || ' ' || u.apellidos as nombre_completo,
    u.email,
    u.username,
    u.estado,
    r.codigo as rol
FROM usuario u
INNER JOIN usuario_rol ur ON u.id = ur.usuario_id
INNER JOIN rol r ON ur.rol_id = r.id
WHERE r.codigo = 'VENDOR'
ORDER BY u.fecha_creacion DESC;
"
```

### 2. Probar Login en el Navegador

1. **Ir a:** `http://72.167.52.14:5173/login`

2. **Probar con Karolina:**
   - Email: `karritogeova@hotmail.com`
   - Password: `admin123`
   - Debe acceder al dashboard de vendedor ✅

3. **Probar con Rossy:**
   - Email: `rossy-revelo@hotmail.com`
   - Password: `admin123`
   - Debe acceder al dashboard de vendedor ✅

---

## 🔐 Cambiar Contraseñas (Primera Sesión)

### Desde la Interfaz Web:

1. Login con credenciales temporales
2. Ir a **Perfil** o **Configuración**
3. Cambiar contraseña
4. Usar contraseña fuerte (mínimo 8 caracteres, mayúsculas, minúsculas, números)

### Desde la Base de Datos (si es necesario):

```bash
# Cambiar contraseña de Karolina
docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "
UPDATE usuario 
SET password_hash = 'NUEVA_CONTRASEÑA_AQUI'
WHERE email = 'karritogeova@hotmail.com';
"

# Cambiar contraseña de Rossy
docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "
UPDATE usuario 
SET password_hash = 'NUEVA_CONTRASEÑA_AQUI'
WHERE email = 'rossy-revelo@hotmail.com';
"
```

⚠️ **NOTA:** Las contraseñas en el sistema actual se almacenan en texto plano (esto debe cambiarse a bcrypt en producción).

---

## 📊 Información de los Vendedores

### Karolina Pazmiño
- **Nombre Completo:** Karolina Pazmiño
- **Email:** karritogeova@hotmail.com
- **Username:** karolina.pazmino
- **Rol:** VENDOR (Vendedor)
- **Estado:** ACTIVO
- **Password Temporal:** admin123

### Rossy Revelo
- **Nombre Completo:** Rossy Revelo
- **Email:** rossy-revelo@hotmail.com
- **Username:** rossy.revelo
- **Rol:** VENDOR (Vendedor)
- **Estado:** ACTIVO
- **Password Temporal:** admin123

---

## 🔄 Actualizar Información (si es necesario)

### Cambiar Teléfono:

```sql
UPDATE usuario 
SET telefono_principal = '0999123456'
WHERE email = 'karritogeova@hotmail.com';
```

### Cambiar Dirección:

```sql
UPDATE usuario 
SET direccion = 'Guayaquil, Ecuador'
WHERE email = 'rossy-revelo@hotmail.com';
```

### Desactivar Usuario:

```sql
UPDATE usuario 
SET estado = 'INACTIVO'
WHERE email = 'karritogeova@hotmail.com';
```

### Reactivar Usuario:

```sql
UPDATE usuario 
SET estado = 'ACTIVO'
WHERE email = 'karritogeova@hotmail.com';
```

---

## 🚨 Troubleshooting

### Problema: "Email ya existe"

Si el email ya está registrado, el script hará UPDATE en vez de INSERT. Verifica:

```bash
docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "
SELECT * FROM usuario WHERE email = 'karritogeova@hotmail.com';
"
```

### Problema: "No pueden hacer login"

Verifica que tengan el rol asignado:

```bash
docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "
SELECT u.email, r.codigo, ur.activo
FROM usuario u
LEFT JOIN usuario_rol ur ON u.id = ur.usuario_id
LEFT JOIN rol r ON ur.rol_id = r.id
WHERE u.email IN ('karritogeova@hotmail.com', 'rossy-revelo@hotmail.com');
"
```

Si no tienen rol, ejecutar:

```bash
cat datos/add_vendedores_piloto.sql | docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev
```

### Problema: "Acceso denegado después de login"

1. Limpiar localStorage en el navegador:
   ```javascript
   localStorage.clear()
   location.reload()
   ```

2. Verificar que el rol esté activo:
   ```sql
   SELECT * FROM usuario_rol WHERE usuario_id = (SELECT id FROM usuario WHERE email = 'karritogeova@hotmail.com');
   ```

---

## 📝 Notas Importantes

1. **Contraseñas Temporales:** 
   - DEBEN ser cambiadas en la primera sesión
   - No compartir las credenciales temporales por email o mensajes no seguros

2. **Permisos de Vendedor:**
   - Pueden crear clientes
   - Pueden ver sus propios clientes
   - NO pueden ver clientes de otros vendedores
   - NO pueden acceder a funciones de admin

3. **Capacitación:**
   - Los vendedores deben ser capacitados antes de usar el sistema
   - Verificar que entienden el flujo de creación de clientes

4. **Monitoreo:**
   - Revisar la actividad de los vendedores regularmente
   - Verificar que los clientes se estén creando correctamente

---

## ✅ Checklist de Ejecución

- [ ] Pull de últimos cambios: `git pull origin dev`
- [ ] Ejecutar script SQL: `cat datos/add_vendedores_piloto.sql | docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev`
- [ ] Verificar usuarios creados en BD
- [ ] Probar login con Karolina
- [ ] Probar login con Rossy
- [ ] Verificar acceso a dashboard de vendedor
- [ ] Solicitar cambio de contraseñas
- [ ] Capacitar a los vendedores
- [ ] Monitorear primeras sesiones

---

## 📞 Soporte

Si hay problemas:

1. Verificar logs del backend: `docker logs gmarm-backend-dev --tail 100`
2. Verificar logs de PostgreSQL: `docker logs gmarm-postgres-dev --tail 50`
3. Consultar documentación: `FIX_ADMIN_NO_ROLES.md`
4. Crear issue en GitHub si persiste el problema

---

*Última actualización: Octubre 2024*
*Vendedores para: Fase Piloto - Desarrollo*

# 📧 Guía para Probar la Verificación de Email

## 🎯 Objetivo
Probar el flujo completo de verificación de email con datos personales del cliente.

---

## 📋 Pasos para Probar

### **Paso 1: Crear un Cliente con Email**

1. Inicia sesión como **Vendedor** en el sistema
2. Ve a **"Crear Cliente"**
3. Completa los datos del cliente, incluyendo:
   - ✅ **Email** (obligatorio para que se envíe el correo)
   - ✅ Todos los datos personales (nombres, apellidos, cédula, dirección, etc.)
   - ✅ Responde las preguntas del formulario
   - ✅ **IMPORTANTE**: Si respondes "NO" a "¿Tiene cuenta en el Sicoar?", verás la advertencia
4. Haz clic en **"Guardar Cliente"**

**Resultado esperado:**
- ✅ El cliente se crea exitosamente
- ✅ Se genera un token de verificación en la base de datos
- ✅ Se envía un correo al email del cliente (si SMTP está configurado)

---

### **Paso 2: Obtener el Token de Verificación**

Tienes dos opciones:

#### **Opción A: Desde el Correo Electrónico** (si SMTP está configurado)

1. Revisa el correo del cliente que creaste
2. Busca el correo con asunto: **"Verifica tus datos personales - GMARM"**
3. El correo contiene:
   - ✅ Todos los datos personales del cliente
   - ✅ Un enlace de verificación: `http://localhost:5173/verify?token=XXXXX-XXXXX-XXXXX`
   - ✅ Si respondiste "NO" a Sicoar, verás una advertencia en rojo

#### **Opción B: Desde la Base de Datos** (más rápido para pruebas)

Ejecuta este comando en PowerShell:

```powershell
docker exec gmarm-postgres-local psql -U postgres -d gmarm_dev -c "SELECT c.id, c.nombres, c.apellidos, c.email, evt.token, evt.expires_at, evt.used FROM cliente c INNER JOIN email_verification_token evt ON c.id = evt.cliente_id WHERE c.email IS NOT NULL AND evt.used = false ORDER BY evt.created_at DESC LIMIT 1;"
```

**Ejemplo de resultado:**
```
 id | nombres | apellidos | email              | token                                 | expires_at           | used 
----+---------+-----------+---------------------+--------------------------------------+----------------------+------
  3 | Juan    | Pérez     | juan@example.com    | a1b2c3d4-e5f6-7890-abcd-ef1234567890 | 2025-12-31 16:00:00  | f
```

**Copia el token** (columna `token`)

---

### **Paso 3: Acceder a la Página de Verificación**

1. Abre tu navegador
2. Ve a la siguiente URL (reemplaza `TOKEN_AQUI` con el token que obtuviste):

```
http://localhost:5173/verify?token=TOKEN_AQUI
```

**Ejemplo:**
```
http://localhost:5173/verify?token=a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

### **Paso 4: Revisar los Datos Personales**

Al acceder a la URL, deberías ver:

1. **Estado "review"** (Revisión):
   - ✅ Una tabla con todos los datos personales del cliente:
     - Nombres y Apellidos
     - Tipo de Identificación
     - Número de Identificación
     - Correo Electrónico
     - Dirección
     - Provincia
     - Cantón
     - Fecha de Nacimiento
     - Teléfono Principal
     - Teléfono Secundario
   - ✅ Si respondiste "NO" a Sicoar, verás una advertencia en amarillo
   - ✅ Dos botones:
     - **"Confirmar - Todos los Datos son Correctos"** (verde)
     - **"Datos Incorrectos"** (rojo)

---

### **Paso 5: Confirmar o Reportar Datos Incorrectos**

#### **Si los datos son correctos:**
1. Haz clic en **"Confirmar - Todos los Datos son Correctos"**
2. El sistema verifica el token
3. Verás un mensaje de éxito: **"¡Verificación Exitosa!"**
4. El cliente queda marcado como `email_verificado = true` en la BD

#### **Si los datos son incorrectos:**
1. Haz clic en **"Datos Incorrectos"**
2. Verás un mensaje indicando que debes contactar al vendedor
3. El token NO se marca como usado (puedes intentar de nuevo)

---

## 🔍 Verificar en la Base de Datos

### **Verificar que el cliente fue verificado:**

```powershell
docker exec gmarm-postgres-local psql -U postgres -d gmarm_dev -c "SELECT id, nombres, apellidos, email, email_verificado FROM cliente WHERE email IS NOT NULL ORDER BY id DESC LIMIT 5;"
```

**Resultado esperado después de verificar:**
```
 id | nombres | apellidos | email              | email_verificado 
----+---------+-----------+--------------------+------------------
  3 | Juan    | Pérez     | juan@example.com   | t
```

### **Verificar que el token fue usado:**

```powershell
docker exec gmarm-postgres-local psql -U postgres -d gmarm_dev -c "SELECT token, cliente_id, used, used_at FROM email_verification_token WHERE cliente_id = 3;"
```

**Resultado esperado después de verificar:**
```
 token                                 | cliente_id | used | used_at           
---------------------------------------+------------+------+-------------------
 a1b2c3d4-e5f6-7890-abcd-ef1234567890 |          3 | t    | 2025-12-29 23:45:00
```

---

## ⚠️ Casos de Prueba Importantes

### **1. Token Inválido**
- URL: `http://localhost:5173/verify?token=token-invalido`
- **Resultado esperado**: Error "Token de verificación inválido"

### **2. Token Expirado**
- Crear un token y modificar su `expires_at` en la BD a una fecha pasada
- **Resultado esperado**: Error "El token de verificación ha expirado"

### **3. Token Ya Usado**
- Intentar usar el mismo token dos veces
- **Resultado esperado**: Error "Este enlace de verificación ya fue utilizado"

### **4. Cliente con Respuesta "NO" a Sicoar**
- Crear cliente respondiendo "NO" a "¿Tiene cuenta en el Sicoar?"
- **Resultado esperado**: 
  - Advertencia en el formulario (amarillo)
  - Advertencia en el correo (rojo)
  - Advertencia en la página de verificación (amarillo)

---

## 📧 Configuración de SMTP (Opcional)

Si quieres recibir los correos reales, configura SMTP en:

**Archivo:** `backend/src/main/resources/application-local.properties`

```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=tu-email@gmail.com
spring.mail.password=tu-contraseña-de-aplicacion
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

**Nota:** Para Gmail, necesitas usar una "Contraseña de aplicación" en lugar de tu contraseña normal.

---

## 🐛 Solución de Problemas

### **Problema: No se envía el correo**
- ✅ Verifica que el cliente tenga email
- ✅ Verifica la configuración SMTP
- ✅ Revisa los logs del backend: `docker-compose -f docker-compose.local.yml logs backend_local | Select-String "correo"`

### **Problema: Token no encontrado**
- ✅ Verifica que el token existe en la BD
- ✅ Verifica que el token no esté usado (`used = false`)
- ✅ Verifica que el token no esté expirado (`expires_at > NOW()`)

### **Problema: Página de verificación no carga**
- ✅ Verifica que el frontend esté corriendo en `http://localhost:5173`
- ✅ Verifica que la ruta `/verify` esté configurada en `App.tsx`
- ✅ Revisa la consola del navegador para errores

---

## ✅ Checklist de Prueba

- [ ] Crear cliente con email
- [ ] Verificar que se creó el token en la BD
- [ ] Obtener el token (desde correo o BD)
- [ ] Acceder a `/verify?token=XXX`
- [ ] Verificar que se muestran todos los datos personales
- [ ] Verificar advertencia de Sicoar (si aplica)
- [ ] Confirmar datos correctos
- [ ] Verificar que `email_verificado = true` en la BD
- [ ] Verificar que el token está marcado como usado
- [ ] Probar con token inválido
- [ ] Probar con token expirado
- [ ] Probar con token ya usado

---

## 📝 Notas

- Los tokens expiran en **48 horas**
- Los tokens son de **un solo uso**
- Si el cliente no tiene email, NO se envía correo (pero el cliente se crea exitosamente)
- La advertencia de Sicoar solo aparece si respondes "NO" a la pregunta correspondiente


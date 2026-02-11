# 📧 Configuración de Envío de Emails - GMARM

**Guía paso a paso para configurar el envío automático de emails**

---

## ℹ️ ¿Qué es esto?

El sistema GMARM puede enviar emails automáticamente a los clientes cuando:
- ✅ Se crea un nuevo cliente (envía contrato adjunto)
- ✅ Se completa un proceso de compra
- ✅ Se genera una autorización de venta

Para que esto funcione, **necesitas configurar una cuenta de Gmail** que el sistema usará para enviar los correos.

---

## 🚀 PASO 1: Preparar tu Cuenta de Gmail

### 1.1 Elige una cuenta de Gmail

Puedes usar:
- **Opción A**: Una cuenta Gmail existente (ej: `tuempresa@gmail.com`)
- **Opción B**: Crear una cuenta nueva específica para el sistema (recomendado):
  - Ejemplo: `gmarm.notificaciones@gmail.com`
  - Ventaja: Separa emails del sistema de tu email personal

### 1.2 Habilitar "Verificación en 2 Pasos"

**⚠️ REQUISITO OBLIGATORIO** - Sin esto NO funcionará

1. Inicia sesión en tu cuenta de Gmail
2. Ve a: **https://myaccount.google.com/security**
3. Busca la sección **"Verificación en 2 pasos"**
4. Si dice **"Desactivada"**:
   - Haz clic en **"Activar"**
   - Sigue los pasos (te pedirá un número de teléfono)
   - Completa la configuración
5. Verifica que ahora diga: **"Activada ✅"**

---

## 🔑 PASO 2: Generar Contraseña de Aplicación

### 2.1 Acceder a Contraseñas de Aplicación

1. Ve a: **https://myaccount.google.com/apppasswords**
2. Te pedirá iniciar sesión nuevamente (seguridad de Google)
3. Verás una página titulada **"Contraseñas de aplicaciones"**

### 2.2 Crear Nueva Contraseña

1. En **"Nombre de la aplicación"**, escribe: `GMARM Backend`
2. Haz clic en **"Crear"**
3. Google te mostrará una contraseña de **16 caracteres** dividida en 4 grupos:

```
┌──────────────────────────────────┐
│  Contraseña de aplicación        │
│                                  │
│  abcd efgh ijkl mnop            │
│                                  │
│  [Copiar]                        │
└──────────────────────────────────┘
```

4. **HAZ CLIC EN "COPIAR"** (o cópiala manualmente)
5. **GUÁRDALA EN UN LUGAR SEGURO** (no la verás de nuevo)

**⚠️ IMPORTANTE:**
- Esta contraseña se usa **SOLO para el sistema GMARM**
- **NO es tu contraseña normal de Gmail**
- Puedes generar múltiples contraseñas de aplicación
- Si la pierdes, puedes generar una nueva

---

## ⚙️ PASO 3: Configurar en el Sistema GMARM

### 3.1 Acceder a Configuración del Sistema

1. Inicia sesión en GMARM como **Admin**
2. Ve a: **Panel de Administración** (esquina superior derecha)
3. Haz clic en la pestaña: **"⚙️ Configuración Sistema"**

### 3.2 Editar Configuraciones SMTP

Busca y edita las siguientes claves (una por una):

#### **1. SMTP_USERNAME** ✏️
- **Valor actual**: `tu-email@gmail.com`
- **Nuevo valor**: `tuempresa@gmail.com` (tu email de Gmail real)
- **Ejemplo**: `gmarm.notificaciones@gmail.com`
- Haz clic en **"Guardar"**

#### **2. SMTP_PASSWORD** ✏️
- **Valor actual**: `tu-password-app`
- **Nuevo valor**: Pega la contraseña de 16 caracteres que copiaste
- **Ejemplo**: `abcdefghijklmnop` (SIN espacios)
- **⚠️ MUY IMPORTANTE**: Copia la contraseña **SIN espacios**
- Haz clic en **"Guardar"**

#### **3. EMAIL_NOTIFICACIONES** ✏️
- **Valor actual**: `notificaciones@gmarm.com`
- **Nuevo valor**: El **mismo email** que pusiste en `SMTP_USERNAME`
- **Ejemplo**: `gmarm.notificaciones@gmail.com`
- Haz clic en **"Guardar"**

#### **4. Verificar las demás (NO cambiar si usas Gmail):**
- ✅ `SMTP_HOST`: `smtp.gmail.com` ← **Dejar como está**
- ✅ `SMTP_PORT`: `587` ← **Dejar como está**
- ✅ `SMTP_AUTH`: `true` ← **Dejar como está**
- ✅ `SMTP_STARTTLS`: `true` ← **Dejar como está**

---

## 🔄 PASO 4: Reiniciar el Sistema

Para que los cambios surtan efecto, **debes reiniciar el backend**:

### **Opción A: Desde el Panel de Admin** (si está disponible)
- Buscar opción "Reiniciar Sistema" o "Reiniciar Servicios"

### **Opción B: Desde el Servidor** (si tienes acceso)

**En Local (tu computadora):**
```powershell
cd "ruta\al\proyecto\gmarm"
docker-compose -f docker-compose.local.yml restart backend_local
```

**En PROD (producción):**
```bash
cd /ruta/al/proyecto/gmarm
docker-compose -f docker-compose.prod.yml restart backend_prod
```

### **Espera 20-30 segundos** para que el backend se reinicie completamente.

---

## 🧪 PASO 5: Probar el Envío de Emails

### 5.1 Crear un Cliente de Prueba

1. Inicia sesión como **Vendedor**
2. Ve a **"Crear Nuevo Cliente"**
3. En el campo **"Email"**, pon **TU PROPIO EMAIL** (para verificar que llegue)
4. Completa los demás datos del formulario
5. Haz clic en **"Guardar"**

### 5.2 Verificar el Email Enviado

1. **Espera 10-20 segundos**
2. **Revisa tu bandeja de entrada** del email que configuraste
3. Deberías recibir un email:
   - **Asunto**: ✅ Contrato de Compra de Arma - GMARM
   - **De**: El email que configuraste (ej: `gmarm.notificaciones@gmail.com`)
   - **Adjunto**: `Contrato_GMARM.pdf`

### 5.3 Si NO llega el email

**Revisa**:
1. ✅ **Carpeta de Spam** - A veces llega ahí la primera vez
2. ✅ **Logs del sistema** - Contacta a soporte técnico para revisar logs
3. ✅ **Configuración** - Verifica que:
   - `SMTP_USERNAME` sea tu email completo
   - `SMTP_PASSWORD` sea la contraseña de 16 caracteres (sin espacios)
   - `EMAIL_NOTIFICACIONES` sea el mismo email

---

## 📋 Checklist de Configuración

Marca cada paso cuando lo completes:

- [ ] **Paso 1.1**: Cuenta de Gmail seleccionada
- [ ] **Paso 1.2**: Verificación en 2 pasos activada
- [ ] **Paso 2.1**: Accedido a https://myaccount.google.com/apppasswords
- [ ] **Paso 2.2**: Contraseña de aplicación generada y copiada
- [ ] **Paso 3.2.1**: `SMTP_USERNAME` editado con tu email
- [ ] **Paso 3.2.2**: `SMTP_PASSWORD` editado con contraseña de 16 caracteres
- [ ] **Paso 3.2.3**: `EMAIL_NOTIFICACIONES` editado con tu email
- [ ] **Paso 4**: Backend reiniciado
- [ ] **Paso 5**: Email de prueba recibido exitosamente

---

## ❓ Preguntas Frecuentes

### **1. ¿Puedo usar Outlook/Hotmail en lugar de Gmail?**
Sí, pero debes cambiar las configuraciones:
- `SMTP_HOST`: `smtp.office365.com`
- `SMTP_PORT`: `587`
- El resto es similar

### **2. ¿Cuántas contraseñas de aplicación puedo crear?**
Ilimitadas. Puedes crear una para cada sistema/aplicación.

### **3. ¿Qué pasa si pierdo la contraseña de aplicación?**
No hay problema:
1. Ve a: https://myaccount.google.com/apppasswords
2. Elimina la contraseña anterior
3. Crea una nueva
4. Actualiza `SMTP_PASSWORD` en el sistema

### **4. ¿Puedo usar un email diferente para ENVIAR y RECIBIR?**
Sí:
- `SMTP_USERNAME` + `SMTP_PASSWORD`: Email que **envía** los correos
- `EMAIL_NOTIFICACIONES`: Email que aparece como **remitente** (debe ser el mismo)
- Los clientes reciben en **su propio email** (el que ingresaste en el formulario)

### **5. ¿El sistema guarda mi contraseña de forma segura?**
Sí, está en la base de datos. **RECOMENDACIÓN para producción**:
- Encriptar la tabla `configuracion_sistema`
- Usar variables de entorno para credenciales sensibles

### **6. ¿Puedo cambiar los mensajes de los emails?**
Sí, sin tocar código:
- Ve a: `backend/src/main/resources/templates/email/`
- Edita los archivos `.html` (con cualquier editor de texto)
- Reinicia el backend
- Lee: `backend/src/main/resources/templates/email/README.md` para más detalles

---

## 🆘 Soporte

**Si tienes problemas:**
1. Verifica los **logs del backend**:
   ```bash
   docker logs gmarm-backend-local --tail 100
   # Busca líneas que empiecen con 📧 o ❌
   ```

2. Verifica que la configuración está bien guardada:
   - Admin → Configuración Sistema → Busca `SMTP_USERNAME`
   - Debe mostrar tu email (sin espacios extras)

3. Contacta a soporte técnico con:
   - Los logs del backend
   - Una captura de pantalla de la configuración SMTP

---

## 📝 Ejemplo Visual de Configuración

```
ANTES (valores por defecto):
┌─────────────────────────────────────────────┐
│ SMTP_USERNAME: tu-email@gmail.com          │
│ SMTP_PASSWORD: tu-password-app             │
│ EMAIL_NOTIFICACIONES: notificaciones@...   │
└─────────────────────────────────────────────┘

DESPUÉS (configurado correctamente):
┌─────────────────────────────────────────────┐
│ SMTP_USERNAME: gmarm.notif@gmail.com   ✅  │
│ SMTP_PASSWORD: abcdefghijklmnop        ✅  │
│ EMAIL_NOTIFICACIONES: gmarm.notif@...  ✅  │
└─────────────────────────────────────────────┘
```

---

**✅ Una vez configurado, el sistema enviará emails automáticamente sin intervención manual.**

---

**Última actualización**: 07/11/2025  
**Versión del sistema**: 1.0.0


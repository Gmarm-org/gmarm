# 📧 Email Templates - GMARM

## 📁 Ubicación
`backend/src/main/resources/templates/email/`

---

## 📄 Templates Disponibles

### 1. **contrato-cliente.html**
**Uso**: Enviado al cliente cuando se genera su contrato de compra  
**Variables disponibles**:
- `${nombreCliente}` - Nombre completo del cliente

**Cuándo se envía**: Al crear un nuevo cliente (POST /api/clientes)

---

### 2. **contrato-con-pago.html**
**Uso**: Enviado al cliente con detalles de pago  
**Variables disponibles**:
- `${nombreCliente}` - Nombre completo del cliente
- `${tipoPago}` - Tipo de pago (CONTADO, CREDITO, etc.)
- `${montoTotal}` - Monto total formateado (ej: $1,500.00)

**Cuándo se envía**: Cuando se llama `emailService.enviarContratoConAdjunto()`

---

### 3. **confirmacion-proceso.html**
**Uso**: Confirmación de proceso completado  
**Variables disponibles**:
- `${nombreCliente}` - Nombre completo del cliente

**Cuándo se envía**: Cuando se llama `emailService.enviarConfirmacionProceso()`

---

### 4. **notificacion-vendedor.html**
**Uso**: Notifica al vendedor que se generó un contrato  
**Variables disponibles**:
- `${nombreVendedor}` - Nombre del vendedor
- `${nombreCliente}` - Nombre del cliente
- `${ciCliente}` - CI/RUC del cliente
- `${montoTotal}` - Monto total formateado

**Cuándo se envía**: Cuando se llama `emailService.enviarConfirmacionContratoVendedor()`

---

### 5. **contrato-con-documentos.html**
**Uso**: Enviado al cliente con lista de documentos procesados  
**Variables disponibles**:
- `${nombreCliente}` - Nombre completo del cliente
- `${documentos}` - Lista de documentos (puede ser null)
- `${respuestas}` - Lista de respuestas (puede ser null)

**Cuándo se envía**: Cuando se llama `emailService.enviarContratoCliente()`

---

## ✏️ Cómo Editar los Templates

### **Sintaxis Thymeleaf**

**Variables simples:**
```html
<p th:text="${nombreCliente}">Nombre por defecto</p>
```

**Condicionales:**
```html
<div th:if="${documentos != null and !documentos.isEmpty()}">
    <!-- Contenido solo si hay documentos -->
</div>
```

**Listas:**
```html
<ul>
    <li th:each="doc : ${documentos}" th:text="${doc.tipoDocumento}">Documento</li>
</ul>
```

**Formato de texto:**
```html
<h2 th:text="'Estimado/a ' + ${nombreCliente} + ','">Estimado/a Cliente,</h2>
```

---

## 🎨 Estilos CSS

**Los estilos están inline en cada template**. Para cambiar colores, tamaños, etc., edita el bloque `<style>` en el `<head>` de cada archivo.

**Ejemplo:**
```html
<style>
    .header { 
        background-color: #2563eb;  /* Cambiar color de fondo del header */
        color: white;                /* Cambiar color del texto */
        padding: 20px;               /* Cambiar espaciado */
    }
</style>
```

---

## 🔧 Configuración SMTP

**✅ La configuración SMTP se gestiona desde la BASE DE DATOS (tabla `configuracion_sistema`)**

**Para configurar SMTP:**
1. Ir a: **Admin → Configuración Sistema**
2. Editar las siguientes claves:

| Clave | Valor por Defecto | Descripción |
|-------|-------------------|-------------|
| `SMTP_HOST` | `smtp.gmail.com` | Servidor SMTP |
| `SMTP_PORT` | `587` | Puerto (587=TLS, 465=SSL) |
| `SMTP_USERNAME` | `tu-email@gmail.com` | Email de la cuenta |
| `SMTP_PASSWORD` | `tu-password-app` | **Contraseña de aplicación** |
| `SMTP_AUTH` | `true` | Requiere autenticación |
| `SMTP_STARTTLS` | `true` | Habilitar STARTTLS |
| `EMAIL_NOTIFICACIONES` | `notificaciones@gmarm.com` | Email remitente |

**⚠️ Para Gmail:**
1. Habilitar "Verificación en 2 pasos" en tu cuenta Google
2. Generar "Contraseña de aplicación" en: https://myaccount.google.com/apppasswords
3. Usar esa contraseña en `SMTP_PASSWORD` (NO la contraseña normal)

**✅ Ventajas de configuración en BD:**
- ✅ Se puede cambiar desde el panel de admin (sin reiniciar)
- ✅ Diferente configuración por ambiente (local, dev, prod)
- ✅ No exponer credenciales en archivos de configuración

---

## 📊 Base de Datos - Email de Notificaciones

El email remitente se configura en la tabla `configuracion_sistema`:

```sql
INSERT INTO configuracion_sistema (clave, valor, descripcion, editable)
VALUES ('EMAIL_NOTIFICACIONES', 'notificaciones@gmarm.com', 'Email para enviar notificaciones', true);
```

**Para cambiar el email remitente**, editar en Admin → Configuración Sistema → `EMAIL_NOTIFICACIONES`

---

## 🧪 Testing de Emails

### **Probar envío de email al crear cliente:**

1. Como Vendedor, crear un nuevo cliente con un **email válido**
2. Verificar logs del backend:
   ```
   📧 Enviando contrato por email a: cliente@example.com
   ✅ Email enviado exitosamente a: cliente@example.com
   ```
3. Revisar la bandeja del cliente para el email

### **Si falla el envío:**
- Verificar configuración SMTP en `application.properties`
- Verificar que `EMAIL_NOTIFICACIONES` existe en la BD
- Revisar logs del backend para errores específicos

---

## 📝 Notas Importantes

1. **Los emails se envían de forma asíncrona** - Si falla el envío, NO afecta la creación del cliente
2. **Los templates son HTML + CSS inline** - Compatibles con todos los clientes de email
3. **Fácil edición** - Solo editar los archivos `.html`, no tocar código Java
4. **Multiidioma** - En el futuro se pueden crear carpetas `email/es/`, `email/en/`, etc.

---

**🎯 Para agregar un nuevo template:**

1. Crear archivo `nuevo-template.html` en esta carpeta
2. Usar sintaxis Thymeleaf para variables dinámicas
3. En `EmailService.java`, crear método que use:
   ```java
   Context context = new Context();
   context.setVariable("variable1", valor1);
   String html = templateEngine.process("email/nuevo-template", context);
   ```

---

**📚 Documentación Thymeleaf:**  
https://www.thymeleaf.org/doc/tutorials/3.0/usingthymeleaf.html


# 📋 ACTUALIZACIONES SPRINT 1

## 📅 Fecha de Creación: 2024-12-27

Este documento mapea todas las actualizaciones y cambios pendientes para el Sprint 1 del sistema GMARM.

---

## 🎯 OBJETIVO DEL SPRINT

Mejorar el flujo de gestión de clientes y contratos, implementando controles manuales para el envío de documentos y mejorando la experiencia del usuario.

---

## 📝 CAMBIOS PLANEADOS

### 1. 🔄 **CAMBIO DE FLUJO: Envío de Contrato**

#### **Estado Actual:**
- ❌ El contrato se envía automáticamente cuando se crea un cliente con pago
- ❌ No hay control manual sobre cuándo enviar el contrato
- ❌ El vendedor no puede decidir cuándo enviar el contrato

#### **Estado Deseado:**
- ✅ El contrato NO se envía automáticamente al crear el cliente
- ✅ Solo el **Jefe de Ventas** puede enviar el contrato manualmente
- ✅ El envío se realiza desde la vista de detalle del cliente
- ✅ El Jefe de Ventas tiene control total sobre cuándo enviar contratos

#### **Cambios Técnicos Requeridos:**

##### **Backend:**
1. **Eliminar envío automático de contrato en `ClienteCompletoService`**
   - Archivo: `backend/src/main/java/com/armasimportacion/service/ClienteCompletoService.java`
   - Método: `crearClienteCompleto()`
   - Acción: Comentar o remover el bloque que llama a `generarContratoDelCliente()`
   - Líneas específicas: 303-313
   - Código a comentar:
     ```java
     // 5. Generar contrato (solo si hay pago)
     // NOTA: El contrato es secundario, si falla no debe revertir la transacción completa
     log.info("🔍 DEBUG: Llamando a generarContratoDelCliente...");
     try {
         generarContratoDelCliente(cliente, pago);
         log.info("🔍 DEBUG: generarContratoDelCliente completado");
     } catch (Exception e) {
         log.error("❌ Error en generarContratoDelCliente (no crítico): {}", e.getMessage(), e);
         // NO relanzar la excepción porque el contrato es secundario
         // La transacción continuará y se confirmará
     }
     ```
   - **Nota:** El método `generarContratoDelCliente()` se mantiene para uso manual desde el endpoint

2. **Crear endpoint para envío manual de contrato**
   - Archivo: `backend/src/main/java/com/armasimportacion/controller/ClienteController.java` (agregar método)
   - Endpoint: `POST /api/clientes/{id}/enviar-contrato`
   - Método: `enviarContratoCliente(@PathVariable Long id, @AuthenticationPrincipal Usuario usuario)`
   - Funcionalidad:
     - Obtener cliente por ID
     - Verificar que el usuario tiene rol `SALES_CHIEF`
     - Verificar que el cliente tiene pago asociado
     - Verificar que el cliente tiene email
     - Llamar a `generarContratoDelCliente()` o método similar
     - Retornar respuesta con éxito/error
   - Validaciones:
     - Solo usuarios con rol `SALES_CHIEF` pueden acceder
     - Verificar que el cliente existe
     - Verificar que el cliente tenga pago asociado
     - Verificar que el cliente tenga email
     - Manejar errores de generación de PDF
     - Manejar errores de envío de email

3. **Reutilizar método existente o crear servicio para envío manual**
   - Archivo: `backend/src/main/java/com/armasimportacion/service/ClienteCompletoService.java`
   - Método existente: `generarContratoDelCliente(Cliente cliente, Pago pago)` (línea 440)
   - Opción A: Hacer el método público y llamarlo desde el controller
   - Opción B: Crear método público `enviarContratoCliente(Long clienteId)` que:
     - Obtiene cliente y pago
     - Llama a `generarContratoDelCliente()`
     - Maneja errores y retorna resultado
   - Funcionalidad:
     - Obtener cliente completo por ID
     - Obtener pago asociado al cliente
     - Verificar que tenga pago
     - Generar contrato PDF usando `documentosHelper.generarYGuardarContrato()`
     - Enviar por email usando `emailService.enviarContratoAdjunto()`
     - Registrar en log/auditoría

##### **Frontend:**
1. **Agregar botones en vista de detalle del cliente (Jefe de Ventas)**
   - Archivo: `frontend/src/pages/JefeVentas/JefeVentas.tsx`
   - Ubicación: Modal de detalle del cliente (líneas ~746-1045)
   - Ubicación específica: Al final del modal, después de todas las secciones (armas, documentos, contratos, pagos)
   - Botones requeridos:
     - **"Enviar Contrato"** (botón primario, azul/verde)
       - Solo visible si: cliente tiene pago Y tiene email
       - Estado: loading mientras se envía, deshabilitado después de enviar
     - **"Cerrar"** (botón secundario, gris)
       - Ya existe un botón X en el header, pero agregar botón "Cerrar" al final
   - Estados necesarios:
     - `const [enviandoContrato, setEnviandoContrato] = useState(false)`
     - `const [contratoEnviado, setContratoEnviado] = useState(false)`
   - Validaciones:
     - Solo mostrar "Enviar Contrato" si:
       - `pagosCliente.length > 0` (tiene pago asociado)
       - `clienteSeleccionado.email` existe y no está vacío
       - El usuario es Jefe de Ventas (ya verificado por el componente)
   - Funcionalidad del botón "Enviar Contrato":
     - Mostrar loading
     - Llamar a `apiService.enviarContratoCliente(clienteSeleccionado.id)`
     - Mostrar mensaje de éxito/error
     - Deshabilitar botón después de envío exitoso
     - Opcional: Mostrar badge "Contrato enviado" si ya fue enviado

2. **Crear método en API Service**
   - Archivo: `frontend/src/services/api.ts`
   - Método: `enviarContratoCliente(clienteId: number): Promise<{success: boolean, message: string}>`
   - Endpoint: `POST /api/clientes/${clienteId}/enviar-contrato`

3. **Manejo de estados y feedback**
   - Mostrar loading mientras se envía
   - Mostrar mensaje de éxito/error
   - Actualizar UI después del envío

#### **Archivos a Modificar:**

**Backend:**
- [ ] `backend/src/main/java/com/armasimportacion/service/ClienteCompletoService.java`
- [ ] `backend/src/main/java/com/armasimportacion/controller/ClienteController.java` (o nuevo `ContratoController.java`)
- [ ] `backend/src/main/java/com/armasimportacion/service/ContratoService.java` (nuevo o existente)
- [ ] `backend/src/main/java/com/armasimportacion/config/SecurityConfig.java` (agregar permisos si es necesario)

**Frontend:**
- [ ] `frontend/src/pages/JefeVentas/JefeVentas.tsx`
- [ ] `frontend/src/services/api.ts`

#### **Checklist de Implementación:**

**Backend:**
- [ ] **Paso 1:** Comentar/eliminar envío automático de contrato en `ClienteCompletoService.crearClienteCompleto()` (líneas 303-313)
- [ ] **Paso 2:** Crear método público `enviarContratoCliente(Long clienteId)` en `ClienteCompletoService`
- [ ] **Paso 3:** Crear endpoint `POST /api/clientes/{id}/enviar-contrato` en `ClienteController`
- [ ] **Paso 4:** Agregar validación de permisos (solo SALES_CHIEF)
- [ ] **Paso 5:** Agregar validaciones (cliente existe, tiene pago, tiene email)
- [ ] **Paso 6:** Probar endpoint con Postman/curl

**Frontend:**
- [ ] **Paso 7:** Agregar método `enviarContratoCliente()` en `api.ts`
- [ ] **Paso 8:** Agregar estados `enviandoContrato` y `contratoEnviado` en `JefeVentas.tsx`
- [ ] **Paso 9:** Agregar botones al final del modal de detalle (después de pagos, línea ~1035)
- [ ] **Paso 10:** Implementar función `handleEnviarContrato()`
- [ ] **Paso 11:** Agregar validaciones para mostrar/ocultar botón
- [ ] **Paso 12:** Agregar feedback visual (loading, éxito, error)
- [ ] **Paso 13:** Probar flujo completo
- [ ] **Paso 14:** Verificar permisos y seguridad

---

### 2. ✅ **IMPLEMENTADO: Verificación de Correo Electrónico**

#### **Estado: COMPLETADO**

- ✅ Sistema de verificación de correo implementado
- ✅ Email con datos personales del cliente
- ✅ Página de verificación con revisión de datos
- ✅ Opción para reportar datos incorrectos
- ✅ Integración completa backend/frontend

**Archivos Implementados:**
- `backend/src/main/java/com/armasimportacion/model/EmailVerificationToken.java`
- `backend/src/main/java/com/armasimportacion/service/EmailVerificationService.java`
- `backend/src/main/java/com/armasimportacion/service/EmailService.java`
- `backend/src/main/java/com/armasimportacion/controller/EmailVerificationController.java`
- `frontend/src/pages/Verify/VerifyPage.tsx`
- `datos/migrations/004_verificacion_email_cliente.sql` (consolidado en `00_gmarm_completo.sql`)

---

## 🔄 FLUJO ACTUAL vs FLUJO DESEADO

### **Flujo Actual (ANTES):**
```
1. Vendedor crea cliente con pago
2. Sistema genera contrato automáticamente
3. Sistema envía contrato por email automáticamente
4. Cliente recibe contrato
```

### **Flujo Deseado (DESPUÉS):**
```
1. Vendedor crea cliente con pago
2. Sistema guarda cliente (sin enviar contrato)
3. Jefe de Ventas revisa cliente en su vista
4. Jefe de Ventas hace clic en "Ver Detalle"
5. Jefe de Ventas revisa información del cliente
6. Jefe de Ventas hace clic en "Enviar Contrato"
7. Sistema genera contrato
8. Sistema envía contrato por email
9. Cliente recibe contrato
10. Jefe de Ventas ve confirmación de envío
```

---

## 📊 PRIORIDADES

### **Alta Prioridad:**
1. ✅ Verificación de correo electrónico (COMPLETADO)
2. 🔄 Cambio de flujo de envío de contrato (PENDIENTE)

### **Media Prioridad:**
- (Por definir en próximos sprints)

### **Baja Prioridad:**
- (Por definir en próximos sprints)

---

## 🧪 TESTING REQUERIDO

### **Para Cambio de Flujo de Contrato:**
- [ ] Crear cliente con pago y verificar que NO se envía contrato automáticamente
- [ ] Login como Jefe de Ventas
- [ ] Ver lista de clientes
- [ ] Abrir detalle de un cliente con pago
- [ ] Verificar que aparecen botones "Enviar Contrato" y "Cerrar"
- [ ] Hacer clic en "Enviar Contrato"
- [ ] Verificar que se muestra loading
- [ ] Verificar que se envía el email
- [ ] Verificar mensaje de éxito
- [ ] Verificar que el botón se deshabilita después del envío (opcional)
- [ ] Probar con cliente sin pago (no debe aparecer botón)
- [ ] Probar con cliente sin email (debe mostrar error)
- [ ] Probar permisos (vendedor no debe poder enviar)

---

## 📝 NOTAS ADICIONALES

### **Consideraciones de Seguridad:**
- Solo usuarios con rol `SALES_CHIEF` deben poder enviar contratos
- Validar que el cliente existe y pertenece al sistema
- Validar que el cliente tiene email antes de enviar
- Registrar en auditoría quién envió el contrato y cuándo

### **Consideraciones de UX:**
- El botón "Enviar Contrato" debe estar claramente visible
- Mostrar feedback inmediato al usuario
- Si falla el envío, mostrar mensaje claro de error
- Considerar deshabilitar el botón después de enviar (o mostrar estado "Ya enviado")

### **Consideraciones Técnicas:**
- El contrato debe generarse en el momento del envío (no pre-generado)
- Manejar errores de generación de PDF
- Manejar errores de envío de email
- No bloquear la UI durante el proceso

---

## 🚀 PRÓXIMOS PASOS

1. **Inmediato:**
   - [ ] Revisar y aprobar este documento
   - [ ] Comenzar implementación del cambio de flujo de contrato

2. **Corto Plazo:**
   - [ ] Completar cambio de flujo de contrato
   - [ ] Testing completo
   - [ ] Documentación de usuario

3. **Mediano Plazo:**
   - [ ] Agregar más funcionalidades al sprint según necesidades

---

## 📞 CONTACTO Y REFERENCIAS

- **Documento creado por:** Sistema de Gestión GMARM
- **Última actualización:** 2024-12-27
- **Versión:** 1.0

---

## 🔄 HISTORIAL DE CAMBIOS

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2024-12-27 | Creación del documento | Sistema |
| 2024-12-27 | Agregado cambio de flujo de contrato | Sistema |

---

**Nota:** Este documento debe actualizarse conforme se completen las tareas y se agreguen nuevas funcionalidades al sprint.


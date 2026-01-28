# 📋 Sprint 11 - Pendientes y Correcciones

**Fecha de creación**: 28 de enero del 2026  
**Estado**: En progreso

---

## ✅ COMPLETADO

### 1. **Mensajes de Excel en Definición de Pedido**
- **Problema**: Al definir pedido, los mensajes decían "PDF" cuando el documento generado es Excel
- **Solución**: Cambiado en `ImportGroupManagement.tsx`:
  - Confirmación: "documento Excel"
  - Mensaje de éxito: "El documento Excel del pedido ha sido generado exitosamente"
  - Botones: "Ver Documento Excel" y "Descargar Documento Excel"
- **Commit**: `ab98194` - fix: corregir mensajes de documento Excel y preservar fecha en checklist

### 2. **Fecha se borraba al marcar checkbox en Gestión de Importación**
- **Problema**: Al marcar el checkbox de "OK" en el proceso de importación, la fecha planificada se borraba
- **Solución**: Modificado `ImportGroupProcessChecklist.tsx` para preservar valores actuales no modificados
- **Commit**: `ab98194` - fix: corregir mensajes de documento Excel y preservar fecha en checklist

### 3. **Ciudad no aparecía en template de Solicitud de Compra**
- **Problema**: La ciudad del cliente no se mostraba en el PDF de solicitud de compra
- **Solución**: Agregado campo ciudad en `solicitud_compra.html` template
- **Archivo**: `backend/src/main/resources/templates/contratos/civiles/solicitud_compra.html`

### 4. **Nombre de botón "Cargar Contrato Firmado" incorrecto**
- **Problema**: El botón siempre decía "Cargar Contrato Firmado" incluso para solicitudes de compra
- **Solución**: Cambio dinámico del texto del botón según tipo de documento en `JefeVentas.tsx`
  - Si es solicitud de compra: "Cargar Solicitud de Compra Firmada"
  - Si es contrato: "Cargar Contrato Firmado"

### 5. **Error 400 al agregar clientes con documentos "completos"**
- **Problema**: Clientes con documentos APROBADOS no podían ser agregados a grupos de importación
- **Causa**: La validación `verificarDocumentosCompletos` solo aceptaba estado `CARGADO`, no `APROBADO`
- **Solución**: Modificado `DocumentoClienteService.java` para aceptar documentos en estado `CARGADO` o `APROBADO`
- **Archivo**: `backend/src/main/java/com/armasimportacion/service/DocumentoClienteService.java`

---

## 🔄 EN VERIFICACIÓN (Requiere Testing del Usuario)

### Error al crear cliente civil
- **Descripción**: Al intentar crear un cliente civil, se muestra error 400
- **Posible causa**: Validaciones de documentos completos (corregido en punto 5)
- **Acción requerida**: 
  1. Probar creación de cliente civil después de aplicar correcciones
  2. Verificar que todos los documentos obligatorios estén cargados y aprobados
  3. Si persiste el error, capturar mensaje completo del error 400

### Error al agregar clientes a grupo de importación
- **Descripción**: Error "El proceso se ha detenido y no se han guardado datos parciales"
- **Posible causa**: Validaciones en `GrupoImportacionService.agregarCliente()`:
  - Cliente ya asignado a otro grupo activo
  - Cliente tiene armas en estado ASIGNADA
  - Documentos incompletos (corregido en punto 5)
  - Cliente no compatible con tipo de grupo (CUPO vs JUSTIFICATIVO)
- **Acción requerida**:
  1. Capturar mensaje de error completo del backend
  2. Verificar estado del cliente:
     - ¿Está en otro grupo activo?
     - ¿Tiene armas en estado RESERVADA (correcto) o ASIGNADA (incorrecto)?
     - ¿Todos los documentos obligatorios están en CARGADO o APROBADO?
     - ¿El tipo de cliente es compatible con el tipo de grupo?

---

## 📊 VALIDACIONES DE COMPATIBILIDAD GRUPO-CLIENTE

### Tipo de Grupo: **CUPO**
- ✅ **Civiles**
- ✅ **Deportistas**
- ✅ **Uniformados en servicio PASIVO**
- ❌ Uniformados en servicio ACTIVO
- ❌ Compañías de Seguridad

### Tipo de Grupo: **JUSTIFICATIVO**
- ✅ **Uniformados en servicio ACTIVO**
- ✅ **Compañías de Seguridad**
- ✅ **Deportistas**
- ❌ Civiles
- ❌ Uniformados en servicio PASIVO

---

## 🐛 PROBLEMAS CONOCIDOS PENDIENTES DE CONFIRMACIÓN

### 1. Mensaje de documentos incompletos persiste
- **Descripción**: Después de crear un cliente y subir todos los documentos, sigue mostrando mensaje "hubo problemas subiendo algunos documentos"
- **Posible causa**: 
  - Algunos documentos fallan al subirse pero el error no se muestra claramente
  - La validación de completitud no se actualiza correctamente
- **Ubicación del código**: `frontend/src/pages/Vendedor/hooks/useVendedorPaymentHandler.ts` línea 158-173
- **Acción requerida**: 
  1. Verificar en el backend que todos los documentos se subieron correctamente
  2. Verificar el estado de los documentos (deberían estar en CARGADO o APROBADO)
  3. Revisar logs del servidor para ver si hay errores al subir documentos

---

## 📝 NOTAS TÉCNICAS

### Estados de Documentos
- **PENDIENTE**: Documento NO cargado (falta subirlo)
- **CARGADO**: Documento subido, pendiente de aprobación
- **APROBADO**: Documento validado y aprobado ✅
- **RECHAZADO**: Documento rechazado, necesita ser resubido
- **OBSERVADO**: Documento con observaciones
- **REEMPLAZADO**: Documento viejo que fue reemplazado por uno nuevo

### Estados de Cliente en Grupo
- **PENDIENTE**: Cliente agregado al grupo, esperando confirmación
- **CONFIRMADO**: Cliente confirmó su participación (después de verificar email)
- **APROBADO**: Cliente aprobado para el grupo
- **EN_PROCESO**: Cliente en proceso de importación
- **COMPLETADO**: Proceso completado ✅
- **CANCELADO**: Proceso cancelado

### Estados de Armas
- **RESERVADA**: Arma reservada para el cliente (puede agregarse a grupos) ✅
- **ASIGNADA**: Arma ya asignada al cliente (NO puede agregarse a grupos)

---

## 🔧 COMANDOS ÚTILES PARA DEBUGGING

### Backend - Ver logs en tiempo real
```powershell
# Ver logs del contenedor backend
docker logs -f gmarm-backend-local
```

### Backend - Verificar estado de un cliente
```sql
-- Conectar a la base de datos
docker exec -it gmarm-postgres-local psql -U postgres -d gmarm_local

-- Ver documentos de un cliente
SELECT dc.id, td.nombre, dc.estado, dc.fecha_carga, dc.aprobado
FROM documento_cliente dc
JOIN tipo_documento td ON dc.tipo_documento_id = td.id
WHERE dc.cliente_id = [ID_CLIENTE];

-- Ver grupos asignados a un cliente
SELECT cgi.id, gi.nombre, cgi.estado, cgi.fecha_asignacion
FROM cliente_grupo_importacion cgi
JOIN grupo_importacion gi ON cgi.grupo_importacion_id = gi.id
WHERE cgi.cliente_id = [ID_CLIENTE];

-- Ver armas de un cliente
SELECT ca.id, a.modelo, ca.estado, ca.fecha_asignacion
FROM cliente_arma ca
JOIN arma a ON ca.arma_id = a.id
WHERE ca.cliente_id = [ID_CLIENTE];
```

### Reiniciar servicios después de cambios
```powershell
# Backend cambios (Java/Templates)
docker-compose -f docker-compose.local.yml restart backend_local

# Frontend cambios (React/TypeScript)
# Los cambios se reflejan automáticamente con Vite HMR
```

---

## ✅ CHECKLIST DE VERIFICACIÓN PARA EL USUARIO

- [ ] **Crear cliente civil**: ¿Se crea correctamente sin error 400?
- [ ] **Subir todos los documentos obligatorios**: ¿Se suben correctamente sin errores?
- [ ] **Aprobar documentos**: ¿Los documentos cambian a estado APROBADO?
- [ ] **Agregar cliente a grupo CUPO**: ¿Se agrega correctamente sin error 400?
- [ ] **Agregar cliente a grupo JUSTIFICATIVO**: ¿Se agrega correctamente si es compatible?
- [ ] **Definir pedido**: ¿El mensaje dice "Excel" correctamente?
- [ ] **Ver documento de pedido**: ¿El botón dice "Ver Documento Excel"?
- [ ] **Descargar documento de pedido**: ¿El botón dice "Descargar Documento Excel"?
- [ ] **Marcar fecha en checklist**: ¿La fecha se mantiene al marcar el checkbox?
- [ ] **Ver solicitud de compra PDF**: ¿Aparece la ciudad del cliente?
- [ ] **Cargar documento firmado**: ¿El botón dice "Cargar Solicitud de Compra Firmada" cuando corresponde?

---

## 📧 PRÓXIMOS PASOS

1. **Testing de correcciones**: El usuario debe probar todas las correcciones aplicadas
2. **Reporte de errores persistentes**: Si algún error persiste, capturar:
   - Mensaje de error completo
   - Logs del backend
   - Estado del cliente/grupo en base de datos
3. **Commit y Push**: Una vez verificado todo:
   ```powershell
   git push origin main
   ```

---

**Última actualización**: 28 de enero del 2026  
**Responsable**: Agente IA + Usuario  
**Estado del Sprint**: 5/5 tareas completadas, pendiente verificación del usuario

# 📋 Pendientes de Producción - GMARM

**Última actualización:** 2024-12-19

Este documento mapea todos los pendientes y mejoras requeridas para producción.

---

## ✅ **COMPLETADOS**

### 1. ✅ Correo de Validación de Datos
**Estado:** ✅ **COMPLETADO**

**Cambios realizados:**
- ✅ Agregado campo `email` en los datos personales del correo de verificación
- ✅ Evitado envío de correo de validación a compañías de seguridad (usando `cliente.esEmpresa()`)

**Archivos modificados:**
- `backend/src/main/java/com/armasimportacion/service/EmailService.java` (línea 91 - agregado email)
- `backend/src/main/java/com/armasimportacion/service/ClienteCompletoService.java` (línea 696-702 - validación de compañías)

---

### 2. ✅ Validación de Grupos Disponibles - Pantalla Vendedor
**Estado:** ✅ **COMPLETADO**

**Cambios realizados:**
- ✅ Deshabilitado botón "Crear Cliente" cuando no hay grupos de importación disponibles
- ✅ Botón "Asignar Arma Sin Cliente" permanece habilitado (no requiere grupos)
- ✅ Mensaje de advertencia visible
- ✅ Creado endpoint `/grupos-importacion/activos` en backend

**Archivos modificados:**
- `frontend/src/pages/Vendedor/Vendedor.tsx`
- `backend/src/main/java/com/armasimportacion/controller/GrupoImportacionController.java`

---

### 3. ✅ Error 503 al Asignar Arma Sin Cliente
**Estado:** ✅ **COMPLETADO**

**Cambios realizados:**
- ✅ Validación para NO enviar correos a clientes fantasma

---

### 4. ✅ Recálculo de Cuotas al Crear Cuota Manual
**Estado:** ✅ **COMPLETADO**

**Cambios realizados:**
- ✅ Modificado `PagoService.crearCuotaManual()` para recalcular todas las cuotas pendientes

---

## 🔄 **EN PROGRESO**

### 5. 🔄 Edición de Grupo de Importación - Licencia y Límites
**Estado:** 🔄 **EN PROGRESO** (80% completado)

**Cambios realizados:**
- ✅ Licencia ahora visible y editable en modo edición
- ✅ Backend actualizado para aceptar `licenciaId` en actualización
- ✅ Método `actualizarGrupoDesdeDTO` actualizado para cambiar licencia (desbloquear anterior, bloquear nueva, recalcular cupos)
- ✅ Frontend actualizado para cargar todas las licencias activas en modo edición
- ✅ Corregido `handleVendedorToggle` para preservar límites existentes (no resetea a 0, usa 1 por defecto)
- ✅ Payload ahora solo incluye vendedores seleccionados con sus límites

**Archivos modificados:**
- `frontend/src/pages/JefeVentas/components/ModalCrearGrupo.tsx`
- `backend/src/main/java/com/armasimportacion/service/GrupoImportacionService.java`
- `frontend/src/services/api.ts`

**Pendiente de validación:**
- ⚠️ Probar que los límites se guarden correctamente
- ⚠️ Probar cambio de licencia y recálculo de cupos

---

## 📋 **PENDIENTES (PRIORIDAD ALTA)**

### 6. ✅ Permisos de Edición de Clientes
**Estado:** ✅ **COMPLETADO**

**Cambios realizados:**
- ✅ Frontend: Botón "Editar" deshabilitado para vendedores si `emailVerificado === true`
- ✅ Frontend: Mensaje de tooltip explicativo cuando está deshabilitado
- ✅ Frontend: Botón "Editar Cliente" en ClientForm también deshabilitado para vendedores
- ✅ Backend: Validación en `PUT /{id}` y `PATCH /{id}` para rechazar ediciones de vendedores a clientes confirmados
- ✅ Backend: Solo Jefe de Ventas y Admin pueden editar clientes confirmados

**Archivos modificados:**
- `frontend/src/pages/Vendedor/Vendedor.tsx` (botón editar condicional)
- `frontend/src/pages/Vendedor/components/ClientForm.tsx` (botón editar deshabilitado)
- `backend/src/main/java/com/armasimportacion/controller/ClienteController.java` (validación permisos en PUT y PATCH)

**Comportamiento:**
- Si el cliente tiene `emailVerificado === true` y el usuario es vendedor (no jefe ni admin), no puede editar
- El backend lanza `BadRequestException` con mensaje claro si un vendedor intenta editar un cliente confirmado
- Solo Jefe de Ventas y Admin pueden editar clientes que ya confirmaron sus datos

---

### 7. ✅ Límites de Armas por Tipo de Cliente
**Estado:** ✅ **COMPLETADO** (90% - pendiente asignación automática a grupos)

**Cambios realizados:**
- ✅ Frontend: Función `esCivil()` para detectar Cliente Civil
- ✅ Frontend: Estado para cantidad de armas a seleccionar (1 o 2)
- ✅ Frontend: Estado para múltiples armas seleccionadas
- ✅ Frontend: Dropdown para seleccionar cantidad (1-2 armas) solo para Cliente Civil
- ✅ Frontend: Indicador de progreso (X / Y armas seleccionadas)
- ✅ Frontend: Lógica de selección múltiple con límite de 2 armas para Civil
- ✅ Frontend: Validación visual que impide seleccionar más del límite
- ✅ Frontend: Validación del botón de confirmación para múltiples armas
- ✅ Frontend: Integración de múltiples armas en `handleWeaponSelectionConfirm`
- ✅ Backend: Validación de límite de 2 armas al crear reserva para Cliente Civil
- ✅ Backend: Detección de tipo de cliente (Civil vs Deportista)
- ✅ Backend: Validación que rechaza más de 2 reservas activas para Civiles
- ✅ Backend: Deportista sin límite de armas (validación implementada)

**Pendiente:**
- ⚠️ Backend: Lógica de asignación automática a grupos (primera arma completa grupo hasta 25, segunda va a otro grupo CUPO)
  - Esta funcionalidad se implementará en el siguiente item (Asignación Automática Inteligente)

**Archivos modificados:**
- `frontend/src/pages/Vendedor/components/WeaponReserve.tsx` (dropdown cantidad + múltiples selecciones + validación botón)
- `frontend/src/pages/Vendedor/hooks/useVendedorHandlers.ts` (crear múltiples reservas)
- `backend/src/main/java/com/armasimportacion/service/ClienteArmaService.java` (validación límites por tipo de cliente)

**Comportamiento:**
- **Cliente Civil**: Puede seleccionar 1 o 2 armas (dropdown). Máximo 2 reservas activas en backend.
- **Deportista**: Sin límite de armas. Puede seleccionar múltiples armas (aunque UI actual permite una a la vez).
- El backend valida y rechaza si un Civil intenta crear más de 2 reservas activas.

**Prioridad:** 🔴 **ALTA**

---

### 8. ✅ Asignación Automática Inteligente de Armas
**Estado:** ✅ **COMPLETADO**

**Cambios realizados:**
- ✅ Backend: Nuevo método `encontrarGrupoDisponibleParaArma()` que busca grupos disponibles para una categoría específica
- ✅ Backend: Priorización inteligente de grupos cerca del límite (ej: 24/25 armas = 96% ocupado = alta prioridad)
- ✅ Backend: Detección de segunda arma para Cliente Civil (excluye grupos donde ya está asignado)
- ✅ Backend: Asignación automática cuando se crea una reserva de arma
- ✅ Backend: Permite múltiples asignaciones de cliente a grupos diferentes (para Civiles con 2 armas)
- ✅ Backend: Asignación basada en categoría del arma y cupo disponible

**Comportamiento:**
- **Primera arma**: Se asigna al grupo más adecuado según categoría, priorizando grupos cerca del límite
- **Segunda arma (Cliente Civil)**: Se busca un grupo diferente, también basado en categoría
- Los grupos se ordenan por porcentaje de ocupación (mayor primero) para completar grupos cerca del límite
- Si un Cliente Civil tiene 2 armas, puede estar asignado a 2 grupos diferentes simultáneamente

**Archivos modificados:**
- `backend/src/main/java/com/armasimportacion/service/GrupoImportacionService.java` (nuevo método `encontrarGrupoDisponibleParaArma`)
- `backend/src/main/java/com/armasimportacion/service/ClienteArmaService.java` (asignación automática en `crearReserva`)

**Prioridad:** 🔴 **ALTA**

---

### 9. ✅ Jefe de Ventas Puede Editar Arma
**Estado:** ✅ **COMPLETADO**

**Cambios realizados:**
- ✅ Backend: Nuevo método `actualizarArmaReserva()` en `ClienteArmaService` para cambiar el arma asignada
- ✅ Backend: Validación que impide cambiar armas ya asignadas o completadas
- ✅ Backend: Endpoint `PUT /api/cliente-arma/{id}/actualizar-arma` en `ClienteArmaController`
- ✅ Frontend: Botón "Editar Arma" en la sección de armas asignadas del cliente
- ✅ Frontend: Modal para seleccionar nueva arma y actualizar precio
- ✅ Frontend: Handler `handleConfirmarEditarArma` para actualizar la reserva
- ✅ Frontend: Método `actualizarArmaReserva()` en API service
- ✅ Frontend: Validación y feedback visual al usuario

**Comportamiento:**
- Solo se pueden editar armas en estado RESERVADA (no asignadas ni completadas)
- El Jefe de Ventas puede seleccionar una nueva arma de la lista disponible
- Puede actualizar el precio unitario al cambiar el arma
- Después de cambiar el arma, se puede generar un nuevo contrato desde el botón "Enviar Contrato"

**Archivos modificados:**
- `backend/src/main/java/com/armasimportacion/service/ClienteArmaService.java` (método `actualizarArmaReserva`)
- `backend/src/main/java/com/armasimportacion/controller/ClienteArmaController.java` (endpoint `actualizarArmaReserva`)
- `frontend/src/services/api.ts` (método `actualizarArmaReserva`)
- `frontend/src/pages/JefeVentas/JefeVentas.tsx` (modal y handlers para editar arma)

**Prioridad:** 🟡 **MEDIA**

---

### 10. ✅ Nueva Estructura de Documentos
**Estado:** ✅ **COMPLETADO (Backend - Falta crear templates HTML)**

**Cambios realizados:**
- ✅ Backend: Nuevo método `generarYGuardarDocumentos()` que genera documentos según tipo de grupo
- ✅ Backend: Método `obtenerTipoGrupoCliente()` para obtener el tipo de grupo del cliente
- ✅ Backend: Nuevos métodos `generarYGuardarCotizacion()` y `generarYGuardarSolicitudCompra()`
- ✅ Backend: Nuevos métodos privados `generarPDFCotizacion()` y `generarPDFSolicitudCompra()`
- ✅ Backend: Nuevos métodos `generarNombreArchivoCotizacion()` y `generarNombreArchivoSolicitudCompra()`
- ✅ Backend: Enum `TipoDocumentoGenerado` actualizado con `COTIZACION` y `SOLICITUD_COMPRA`
- ✅ Backend: Método `crearDocumentoGenerado()` actualizado para aceptar tipo de documento
- ✅ Backend: Controlador actualizado para usar `generarYGuardarDocumentos()` y retornar lista de documentos

**Comportamiento:**
- **CUPO:** Solo genera Cotización
- **JUSTIFICATIVO:** Genera 3 documentos: Solicitud de compra, Contrato, Cotización (en ese orden)
- El estado ASIGNADO se confirma cuando se envían documentos desde Jefe de ventas

**Pendiente:**
- ⚠️ Crear templates HTML:
  - `backend/src/main/resources/templates/cotizaciones/cotizacion.html`
  - `backend/src/main/resources/templates/solicitudes/solicitud_compra.html`

**Archivos modificados:**
- `backend/src/main/java/com/armasimportacion/enums/TipoDocumentoGenerado.java` (agregados COTIZACION, SOLICITUD_COMPRA)
- `backend/src/main/java/com/armasimportacion/service/helper/GestionDocumentosServiceHelper.java` (nuevos métodos)
- `backend/src/main/java/com/armasimportacion/controller/ClienteController.java` (actualizado para usar nuevo método)

**Prioridad:** 🔴 **ALTA**
- `backend/src/main/java/com/armasimportacion/service/helper/GestionDocumentosServiceHelper.java`

**Prioridad:** 🔴 **ALTA**

---

### 11. ✅ Error Botón Desistimiento - Jefe de Ventas
**Estado:** ✅ **COMPLETADO**

**Cambios realizados:**
- ✅ Backend: Mejorado manejo de request body (Map<String, Object> en lugar de Map<String, String>)
- ✅ Backend: Mejorado manejo de errores y logging
- ✅ Frontend: Mejorado manejo de errores con mensajes más específicos
- ✅ Frontend: Agregado logging para debugging
- ✅ Frontend: Validación de cliente seleccionado antes de ejecutar acción

**Archivos modificados:**
- `backend/src/main/java/com/armasimportacion/controller/ClienteController.java` (método `cambiarEstadoDesistimiento`)
- `frontend/src/pages/JefeVentas/JefeVentas.tsx` (handler `handleConfirmarDesistimiento`)

**Prioridad:** 🟡 **MEDIA**

---

## 📊 **RESUMEN DE PRIORIDADES**

| # | Tarea | Prioridad | Estado | Complejidad |
|---|-------|-----------|--------|-------------|
| 1 | Correo validación | ✅ | Completado | Baja |
| 2 | Validación grupos | ✅ | Completado | Media |
| 3 | Error 503 arma sin cliente | ✅ | Completado | Baja |
| 4 | Recálculo cuotas | ✅ | Completado | Media |
| 5 | Edición grupo | 🔄 | En progreso (80%) | Media |
| 6 | Permisos edición | ✅ | Completado | Alta |
| 7 | Límites armas | ✅ | Completado (90%) | Alta |
| 8 | Asignación automática | ✅ | Completado | Alta |
| 11 | Error desistimiento | ✅ | Completado | Media |
| 9 | Jefe ventas editar arma | ✅ | Completado | Media |
| 10 | Nueva estructura documentos | ✅ | Backend completo (Falta templates HTML) | Alta |
| 10 | Nueva estructura documentos | 🔴 Alta | Pendiente | Alta |
| 11 | Error desistimiento | 🟡 Media | Pendiente | Media |

---

**Última revisión:** Pendiente validación en producción

# 📋 Módulo de Operaciones - Checklist de Implementación

Este documento rastrea el progreso de implementación del módulo de operaciones para grupos de importación.

**Última actualización:** 2024-12-23 - Corrección de ruta de visualización de documentos generados. Mejoras en manejo de errores de clave duplicada. Validación de documentos obligatorios implementada. Estructura de documentos actualizada.

---

## 🎯 Resumen del Módulo

El módulo de operaciones permite gestionar el flujo completo de importación de armas, desde la creación del grupo de importación hasta la entrega final al cliente.

### Flujo Principal:
1. **Jefe de Ventas** crea grupo de importación y asigna clientes
2. **Jefe de Ventas** define pedido (genera PDF) ✅
3. **Operaciones** carga documentos requeridos ✅
4. **Operaciones** notifica pagos y registra fechas ✅
5. **Finanzas/Jefe de Ventas** gestiona pagos y autorizaciones ✅
6. **Finalización** por cliente con documentos y entrega ⏳

---

## ✅ Backend - Base de Datos

### Scripts de Migración
- [x] Crear script de migración `001_modulo_operaciones_grupos_importacion.sql`
- [x] Agregar columna `grupos_importacion` a `tipo_documento`
- [x] Agregar columna `numero_previa_importacion` a `grupo_importacion`
- [x] Migrar `documento_grupo_importacion` para usar `tipo_documento_id` (FK)
- [x] Crear 7 tipos de documento para grupos de importación
- [x] Actualizar configuraciones de expoferia (EXPOFERIA_ACTIVA=false, renombrar claves coordinador)
- [x] Actualizar todas las armas para que expoferia=false
- [x] Crear README.md para documentación de migraciones

### Modelos y Enums
- [x] Actualizar enum `EstadoGrupoImportacion` con todos los estados del flujo
- [x] Actualizar modelo `TipoDocumento` con campo `gruposImportacion`
- [x] Actualizar modelo `GrupoImportacion` con campo `numeroPreviaImportacion`
- [x] Actualizar modelo `DocumentoGrupoImportacion` para usar `TipoDocumento` (FK)

### Repositorios
- [x] Actualizar `DocumentoGrupoImportacionRepository` para usar `TipoDocumento`

### Estructura de Documentos
- [x] Implementar nueva estructura de carpetas:
  - [x] Clientes: `documentos_clientes/{cedula}/documentos_cargados/` y `documentos_generados/`
  - [x] Grupos: `documentos_importacion/{grupoId}/documentos_cargados/` y `documentos_generados/`
- [x] Actualizar `FileStorageService` para usar nueva estructura
- [x] Actualizar `DocumentoController` para construir rutas correctamente

---

## 🔨 Backend - Servicios

### DocumentoGrupoImportacionService
- [x] Crear servicio `DocumentoGrupoImportacionService`
- [x] Método `cargarDocumento(Long grupoId, Long tipoDocumentoId, MultipartFile archivo, Long usuarioId)`
- [x] Método `obtenerDocumentosPorGrupo(Long grupoId)`
- [x] Método `obtenerDocumentosPorTipo(Long grupoId, Long tipoDocumentoId)`
- [x] Método `eliminarDocumento(Long documentoId)`
- [x] Método `verificarDocumentosRequeridos(Long grupoId)` - Verifica si están los 3 primeros documentos
- [x] Método `cambiarEstado(Long documentoId, EstadoDocumentoGrupo nuevoEstado)`

### Generación de Documentos PDF
- [x] Crear servicio `PedidoArmasGrupoImportacionService`
- [x] Método `generarPedidoArmas(Long grupoId, Long usuarioId)`
- [x] Guardar PDF en `documento_generado` vinculado al grupo
- [x] Template HTML para el documento de pedido (`pedido_armas_grupo_importacion.html`)
- [x] Nombre de archivo: `lista_importacion_{fecha}_{importador}.pdf` (donde importador = nombre de licencia)
- [x] Estructura de carpetas: `documentos_importacion/{grupoId}/documentos_generados/`

### GrupoImportacionService - Métodos del Flujo
- [x] Método `definirPedido(Long grupoId, Long usuarioId)` 
  - [x] Generar PDF del pedido
  - [x] Cambiar estado a `SOLICITAR_PROFORMA_FABRICA`
  - [x] Guardar documento generado
- [x] Método `notificarPagoFabrica(Long grupoId, Long usuarioId)`
  - [x] Validar que existan documentos 1, 2, 3
  - [x] Registrar notificación de pago
- [x] Método `registrarFechaLlegada(Long grupoId, LocalDate fechaLlegada, Long usuarioId)`
- [x] Método `registrarNumeroPreviaImportacion(Long grupoId, String numeroPrevia, Long usuarioId)`
- [x] Método `cambiarEstado(Long grupoId, EstadoGrupoImportacion nuevoEstado, Long usuarioId)`
- [x] Método `obtenerResumenGrupo(Long grupoId)` - Retorna conteo de clientes por tipo
- [x] Método `verificarPuedeDefinirPedido(Long grupoId)` - Validaciones
- [x] Método `agregarCliente(Long grupoId, Long clienteId)` - Validaciones mejoradas
  - [x] Validar que el cliente no esté ya asignado al grupo
  - [x] Validar que el cliente no esté asignado a otro grupo activo
  - [x] Validar que el cliente no tenga armas en estado ASIGNADA
  - [x] **NUEVO:** Validar que el cliente tenga todos sus documentos obligatorios completos y aprobados
  - [x] Lanzar `BadRequestException` si faltan documentos obligatorios

---

## 🌐 Backend - Controladores

### GrupoImportacionController
- [x] Endpoint `POST /api/grupos-importacion/{id}/definir-pedido`
- [x] Endpoint `GET /api/grupos-importacion/{id}/resumen` - Retorna conteo de clientes por tipo
- [x] Endpoint `GET /api/grupos-importacion/jefe-ventas` - Lista para Jefe de Ventas
- [x] Endpoint `GET /api/grupos-importacion/{id}/puede-definir-pedido` - Verifica si puede definir pedido
- [x] Endpoint `GET /api/grupos-importacion/{id}` - Obtener grupo completo con documentos generados
- [x] Endpoint `GET /api/grupos-importacion/gestion-importaciones` - Para Finanzas/Jefe de Ventas
- [x] Endpoint `GET /api/grupos-importacion/clientes-disponibles` - Actualizado
  - [x] **NUEVO:** Incluir campo `documentosCompletos` en la respuesta para cada cliente
  - [x] Usar `DocumentoClienteService.verificarDocumentosCompletos()` para verificar estado
- [x] Endpoint `POST /api/grupos-importacion/{id}/clientes/{clienteId}` - Validación mejorada
  - [x] **NUEVO:** Validar documentos completos antes de permitir asignación
- [x] Endpoint `GET /api/grupos-importacion/{id}/clientes` - Actualizado
  - [x] **NUEVO:** Incluir campo `documentosCompletos` en la respuesta para cada cliente asignado

### OperacionesController
- [x] Endpoint `GET /api/operaciones/grupos` - Lista grupos para operaciones
- [x] Endpoint `GET /api/operaciones/grupos/{id}` - Detalle de grupo
- [x] Endpoint `POST /api/operaciones/grupos/{id}/documentos` - Cargar documento
- [x] Endpoint `GET /api/operaciones/grupos/{id}/documentos` - Listar documentos
- [x] Endpoint `DELETE /api/operaciones/grupos/{id}/documentos/{documentoId}` - Eliminar documento
- [x] Endpoint `POST /api/operaciones/grupos/{id}/notificar-pago-fabrica`
- [x] Endpoint `PUT /api/operaciones/grupos/{id}/fecha-llegada`
- [x] Endpoint `PUT /api/operaciones/grupos/{id}/numero-previa`
- [x] Endpoint `GET /api/operaciones/grupos/{id}/puede-notificar-pago` - Verifica si puede notificar pago

### DocumentoController
- [x] Endpoint `GET /api/documentos/serve/{documentoId}` - Servir documentos de clientes
- [x] Endpoint `GET /api/documentos/serve-generated/{documentoId}` - Servir documentos generados (contratos, pedidos, etc.)
- [x] **ACTUALIZADO (2024-12-23):** Corrección de construcción de ruta para documentos generados
  - [x] Ruta construida correctamente como `/app/documentacion/documentos_cliente/` + `rutaBD`
  - [x] Funciona tanto en Windows (Docker) como en Ubuntu (Docker)
  - [x] Manejo de errores mejorado para requests duplicados (clave única)

---

## 🎨 Frontend - Pantalla de Jefe de Ventas

### Lista de Grupos de Importación
- [x] Componente `ImportGroupManagement` actualizado
- [x] Tabla con columnas:
  - [x] IdGrupoImportacion
  - [x] #clientes civiles
  - [x] #clientes uniformados
  - [x] #clientes Empresas
  - [x] #clientes deportistas
  - [x] Fecha de última actualización
  - [x] Estado del proceso
  - [x] Licencia asignada
- [x] Botón "Definir Pedido" (solo para estados permitidos)
- [x] Integración con endpoint `definirPedido()`
- [x] Botón "Ver Documento" para ver PDF generado
- [x] Botón "Ver" para ver detalle del grupo
- [x] Botón "Agregar Clientes" (para estados permitidos)
- [x] Modal de detalle del grupo con información completa
- [x] Modal para agregar clientes al grupo (`AgregarClientesModal`)
  - [x] **NUEVO:** Mostrar estado de documentos obligatorios por cliente
  - [x] **NUEVO:** Columna "Estado Documentos" en la tabla de clientes disponibles
  - [x] **NUEVO:** Badge verde "✓ Documentos completos" para clientes con documentos completos
  - [x] **NUEVO:** Badge rojo "⚠ Faltan documentos" para clientes con documentos incompletos
  - [x] **NUEVO:** Deshabilitar checkbox para clientes sin documentos completos
  - [x] **NUEVO:** Fondo rojizo (bg-red-50) para filas de clientes sin documentos completos
  - [x] **NUEVO:** Alerta al intentar seleccionar cliente sin documentos completos
  - [x] **NUEVO:** Validación en backend previene asignación si faltan documentos
- [x] Licencia no editable (solo lectura)
- [x] Indicador visual de estado del grupo
- [x] **Sistema de avisos de cupo civil próximo a completar:**
  - [x] Aviso visual cuando falten 5 o menos cupos civiles
  - [x] Colores informativos según cantidad de cupos restantes
  - [x] Indicador en header con cantidad de grupos próximos
  - [x] Resaltado de filas con borde de color
  - [x] Aviso en modal de detalle
  - [x] Información de cupos desde licencia (BD)

### Funcionalidades Pendientes (Jefe de Ventas)
- [x] ✅ **IMPLEMENTADO** - Proceso "Definir Pedido" completamente funcional:
  - [x] ✅ PDF se genera correctamente usando `FlyingSaucerPdfService` con template Thymeleaf
  - [x] ✅ Estado cambia correctamente a `SOLICITAR_PROFORMA_FABRICA` después de definir pedido
  - [x] ✅ Documento se puede ver/descargar mediante modal con botones "Ver PDF" y "Descargar PDF"
  - [x] ✅ Nombre del archivo es correcto: `lista_importacion_{fecha}_{nombre_licencia}.pdf`
  - [x] ✅ Grupo pasa correctamente a la vista de Operaciones (filtrado por estado `SOLICITAR_PROFORMA_FABRICA`)
  - [x] ✅ Botón "Definir Pedido" solo aparece para estados permitidos (`EN_PREPARACION` o `EN_PROCESO_ASIGNACION_CLIENTES`)
  - [x] ✅ Después de definir pedido, el botón desaparece automáticamente (se recarga la lista)
  - [x] ✅ Modal muestra el documento generado con opciones para ver/descargar
- [ ] Filtros por estado (opcional - puede agregarse después)
- [ ] Búsqueda por nombre/código (opcional - puede agregarse después)

---

## 🎨 Frontend - Pantalla de Operaciones

### Lista de Grupos para Operaciones
- [x] Pantalla `Operaciones.tsx` con pestañas
- [x] Lista de grupos con estado `SOLICITAR_PROFORMA_FABRICA` o `EN_PROCESO_OPERACIONES`
- [x] Filtros por estado
- [x] Búsqueda por nombre/descripción
- [x] Indicadores visuales de documentos faltantes:
  - [x] Contador de documentos cargados/faltantes
  - [x] Contador de documentos requeridos (3 primeros)
  - [x] Indicador "Listo para notificar pago" cuando están los 3 documentos
  - [x] Colores diferenciados según cantidad de documentos faltantes
- [x] Integración con Asignación de Series

### Vista Detalle de Grupo (Operaciones)
- [x] Componente `GrupoImportacionDetalle`
- [x] Información del grupo
- [x] Resumen del grupo (conteo de clientes por tipo)
- [x] Sección de documentos requeridos:
  - [x] Lista de 7 documentos con estado (cargado/pendiente)
  - [x] Botón para cargar cada documento
  - [x] Visualización de documentos cargados
  - [x] Botón eliminar documento
- [x] Botones de acciones según estado:
  - [x] "Notificar Pago Fabrica" (solo si documentos 1,2,3 están cargados)
  - [x] "Registrar Fecha Aproximada de Llegada"
  - [x] "Registrar Número de Previa Importación"
- [x] Validaciones visuales (botones deshabilitados si no se cumplen condiciones)
- [x] Indicador de progreso del flujo:
  - [x] Barra de progreso visual con 3 pasos principales
  - [x] Indicador de documentos requeridos (3 primeros)
  - [x] Indicador de notificación de pago
  - [x] Indicador de documentos adicionales

### Servicios API
- [x] `getGruposParaOperaciones()`
- [x] `getGrupoResumen()`
- [x] `cargarDocumentoGrupo()`
- [x] `getDocumentosGrupo()`
- [x] `eliminarDocumentoGrupo()`
- [x] `notificarPagoFabrica()`
- [x] `puedeNotificarPago()`
- [x] `registrarFechaLlegada()`
- [x] `registrarNumeroPrevia()`
- [x] `getTiposDocumentoGruposImportacion()`

### Funcionalidades Pendientes (Operaciones)
- [ ] ⏳ **VERIFICAR** que el flujo completo funcione:
  - [ ] Verificar que los grupos aparecen correctamente cuando cambian a `SOLICITAR_PROFORMA_FABRICA`
  - [ ] Verificar carga de documentos
  - [ ] Verificar notificación de pago
  - [ ] Verificar registro de fechas y números de previa
  - [ ] Verificar transición de estados
- [ ] Validación de tipo de archivo en frontend (opcional)
- [ ] Preview del documento cargado (opcional)

---

## 🎨 Frontend - Pantalla Compartida (Finanzas/Jefe de Ventas)

### Gestión de Importaciones
- [x] Componente compartido `GestionImportaciones`
- [x] Lista de grupos con estado `NOTIFICAR_AGENTE_ADUANERO` o `EN_ESPERA_DOCUMENTOS_CLIENTE`
- [x] Agregar pestaña en Finanzas
- [x] Agregar pestaña en Jefe de Ventas
- [x] Endpoint backend `/api/grupos-importacion/gestion-importaciones`
- [x] Funcionalidades implementadas:
  - [x] Cambiar estado a "Notificar a agente aduanero"
  - [x] Registrar pagos pendientes de cliente (modal básico)
  - [x] Generar Autorización de Venta (con número de factura y trámite)
  - [x] Cargar "Documento recibido por comando conjunto" (modal completo)
  - [x] **NUEVO:** Mostrar estado de documentos en lista de clientes del grupo
    - [x] Columna "Documentos" en tabla de clientes
    - [x] Badge verde "✓ Completos" para clientes con documentos completos
    - [x] Badge rojo "⚠ Faltan documentos" para clientes con documentos incompletos
  - [ ] Enviar email al cliente con instrucciones (pendiente - requiere servicio de email)

---

## 🎨 Frontend - Documentos por Cliente

### Gestión de Documentos Finales
- [ ] Componente para gestionar documentos por cliente
- [ ] Lista de documentos requeridos por cliente:
  - [ ] Resolución para migrar serie al cliente
  - [ ] Guía de libre tránsito
- [ ] Botón "Generar Acta Entrega Recepción"
  - [ ] Modal con datos de receptor modificables
- [ ] Cargar documento de entrega firmado
- [ ] Cambiar estado del cliente a "Inactivo" al finalizar

---

## 📊 DTOs y Mappers

### DTOs
- [x] `DocumentoGrupoImportacionDTO`
- [x] `GrupoImportacionResumenDTO` (con conteo de clientes por tipo)
- [x] Los endpoints usan parámetros directos en lugar de DTOs de request (implementado así intencionalmente)

### Mappers
- [x] `DocumentoGrupoImportacionMapper`
- [x] `GrupoImportacionMapper` tiene método para resumen

---

## 🔐 Seguridad y Permisos

### Roles y Rutas
- [x] Rol `OPERATIONS` existe en configuración
- [x] Ruta `/operaciones` existe en `App.tsx`
- [x] Endpoints protegidos con JWT
- [ ] Verificar permisos específicos por rol en endpoints (pendiente de revisión)

---

## 🧪 Testing

### Backend
- [ ] Tests unitarios para `DocumentoGrupoImportacionService`
- [ ] Tests unitarios para métodos del flujo en `GrupoImportacionService`
- [ ] Tests de integración para endpoints de operaciones
- [ ] Tests para generación de PDF

### Frontend
- [ ] Tests para componentes de operaciones
- [ ] Tests para carga de documentos
- [ ] Tests para validaciones de botones

---

## 🔒 Validaciones de Negocio

### Validación de Documentos Obligatorios
- [x] **Validación antes de asignar cliente a grupo:**
  - [x] Verificar que el cliente tenga todos sus documentos obligatorios cargados y aprobados
  - [x] Validación en backend: `GrupoImportacionService.agregarCliente()` usa `DocumentoClienteService.verificarDocumentosCompletos()`
  - [x] Validación considera documentos obligatorios según `tipoProcesoId` del cliente
  - [x] Solo documentos con estado `APROBADO` se consideran válidos
  - [x] Mensaje de error claro: "El cliente no tiene todos sus documentos obligatorios completos"
  - [x] Frontend muestra estado visual de documentos en modal de agregar clientes
  - [x] Frontend previene selección de clientes sin documentos completos
  - [x] Backend bloquea asignación incluso si se intenta por API directamente

---

## 📝 Documentación

- [ ] Documentar flujo completo en README
- [ ] Documentar endpoints de API
- [ ] Crear guía de usuario para rol Operaciones
- [ ] Actualizar diagrama de flujo del proceso

---

## 🐛 Bugs Conocidos

- [ ] (Agregar bugs encontrados durante desarrollo)

---

## 📌 Notas Importantes

- ⚠️ **NO actualizar el script maestro** (`00_gmarm_completo.sql`) - Solo usar scripts de migración
- ⚠️ Los documentos 1, 2, 3 deben estar cargados antes de habilitar "Notificar Pago Fabrica"
- ⚠️ El packing list se asigna masivamente (proceso ya en producción)
- ⚠️ Los documentos por cliente se gestionan después de todos los pasos previos del grupo
- ⚠️ **Nueva estructura de documentos:**
  - Clientes: `documentos_clientes/{cedula}/documentos_cargados/` y `documentos_generados/`
  - Grupos: `documentos_importacion/{grupoId}/documentos_cargados/` y `documentos_generados/`
- ⚠️ **Configuraciones actualizadas:**
  - `EXPOFERIA_ACTIVA` = false
  - `COORDINADOR_NOMBRE` (antes COORDINADOR_NOMBRE_EXPOFERIA)
  - `COORDINADOR_CARGO` (antes COORDINADOR_CARGO_EXPOFERIA)
  - `COORDINADOR_DIRECCION` (antes COORDINADOR_DIRECCION_EXPOFERIA)
- ⚠️ **Validación de documentos obligatorios:**
  - Los clientes DEBEN tener todos sus documentos obligatorios cargados y aprobados antes de ser asignados a un grupo de importación
  - La validación se realiza tanto en frontend (visual) como en backend (bloqueo)
  - Solo documentos con estado `APROBADO` se consideran válidos
  - La validación considera los documentos obligatorios según el `tipoProcesoId` del cliente

---

## 🎯 Próximos Pasos (Prioridad)

### 🔴 ALTA PRIORIDAD
1. ✅ **COMPLETADO** - Proceso "Definir Pedido" verificado e implementado completamente (Jefe de Ventas)
2. **⏳ VERIFICAR** que el flujo completo de Operaciones funcione correctamente
3. Revisar permisos específicos por rol en endpoints

### 🟡 MEDIA PRIORIDAD
4. Implementar gestión de documentos por cliente (finalización)
5. Enviar email al cliente con instrucciones
6. Filtros y búsqueda adicionales (opcionales)

### 🟢 BAJA PRIORIDAD
7. Validación de tipo de archivo en frontend
8. Preview de documentos
9. Tests unitarios e integración

### 🔧 TECHNICAL DEBT (Revisión General del Proyecto)
10. ⏳ **PENDIENTE** - Revisar y refactorizar código duplicado en todo el proyecto:
    - [ ] Identificar duplicaciones de código en frontend (funciones, helpers, mappers)
    - [ ] Identificar duplicaciones de código en backend (servicios, helpers, validaciones)
    - [ ] Crear archivos de utilidades compartidas donde corresponda
    - [ ] Refactorizar código duplicado para usar funciones compartidas
    - [ ] Revisar patrones repetitivos que puedan ser extraídos a helpers/services comunes
    - Nota: Se ha comenzado con `typeMappers.ts` y funciones helper en `ClientForm.tsx`, pero se requiere una revisión completa del proyecto

---

**Última actualización:** 2024-12-23 - Corrección de ruta de visualización de documentos generados. El método `construirRutaCompletaDocumentoGenerado` ahora construye correctamente la ruta como `/app/documentacion/documentos_cliente/` + `rutaBD`, funcionando tanto en Windows (Docker) como en Ubuntu (Docker). Mejoras en manejo de errores para requests duplicados (validación de clave única con mensajes claros). Proceso "Definir Pedido" verificado y funcional completamente. Validación de documentos obligatorios implementada. Backend valida que todos los documentos obligatorios estén completos y aprobados antes de asignar clientes. Frontend muestra estado visual y previene asignación. PDF se genera correctamente, estado cambia a `SOLICITAR_PROFORMA_FABRICA`, y el grupo pasa a la vista de Operaciones automáticamente.

# Validación del Flujo de Guardado de Cliente

## 📋 Resumen del Flujo

### Frontend → Backend

1. **Frontend (`ClientForm.tsx`)**:
   - Construye `requestData` con:
     ```typescript
     {
       cliente: {
         nombres, apellidos, numeroIdentificacion,
         tipoIdentificacionCodigo, tipoClienteCodigo,
         fechaNacimiento, direccion, provincia, canton,
         email, telefonoPrincipal, telefonoSecundario,
         representanteLegal, ruc, nombreEmpresa,
         direccionFiscal, telefonoReferencia, correoEmpresa,
         provinciaEmpresa, cantonEmpresa,
         estadoMilitar, codigoIssfa, rango,
         estado, // Campo adicional que el backend puede ignorar
         usuarioCreadorId // Campo adicional que el backend ignora (usa JWT)
       },
       respuestas: [
         { preguntaId: number, respuesta: string }
       ],
       arma: { // Opcional
         armaId: number,
         cantidad: number,
         precioUnitario: number,
         precioTotal: number
       }
     }
     ```

2. **Backend (`ClienteController.crearCliente`)**:
   - Recibe `requestData` y `Authorization` header
   - Extrae `usuarioId` del JWT (ignora `usuarioCreadorId` del body)
   - Llama a `ClienteCompletoService.crearClienteCompleto(requestData, usuarioId)`

3. **Backend (`ClienteCompletoService.crearClienteCompleto`)** - **TRANSACCIONAL**:
   - Extrae datos de cliente: `extraerDatosCliente(requestData)`
   - Construye DTO: `construirClienteCreateDTO(clientData)`
   - Crea cliente básico: `crearClienteBasico(requestData, usuarioId)`
   - Guarda respuestas: `guardarRespuestasDelCliente(requestData, cliente)`
   - Asigna arma (si existe): `asignarArmaAlCliente(requestData, cliente)`
   - Crea pago (opcional, si viene): `crearPagoDelCliente(...)`
   - Genera contrato (si hay pago): `generarContratoDelCliente(...)`

4. **Documentos** (después de la transacción):
   - Se suben después porque son archivos multipart
   - Se hace en el frontend después de crear el cliente

## ✅ Validación de Campos

### Campos del Cliente (ClienteCreateDTO)

| Campo Frontend | Campo Backend | Estado | Notas |
|---------------|---------------|--------|-------|
| `nombres` | `nombres` | ✅ | Requerido |
| `apellidos` | `apellidos` | ✅ | Requerido |
| `numeroIdentificacion` | `numeroIdentificacion` | ✅ | Requerido |
| `tipoIdentificacionCodigo` | `tipoIdentificacionCodigo` | ✅ | "CED", "RUC", "PAS" |
| `tipoClienteCodigo` | `tipoClienteCodigo` | ✅ | "CIV", "MIL", "EMP", "DEP" |
| `fechaNacimiento` | `fechaNacimiento` | ✅ | Formato YYYY-MM-DD |
| `direccion` | `direccion` | ✅ | Requerido |
| `provincia` | `provincia` | ✅ | Requerido |
| `canton` | `canton` | ✅ | Requerido |
| `email` | `email` | ✅ | Requerido |
| `telefonoPrincipal` | `telefonoPrincipal` | ✅ | Requerido |
| `telefonoSecundario` | `telefonoSecundario` | ✅ | Opcional |
| `representanteLegal` | `representanteLegal` | ✅ | Solo empresas |
| `ruc` | `ruc` | ✅ | Solo empresas |
| `nombreEmpresa` | `nombreEmpresa` | ✅ | Solo empresas |
| `direccionFiscal` | `direccionFiscal` | ✅ | Solo empresas |
| `telefonoReferencia` | `telefonoReferencia` | ✅ | Solo empresas |
| `correoEmpresa` | `correoEmpresa` | ✅ | Solo empresas |
| `provinciaEmpresa` | `provinciaEmpresa` | ✅ | Solo empresas |
| `cantonEmpresa` | `cantonEmpresa` | ✅ | Solo empresas |
| `estadoMilitar` | `estadoMilitar` | ✅ | Solo militares ("ACTIVO", "PASIVO") |
| `codigoIssfa` | `codigoIssfa` | ✅ | Solo militares activos |
| `rango` | `rango` | ✅ | Opcional (militares/policías) |
| `estado` | ❌ | ⚠️ | Campo extra que el backend ignora |
| `usuarioCreadorId` | ❌ | ⚠️ | Campo extra que el backend ignora (usa JWT) |

### Respuestas

| Campo Frontend | Campo Backend | Estado |
|---------------|---------------|--------|
| `preguntaId` | `preguntaId` | ✅ |
| `respuesta` | `respuesta` | ✅ |

### Arma (Opcional)

| Campo Frontend | Campo Backend | Estado |
|---------------|---------------|--------|
| `armaId` | `armaId` | ✅ |
| `cantidad` | `cantidad` | ✅ |
| `precioUnitario` | `precioUnitario` | ✅ |
| `precioTotal` | `precioTotal` | ✅ |

## 🔄 Flujo de Transacción

1. **Inicio de transacción** (`@Transactional(rollbackFor = Exception.class)`)
2. **Crear cliente básico** → Si falla, rollback
3. **Guardar respuestas** → Si falla, rollback
4. **Asignar arma** → Si falla, rollback
   - **IMPORTANTE**: NO se valida stock porque estas son armas para importación que aún no están físicamente disponibles
   - Las armas se reservan para el cliente y se importarán posteriormente
5. **Crear pago** (opcional) → Si falla, rollback
6. **Generar contrato** (solo si hay pago, no crítico) → Si falla, NO hace rollback (catch interno)
7. **Commit de transacción** → Todo se guarda

## ⚠️ Puntos de Atención

1. **Documentos**: Se suben DESPUÉS de la transacción porque son archivos multipart. Si falla subir documentos, el cliente ya está creado.

2. **Campo `estado`**: El frontend lo incluye pero el backend lo ignora. No debería causar problemas.

3. **Campo `usuarioCreadorId`**: El frontend lo incluye pero el backend lo ignora y usa el JWT. No debería causar problemas.

4. **Respuestas vacías**: Si no hay respuestas, el método `guardarRespuestasDelCliente` simplemente no hace nada (no falla).

5. **Arma opcional**: Si no hay arma seleccionada, el método `asignarArmaAlCliente` simplemente no hace nada (no falla).

6. **⚠️ VALIDACIÓN DE STOCK - IMPORTANTE**: 
   - **NO se valida stock** al asignar/reservar armas porque estas son armas para importación
   - Las armas aún no están físicamente disponibles cuando se reservan
   - El proceso es: Cliente reserva arma → Se agrega a grupo de importación → Se importa → Llega físicamente
   - Cuando se cancela o elimina una reserva, **NO se devuelve stock** al inventario porque nunca tuvo stock físico
   - Servicios afectados:
     - `GestionArmasServiceHelper.asignarArmaACliente()` - No valida ni reduce stock
     - `ClienteArmaService.crearReserva()` - No valida ni reduce stock
     - `ClienteArmaService.cancelarReserva()` - No devuelve stock
     - `ClienteArmaService.eliminarReserva()` - No devuelve stock

## 📦 Proceso de Reserva de Armas

### Flujo de Importación

1. **Cliente selecciona arma** → Se reserva (estado: `RESERVADA`)
2. **Cliente se agrega a grupo de importación** → Las armas se agrupan para importar
3. **Se realiza la importación** → Las armas llegan físicamente
4. **Se asigna número de serie** (si aplica) → Estado cambia a `ASIGNADA`
5. **Cliente recibe arma** → Estado cambia a `COMPLETADA`

### Validaciones Aplicadas

- ✅ **Validación de documentos**: El cliente debe tener todos sus documentos obligatorios completos y aprobados antes de reservar un arma
- ❌ **NO se valida stock**: Las armas no tienen stock físico porque aún no han sido importadas
- ❌ **NO se reduce stock**: No hay stock físico que reducir
- ❌ **NO se devuelve stock**: No hay stock físico que devolver al cancelar/eliminar reservas

## ✅ Estado Final

**El flujo está completo y listo para pruebas de campo.**

- ✅ Todos los campos requeridos están mapeados correctamente
- ✅ El formato de datos es correcto
- ✅ La transacción funciona correctamente
- ✅ Los campos opcionales están manejados
- ✅ Los campos adicionales del frontend no causan problemas
- ✅ El proceso de reserva de armas funciona sin validación de stock (proceso de importación)


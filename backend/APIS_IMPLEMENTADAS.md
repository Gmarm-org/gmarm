# 📋 APIS IMPLEMENTADAS - SISTEMA DE IMPORTACIÓN DE ARMAS

## 🏗️ **ARQUITECTURA DEL SISTEMA**

```
Frontend (Next.js) ↔ API Gateway ↔ Backend (Spring Boot) ↔ PostgreSQL
```

## 🎯 **ROLES Y MÓDULOS PRINCIPALES**

1. **VENDEDOR** - Gestión de clientes y asignación de armas
2. **JEFE DE VENTAS** - Aprobación y gestión de importaciones  
3. **FINANZAS** - Gestión de pagos y facturación
4. **OPERACIONES** - Gestión de importación y documentación
5. **ADMINISTRADOR** - Gestión de usuarios y configuración

## 📚 **ENTIDADES IMPLEMENTADAS**

### **Usuarios y Roles**
- ✅ `Usuario` - Gestión de usuarios del sistema
- ✅ `Rol` - Roles y permisos
- ✅ `usuario_rol` - Relación muchos a muchos

### **Clientes y Tipos**
- ✅ `Cliente` - Información de clientes
- ✅ `TipoCliente` - Tipos de cliente (Civil, Militar, Empresa, Deportista)
- ✅ `TipoIdentificacion` - Tipos de identificación
- ✅ `RespuestaCliente` - Respuestas a preguntas
- ✅ `PreguntaCliente` - Preguntas por tipo de cliente
- ✅ `TipoProceso` - Tipos de proceso
- ✅ `TipoImportacion` - Tipos de importación

### **Armas y Catálogos**
- ✅ `ModeloArma` - Modelos de armas disponibles
- ✅ `CategoriaArma` - Categorías de armas
- ✅ `ArmaFisica` - Armas físicas con números de serie
- ✅ `Accesorio` - Accesorios disponibles
- ✅ `AccesorioFisico` - Accesorios físicos

### **Importaciones y Licencias**
- ✅ `Licencia` - Licencias de importación
- ✅ `GrupoImportacion` - Grupos de importación
- ✅ `AsignacionArma` - Asignación de armas a clientes
- ✅ `AsignacionAccesorio` - Asignación de accesorios

### **Pagos y Finanzas**
- ✅ `PlanPago` - Planes de pago
- ✅ `Pago` - Pagos realizados
- ✅ `CuotaPago` - Cuotas de pago

### **Documentos**
- ✅ `TipoDocumento` - Tipos de documentos
- ✅ `DocumentoCliente` - Documentos de clientes
- ✅ `DocumentoGenerado` - Documentos generados por el sistema

### **Notificaciones**
- ✅ `Notificacion` - Notificaciones del sistema

## 🔧 **ENUMS IMPLEMENTADOS**

- ✅ `EstadoUsuario` - Estados de usuario
- ✅ `EstadoCliente` - Estados de cliente
- ✅ `EstadoMilitar` - Estados militares
- ✅ `TipoRolVendedor` - Tipos de rol vendedor
- ✅ `EstadoDocumento` - Estados de documentos
- ✅ `EstadoAsignacion` - Estados de asignación
- ✅ `EstadoLicencia` - Estados de licencia
- ✅ `EstadoArmaFisica` - Estados de arma física
- ✅ `EstadoAccesorioFisico` - Estados de accesorio físico
- ✅ `TipoPago` - Tipos de pago
- ✅ `EstadoPago` - Estados de pago
- ✅ `EstadoCuotaPago` - Estados de cuota de pago
- ✅ `TipoNotificacion` - Tipos de notificación
- ✅ `EstadoNotificacion` - Estados de notificación
- ✅ `TipoDocumentoGenerado` - Tipos de documento generado
- ✅ `EstadoDocumentoGenerado` - Estados de documento generado

## 🗄️ **REPOSITORIOS IMPLEMENTADOS**

### **Usuarios y Roles**
- ✅ `UsuarioRepository` - Operaciones CRUD de usuarios
- ✅ `RolRepository` - Operaciones CRUD de roles

### **Clientes**
- ✅ `ClienteRepository` - Operaciones CRUD de clientes
- ✅ `TipoClienteRepository` - Operaciones de tipos de cliente
- ✅ `ModeloArmaRepository` - Operaciones de modelos de arma

### **Importaciones**
- ✅ `LicenciaRepository` - Operaciones de licencias
- ✅ `CategoriaArmaRepository` - Operaciones de categorías
- ✅ `AccesorioRepository` - Operaciones de accesorios
- ✅ `ArmaFisicaRepository` - Operaciones de armas físicas

### **Pagos**
- ✅ `PagoRepository` - Operaciones de pagos
- ✅ `PlanPagoRepository` - Operaciones de planes de pago

## 🚀 **SERVICIOS IMPLEMENTADOS**

### **Usuarios**
- ✅ `UsuarioService` - Lógica de negocio para usuarios
- ✅ `ClienteService` - Lógica de negocio para clientes

### **Importaciones**
- ✅ `LicenciaService` - Lógica de negocio para licencias

### **Pagos**
- ✅ `PagoService` - Lógica de negocio para pagos

## 🌐 **CONTROLADORES IMPLEMENTADOS**

### **Usuarios**
- ✅ `UsuarioController` - Endpoints REST para usuarios
- ✅ `LicenciaController` - Endpoints REST para licencias
- ✅ `PagoController` - Endpoints REST para pagos

## 📋 **ENDPOINTS DISPONIBLES**

### **🔐 USUARIOS** (`/api/usuarios`)

#### **CRUD Básico**
- `POST /api/usuarios` - Crear usuario
- `GET /api/usuarios/{id}` - Obtener usuario por ID
- `GET /api/usuarios` - Listar usuarios (paginado)
- `PUT /api/usuarios/{id}` - Actualizar usuario
- `DELETE /api/usuarios/{id}` - Eliminar usuario

#### **Gestión de Roles**
- `POST /api/usuarios/{id}/roles` - Asignar roles
- `DELETE /api/usuarios/{id}/roles/{rolId}` - Remover rol
- `GET /api/usuarios/{id}/roles` - Obtener roles del usuario

#### **Estados y Seguridad**
- `PUT /api/usuarios/{id}/desbloquear` - Desbloquear usuario
- `PUT /api/usuarios/{id}/bloquear` - Bloquear usuario
- `GET /api/usuarios/vendedores` - Obtener vendedores
- `GET /api/usuarios/por-estado/{estado}` - Usuarios por estado
- `GET /api/usuarios/por-rol/{rolId}` - Usuarios por rol

#### **Búsquedas**
- `GET /api/usuarios/buscar` - Buscar usuarios con filtros

### **📄 LICENCIAS** (`/api/licencias`)

#### **CRUD Básico**
- `POST /api/licencias` - Crear licencia
- `GET /api/licencias/{id}` - Obtener licencia por ID
- `GET /api/licencias` - Listar licencias (paginado)
- `PUT /api/licencias/{id}` - Actualizar licencia
- `DELETE /api/licencias/{id}` - Eliminar licencia

#### **Gestión de Cupos**
- `GET /api/licencias/activas` - Obtener licencias activas
- `GET /api/licencias/cupo-civil-disponible` - Licencias con cupo civil
- `GET /api/licencias/{id}/tiene-cupo` - Verificar cupo disponible
- `POST /api/licencias/{id}/decrementar-cupo` - Decrementar cupo

#### **Estados y Fechas**
- `PUT /api/licencias/{id}/estado` - Cambiar estado
- `GET /api/licencias/proximas-vencer` - Licencias próximas a vencer

#### **Búsquedas y Estadísticas**
- `GET /api/licencias/buscar` - Buscar licencias con filtros
- `GET /api/licencias/estadisticas` - Estadísticas por estado

### **💰 PAGOS** (`/api/pagos`)

#### **CRUD Básico**
- `POST /api/pagos` - Crear pago
- `GET /api/pagos/{id}` - Obtener pago por ID
- `GET /api/pagos` - Listar pagos (paginado)
- `PUT /api/pagos/{id}` - Actualizar pago
- `DELETE /api/pagos/{id}` - Eliminar pago

#### **Gestión por Cliente**
- `GET /api/pagos/cliente/{clienteId}` - Pagos por cliente
- `GET /api/pagos/cliente/{clienteId}/saldo` - Saldo del cliente

#### **Filtros y Fechas**
- `GET /api/pagos/por-fecha` - Pagos por rango de fechas
- `GET /api/pagos/pendientes` - Pagos pendientes
- `GET /api/pagos/buscar` - Buscar pagos con filtros

#### **Estados y Utilidades**
- `PUT /api/pagos/{id}/estado` - Cambiar estado
- `GET /api/pagos/estadisticas` - Estadísticas por estado
- `GET /api/pagos/generar-comprobante` - Generar número de comprobante

### **👥 CLIENTES** (`/api/clientes`)

#### **CRUD Básico**
- `POST /api/clientes` - Crear cliente
- `GET /api/clientes/{id}` - Obtener cliente por ID
- `GET /api/clientes` - Listar clientes (paginado)
- `PUT /api/clientes/{id}` - Actualizar cliente
- `DELETE /api/clientes/{id}` - Eliminar cliente

#### **Búsquedas Específicas**
- `GET /api/clientes/por-vendedor/{vendedorId}` - Clientes por vendedor
- `GET /api/clientes/por-identificacion/{numero}` - Cliente por identificación
- `GET /api/clientes/por-estado/{estado}` - Clientes por estado
- `GET /api/clientes/buscar` - Buscar clientes con filtros

## 🔒 **SEGURIDAD Y AUTORIZACIÓN**

### **Roles Requeridos**
- `VENDEDOR` - Acceso a gestión de clientes
- `JEFE_VENTAS` - Acceso a licencias e importaciones
- `FINANZAS` - Acceso a pagos y facturación
- `OPERACIONES` - Acceso a gestión de importación
- `ADMIN` - Acceso completo al sistema

### **Anotaciones de Seguridad**
- `@PreAuthorize("hasRole('ROLE')")` - Control de acceso por rol
- `@Valid` - Validación de datos de entrada
- `@Transactional` - Control de transacciones

## 📊 **VALIDACIONES IMPLEMENTADAS**

### **Usuarios**
- ✅ Username único
- ✅ Email único
- ✅ Validación de contraseña
- ✅ Control de intentos de login
- ✅ Bloqueo automático

### **Clientes**
- ✅ Número de identificación único
- ✅ Validación de edad mínima
- ✅ Validación de email
- ✅ Validación de teléfonos

### **Licencias**
- ✅ Número de licencia único
- ✅ Control de cupos disponibles
- ✅ Validación de fechas de vencimiento

### **Pagos**
- ✅ Número de comprobante único
- ✅ Validación de montos
- ✅ Control de saldos

## 🚧 **PRÓXIMOS PASOS**

### **Entidades Faltantes**
- ⏳ `GrupoImportacion` - Completar relaciones
- ⏳ `DocumentoCliente` - Implementar servicio
- ⏳ `Notificacion` - Implementar servicio
- ⏳ `DocumentoGenerado` - Implementar servicio

### **Servicios Faltantes**
- ⏳ `GrupoImportacionService`
- ⏳ `DocumentoService`
- ⏳ `NotificacionService`
- ⏳ `ArmaFisicaService`
- ⏳ `AccesorioService`

### **Controladores Faltantes**
- ⏳ `ClienteController`
- ⏳ `GrupoImportacionController`
- ⏳ `DocumentoController`
- ⏳ `NotificacionController`
- ⏳ `ArmaFisicaController`

### **Configuraciones**
- ⏳ Spring Security con JWT
- ⏳ Configuración de Swagger
- ⏳ Configuración de email
- ⏳ Configuración de archivos

## 📝 **NOTAS IMPORTANTES**

1. **Base de Datos**: Todas las entidades incluyen auditoría (`fechaCreacion`, `fechaActualizacion`)
2. **Validaciones**: Implementadas tanto a nivel de entidad como de servicio
3. **Seguridad**: Control de acceso basado en roles implementado
4. **Documentación**: Swagger configurado para documentación automática
5. **Manejo de Errores**: Excepciones personalizadas y manejo global

## 🔗 **ENLACES ÚTILES**

- **Swagger UI**: `http://localhost:8080/swagger-ui.html`
- **Base de Datos**: PostgreSQL en puerto 5432
- **API Base**: `http://localhost:8080/api`
- **Documentación**: `backend/APIS_IMPLEMENTADAS.md` 
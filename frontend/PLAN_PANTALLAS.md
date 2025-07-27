# 🎨 PLAN DE PANTALLAS - SISTEMA DE IMPORTACIÓN DE ARMAS

## 🏗️ **ARQUITECTURA FRONTEND**

```
Next.js App
├── Pages (Rutas)
├── Components (Componentes reutilizables)
├── Hooks (Lógica de estado)
├── Services (APIs)
├── Contexts (Estado global)
├── Utils (Utilidades)
└── Styles (Estilos)
```

## 🎯 **PANTALLAS PRINCIPALES POR ROL**

### **🔐 AUTENTICACIÓN**
- ✅ **Login** - Autenticación de usuarios
- ⏳ **Recuperar Contraseña** - Recuperación de credenciales
- ⏳ **Cambiar Contraseña** - Cambio de contraseña

### **👤 ADMINISTRADOR**
- ✅ **Gestión de Usuarios** (`/usuario`) - CRUD de usuarios y roles
- ⏳ **Gestión de Roles** - Administración de roles y permisos
- ⏳ **Configuración del Sistema** - Configuraciones generales
- ⏳ **Logs y Auditoría** - Registro de actividades

### **💰 VENDEDOR**
- ✅ **Dashboard Vendedor** (`/vendedor`) - Vista principal del vendedor
- ✅ **Gestión de Clientes** - CRUD de clientes
- ✅ **Asignación de Armas** - Selección y asignación de armas
- ⏳ **Reserva de Armas** - Reserva sin cliente
- ⏳ **Documentos de Cliente** - Carga y gestión de documentos
- ⏳ **Preguntas de Cliente** - Formulario de preguntas por tipo

### **📊 JEFE DE VENTAS**
- ⏳ **Dashboard Jefe Ventas** - Vista principal del jefe de ventas
- ⏳ **Gestión de Importaciones** - Lista de importaciones
- ⏳ **Aprobación de Solicitudes** - Revisión y aprobación
- ⏳ **Asignación de Licencias** - Gestión de licencias y cupos
- ⏳ **Generación de Contratos** - Creación de contratos
- ⏳ **Carga de Documentos** - Documentos firmados

### **💳 FINANZAS**
- ⏳ **Dashboard Finanzas** - Vista principal de finanzas
- ⏳ **Gestión de Pagos** - Registro y seguimiento de pagos
- ⏳ **Planes de Pago** - Configuración de planes
- ⏳ **Facturación** - Generación de facturas
- ⏳ **Reportes Financieros** - Reportes y estadísticas

### **⚙️ OPERACIONES**
- ⏳ **Dashboard Operaciones** - Vista principal de operaciones
- ⏳ **Gestión de Importación** - Seguimiento de importaciones
- ⏳ **Documentos de Importación** - Carga de documentos
- ⏳ **Asignación de Series** - Números de serie
- ⏳ **Seguimiento de Estado** - Estados de importación
- ⏳ **Generación de Documentos** - Documentos automáticos

## 📱 **DETALLE DE PANTALLAS**

### **🔐 1. LOGIN**
**Ruta**: `/login`
**Descripción**: Autenticación de usuarios con email y contraseña
**Funcionalidades**:
- ✅ Formulario de login
- ✅ Validación de credenciales
- ✅ Redirección por rol
- ✅ Recordar sesión
- ⏳ Recuperar contraseña
- ⏳ Bloqueo por intentos

**Componentes**:
- `LoginForm`
- `AuthContext`
- `useAuth`

### **👤 2. GESTIÓN DE USUARIOS**
**Ruta**: `/usuario`
**Descripción**: CRUD completo de usuarios del sistema
**Funcionalidades**:
- ✅ Lista de usuarios con filtros
- ✅ Crear/Editar usuario
- ✅ Asignar/Remover roles
- ✅ Carga de foto de perfil
- ✅ Cambiar estado (activo/bloqueado)
- ✅ Búsqueda y paginación

**Componentes**:
- `UsuarioList`
- `UsuarioForm`
- `UsuarioDetail`
- `RoleSelector`
- `FileUpload`

### **💰 3. DASHBOARD VENDEDOR**
**Ruta**: `/vendedor`
**Descripción**: Vista principal del vendedor con estadísticas y clientes
**Funcionalidades**:
- ✅ Estadísticas de clientes por tipo
- ✅ Lista de clientes del vendedor
- ✅ Acciones rápidas (crear, editar, ver)
- ✅ Filtros y búsqueda
- ✅ Responsive design

**Componentes**:
- `VendedorDashboard`
- `ClientStats`
- `ClientList`
- `ClientActions`

### **👥 4. GESTIÓN DE CLIENTES**
**Ruta**: `/vendedor/cliente`
**Descripción**: Formulario completo de gestión de clientes
**Funcionalidades**:
- ✅ Formulario dinámico por tipo de cliente
- ✅ Validaciones específicas por tipo
- ✅ Carga de documentos requeridos
- ✅ Preguntas específicas por tipo
- ✅ Asignación de armas
- ✅ Ubicación (Provincia/Cantón)

**Tipos de Cliente**:
- **Civil**: Cédula, documentos básicos
- **Militar**: Cédula + credencial militar
- **Empresa**: RUC + documentos empresariales
- **Deportista**: Cédula + credenciales deportivas

**Componentes**:
- `ClientForm`
- `ClientTypeSelector`
- `DocumentUpload`
- `Questionnaire`
- `WeaponSelector`

### **🔫 5. ASIGNACIÓN DE ARMAS**
**Ruta**: `/vendedor/asignacion`
**Descripción**: Selección y asignación de armas a clientes
**Funcionalidades**:
- ✅ Catálogo de armas disponibles
- ✅ Selección múltiple
- ✅ Precios personalizados por cliente
- ✅ Cálculo de IVA y precio final
- ✅ Cantidad para empresas
- ✅ Reserva temporal

**Componentes**:
- `WeaponCatalog`
- `WeaponSelector`
- `PriceCalculator`
- `AssignmentSummary`

### **📊 6. DASHBOARD JEFE DE VENTAS**
**Ruta**: `/jefe-ventas`
**Descripción**: Vista principal del jefe de ventas
**Funcionalidades**:
- ✅ Lista de importaciones (completas/incompletas)
- ✅ Estadísticas de cupos
- ✅ Aprobación de solicitudes
- ✅ Asignación de licencias
- ✅ Generación de contratos

**Componentes**:
- `JefeVentasDashboard`
- `ImportacionList`
- `CupoManager`
- `ContractGenerator`

### **📋 7. GESTIÓN DE IMPORTACIONES**
**Ruta**: `/jefe-ventas/importacion`
**Descripción**: Gestión completa de importaciones
**Funcionalidades**:
- ✅ Crear nueva importación
- ✅ Asignar licencias
- ✅ Gestionar cupos por tipo
- ✅ Generar contratos automáticos
- ✅ Carga de documentos firmados
- ✅ Seguimiento de estado

**Componentes**:
- `ImportacionForm`
- `LicenciaSelector`
- `CupoManager`
- `ContractGenerator`
- `DocumentManager`

### **💳 8. DASHBOARD FINANZAS**
**Ruta**: `/finanzas`
**Descripción**: Vista principal de finanzas
**Funcionalidades**:
- ✅ Clientes por cobrar
- ✅ Clientes con pago completo
- ✅ Registro de pagos
- ✅ Generación de facturas
- ✅ Reportes financieros

**Componentes**:
- `FinanzasDashboard`
- `PaymentList`
- `PaymentForm`
- `InvoiceGenerator`

### **💰 9. GESTIÓN DE PAGOS**
**Ruta**: `/finanzas/pagos`
**Descripción**: Gestión completa de pagos
**Funcionalidades**:
- ✅ Registro de pagos
- ✅ Planes de pago
- ✅ Cuotas y anticipos
- ✅ Generación de comprobantes
- ✅ Seguimiento de saldos
- ✅ Generación de facturas

**Componentes**:
- `PaymentManager`
- `PaymentPlanSelector`
- `PaymentForm`
- `BalanceTracker`
- `InvoiceGenerator`

### **⚙️ 10. DASHBOARD OPERACIONES**
**Ruta**: `/operaciones`
**Descripción**: Vista principal de operaciones
**Funcionalidades**:
- ✅ Estado de importaciones
- ✅ Documentos pendientes
- ✅ Asignación de series
- ✅ Seguimiento de procesos
- ✅ Generación de documentos

**Componentes**:
- `OperacionesDashboard`
- `ImportacionStatus`
- `DocumentManager`
- `SerialNumberAssigner`

### **📄 11. GESTIÓN DE DOCUMENTOS**
**Ruta**: `/operaciones/documentos`
**Descripción**: Gestión de documentos de importación
**Funcionalidades**:
- ✅ Carga de documentos
- ✅ Generación automática
- ✅ Seguimiento de estado
- ✅ Notificaciones
- ✅ Archivo digital

**Componentes**:
- `DocumentManager`
- `DocumentUpload`
- `DocumentGenerator`
- `DocumentStatus`

## 🎨 **COMPONENTES REUTILIZABLES**

### **Formularios**
- `FormField` - Campo de formulario genérico
- `FormSection` - Sección de formulario
- `FormValidation` - Validación de formularios
- `DynamicForm` - Formulario dinámico

### **Tablas y Listas**
- `DataTable` - Tabla de datos con paginación
- `FilterBar` - Barra de filtros
- `SearchInput` - Campo de búsqueda
- `Pagination` - Paginación

### **Navegación**
- `Sidebar` - Menú lateral
- `Breadcrumb` - Migas de pan
- `TabNavigation` - Navegación por pestañas
- `UserMenu` - Menú de usuario

### **Notificaciones**
- `NotificationCenter` - Centro de notificaciones
- `Toast` - Notificaciones temporales
- `Alert` - Alertas
- `Modal` - Ventanas modales

### **Archivos**
- `FileUpload` - Carga de archivos
- `FilePreview` - Vista previa
- `FileManager` - Gestor de archivos
- `DocumentViewer` - Visor de documentos

## 🔧 **HOOKS PERSONALIZADOS**

### **Estado**
- `useAuth` - Autenticación
- `useUser` - Datos de usuario
- `usePermissions` - Permisos
- `useNotifications` - Notificaciones

### **Formularios**
- `useFormValidation` - Validación
- `useDynamicForm` - Formulario dinámico
- `useFileUpload` - Carga de archivos
- `useSearch` - Búsqueda

### **Datos**
- `useApi` - Llamadas a API
- `usePagination` - Paginación
- `useFilters` - Filtros
- `useRealTime` - Tiempo real

## 📱 **RESPONSIVE DESIGN**

### **Breakpoints**
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### **Adaptaciones**
- **Tablas**: Convertir a cards en mobile
- **Formularios**: Campos en columna única
- **Navegación**: Menú hamburguesa
- **Acciones**: Botones flotantes

## 🎯 **ESTADOS Y FLUJOS**

### **Estados de Cliente**
1. **Borrador** - En proceso de creación
2. **Pendiente** - Esperando aprobación
3. **Aprobado** - Cliente aprobado
4. **Rechazado** - Cliente rechazado
5. **Activo** - Cliente activo
6. **Inactivo** - Cliente inactivo

### **Estados de Importación**
1. **Incompleta** - Faltan datos/documentos
2. **En Revisión** - En proceso de revisión
3. **En Aduana** - Proceso aduanero
4. **Entregados** - Armas entregadas
5. **Completa** - Proceso finalizado

### **Estados de Pago**
1. **Pendiente** - Pago pendiente
2. **Confirmado** - Pago confirmado
3. **Rechazado** - Pago rechazado
4. **Cancelado** - Pago cancelado

## 🚀 **PRÓXIMOS PASOS**

### **Fase 1 - Core (Completado)**
- ✅ Login y autenticación
- ✅ Gestión de usuarios
- ✅ Dashboard vendedor
- ✅ Gestión de clientes básica

### **Fase 2 - Vendedor (En Progreso)**
- ⏳ Asignación de armas
- ⏳ Documentos de cliente
- ⏳ Preguntas por tipo
- ⏳ Reserva de armas

### **Fase 3 - Jefe de Ventas**
- ⏳ Dashboard jefe de ventas
- ⏳ Gestión de importaciones
- ⏳ Asignación de licencias
- ⏳ Generación de contratos

### **Fase 4 - Finanzas**
- ⏳ Dashboard finanzas
- ⏳ Gestión de pagos
- ⏳ Facturación
- ⏳ Reportes

### **Fase 5 - Operaciones**
- ⏳ Dashboard operaciones
- ⏳ Gestión de documentos
- ⏳ Asignación de series
- ⏳ Seguimiento de estado

### **Fase 6 - Integración**
- ⏳ Notificaciones en tiempo real
- ⏳ Reportes avanzados
- ⏳ Optimizaciones
- ⏳ Testing completo

## 📋 **NOTAS IMPORTANTES**

1. **Roles**: Cada pantalla tiene control de acceso por rol
2. **Responsive**: Todas las pantallas son responsive
3. **Validaciones**: Validaciones tanto frontend como backend
4. **Estados**: Manejo de estados de carga y error
5. **Notificaciones**: Sistema de notificaciones integrado
6. **Archivos**: Gestión completa de archivos y documentos
7. **Real-time**: Actualizaciones en tiempo real donde sea necesario 
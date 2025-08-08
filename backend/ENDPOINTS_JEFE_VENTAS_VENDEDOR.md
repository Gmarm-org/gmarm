# 📋 ENDPOINTS JEFE DE VENTAS Y VENDEDOR - SISTEMA DE IMPORTACIÓN DE ARMAS

## 🏗️ **ARQUITECTURA DEL SISTEMA**

```
Frontend (React) ↔ API Gateway ↔ Backend (Spring Boot) ↔ PostgreSQL
```

## 🎯 **MÓDULOS IMPLEMENTADOS**

1. **VENDEDOR** - Gestión de clientes y asignación de armas
2. **JEFE DE VENTAS** - Aprobación y gestión de importaciones  

---

## 🔐 **AUTENTICACIÓN**

Todos los endpoints requieren el header:
```
Authorization: Bearer <token>
```

---

## 👨‍💼 **MÓDULO VENDEDOR** (`/api/vendedor`)

### **GESTIÓN DE CLIENTES**

#### **Obtener clientes del vendedor**
```http
GET /api/vendedor/clientes?estado=ACTIVO&page=0&size=10
```
**Descripción:** Obtiene todos los clientes del vendedor logueado
**Roles:** `VENDEDOR`
**Parámetros:**
- `estado` (opcional): Estado del cliente (ACTIVO, BLOQUEADO, etc.)
- `page` (opcional): Número de página (default: 0)
- `size` (opcional): Tamaño de página (default: 10)

**Response:**
```json
{
  "content": [
    {
      "id": 1,
      "nombres": "Juan",
      "apellidos": "Pérez",
      "email": "juan@example.com",
      "estado": "ACTIVO",
      "procesoCompletado": false,
      "fechaCreacion": "2024-01-01T00:00:00Z"
    }
  ],
  "totalElements": 1,
  "totalPages": 1,
  "size": 10,
  "number": 0
}
```

#### **Crear nuevo cliente**
```http
POST /api/vendedor/clientes
```
**Descripción:** Crea un nuevo cliente para el vendedor
**Roles:** `VENDEDOR`
**Body:**
```json
{
  "nombres": "Juan",
  "apellidos": "Pérez",
  "email": "juan@example.com",
  "telefonoPrincipal": "0991234567",
  "direccion": "Av. Principal 123",
  "provincia": "Pichincha",
  "canton": "Quito",
  "tipoIdentificacion": {
    "id": 1
  },
  "numeroIdentificacion": "1234567890",
  "tipoCliente": {
    "id": 1
  },
  "fechaNacimiento": "1990-01-01"
}
```

#### **Actualizar cliente**
```http
PUT /api/vendedor/clientes/{id}
```
**Descripción:** Actualiza un cliente existente del vendedor
**Roles:** `VENDEDOR`
**Body:** Mismo formato que crear cliente

#### **Obtener cliente por ID**
```http
GET /api/vendedor/clientes/{id}
```
**Descripción:** Obtiene un cliente específico del vendedor
**Roles:** `VENDEDOR`

#### **Completar proceso de cliente**
```http
PUT /api/vendedor/clientes/{id}/completar-proceso
```
**Descripción:** Marca el proceso de datos del cliente como completado
**Roles:** `VENDEDOR`

### **GESTIÓN DE ARMAS**

#### **Obtener armas disponibles**
```http
GET /api/vendedor/armas
```
**Descripción:** Obtiene las armas disponibles para asignación
**Roles:** `VENDEDOR`

**Response:**
```json
[
  {
    "id": 1,
    "nombre": "Pistola Glock 17",
    "precio": 1500.00,
    "disponible": true,
    "categoria": {
      "id": 1,
      "nombre": "Pistolas"
    }
  }
]
```

#### **Obtener precio de arma**
```http
GET /api/vendedor/armas/{armaId}/precio
```
**Descripción:** Obtiene el precio actual de una arma específica
**Roles:** `VENDEDOR`

**Response:**
```json
{
  "armaId": 1,
  "nombre": "Pistola Glock 17",
  "precio": 1500.00,
  "disponible": true
}
```

### **ASIGNACIÓN DE ARMAS**

#### **Asignar arma a cliente**
```http
POST /api/vendedor/clientes/{clienteId}/asignar-arma/{armaId}?cantidad=1
```
**Descripción:** Asigna una arma a un cliente específico
**Roles:** `VENDEDOR`
**Parámetros:**
- `cantidad` (opcional): Cantidad de armas a asignar (default: 1)

**Response:**
```json
{
  "id": 1,
  "cliente": {
    "id": 1,
    "nombres": "Juan",
    "apellidos": "Pérez"
  },
  "modeloArma": {
    "id": 1,
    "nombre": "Pistola Glock 17"
  },
  "cantidad": 1,
  "estado": "ACTIVA",
  "fechaCreacion": "2024-01-01T00:00:00Z"
}
```

#### **Obtener asignaciones de cliente**
```http
GET /api/vendedor/clientes/{clienteId}/asignaciones
```
**Descripción:** Obtiene todas las asignaciones de armas de un cliente
**Roles:** `VENDEDOR`

#### **Eliminar asignación**
```http
DELETE /api/vendedor/asignaciones/{asignacionId}
```
**Descripción:** Elimina una asignación de arma
**Roles:** `VENDEDOR`

### **ESTADÍSTICAS**

#### **Estadísticas del vendedor**
```http
GET /api/vendedor/estadisticas
```
**Descripción:** Obtiene estadísticas de clientes y ventas del vendedor
**Roles:** `VENDEDOR`

**Response:**
```json
{
  "totalClientes": 25,
  "clientesActivos": 20,
  "clientesBloqueados": 3,
  "clientesCompletados": 15,
  "clientesPendientes": 10
}
```

---

## 👔 **MÓDULO JEFE DE VENTAS** (`/api/jefe-ventas`)

### **GESTIÓN DE CLIENTES**

#### **Obtener todos los clientes**
```http
GET /api/jefe-ventas/clientes?estado=ACTIVO&vendedor=Juan&page=0&size=10
```
**Descripción:** Obtiene todos los clientes del sistema para revisión del jefe de ventas
**Roles:** `JEFE_VENTAS`, `ADMIN`
**Parámetros:**
- `estado` (opcional): Estado del cliente
- `vendedor` (opcional): Nombre del vendedor
- `page` (opcional): Número de página
- `size` (opcional): Tamaño de página

#### **Obtener clientes aprobados**
```http
GET /api/jefe-ventas/clientes/aprobados
```
**Descripción:** Obtiene clientes que han completado el proceso de datos y están listos para asignación de licencia
**Roles:** `JEFE_VENTAS`, `ADMIN`

#### **Obtener detalle completo de cliente**
```http
GET /api/jefe-ventas/clientes/{clienteId}/detalle
```
**Descripción:** Obtiene información detallada de un cliente incluyendo documentos y respuestas
**Roles:** `JEFE_VENTAS`, `ADMIN`

**Response:**
```json
{
  "cliente": {
    "id": 1,
    "nombres": "Juan",
    "apellidos": "Pérez",
    "estado": "ACTIVO",
    "procesoCompletado": true
  },
  "documentos": [
    {
      "id": 1,
      "tipo": "CEDULA",
      "url": "https://example.com/cedula.pdf"
    }
  ],
  "respuestas": [
    {
      "id": 1,
      "pregunta": "¿Tiene denuncias de violencia?",
      "respuesta": "NO"
    }
  ],
  "asignacionesArma": [],
  "asignacionesAccesorio": []
}
```

#### **Aprobar cliente**
```http
PUT /api/jefe-ventas/clientes/{clienteId}/aprobar
```
**Descripción:** Aprueba un cliente para asignación de licencia
**Roles:** `JEFE_VENTAS`, `ADMIN`

#### **Rechazar cliente**
```http
PUT /api/jefe-ventas/clientes/{clienteId}/rechazar?motivo=Documentación incompleta
```
**Descripción:** Rechaza un cliente con motivo
**Roles:** `JEFE_VENTAS`, `ADMIN`

### **GESTIÓN DE LICENCIAS**

#### **Obtener licencias disponibles**
```http
GET /api/jefe-ventas/licencias
```
**Descripción:** Obtiene licencias disponibles para asignación
**Roles:** `JEFE_VENTAS`, `ADMIN`

#### **Obtener cupos de licencia**
```http
GET /api/jefe-ventas/licencias/{licenciaId}/cupos
```
**Descripción:** Obtiene información detallada de cupos de una licencia
**Roles:** `JEFE_VENTAS`, `ADMIN`

**Response:**
```json
{
  "licencia": {
    "id": 1,
    "numeroLicencia": "LIC-2024-001",
    "estado": "ACTIVA"
  },
  "cupoCivil": 25,
  "cupoEmpresa": 10,
  "cupoMilitar": 50,
  "cupoDeportista": 100,
  "totalCupos": 185
}
```

#### **Asignar cliente a licencia**
```http
POST /api/jefe-ventas/licencias/{licenciaId}/asignar-cliente/{clienteId}
```
**Descripción:** Asigna un cliente aprobado a una licencia específica
**Roles:** `JEFE_VENTAS`, `ADMIN`

**Response:**
```json
{
  "licenciaId": 1,
  "clienteId": 1,
  "asignado": true,
  "fechaAsignacion": "2024-01-01T00:00:00Z"
}
```

#### **Remover cliente de licencia**
```http
DELETE /api/jefe-ventas/licencias/{licenciaId}/remover-cliente/{clienteId}
```
**Descripción:** Remueve un cliente de una licencia
**Roles:** `JEFE_VENTAS`, `ADMIN`

### **GESTIÓN DE GRUPOS DE IMPORTACIÓN**

#### **Crear grupo de importación**
```http
POST /api/jefe-ventas/grupos-importacion
```
**Descripción:** Crea un nuevo grupo de importación
**Roles:** `JEFE_VENTAS`, `ADMIN`
**Body:**
```json
{
  "codigo": "GRUPO-2024-001",
  "descripcion": "Importación de armas civiles Q1 2024",
  "fechaEstimadaLlegada": "2024-03-31T00:00:00Z",
  "costoTotal": 50000.00,
  "observaciones": "Importación para clientes civiles"
}
```

#### **Obtener grupos de importación**
```http
GET /api/jefe-ventas/grupos-importacion?page=0&size=10
```
**Descripción:** Obtiene grupos de importación del jefe de ventas
**Roles:** `JEFE_VENTAS`, `ADMIN`

#### **Obtener grupo de importación**
```http
GET /api/jefe-ventas/grupos-importacion/{grupoId}
```
**Descripción:** Obtiene un grupo de importación específico
**Roles:** `JEFE_VENTAS`, `ADMIN`

#### **Actualizar grupo de importación**
```http
PUT /api/jefe-ventas/grupos-importacion/{grupoId}
```
**Descripción:** Actualiza un grupo de importación
**Roles:** `JEFE_VENTAS`, `ADMIN`

### **ESTADÍSTICAS Y REPORTES**

#### **Estadísticas de clientes**
```http
GET /api/jefe-ventas/estadisticas/clientes
```
**Descripción:** Obtiene estadísticas de clientes por estado y vendedor
**Roles:** `JEFE_VENTAS`, `ADMIN`

**Response:**
```json
{
  "totalClientes": 100,
  "clientesAprobados": 75,
  "clientesPendientes": 20,
  "clientesRechazados": 5,
  "clientesPorEstado": [
    ["ACTIVO", 80],
    ["BLOQUEADO", 15],
    ["INACTIVO", 5]
  ],
  "clientesPorVendedor": [
    ["Juan Pérez", 25],
    ["María García", 30],
    ["Carlos López", 45]
  ]
}
```

#### **Estadísticas de licencias**
```http
GET /api/jefe-ventas/estadisticas/licencias
```
**Descripción:** Obtiene estadísticas de licencias y cupos
**Roles:** `JEFE_VENTAS`, `ADMIN`

#### **Reporte de clientes pendientes**
```http
GET /api/jefe-ventas/reportes/clientes-pendientes
```
**Descripción:** Obtiene reporte de clientes pendientes de aprobación
**Roles:** `JEFE_VENTAS`, `ADMIN`

---

## 🔒 **SEGURIDAD Y AUTORIZACIÓN**

### **Roles Requeridos**
- `VENDEDOR` - Acceso a gestión de clientes y armas
- `JEFE_VENTAS` - Acceso a licencias e importaciones
- `ADMIN` - Acceso completo al sistema

### **Anotaciones de Seguridad**
- `@PreAuthorize("hasRole('ROLE')")` - Control de acceso por rol
- `@Valid` - Validación de datos de entrada
- `@Transactional` - Control de transacciones

---

## 📊 **VALIDACIONES IMPLEMENTADAS**

### **Clientes**
- ✅ Número de identificación único
- ✅ Email único
- ✅ Validación de edad mínima (25 años)
- ✅ Validación de formato de cédula/RUC
- ✅ Validación de teléfonos
- ✅ Campos obligatorios por tipo de cliente

### **Licencias**
- ✅ Número de licencia único
- ✅ Control de cupos disponibles
- ✅ Validación de fechas de vencimiento

### **Asignaciones**
- ✅ Validación de disponibilidad de armas
- ✅ Control de cantidad positiva
- ✅ Verificación de permisos por vendedor

---

## 🚧 **PRÓXIMOS PASOS**

### **Funcionalidades Pendientes**
- ⏳ Integración con sistema de autenticación JWT
- ⏳ Implementación de notificaciones automáticas
- ⏳ Generación de documentos automáticos
- ⏳ Sistema de auditoría completo
- ⏳ Reportes avanzados y dashboards

### **Mejoras Técnicas**
- ⏳ Cache de consultas frecuentes
- ⏳ Optimización de consultas complejas
- ⏳ Implementación de paginación eficiente
- ⏳ Validaciones de negocio más robustas

---

## 🔗 **ENLACES ÚTILES**

- **Swagger UI**: `http://localhost:8080/swagger-ui.html`
- **Base de Datos**: PostgreSQL en puerto 5432
- **API Base**: `http://localhost:8080/api`
- **Documentación**: `backend/ENDPOINTS_JEFE_VENTAS_VENDEDOR.md`

---

## 📝 **NOTAS IMPORTANTES**

1. **Base de Datos**: Todas las entidades incluyen auditoría (`fechaCreacion`, `fechaActualizacion`)
2. **Validaciones**: Implementadas tanto a nivel de entidad como de servicio
3. **Seguridad**: Control de acceso basado en roles implementado
4. **Documentación**: Swagger configurado para documentación automática
5. **Manejo de Errores**: Excepciones personalizadas y manejo global
6. **Transacciones**: Control de transacciones en operaciones críticas 
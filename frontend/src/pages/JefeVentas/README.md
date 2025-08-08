# Módulo Jefe de Ventas

Este módulo proporciona las funcionalidades necesarias para que el Jefe de Ventas gestione el proceso de importación de armas, supervise el equipo de vendedores y tome decisiones estratégicas.

## Estructura del Módulo

```
JefeVentas/
├── components/
│   ├── ClientManagement.tsx      # Gestión de clientes
│   ├── LicenseManagement.tsx     # Gestión de licencias
│   ├── ImportGroupManagement.tsx # Gestión de grupos de importación
│   └── ReportsAndStats.tsx       # Reportes y estadísticas
├── types/
│   └── index.ts                  # Definiciones de tipos TypeScript
├── HardcodedData.ts              # Datos mock para desarrollo
├── JefeVentas.tsx                # Componente principal
├── JefeVentasSupervision.tsx     # Pantalla de supervisión
└── README.md                     # Esta documentación
```

## Funcionalidades Principales

### 1. Gestión de Clientes (`ClientManagement.tsx`)

**Propósito**: Aprobar, rechazar y gestionar clientes que han completado el proceso inicial.

**Funcionalidades**:
- Ver lista de clientes pendientes de aprobación
- Aprobar clientes para asignación de licencias
- Rechazar clientes con motivo
- Filtrar por estado (pendientes, aprobados, rechazados)
- Buscar clientes por nombre, apellido o cédula
- Ver estadísticas rápidas
- Ver detalles completos del cliente

**Estados de Cliente**:
- `PENDIENTE`: Cliente completó el proceso pero no ha sido revisado
- `APROBADO`: Cliente aprobado para asignación de licencias
- `RECHAZADO`: Cliente rechazado con motivo
- `BLOQUEADO`: Cliente bloqueado por validaciones

### 2. Gestión de Licencias (`LicenseManagement.tsx`)

**Propósito**: Asignar cupos de armas por importación a clientes aprobados.

**Funcionalidades**:
- Ver licencias disponibles con cupos
- Asignar clientes a licencias específicas
- Monitorear uso de cupos por tipo
- Ver estadísticas de utilización
- Gestionar diferentes tipos de licencias

**Tipos de Licencias**:
- `IMPORTACION_CIVIL`: 25 cupos para armas civiles
- `IMPORTACION_MILITAR`: Cupos indeterminados para uniformados
- `IMPORTACION_EMPRESA`: Cupos indeterminados para empresas de seguridad
- `IMPORTACION_DEPORTISTA`: Sin límite (por el momento)

**Estructura de Licencias (Adaptada a BDD Real)**:
```typescript
interface License {
  id: number;
  numero: string;           // Número de licencia (ej: LIC001)
  nombre: string;           // Nombre del titular
  ruc?: string;            // RUC del titular
  cuentaBancaria?: string; // Número de cuenta bancaria
  nombreBanco?: string;    // Nombre del banco
  tipoCuenta?: string;     // Tipo de cuenta (AHORROS/CORRIENTE)
  cedulaCuenta?: string;   // Cédula asociada a la cuenta
  email?: string;          // Email del titular
  telefono?: string;       // Teléfono del titular
  fechaVencimiento: string; // Fecha de vencimiento
  tipoLicencia?: string;   // Tipo de licencia (inferido automáticamente)
  cupoTotal?: number;      // Cupo total disponible
  cupoDisponible?: number; // Cupo disponible actual
  cupoCivil?: number;      // Cupos para civiles
  cupoMilitar?: number;    // Cupos para militares
  cupoEmpresa?: number;    // Cupos para empresas
  cupoDeportista?: number; // Cupos para deportistas
  estado: string;          // Estado de la licencia
  diasRestantes?: number;  // Días restantes hasta vencimiento
  vencida?: boolean;       // Si la licencia está vencida
}
```

### 3. Grupos de Importación (`ImportGroupManagement.tsx`)

**Propósito**: Crear y gestionar grupos de importación con períodos específicos.

**Funcionalidades**:
- Crear nuevos grupos de importación
- Asignar cupos por tipo de cliente
- Definir períodos de vigencia
- Monitorear progreso de utilización
- Activar/desactivar grupos

**Estados de Grupo**:
- `PENDIENTE`: Grupo creado pero no activo
- `ACTIVO`: Grupo en uso
- `COMPLETADO`: Grupo finalizado
- `INACTIVO`: Grupo desactivado

### 4. Reportes y Estadísticas (`ReportsAndStats.tsx`)

**Propósito**: Análisis de rendimiento del equipo y métricas del negocio.

**Funcionalidades**:
- Estadísticas de ventas por período
- Rendimiento individual de vendedores
- Métricas de conversión
- Análisis de utilización de licencias
- Reportes de grupos de importación
- Acciones rápidas (exportar, enviar resumen)

## Flujo de Trabajo

### Proceso de Aprobación de Clientes

1. **Vendedor** crea cliente y completa proceso inicial
2. **Sistema** marca cliente como `procesoCompletado = true`
3. **Jefe de Ventas** ve cliente en lista de pendientes
4. **Jefe de Ventas** revisa documentación y respuestas
5. **Jefe de Ventas** aprueba o rechaza cliente
6. **Sistema** actualiza estado y permite asignación de licencias

### Proceso de Asignación de Licencias

1. **Jefe de Ventas** selecciona licencia disponible
2. **Sistema** muestra clientes aprobados compatibles
3. **Jefe de Ventas** asigna cliente a licencia
4. **Sistema** actualiza cupos disponibles
5. **Cliente** puede proceder con importación

### Proceso de Grupos de Importación

1. **Jefe de Ventas** crea nuevo grupo
2. **Sistema** genera código único
3. **Jefe de Ventas** define cupos y período
4. **Jefe de Ventas** activa grupo
5. **Sistema** permite asignaciones dentro del grupo

## Tipos de Datos

### Cliente
```typescript
interface Client {
  id: number;
  nombres: string;
  apellidos: string;
  cedula: string;
  email: string;
  telefono: string;
  estado: string;
  procesoCompletado: boolean;
  aprobadoPorJefeVentas: boolean | null;
  motivoRechazo?: string;
  fechaCreacion: string;
  vendedor: {
    nombres: string;
    apellidos: string;
  };
}
```

### Grupo de Importación
```typescript
interface ImportGroup {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  estado: string;
  fechaCreacion: string;
  fechaInicio: string;
  fechaFin: string;
  cuposDisponibles: {
    civil: number;
    militar: number;
    empresa: number;
    deportista: number;
  };
  cuposUtilizados: {
    civil: number;
    militar: number;
    empresa: number;
    deportista: number;
  };
  licenciasAsignadas: number;
  clientesAsignados: number;
}
```

## Integración con Backend

### Endpoints Principales

#### Clientes
- `GET /api/jefe-ventas/clientes` - Listar clientes
- `GET /api/jefe-ventas/clientes/aprobados` - Clientes aprobados
- `PUT /api/jefe-ventas/clientes/{id}/aprobar` - Aprobar cliente
- `PUT /api/jefe-ventas/clientes/{id}/rechazar` - Rechazar cliente

#### Licencias
- `GET /api/jefe-ventas/licencias` - Listar licencias
- `GET /api/jefe-ventas/licencias/{id}/cupos` - Detalles de cupos
- `POST /api/jefe-ventas/licencias/{id}/asignar-cliente/{clienteId}` - Asignar cliente

#### Grupos de Importación
- `GET /api/jefe-ventas/grupos-importacion` - Listar grupos
- `POST /api/jefe-ventas/grupos-importacion` - Crear grupo
- `PUT /api/jefe-ventas/grupos-importacion/{id}` - Actualizar grupo

#### Reportes
- `GET /api/jefe-ventas/estadisticas/clientes` - Estadísticas de clientes
- `GET /api/jefe-ventas/estadisticas/licencias` - Estadísticas de licencias
- `GET /api/jefe-ventas/reportes/clientes-pendientes` - Reporte de pendientes

## Adaptación a Base de Datos Real

### Cambios Realizados

1. **Modelo de Licencia Actualizado**:
   - Adaptado a la estructura real de la tabla `licencia`
   - Campos adicionales para gestión del sistema
   - Métodos de utilidad para inferir tipo de licencia

2. **Script SQL de Migración**:
   - `datos/08_actualizacion_licencia_sistema.sql`
   - Agrega columnas necesarias para el sistema
   - Actualiza licencias existentes con valores por defecto
   - Crea índices para optimización

3. **Datos Mock Actualizados**:
   - Licencias basadas en datos reales proporcionados
   - Estructura compatible con el modelo actualizado
   - Información completa de cada licencia

### Estructura de Base de Datos

```sql
-- Tabla licencia (estructura real)
CREATE TABLE licencia (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    numero VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    ruc VARCHAR(20),
    cuenta_bancaria VARCHAR(50),
    nombre_banco VARCHAR(100),
    tipo_cuenta VARCHAR(20),
    cedula_cuenta VARCHAR(20),
    email VARCHAR(255),
    telefono VARCHAR(20),
    fecha_vencimiento DATE NOT NULL,
    
    -- Campos adicionales del sistema
    tipo_licencia VARCHAR(50),
    descripcion TEXT,
    fecha_emision DATE,
    cupo_total INTEGER DEFAULT 0,
    cupo_disponible INTEGER DEFAULT 0,
    cupo_civil INTEGER DEFAULT 0,
    cupo_militar INTEGER DEFAULT 0,
    cupo_empresa INTEGER DEFAULT 0,
    cupo_deportista INTEGER DEFAULT 0,
    observaciones TEXT,
    estado VARCHAR(20) DEFAULT 'ACTIVA',
    usuario_creador_id BIGINT,
    usuario_actualizador_id BIGINT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Configuración

### Variables de Entorno
```env
REACT_APP_API_BASE_URL=http://localhost:8080
REACT_APP_JEFE_VENTAS_ROLE=JEFE_VENTAS
```

### Permisos Requeridos
- `JEFE_VENTAS` o `ADMIN` para todas las operaciones
- Acceso a gestión de clientes
- Acceso a gestión de licencias
- Acceso a reportes y estadísticas

## Desarrollo

### Instalación de Dependencias
```bash
npm install
```

### Ejecutar en Desarrollo
```bash
npm run dev
```

### Construir para Producción
```bash
npm run build
```

### Estructura de Componentes

Cada componente sigue el patrón:
1. **Estado local** para datos y UI
2. **useEffect** para carga inicial
3. **Handlers** para eventos
4. **Renderizado condicional** para loading/error
5. **Props** para comunicación entre componentes

### Convenciones de Código

- **Nombres de archivos**: PascalCase para componentes
- **Nombres de variables**: camelCase
- **Nombres de interfaces**: PascalCase con prefijo descriptivo
- **Comentarios**: JSDoc para funciones públicas
- **Estilos**: Tailwind CSS con clases utilitarias
- **Importaciones de tipos**: `import type` para TypeScript

## Próximas Mejoras

1. **Gráficos interactivos** con Chart.js o D3.js
2. **Exportación de reportes** en PDF/Excel
3. **Notificaciones en tiempo real** con WebSockets
4. **Filtros avanzados** con búsqueda por múltiples criterios
5. **Dashboard personalizable** con widgets configurables
6. **Auditoría completa** de acciones del Jefe de Ventas
7. **Integración con calendario** para gestión de períodos
8. **Sistema de alertas** para cupos bajos o vencimientos
9. **Validación de RUC** en tiempo real
10. **Integración con servicios bancarios** para verificación de cuentas 
# Adaptación del Sistema a la Estructura Real de Base de Datos

## Resumen

Se ha realizado una adaptación completa del sistema para que funcione con la estructura real de la base de datos de licencias, manteniendo la funcionalidad existente y agregando nuevas capacidades.

## Datos de Entrada

Los datos reales de licencias proporcionados fueron:
```sql
INSERT INTO licencia (numero, nombre, ruc, cuenta_bancaria, nombre_banco, tipo_cuenta, cedula_cuenta, email, telefono, fecha_vencimiento) VALUES
('LIC001', 'LEITON PORTILLA CORALIA SALOME', '1725781254', '2200614031', 'PICHINCHA', 'AHORROS', '1725781254', 'frank_gun@hotmail.com', '0000000000', '2050-12-31'),
('LIC002', 'SILVA ACOSTA FRANCISCO JAVIER', '1714597414', '3020513304', 'PICHINCHA', 'AHORROS', '1714597414', 'frank_gun@hotmail.com', '0000000000', '2050-12-31'),
('LIC003', 'MULLER BENITEZ NICOLE PAMELA', '1713978540', '2212737882', 'PICHINCHA', 'AHORROS', '1713978540', 'vbenitez@hotmail.com', '0000000000', '2050-12-31'),
('LIC004', 'SIMOGUE S.A.S.', '0993392212001', '2212359266', 'PICHINCHA', 'AHORROS', '0993392212001', 'simogue.sas@gmail.com', '0000000000', '2050-12-31'),
('LIC005', 'GUERRERO MARTINEZ JOSE LUIS', '1707815922', '8151263', 'INTERNACIONAL', 'AHORROS', '1707815922', 'joseluis@guerreromartinez.com', '0000000000', '2050-12-31'),
('LIC006', 'ENDARA UNDA FRANKLIN GEOVANNY', '1721770632', '2100300998', 'PICHINCHA', 'CORRIENTE', '1721770632', 'f.endara@hotmail.com', '0000000000', '2050-12-31');
```

## Cambios Realizados

### 1. Backend - Modelo de Licencia

**Archivo**: `backend/src/main/java/com/armasimportacion/model/Licencia.java`

**Cambios principales**:
- Adaptado a la estructura real de la tabla `licencia`
- Agregados campos para información bancaria y personal
- Mantenidos campos adicionales para el sistema de gestión
- Agregados métodos de utilidad:
  - `isVencida()`: Determina si la licencia está vencida
  - `getDiasRestantes()`: Calcula días restantes hasta vencimiento
  - `getTipoLicenciaInferido()`: Infiere el tipo basado en RUC/nombre

### 2. Backend - Repository

**Archivo**: `backend/src/main/java/com/armasimportacion/repository/LicenciaRepository.java`

**Cambios principales**:
- Actualizados métodos para usar la nueva estructura
- Agregados nuevos métodos de búsqueda por RUC, email
- Agregados métodos para licencias vencidas
- Agregadas consultas para estadísticas de cupos

### 3. Backend - Service

**Archivo**: `backend/src/main/java/com/armasimportacion/service/LicenciaService.java`

**Cambios principales**:
- Actualizados métodos CRUD para la nueva estructura
- Agregada lógica de inferencia de tipo de licencia
- Mejorado manejo de cupos con validaciones null-safe
- Agregados métodos para estadísticas avanzadas

### 4. Script SQL de Migración

**Archivo**: `datos/08_actualizacion_licencia_sistema.sql`

**Funcionalidades**:
- Agrega columnas adicionales necesarias para el sistema
- Actualiza licencias existentes con valores por defecto
- Infiere tipo de licencia basado en RUC/nombre
- Asigna cupos según el tipo de licencia
- Crea índices para optimización de consultas

### 5. Frontend - Tipos TypeScript

**Archivo**: `frontend/src/pages/JefeVentas/types/index.ts`

**Cambios principales**:
- Actualizada interfaz `License` para coincidir con la estructura real
- Agregados campos opcionales para información bancaria
- Mantenida compatibilidad con campos del sistema

### 6. Frontend - Datos Mock

**Archivo**: `frontend/src/pages/JefeVentas/HardcodedData.ts`

**Cambios principales**:
- Actualizados datos mock con información real de licencias
- Agregada información bancaria y personal
- Calculados cupos según tipo de licencia
- Agregados campos de utilidad (días restantes, estado vencida)

### 7. Frontend - Componente LicenseManagement

**Archivo**: `frontend/src/pages/JefeVentas/components/LicenseManagement.tsx`

**Cambios principales**:
- Adaptado para usar la nueva estructura de licencias
- Mejorada visualización con información bancaria
- Agregados indicadores de días restantes y estado vencida
- Actualizada lógica de asignación de clientes

## Estructura Final de Licencia

```typescript
interface License {
  // Campos de la base de datos real
  id: number;
  numero: string;           // LIC001, LIC002, etc.
  nombre: string;           // Nombre completo del titular
  ruc?: string;            // RUC (13 dígitos para empresas)
  cuentaBancaria?: string; // Número de cuenta bancaria
  nombreBanco?: string;    // PICHINCHA, INTERNACIONAL, etc.
  tipoCuenta?: string;     // AHORROS, CORRIENTE
  cedulaCuenta?: string;   // Cédula asociada a la cuenta
  email?: string;          // Email del titular
  telefono?: string;       // Teléfono del titular
  fechaVencimiento: string; // Fecha de vencimiento
  
  // Campos adicionales del sistema
  tipoLicencia?: string;   // Inferido automáticamente
  descripcion?: string;    // Descripción de la licencia
  fechaEmision?: string;   // Fecha de emisión
  cupoTotal?: number;      // Cupo total disponible
  cupoDisponible?: number; // Cupo disponible actual
  cupoCivil?: number;      // Cupos para civiles
  cupoMilitar?: number;    // Cupos para militares
  cupoEmpresa?: number;    // Cupos para empresas
  cupoDeportista?: number; // Cupos para deportistas
  observaciones?: string;  // Observaciones adicionales
  estado: string;          // ACTIVA, PENDIENTE, VENCIDA
  clientesAsignados?: number; // Número de clientes asignados
  
  // Campos calculados
  diasRestantes?: number;  // Días restantes hasta vencimiento
  vencida?: boolean;       // Si la licencia está vencida
}
```

## Lógica de Inferencia de Tipo de Licencia

El sistema infiere automáticamente el tipo de licencia basándose en:

1. **Empresas**: RUC de 13 dígitos → `IMPORTACION_EMPRESA`
2. **Militares**: Nombre contiene "militar" → `IMPORTACION_MILITAR`
3. **Deportistas**: Nombre contiene "deportista" → `IMPORTACION_DEPORTISTA`
4. **Civiles**: Por defecto → `IMPORTACION_CIVIL`

## Asignación de Cupos por Tipo

- **Civiles**: 25 cupos por licencia
- **Militares**: 50 cupos por licencia
- **Empresas**: 100 cupos por licencia
- **Deportistas**: 200 cupos por licencia

## Beneficios de la Adaptación

1. **Compatibilidad**: El sistema funciona con datos reales existentes
2. **Escalabilidad**: Estructura preparada para futuras expansiones
3. **Flexibilidad**: Campos opcionales permiten diferentes tipos de licencias
4. **Automatización**: Inferencia automática de tipos y cupos
5. **Mantenibilidad**: Código limpio y bien documentado

## Próximos Pasos

1. **Ejecutar script de migración** en la base de datos
2. **Probar funcionalidades** con datos reales
3. **Validar inferencia** de tipos de licencia
4. **Ajustar cupos** según necesidades específicas
5. **Implementar validaciones** adicionales si es necesario

## Archivos Modificados

### Backend
- `backend/src/main/java/com/armasimportacion/model/Licencia.java`
- `backend/src/main/java/com/armasimportacion/repository/LicenciaRepository.java`
- `backend/src/main/java/com/armasimportacion/service/LicenciaService.java`

### Frontend
- `frontend/src/pages/JefeVentas/types/index.ts`
- `frontend/src/pages/JefeVentas/HardcodedData.ts`
- `frontend/src/pages/JefeVentas/components/LicenseManagement.tsx`
- `frontend/src/pages/JefeVentas/README.md`

### Base de Datos
- `datos/08_actualizacion_licencia_sistema.sql` (nuevo)

## Conclusión

La adaptación se ha realizado exitosamente, manteniendo toda la funcionalidad existente mientras se integra perfectamente con la estructura real de la base de datos. El sistema ahora puede trabajar con datos reales de licencias y proporciona una experiencia de usuario mejorada con información más detallada y útil. 
# Restructuración de Documentos con Links Externos

## 📋 Descripción

Este documento describe la restructuración necesaria para manejar documentos con links externos de manera dinámica y configurable desde la base de datos.

## 🎯 Objetivo

Permitir que los links externos de documentos (Antecedentes Penales, Consejo de la Judicatura, Fiscalía, SATJE) sean configurables desde la base de datos, evitando hardcodear URLs en el código.

## 📁 Archivos Creados/Modificados

### 1. Base de Datos
- `datos/03_restructuracion_documentos.sql` - Script de restructuración de la BD

### 2. Backend Java
- `backend/src/main/java/com/armasimportacion/model/ConfiguracionDocumentoExterno.java`
- `backend/src/main/java/com/armasimportacion/repository/ConfiguracionDocumentoExternoRepository.java`
- `backend/src/main/java/com/armasimportacion/service/DocumentoExternoService.java`
- `backend/src/main/java/com/armasimportacion/controller/DocumentoExternoController.java`

## 🚀 Pasos de Implementación

### Paso 1: Ejecutar Script de Base de Datos

```sql
-- Ejecutar el script de restructuración
\i datos/03_restructuracion_documentos.sql
```

### Paso 2: Verificar la Estructura

```sql
-- Verificar que la nueva tabla se creó correctamente
\d configuracion_documento_externo

-- Verificar que los datos se insertaron
SELECT * FROM configuracion_documento_externo;

-- Probar la función
SELECT * FROM obtener_documentos_por_tipo_cliente('Civil');
SELECT * FROM obtener_documentos_por_tipo_cliente('Uniformado', 'PASIVO');
```

### Paso 3: Actualizar Backend

1. **Agregar las nuevas clases Java** al proyecto
2. **Compilar y verificar** que no hay errores
3. **Probar los endpoints** del nuevo controlador

### Paso 4: Actualizar Frontend

Modificar el `mockApiService.ts` para usar los nuevos endpoints:

```typescript
// En mockApiService.ts
async getDocumentsByClientType(clientType: string, estadoMilitar?: string): Promise<any[]> {
  // Llamar al nuevo endpoint
  const response = await fetch(`/api/documentos-externos/por-tipo-cliente/${clientType}?estadoMilitar=${estadoMilitar || ''}`);
  const documentosExternos = await response.json();
  
  // Combinar con documentos específicos del tipo de cliente
  const documentosEspecificos = mockAdditionalDocuments.filter(d => 
    d.tipo_proceso_id === clientTypeToProcessId[clientType]
  );
  
  return [...documentosExternos, ...documentosEspecificos];
}
```

## 📊 Estructura de la Nueva Tabla

### `configuracion_documento_externo`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL | ID único |
| `nombre` | VARCHAR(100) | Nombre del documento |
| `descripcion` | TEXT | Descripción detallada |
| `link_externo` | VARCHAR(500) | URL del documento externo |
| `instrucciones_descarga` | TEXT | Instrucciones para descargar |
| `aplica_para_tipos_cliente` | TEXT[] | Tipos de cliente que aplican |
| `excluye_tipos_cliente` | TEXT[] | Tipos de cliente que NO aplican |
| `orden_visual` | INTEGER | Orden de visualización |
| `activo` | BOOLEAN | Si está activo |
| `fecha_creacion` | TIMESTAMP | Fecha de creación |
| `fecha_actualizacion` | TIMESTAMP | Fecha de última actualización |

## 🔧 Funcionalidades Implementadas

### 1. Gestión de Documentos Externos
- ✅ Crear nuevos documentos externos
- ✅ Actualizar links existentes
- ✅ Activar/desactivar documentos
- ✅ Configurar tipos de cliente que aplican

### 2. Lógica de Aplicación
- ✅ Documentos aplican para todos excepto Compañía de Seguridad
- ✅ Lógica especial para Uniformado en servicio pasivo
- ✅ Orden de visualización configurable

### 3. Validación
- ✅ Validación de formato de URLs
- ✅ Prevención de duplicados por nombre
- ✅ Validación de tipos de cliente

### 4. API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/documentos-externos` | Listar todos los documentos |
| GET | `/api/documentos-externos/por-tipo-cliente/{tipo}` | Documentos por tipo de cliente |
| GET | `/api/documentos-externos/{id}` | Obtener documento específico |
| POST | `/api/documentos-externos` | Crear nuevo documento |
| PUT | `/api/documentos-externos/{id}` | Actualizar documento |
| DELETE | `/api/documentos-externos/{id}` | Eliminar documento |
| GET | `/api/documentos-externos/buscar?nombre=...` | Buscar por nombre |
| GET | `/api/documentos-externos/estadisticas` | Estadísticas |
| POST | `/api/documentos-externos/validar-link` | Validar URL |

## 📝 Ejemplos de Uso

### 1. Obtener Documentos para Cliente Civil
```sql
SELECT * FROM obtener_documentos_por_tipo_cliente('Civil');
```

### 2. Obtener Documentos para Uniformado Pasivo
```sql
SELECT * FROM obtener_documentos_por_tipo_cliente('Uniformado', 'PASIVO');
```

### 3. Actualizar Link de Antecedentes Penales
```sql
UPDATE configuracion_documento_externo 
SET link_externo = 'https://nuevo-link-antecedentes.gob.ec'
WHERE nombre = 'Antecedentes Penales';
```

### 4. Agregar Nuevo Documento Externo
```sql
INSERT INTO configuracion_documento_externo (
  nombre, descripcion, link_externo, 
  aplica_para_tipos_cliente, orden_visual
) VALUES (
  'Nuevo Documento', 'Descripción del nuevo documento',
  'https://ejemplo.com/documento',
  ARRAY['Civil', 'Uniformado'], 5
);
```

## 🔄 Migración de Datos

Los documentos existentes se migran automáticamente:

1. **Antecedentes Penales** - Se actualiza con link externo
2. **Nuevos documentos** - Se insertan con configuración completa
3. **Compatibilidad** - Se mantiene la funcionalidad existente

## ⚠️ Consideraciones

1. **Backup**: Hacer backup de la BD antes de ejecutar el script
2. **Testing**: Probar en ambiente de desarrollo primero
3. **Rollback**: Tener plan de rollback en caso de problemas
4. **Documentación**: Actualizar documentación del sistema

## 🎉 Beneficios

1. **Flexibilidad**: Los links se pueden actualizar sin cambiar código
2. **Mantenibilidad**: Configuración centralizada en la BD
3. **Escalabilidad**: Fácil agregar nuevos documentos externos
4. **Auditoría**: Trazabilidad de cambios con timestamps
5. **Validación**: Validación automática de URLs

## 📞 Soporte

Para dudas o problemas durante la implementación, revisar:
1. Logs del backend
2. Consultas SQL de ejemplo
3. Documentación de la API
4. Tests unitarios incluidos 
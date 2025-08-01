# Correcciones de Base de Datos - GMARM

## Problema Identificado

El error que estabas experimentando era:

```
ERROR: column "activo" does not exist
STATEMENT: CREATE INDEX idx_tipo_documento_proceso ON tipo_documento(tipo_proceso_id, activo);
```

Este error ocurría porque el script `03_restructuracion_documentos.sql` estaba intentando crear un índice usando la columna `activo` que no existe en la tabla `tipo_documento`. La tabla tiene una columna llamada `estado` en su lugar.

## Correcciones Aplicadas

### 1. Script `03_restructuracion_documentos.sql` (Corregido)

**Cambios realizados:**
- ✅ Cambiado `activo` por `estado` en los índices
- ✅ Agregado `IF NOT EXISTS` para evitar errores de duplicación
- ✅ Agregada columna `orden_visual` a `tipo_documento`
- ✅ Corregidas las referencias a columnas inexistentes

### 2. Nuevo Script `04_actualizacion_cliente_estado.sql`

**Funcionalidades agregadas:**
- ✅ Campo `vendedor_id` en tabla `cliente`
- ✅ Campos adicionales en `respuesta_cliente` (`tipo_respuesta`, `pregunta_texto`)
- ✅ Campos adicionales en `documento_cliente` (`nombre_archivo`, `tipo_mime`, `tamano_bytes`)
- ✅ Función `determinar_estado_cliente()` para calcular automáticamente el estado
- ✅ Triggers para actualizar estado automáticamente
- ✅ Constraint para validar valores de estado del cliente

### 3. Script de Verificación `05_verificacion_estructura.sql`

**Verificaciones incluidas:**
- ✅ Existencia de todas las tablas y columnas necesarias
- ✅ Verificación de funciones y triggers
- ✅ Verificación de índices
- ✅ Verificación de datos de prueba
- ✅ Pruebas de funcionamiento de funciones

## Cómo Aplicar las Correcciones

### Opción 1: Script Automático (Recomendado)

```bash
# Ejecutar el script de reinicio
./restart-docker-with-fixes.sh
```

### Opción 2: Manual

```bash
# 1. Detener contenedores
docker-compose -f docker-compose.dev.yml down

# 2. Eliminar volumen de PostgreSQL
docker volume rm gmarm_postgres_data_dev

# 3. Reconstruir e iniciar
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up -d

# 4. Verificar que todo funcione
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_db -f /docker-entrypoint-initdb.d/05_verificacion_estructura.sql
```

## Estructura de Base de Datos Actualizada

### Tabla `tipo_documento`
```sql
- id (SERIAL PRIMARY KEY)
- nombre (VARCHAR(100))
- descripcion (TEXT)
- obligatorio (BOOLEAN)
- tipo_proceso_id (INTEGER)
- estado (BOOLEAN) -- ✅ Corregido: era 'activo'
- link_externo (VARCHAR(500)) -- ✅ Nuevo
- es_documento_externo (BOOLEAN) -- ✅ Nuevo
- aplica_para_todos (BOOLEAN) -- ✅ Nuevo
- instrucciones_descarga (TEXT) -- ✅ Nuevo
- orden_visual (INTEGER) -- ✅ Nuevo
```

### Tabla `cliente`
```sql
- id (SERIAL PRIMARY KEY)
- ... (campos existentes)
- estado (VARCHAR(30)) -- ✅ Actualizado para soportar nuevos valores
- vendedor_id (INTEGER) -- ✅ Nuevo
```

### Nueva Tabla `configuracion_documento_externo`
```sql
- id (SERIAL PRIMARY KEY)
- nombre (VARCHAR(100))
- descripcion (TEXT)
- link_externo (VARCHAR(500))
- instrucciones_descarga (TEXT)
- aplica_para_tipos_cliente (TEXT[])
- excluye_tipos_cliente (TEXT[])
- orden_visual (INTEGER)
- activo (BOOLEAN)
```

## Estados de Cliente Soportados

El sistema ahora soporta los siguientes estados de cliente:

1. **FALTAN_DOCUMENTOS** - Cliente creado pero sin documentos completos
2. **BLOQUEADO** - Cliente bloqueado por denuncias de violencia
3. **LISTO_IMPORTACION** - Cliente con documentos completos y arma asignada
4. **INACTIVO** - Cliente deshabilitado
5. **ACTIVO** - Cliente activo (estado por defecto)

## Funciones Automáticas

### `determinar_estado_cliente(cliente_id)`
- Calcula automáticamente el estado del cliente basado en:
  - Documentos cargados y aprobados
  - Respuestas a preguntas de seguridad
  - Asignación de armas

### Triggers Automáticos
- **trigger_actualizar_estado_documento** - Actualiza estado cuando cambian documentos
- **trigger_actualizar_estado_respuesta** - Actualiza estado cuando cambian respuestas
- **trigger_actualizar_estado_asignacion** - Actualiza estado cuando cambian asignaciones

## Verificación

Después de aplicar las correcciones, ejecuta:

```bash
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_db -f /docker-entrypoint-initdb.d/05_verificacion_estructura.sql
```

Deberías ver:
```
=====================================================
VERIFICACIÓN COMPLETADA EXITOSAMENTE
=====================================================
Todas las tablas, columnas, funciones, índices y triggers
están correctamente configurados.
La base de datos está lista para usar con el frontend.
=====================================================
```

## URLs de Acceso

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8080
- **PostgreSQL**: localhost:5432

## Logs y Debugging

Para ver logs en tiempo real:
```bash
docker-compose -f docker-compose.dev.yml logs -f
```

Para ver logs específicos:
```bash
docker-compose -f docker-compose.dev.yml logs -f postgres_dev
docker-compose -f docker-compose.dev.yml logs -f backend
docker-compose -f docker-compose.dev.yml logs -f frontend
``` 
# Orden de Ejecución de Scripts SQL - GMARM

## Problema Identificado

Había un conflicto en la numeración de archivos SQL:
- `03_restructuracion_documentos.sql`
- `03_usuario_admin_default.sql` ❌ **DUPLICADO**

Esto causaba problemas en el orden de ejecución durante el deploy.

## Corrección Aplicada

Se renombró el archivo duplicado:
- `03_usuario_admin_default.sql` → `07_usuario_admin_default.sql` ✅

## Orden Correcto de Ejecución

Los archivos SQL se ejecutan en orden alfabético. El orden correcto es:

### 1. `01_gmarm_schema_mejorado.sql`
**Propósito:** Crear el esquema base de la base de datos
- ✅ Crea todas las tablas principales
- ✅ Crea índices básicos
- ✅ Crea triggers de auditoría
- ✅ Crea función `update_updated_at_column()`

### 2. `02_gmarm_datos_prueba.sql`
**Propósito:** Insertar datos de prueba
- ✅ Tipos de cliente, identificación, proceso, etc.
- ✅ Datos de prueba para todas las tablas
- ✅ Configuración inicial del sistema

### 3. `03_restructuracion_documentos.sql`
**Propósito:** Configurar documentos externos
- ✅ Agrega columnas a `tipo_documento`
- ✅ Crea tabla `configuracion_documento_externo`
- ✅ Crea función `obtener_documentos_por_tipo_cliente`
- ✅ Crea índices para documentos

### 4. `04_actualizacion_cliente_estado.sql`
**Propósito:** Configurar estados de cliente
- ✅ Agrega campo `vendedor_id` a `cliente`
- ✅ Agrega campos a `respuesta_cliente` y `documento_cliente`
- ✅ Crea función `determinar_estado_cliente`
- ✅ Crea triggers para actualización automática

### 5. `05_verificacion_estructura.sql`
**Propósito:** Verificar que todo esté correcto
- ✅ Verifica existencia de tablas y columnas
- ✅ Verifica funciones y triggers
- ✅ Verifica índices
- ✅ Prueba funciones

### 6. `06_correccion_funcion.sql`
**Propósito:** Corregir error de tipo de datos
- ✅ Corrige función `obtener_documentos_por_tipo_cliente`
- ✅ Aplica `CAST(NULL AS INTEGER)` para `tipo_proceso_id`
- ✅ Verifica que la corrección funcionó

### 7. `07_usuario_admin_default.sql`
**Propósito:** Crear usuarios administradores
- ✅ Crea usuarios por defecto
- ✅ Asigna roles
- ✅ Configura credenciales de acceso

## Verificación Local

Para probar sin hacer deploy:

```bash
# Ejecutar prueba local
./test-local-database.sh

# O manualmente:
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_db -f /docker-entrypoint-initdb.d/verificar_orden_ejecucion.sql
```

## Estructura Final de Archivos

```
datos/
├── 01_gmarm_schema_mejorado.sql      # Esquema base
├── 02_gmarm_datos_prueba.sql         # Datos de prueba
├── 03_restructuracion_documentos.sql # Documentos externos
├── 04_actualizacion_cliente_estado.sql # Estado cliente
├── 05_verificacion_estructura.sql    # Verificación
├── 06_correccion_funcion.sql         # Corrección función
├── 07_usuario_admin_default.sql      # Usuarios admin
├── verificar_orden_ejecucion.sql     # Verificación orden
└── README_ORDEN_EJECUCION.md         # Esta documentación
```

## Dependencias

### Dependencias entre scripts:
- `02_gmarm_datos_prueba.sql` depende de `01_gmarm_schema_mejorado.sql`
- `03_restructuracion_documentos.sql` depende de `01_gmarm_schema_mejorado.sql`
- `04_actualizacion_cliente_estado.sql` depende de `01_gmarm_schema_mejorado.sql`
- `05_verificacion_estructura.sql` depende de todos los anteriores
- `06_correccion_funcion.sql` depende de `03_restructuracion_documentos.sql`
- `07_usuario_admin_default.sql` depende de `01_gmarm_schema_mejorado.sql`

## Solución de Problemas

### Si hay errores de orden:
1. Verificar que no haya archivos con números duplicados
2. Ejecutar `./test-local-database.sh` para probar localmente
3. Revisar logs: `docker-compose -f docker-compose.dev.yml logs -f postgres_dev`

### Si hay errores de dependencias:
1. Verificar que todas las tablas existan antes de ejecutar scripts que las modifican
2. Asegurar que los datos de prueba se inserten antes de crear funciones que los usen

### Si hay errores de tipos de datos:
1. Verificar que `06_correccion_funcion.sql` se ejecute después de `03_restructuracion_documentos.sql`
2. Asegurar que `CAST(NULL AS INTEGER)` se use en lugar de `NULL` para campos enteros

## Comandos Útiles

```bash
# Ver orden de archivos
ls -la datos/*.sql

# Ver logs de PostgreSQL
docker-compose -f docker-compose.dev.yml logs -f postgres_dev

# Probar función específica
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_db -c "SELECT obtener_documentos_por_tipo_cliente('Civil');"

# Verificar estado de contenedores
docker-compose -f docker-compose.dev.yml ps
``` 
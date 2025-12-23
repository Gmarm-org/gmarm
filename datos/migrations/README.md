# Scripts de Migración de Base de Datos

Este directorio contiene scripts de migración SQL para aplicar cambios al esquema de la base de datos en producción.

## ⚠️ IMPORTANTE

**Estos scripts son para PRODUCCIÓN**. El archivo `00_gmarm_completo.sql` sigue siendo la fuente única de verdad para nuevas instalaciones, pero los cambios en producción deben aplicarse mediante estos scripts de migración.

## Uso

### ⚡ Aplicación Automática (Recomendado)

**Las migraciones se ejecutan automáticamente** durante el despliegue a producción usando el script `scripts/deploy-prod.sh`.

El script:
1. ✅ Busca todos los archivos `.sql` en `datos/migrations/`
2. ✅ Los ejecuta en orden numérico (001, 002, 003, etc.)
3. ✅ Continúa aunque una migración ya haya sido ejecutada (idempotencia)

**No necesitas ejecutar migraciones manualmente si usas el script de deploy.**

### 🔧 Aplicación Manual (Solo si es necesario)

Si necesitas aplicar una migración manualmente (por ejemplo, fuera del proceso de deploy):

```bash
# Conectarse a la base de datos de producción
psql -U postgres -d gmarm_prod -f datos/migrations/001_modulo_operaciones_grupos_importacion.sql

# O desde Docker
docker exec -i gmarm-postgres-prod psql -U postgres -d gmarm_prod < datos/migrations/001_modulo_operaciones_grupos_importacion.sql
```

### Verificar migración

```sql
-- Verificar que las columnas existen
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tipo_documento' 
AND column_name = 'grupos_importacion';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'grupo_importacion' 
AND column_name = 'numero_previa_importacion';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'documento_grupo_importacion' 
AND column_name = 'tipo_documento_id';

-- Verificar tipos de documento creados
SELECT nombre, grupos_importacion 
FROM tipo_documento 
WHERE grupos_importacion = true;
```

## Convenciones de Nomenclatura

- `001_<descripcion>.sql` - Primera migración
- `002_<descripcion>.sql` - Segunda migración
- etc.

## Características de los Scripts

Todos los scripts de migración deben:

1. ✅ Ser **idempotentes** (pueden ejecutarse múltiples veces sin errores)
2. ✅ Usar `DO $$ ... END $$` para verificaciones condicionales
3. ✅ Incluir comentarios descriptivos
4. ✅ Verificar existencia antes de crear/modificar
5. ✅ Incluir verificaciones post-migración
6. ✅ No eliminar datos existentes sin verificación explícita

## Orden de Ejecución

Las migraciones deben ejecutarse en orden numérico:

1. `001_modulo_operaciones_grupos_importacion.sql`
2. `002_<siguiente>.sql`
3. etc.

## Rollback

Si necesitas revertir una migración, crea un script de rollback con el mismo número pero sufijo `_rollback`:

- `001_modulo_operaciones_grupos_importacion_rollback.sql`


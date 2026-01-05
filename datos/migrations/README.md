# Scripts de Migración de Base de Datos

Este directorio contiene documentación y planes de ejecución para migraciones de base de datos.

## ⚠️ IMPORTANTE - CAMBIO DE ESTRATEGIA

**Todos los scripts de migración (001, 002, 003, 004) han sido consolidados en el script maestro `00_gmarm_completo.sql`.**

### Nueva Estrategia

- **Para nuevas instalaciones:** Usar `datos/00_gmarm_completo.sql` (script maestro completo)
- **Para reseteo de producción:** Usar `datos/00_gmarm_completo.sql` (incluye limpieza de tablas obsoletas)
- **Scripts de migración individuales:** Ya no existen, todo está en el script maestro

## Script Maestro

El archivo `datos/00_gmarm_completo.sql` es ahora la **única fuente de verdad** y contiene:

- ✅ Limpieza de tablas obsoletas (DROP TABLE IF EXISTS)
- ✅ Creación completa del esquema de base de datos
- ✅ Todos los datos iniciales
- ✅ Todas las migraciones consolidadas (001, 002, 003, 004)
- ✅ Configuraciones del sistema
- ✅ Es idempotente (se puede ejecutar múltiples veces)

### Uso del Script Maestro

```bash
# Para nueva instalación o reset completo
psql -U postgres -d gmarm_prod -f datos/00_gmarm_completo.sql

# O desde Docker
docker exec -i gmarm-postgres-prod psql -U postgres -d gmarm_prod < datos/00_gmarm_completo.sql
```

## Archivos en este Directorio

- `README.md` - Este archivo (documentación actualizada)
- `003_PLAN_EJECUCION_PRODUCCION.md` - Plan de ejecución para migración específica (referencia histórica)

## Migraciones Consolidadas

Las siguientes migraciones fueron consolidadas en el script maestro:

1. **001 - Módulo de Operaciones:** Soporte para documentos de grupos de importación
2. **002 - Documentos Finales:** Resolución para migrar serie y Guía de libre tránsito
3. **003 - Eliminaciones:** Eliminación de "Formulario de solicitud" y pregunta Sicoar, actualización documentos Deportista
4. **004 - Verificación Email:** Tabla y columna para verificación de correo electrónico

Todas estas migraciones están ahora integradas en `00_gmarm_completo.sql` y se aplican automáticamente al ejecutar el script maestro.


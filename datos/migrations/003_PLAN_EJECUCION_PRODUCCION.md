# Plan de Ejecución en Producción
## Script: 003_eliminar_formulario_solicitud_y_pregunta_sicoar.sql

**Fecha de creación:** 2024-12-27  
**Objetivo:** Eliminar documentos "Formulario de solicitud" y respuestas a pregunta Sicoar de todos los clientes

---

## 📋 Resumen Ejecutivo

### Pasos Rápidos (5 minutos)

1. **Backup de tablas afectadas:**
   ```sql
   CREATE TABLE documento_cliente_backup_20241227 AS SELECT * FROM documento_cliente WHERE tipo_documento_id IN (SELECT id FROM tipo_documento WHERE nombre = 'Formulario de solicitud');
   CREATE TABLE respuestas_cliente_backup_20241227 AS SELECT * FROM respuestas_cliente WHERE pregunta_id IN (SELECT id FROM preguntas WHERE pregunta = '¿La dirección en Sicoar coincide con su domicilio actual?');
   ```

2. **Ejecutar script completo (incluye verificación, eliminación y verificación):**
   ```bash
   psql -h [HOST] -U postgres -d gmarm_prod -f datos/migrations/003_eliminar_formulario_solicitud_y_pregunta_sicoar.sql
   ```

4. **Verificar resultado:**
   - El script mostrará conteos y confirmación automática
   - Verificar que la aplicación funciona correctamente

### Archivos Clave
- ✅ `003_eliminar_formulario_solicitud_y_pregunta_sicoar.sql` - Script completo (incluye verificación, eliminación y verificación posterior)
- ✅ `003_PLAN_EJECUCION_PRODUCCION.md` - Este documento completo

---

## 📋 Pre-requisitos

- [ ] Acceso SSH al servidor de producción
- [ ] Acceso a la base de datos PostgreSQL de producción
- [ ] Backup completo de la base de datos realizado
- [ ] Ventana de mantenimiento programada (recomendado)
- [ ] Notificación a usuarios sobre mantenimiento (si aplica)

---

## 🔍 FASE 1: Verificación Previa

### 1.1. Conectar a la base de datos de producción
```bash
# Conectar a PostgreSQL de producción
psql -h [HOST_PRODUCCION] -U postgres -d gmarm_prod
```

### 1.2. Verificar registros a eliminar

**El script 003 incluye verificación automática en la FASE 1, pero puedes verificar manualmente antes:**
```sql
-- Contar documentos "Formulario de solicitud" a eliminar
SELECT COUNT(*) as total_documentos
FROM documento_cliente
WHERE tipo_documento_id IN (
    SELECT id FROM tipo_documento 
    WHERE nombre = 'Formulario de solicitud'
);

-- Contar respuestas Sicoar a eliminar
SELECT COUNT(*) as total_respuestas
FROM respuestas_cliente
WHERE pregunta_id IN (
    SELECT id FROM preguntas 
    WHERE pregunta = '¿La dirección en Sicoar coincide con su domicilio actual?'
);
```

### 1.3. Crear backup de tablas afectadas

```sql
-- Backup de documento_cliente (solo registros a eliminar)
CREATE TABLE documento_cliente_backup_20241227 AS
SELECT * FROM documento_cliente
WHERE tipo_documento_id IN (
    SELECT id FROM tipo_documento 
    WHERE nombre = 'Formulario de solicitud'
);

-- Backup de respuestas_cliente (solo registros a eliminar)
CREATE TABLE respuestas_cliente_backup_20241227 AS
SELECT * FROM respuestas_cliente
WHERE pregunta_id IN (
    SELECT id FROM preguntas 
    WHERE pregunta = '¿La dirección en Sicoar coincide con su domicilio actual?'
);

-- Verificar que los backups se crearon correctamente
SELECT 
    (SELECT COUNT(*) FROM documento_cliente_backup_20241227) as backup_documentos,
    (SELECT COUNT(*) FROM respuestas_cliente_backup_20241227) as backup_respuestas;
```

---

## ⚠️ FASE 2: Ejecución del Script

### 2.1. Ejecutar script de migración

```bash
# Ejecutar script completo (incluye FASE 1: verificación, FASE 2: eliminación, FASE 3: verificación)
psql -h [HOST_PRODUCCION] -U postgres -d gmarm_prod -f datos/migrations/003_eliminar_formulario_solicitud_y_pregunta_sicoar.sql

# Opción alternativa: Desde stdin
cat datos/migrations/003_eliminar_formulario_solicitud_y_pregunta_sicoar.sql | psql -h [HOST_PRODUCCION] -U postgres -d gmarm_prod
```

**Nota:** El script ejecuta automáticamente las 3 fases:
- **FASE 1:** Muestra conteos previos (qué se eliminará)
- **FASE 2:** Elimina los registros
- **FASE 3:** Verifica que la eliminación fue exitosa

### 2.2. Verificar resultado de la ejecución

El script mostrará:
```
NOTICE: ✅ Migración completada
NOTICE:    - Documentos "Formulario de solicitud" restantes: 0
NOTICE:    - Respuestas a pregunta Sicoar restantes: 0
```

---

## ✅ FASE 3: Verificación Posterior

### 3.1. Verificar que los registros fueron eliminados

```sql
-- Verificar que no quedan documentos "Formulario de solicitud"
SELECT COUNT(*) as documentos_restantes
FROM documento_cliente
WHERE tipo_documento_id IN (
    SELECT id FROM tipo_documento 
    WHERE nombre = 'Formulario de solicitud'
);
-- Debe retornar: 0

-- Verificar que no quedan respuestas Sicoar
SELECT COUNT(*) as respuestas_restantes
FROM respuestas_cliente
WHERE pregunta_id IN (
    SELECT id FROM preguntas 
    WHERE pregunta = '¿La dirección en Sicoar coincide con su domicilio actual?'
);
-- Debe retornar: 0
```

### 3.2. Verificar integridad de datos

```sql
-- Verificar que otros documentos no fueron afectados
SELECT 
    td.nombre as tipo_documento,
    COUNT(*) as cantidad
FROM documento_cliente dc
JOIN tipo_documento td ON dc.tipo_documento_id = td.id
GROUP BY td.nombre
ORDER BY cantidad DESC;

-- Verificar que otras respuestas no fueron afectadas
SELECT 
    p.pregunta,
    COUNT(*) as cantidad
FROM respuestas_cliente rc
JOIN preguntas p ON rc.pregunta_id = p.id
GROUP BY p.pregunta
ORDER BY cantidad DESC;
```

### 3.3. Verificar que la aplicación funciona correctamente

- [ ] Probar creación de nuevo cliente
- [ ] Verificar que no aparece "Formulario de solicitud" en documentos requeridos
- [ ] Verificar que no aparece la pregunta Sicoar en el formulario
- [ ] Verificar edición de cliente existente
- [ ] Verificar visualización de documentos existentes

---

## 🔄 FASE 4: Rollback (Si es necesario)

### 4.1. Restaurar desde backup

```sql
-- Restaurar documentos eliminados
INSERT INTO documento_cliente
SELECT * FROM documento_cliente_backup_20241227;

-- Restaurar respuestas eliminadas
INSERT INTO respuestas_cliente
SELECT * FROM respuestas_cliente_backup_20241227;

-- Verificar restauración
SELECT 
    (SELECT COUNT(*) FROM documento_cliente WHERE tipo_documento_id IN (SELECT id FROM tipo_documento WHERE nombre = 'Formulario de solicitud')) as documentos_restaurados,
    (SELECT COUNT(*) FROM respuestas_cliente WHERE pregunta_id IN (SELECT id FROM preguntas WHERE pregunta = '¿La dirección en Sicoar coincide con su domicilio actual?')) as respuestas_restauradas;
```

### 4.2. Limpiar backups (solo después de confirmar que todo está bien)

```sql
-- ⚠️ SOLO EJECUTAR DESPUÉS DE CONFIRMAR QUE TODO ESTÁ CORRECTO
-- DROP TABLE IF EXISTS documento_cliente_backup_20241227;
-- DROP TABLE IF EXISTS respuestas_cliente_backup_20241227;
```

---

## 📊 Checklist de Ejecución

### Antes de ejecutar:
- [ ] Backup completo de base de datos realizado
- [ ] Backup de tablas específicas creado
- [ ] Conteo de registros a eliminar verificado
- [ ] Ventana de mantenimiento programada
- [ ] Usuarios notificados (si aplica)

### Durante la ejecución:
- [ ] Script ejecutado correctamente
- [ ] Mensajes de NOTICE verificados
- [ ] Sin errores en la ejecución

### Después de ejecutar:
- [ ] Verificación de eliminación exitosa
- [ ] Integridad de datos verificada
- [ ] Aplicación probada y funcionando
- [ ] Documentación actualizada

### Post-ejecución (después de 24-48 horas):
- [ ] Confirmar que no hay problemas reportados
- [ ] Eliminar tablas de backup (opcional)
- [ ] Cerrar ticket de mantenimiento

---

## 📝 Notas Importantes

1. **Backup obligatorio:** Siempre crear backup antes de ejecutar scripts de eliminación masiva
2. **Ventana de mantenimiento:** Ejecutar durante horas de bajo tráfico si es posible
3. **Monitoreo:** Monitorear logs de aplicación después de la ejecución
4. **Comunicación:** Notificar al equipo sobre la ejecución del script
5. **Documentación:** Registrar fecha y hora de ejecución en el historial de cambios

---

## 🔗 Archivos Relacionados

- **Script de migración completo:** `datos/migrations/003_eliminar_formulario_solicitud_y_pregunta_sicoar.sql` ⭐
  - Incluye: Verificación previa (FASE 1), Eliminación (FASE 2), Verificación posterior (FASE 3)
- **Plan de ejecución:** `datos/migrations/003_PLAN_EJECUCION_PRODUCCION.md` (este archivo)
- **Backup de base de datos:** `backups/gmarm_prod_[FECHA].sql`
- **Logs de ejecución:** Guardar salida del comando `psql` en archivo de log

---

## 📞 Contacto de Emergencia

En caso de problemas durante la ejecución:
1. NO ejecutar rollback inmediatamente
2. Verificar logs de aplicación
3. Consultar con el equipo de desarrollo
4. Si es necesario, ejecutar rollback siguiendo FASE 4

---

**Última actualización:** 2024-12-27


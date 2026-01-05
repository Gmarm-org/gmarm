# 🔄 Guía para Reiniciar Base de Datos en Producción

## ⚠️ IMPORTANTE: Hacer Backup ANTES de Reiniciar

**SIEMPRE hacer backup antes de reiniciar la base de datos en producción.**

## 📋 Opciones para Reiniciar la BD

### Opción 1: Reset Completo (Eliminar todo y empezar de cero) ⚠️

**⚠️ ESTO ELIMINARÁ TODOS LOS DATOS EXISTENTES (clientes, usuarios, etc.)**

```bash
# 1. Conectarse al servidor de producción
ssh usuario@servidor-produccion

# 2. Ir al directorio del proyecto
cd ~/deploy/prod  # O la ruta donde está tu proyecto

# 3. Detener servicios (IMPORTANTE: detener antes de eliminar volumen)
docker-compose -f docker-compose.prod.yml down

# 4. Verificar nombre exacto del volumen
docker volume ls | grep postgres

# 5. Eliminar volumen de PostgreSQL (ESTO BORRA TODOS LOS DATOS)
# El nombre del volumen es: prod_postgres_data_prod
docker volume rm prod_postgres_data_prod

# 6. Verificar que el volumen fue eliminado
docker volume ls | grep postgres
# No debe aparecer ningún volumen de postgres

# 7. Levantar servicios nuevamente (el script se ejecutará automáticamente)
docker-compose -f docker-compose.prod.yml up -d

# 8. Esperar a que PostgreSQL esté listo y ejecute el script (60-90 segundos)
echo "Esperando a que PostgreSQL inicie y ejecute el script maestro..."
sleep 90

# 9. Verificar que el script se ejecutó correctamente (debe mostrar solo usuarios iniciales)
docker exec gmarm-postgres-prod psql -U postgres -d gmarm_prod -c "SELECT COUNT(*) FROM usuario;"
docker exec gmarm-postgres-prod psql -U postgres -d gmarm_prod -c "SELECT COUNT(*) FROM cliente;"
# Debe mostrar 0 clientes (o solo los datos iniciales del script)

# 10. Verificar logs de PostgreSQL para confirmar que ejecutó el script
docker logs gmarm-postgres-prod | grep -i "00_gmarm_completo\|executing\|initdb"

# 11. El script maestro ya resetea las secuencias automáticamente
# Los IDs empezarán desde 1 (o desde los valores iniciales del script)

# 12. Verificar logs del backend
docker logs gmarm-backend-prod | tail -50
```

### Opción 2: Ejecutar Script Maestro Manualmente (Solo actualiza esquema) ⚠️

**⚠️ ESTO NO ELIMINA DATOS EXISTENTES - Solo actualiza el esquema**

**Si quieres eliminar TODOS los datos, usa la Opción 1 (Reset Completo)**

```bash
# 1. Conectarse al servidor de producción
ssh usuario@servidor-produccion

# 2. Ir al directorio del proyecto
cd ~/deploy/prod  # O la ruta donde está tu proyecto

# 3. HACER BACKUP PRIMERO (OBLIGATORIO)
mkdir -p backups
docker exec gmarm-postgres-prod pg_dump -U postgres -d gmarm_prod > backups/backup-antes-script-$(date +%Y%m%d-%H%M%S).sql

# 4. Verificar que el backup se creó
ls -lh backups/backup-antes-script-*.sql

# 5. Actualizar código (si es necesario)
git pull origin main

# 6. Ejecutar el script maestro manualmente
docker exec -i gmarm-postgres-prod psql -U postgres -d gmarm_prod < datos/00_gmarm_completo.sql

# 7. Verificar que se ejecutó correctamente
docker exec gmarm-postgres-prod psql -U postgres -d gmarm_prod -c "SELECT COUNT(*) FROM usuario;"
docker exec gmarm-postgres-prod psql -U postgres -d gmarm_prod -c "SELECT COUNT(*) FROM configuracion_sistema;"

# 8. Reiniciar backend para que cargue el nuevo esquema
docker-compose -f docker-compose.prod.yml restart backend

# 9. Esperar a que el backend inicie (60 segundos)
sleep 60

# 10. Verificar que el backend inició correctamente
docker logs gmarm-backend-prod | tail -50
curl http://localhost:8080/api/health
```

### Opción 3: Usar Script de Deploy (Incluye Backup Automático) ✅

```bash
# 1. Conectarse al servidor de producción
ssh usuario@servidor-produccion

# 2. Ir al directorio del proyecto
cd ~/deploy/prod

# 3. Ejecutar script de deploy (hace backup automáticamente)
bash scripts/deploy-prod.sh

# NOTA: El script de deploy NO ejecuta el script maestro automáticamente
# Después del deploy, ejecutar manualmente:
docker exec -i gmarm-postgres-prod psql -U postgres -d gmarm_prod < datos/00_gmarm_completo.sql
```

## 🔍 Verificación Post-Ejecución

Después de ejecutar el script, verifica que todo esté correcto:

```bash
# 1. Verificar tablas principales
docker exec gmarm-postgres-prod psql -U postgres -d gmarm_prod -c "
SELECT 
  'usuario' as tabla, COUNT(*) as registros FROM usuario
UNION ALL
SELECT 'cliente', COUNT(*) FROM cliente
UNION ALL
SELECT 'configuracion_sistema', COUNT(*) FROM configuracion_sistema
UNION ALL
SELECT 'tipo_documento', COUNT(*) FROM tipo_documento;
"

# 2. Verificar que las secuencias estén correctas
docker exec gmarm-postgres-prod psql -U postgres -d gmarm_prod -c "
SELECT 
  'usuario_id_seq' as secuencia, last_value FROM usuario_id_seq
UNION ALL
SELECT 'cliente_id_seq', last_value FROM cliente_id_seq;
"

# 3. Verificar logs del backend (no debe haber errores de schema)
docker logs gmarm-backend-prod | grep -i "schema\|error\|exception" | tail -20

# 4. Verificar health check
curl http://localhost:8080/api/health
```

## 🚨 Troubleshooting

### Error: "database is being accessed by other users"

```bash
# Cerrar todas las conexiones activas
docker exec gmarm-postgres-prod psql -U postgres -d gmarm_prod -c "
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'gmarm_prod' AND pid <> pg_backend_pid();
"

# Luego ejecutar el script nuevamente
docker exec -i gmarm-postgres-prod psql -U postgres -d gmarm_prod < datos/00_gmarm_completo.sql
```

### Error: "relation already exists"

**✅ Esto es NORMAL** - El script es idempotente y puede ejecutarse múltiples veces. Los errores de "already exists" se ignoran.

### Error: "permission denied"

```bash
# Verificar permisos del archivo
ls -la datos/00_gmarm_completo.sql

# Si es necesario, dar permisos de lectura
chmod +r datos/00_gmarm_completo.sql
```

## 📝 Notas Importantes

1. **El script maestro es idempotente**: Se puede ejecutar múltiples veces sin problemas
2. **No elimina datos existentes**: Solo crea/actualiza tablas y datos iniciales
3. **Las secuencias se resetean**: Si necesitas mantener IDs continuos, ajusta las secuencias después
4. **Backup siempre primero**: Nunca ejecutes el script sin hacer backup

## 🔄 Restaurar desde Backup (si algo sale mal)

```bash
# 1. Detener servicios
docker-compose -f docker-compose.prod.yml down

# 2. Eliminar volumen
docker volume rm gmarm_postgres_data_prod

# 3. Levantar PostgreSQL solo
docker-compose -f docker-compose.prod.yml up -d postgres_prod

# 4. Esperar a que esté listo
sleep 30

# 5. Restaurar backup
docker exec -i gmarm-postgres-prod psql -U postgres -d gmarm_prod < backups/backup-antes-script-YYYYMMDD-HHMMSS.sql

# 6. Levantar todos los servicios
docker-compose -f docker-compose.prod.yml up -d
```

---

**Última actualización:** 2026-01-05


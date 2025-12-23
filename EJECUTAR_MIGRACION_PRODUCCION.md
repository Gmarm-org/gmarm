# 🔧 Ejecutar Migración en Producción - Solución al Error 502

## ❌ Error Actual

El backend está crasheando porque falta la columna `tipo_documento_id` en la tabla `documento_grupo_importacion`:

```
Schema-validation: missing column [tipo_documento_id] in table [documento_grupo_importacion]
```

## ✅ Solución: Ejecutar la Migración

La migración `001_modulo_operaciones_grupos_importacion.sql` debe ejecutarse en la base de datos de producción.

### Pasos en el servidor:

```bash
# 1. Ir al directorio del proyecto
cd ~/deploy/prod

# 2. Verificar que el script de migración existe
ls -la datos/migrations/001_modulo_operaciones_grupos_importacion.sql

# 3. Ejecutar la migración en la base de datos de producción
docker exec -i gmarm-postgres-prod psql -U postgres -d gmarm_prod < datos/migrations/001_modulo_operaciones_grupos_importacion.sql

# 4. Verificar que la columna se creó
docker exec gmarm-postgres-prod psql -U postgres -d gmarm_prod -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'documento_grupo_importacion' AND column_name = 'tipo_documento_id';"

# 5. Si la verificación muestra la columna, reiniciar el backend
docker-compose -f docker-compose.prod.yml restart backend

# 6. Esperar 60 segundos
sleep 60

# 7. Verificar que el backend inició correctamente
docker logs gmarm-backend-prod | tail -50
```

### Si el script no existe en el servidor:

```bash
# 1. Actualizar código
cd ~/deploy/prod
git pull origin main

# 2. Ejecutar la migración (como arriba)
docker exec -i gmarm-postgres-prod psql -U postgres -d gmarm_prod < datos/migrations/001_modulo_operaciones_grupos_importacion.sql
```

## ✅ Verificación Post-Migración

Después de ejecutar la migración, el backend debe iniciar correctamente. Verifica:

```bash
# Ver logs - debe mostrar "Started Application"
docker logs gmarm-backend-prod | grep -i "started"

# Verificar health check
curl http://localhost:8080/api/health

# Verificar CORS (desde el servidor)
curl -X OPTIONS http://localhost:8080/api/auth/login \
  -H "Origin: https://gmarm.com" \
  -H "Access-Control-Request-Method: POST" \
  -i
```

## 🚨 Si la migración falla

Si hay errores al ejecutar la migración, pueden ser:
1. La columna ya existe → Ignorar, está bien
2. Error de sintaxis → Verificar que el script esté completo
3. Error de permisos → Verificar que el usuario postgres tenga permisos

**Ver errores:**
```bash
docker exec -i gmarm-postgres-prod psql -U postgres -d gmarm_prod < datos/migrations/001_modulo_operaciones_grupos_importacion.sql 2>&1
```

---

**Última actualización:** 2024-12-23


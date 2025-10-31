# 🔍 Diagnóstico: DEV Caído - Failed to Fetch

## 🚨 Problema Actual

```
POST http://72.167.52.14:8080/api/auth/login net::ERR_CONNECTION_REFUSED
```

**Síntoma**: El frontend NO puede conectarse al backend en DEV.

## 🔍 Posibles Causas

### 1. ✅ **PostgreSQL Caído por OOM**
- **Síntoma**: `Connection refused` al intentar conectar
- **Causa**: PostgreSQL matado por OOM killer
- **Diagnóstico**: 
  ```bash
  docker logs gmarm-postgres-dev --tail 100 | grep -i "killed\|oom\|panic"
  ```
- **Solución**: Ya implementada en `e68a8d2` (configuración conservadora PostgreSQL)

### 2. **Backend No Iniciado**
- **Síntoma**: Frontend responde pero backend no
- **Causa**: Backend falló al iniciar (dependencias, validación schema, etc.)
- **Diagnóstico**:
  ```bash
  docker logs gmarm-backend-dev --tail 200
  ```
- **Posibles errores**:
  - `Schema-validation: missing column` → Cambio en schema sin recrear BD
  - `Connection refused to postgres` → PostgreSQL caído
  - `Port 8080 already in use` → Puerto ocupado

### 3. **Network/DNS Issues**
- **Síntoma**: Frontend no puede resolver `72.167.52.14:8080`
- **Causa**: Firewall, DNS, o servicios down
- **Diagnóstico**:
  ```bash
  curl -v http://72.167.52.14:8080/api/health
  ```

### 4. **Reset Database Rompió Something**
- **Síntoma**: Todo funcionaba antes del reset
- **Causa**: Reset eliminó datos críticos o corrompió schema
- **Solución**: Ejecutar SQL maestro limpio

## 🔧 Acciones Inmediatas (En el servidor DEV)

### Paso 1: Verificar Estado de Contenedores
```bash
docker ps -a | grep gmarm
```

**Esperado**:
```
gmarm-backend-dev     Up   8080:8080
gmarm-frontend-dev    Up   5173:5173
gmarm-postgres-dev    Up   5432:5432
```

### Paso 2: Si PostgreSQL está DOWN
```bash
docker logs gmarm-postgres-dev --tail 100
docker restart gmarm-postgres-dev
```

### Paso 3: Si Backend está DOWN
```bash
docker logs gmarm-backend-dev --tail 200
docker restart gmarm-backend-dev
```

### Paso 4: Si Todo Está UP pero No Funciona
```bash
# Verificar health check del backend
curl http://localhost:8080/api/health

# Si falla, revisar logs
docker logs gmarm-backend-dev --tail 100 | grep -i error
```

### Paso 5: Reset Completo si es Necesario
```bash
cd /home/usuario/deploy/dev
docker-compose -f docker-compose.dev.yml down -v
docker system prune -f
./reset-dev-database.sh  # o reset-dev-database.sh según el OS del servidor
```

## 🔄 Comandos SSH (Desde Local)

Si tienes acceso SSH al servidor:

```bash
ssh usuario@72.167.52.14

# Ver logs de PostgreSQL
docker logs gmarm-postgres-dev --tail 100

# Ver logs de Backend
docker logs gmarm-backend-dev --tail 100

# Ver estado de servicios
docker ps -a | grep gmarm

# Reiniciar servicios
cd /home/usuario/deploy/dev
docker-compose -f docker-compose.dev.yml restart

# Si PostgreSQL está caído, reiniciar
docker restart gmarm-postgres-dev

# Verificar conexión
curl http://localhost:8080/api/health
```

## ✅ Verificación Final

Una vez restaurado, verificar:

1. **Backend responde**:
   ```bash
   curl http://72.167.52.14:8080/api/health
   ```

2. **PostgreSQL responde**:
   ```bash
   docker exec gmarm-postgres-dev pg_isready -U postgres
   ```

3. **Frontend carga**:
   - Navegar a `http://72.167.52.14:5173`
   - Ver que NO aparece "Failed to fetch"

## 📝 Notas Importantes

- **Los cambios de estabilidad PostgreSQL** ya están en `e68a8d2`
- **Los cambios de reset de secuencias** ya están en `e68a8d2`
- **El pipeline** está pasando (warnings son no-críticos)
- **El problema** es que DEV necesita ser reiniciado con la nueva configuración

## 🚀 Próximos Pasos

1. Acceder al servidor DEV vía SSH
2. Ejecutar: `./reset-dev-database.sh` (o `.ps1` dependiendo del OS)
3. Esto aplicará TODAS las correcciones de estabilidad
4. Verificar que funciona
5. Reportar si persiste el problema

---
**Fecha**: 2025-10-31  
**Última acción**: Cambios críticos pusheados a `dev` (e68a8d2)  
**Estado**: Esperando aplicación en servidor DEV


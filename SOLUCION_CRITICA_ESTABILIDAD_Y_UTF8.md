# 🚨 SOLUCIÓN CRÍTICA: ESTABILIDAD BD Y UTF-8

## ❌ PROBLEMAS IDENTIFICADOS

### 1. **Inestabilidad de Base de Datos (Error 400 Intermitente)**
- **Causa**: `spring.jpa.hibernate.ddl-auto=update` en `application-docker.properties`
- **Efecto**: Hibernate modifica la BD cada vez que se reinicia, causando:
  - Pérdida de datos
  - Estructura inconsistente
  - Errores 400 en login
  - Base de datos "se cae" o "no se levanta bien"

### 2. **Caracteres Especiales Corruptos (Tildes, Ñ)**
- **Causa**: Falta de configuración UTF-8 estricta
- **Efecto**: Caracteres especiales se ven como `??` o extraños en el frontend

## ✅ SOLUCIONES APLICADAS

### 1. **Cambio Hibernate DDL de `update` a `validate`**

**Archivo**: `backend/src/main/resources/application-docker.properties`

**ANTES (❌ INESTABLE)**:
```properties
spring.jpa.hibernate.ddl-auto=update
spring.jpa.hibernate.hbm2ddl.auto=update
```

**DESPUÉS (✅ ESTABLE)**:
```properties
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.hibernate.hbm2ddl.auto=validate
```

**Efecto**:
- Hibernate **NO modifica** la estructura de la BD
- Solo **valida** que las entidades coincidan con las tablas
- La BD es **inmutable** desde el código
- **Única fuente de verdad**: `datos/00_gmarm_completo.sql`

### 2. **Configuración UTF-8 Estricta**

**Ya estaba configurada en** `docker-compose.dev.yml`:
```yaml
environment:
  POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
```

**Pero necesita recreación del volumen** para aplicarse.

### 3. **Frontend: Corrección Error TypeScript**

**Archivo**: `frontend/src/pages/JefeVentas/JefeVentas.tsx`

**ANTES (❌ ERROR)**:
```typescript
const puedeVerAsignacionSeries = user?.roles?.some(
  role => role.codigo === 'SALES_CHIEF' || role.codigo === 'FINANCE'
) || false;
```

**DESPUÉS (✅ CORRECTO)**:
```typescript
const puedeVerAsignacionSeries = user?.roles?.some(
  role => role.rol?.codigo === 'SALES_CHIEF' || role.rol?.codigo === 'FINANCE'
) || false;
```

**Efecto**: El build del frontend ahora pasa sin errores.

## 🔧 APLICAR EN SERVIDOR DEV

### Opción 1: Script Automático (RECOMENDADO)

1. **Subir el script al servidor**:
   ```bash
   scp fix-dev-database-utf8-y-estabilidad.sh user@72.167.52.14:/ruta/proyecto/
   ```

2. **Dar permisos de ejecución**:
   ```bash
   ssh user@72.167.52.14
   cd /ruta/proyecto
   chmod +x fix-dev-database-utf8-y-estabilidad.sh
   ```

3. **Ejecutar el script**:
   ```bash
   ./fix-dev-database-utf8-y-estabilidad.sh
   ```

### Opción 2: Manual

1. **Detener servicios**:
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

2. **Eliminar volumen de PostgreSQL** (forzar recreación UTF-8):
   ```bash
   docker volume rm gmarm_postgres_data_dev
   ```

3. **Actualizar `application-docker.properties`**:
   ```bash
   cd backend/src/main/resources
   nano application-docker.properties
   
   # Cambiar estas líneas:
   spring.jpa.hibernate.ddl-auto=validate
   spring.jpa.hibernate.hbm2ddl.auto=validate
   ```

4. **Actualizar archivos del frontend** (si no están ya actualizados):
   ```bash
   cd frontend/src/pages/JefeVentas
   nano JefeVentas.tsx
   
   # Cambiar:
   role => role.rol?.codigo === 'SALES_CHIEF' || role.rol?.codigo === 'FINANCE'
   ```

5. **Reconstruir y levantar servicios**:
   ```bash
   cd /ruta/proyecto
   docker-compose -f docker-compose.dev.yml up -d --build
   ```

6. **Esperar 60 segundos** para que los servicios estén listos.

7. **Verificar datos**:
   ```bash
   docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "SELECT COUNT(*) FROM usuario;"
   docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "SELECT COUNT(*) FROM arma_serie;"
   docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "SHOW server_encoding;"
   ```

8. **Probar caracteres especiales**:
   ```bash
   docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "SELECT nombres, apellidos FROM usuario WHERE nombres LIKE '%á%' OR nombres LIKE '%ñ%' LIMIT 3;"
   ```

## 🧪 VERIFICACIÓN

### 1. **Probar Login**
- URL: http://72.167.52.14:5173
- Usuario: `jefe@test.com`
- Password: `JefeVentas2024!`
- Resultado esperado: Login exitoso, **NO error 400**

### 2. **Verificar Caracteres Especiales**
- Navegar a algún cliente o usuario con tildes/ñ
- Resultado esperado: Caracteres se ven correctamente (ñ, á, é, í, ó, ú)

### 3. **Verificar Estabilidad**
- Reiniciar backend:
  ```bash
  docker-compose -f docker-compose.dev.yml restart backend_dev
  ```
- Esperar 30 segundos
- Probar login nuevamente
- Resultado esperado: Login sigue funcionando, **datos NO se pierden**

### 4. **Verificar Series**
- Login como Jefe de Ventas o Finanzas
- Ir a "Asignación de Series"
- Resultado esperado: Ver lista de reservas pendientes (si hay) o mensaje "No hay reservas"

## 📊 MÉTRICAS DE ÉXITO

✅ **Login funciona consistentemente** (sin error 400)  
✅ **Caracteres especiales se ven correctamente** (ñ, tildes)  
✅ **Datos persisten después de reinicios**  
✅ **500 series cargadas en `arma_serie`**  
✅ **Build del frontend pasa sin errores**  
✅ **Backend no modifica estructura de BD**

## 🔍 MONITOREO

### Ver Logs en Tiempo Real
```bash
# Backend
docker-compose -f docker-compose.dev.yml logs -f backend_dev

# PostgreSQL
docker-compose -f docker-compose.dev.yml logs -f postgres_dev

# Todos
docker-compose -f docker-compose.dev.yml logs -f
```

### Verificar Estado de Servicios
```bash
docker-compose -f docker-compose.dev.yml ps
```

### Verificar Salud del Backend
```bash
curl http://72.167.52.14:8080/api/health
```

## 🚨 SI EL PROBLEMA PERSISTE

### Error 400 en Login
1. Verificar logs del backend:
   ```bash
   docker-compose -f docker-compose.dev.yml logs backend_dev | grep -i "error\|exception"
   ```

2. Verificar que la tabla `usuario` tenga datos:
   ```bash
   docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "SELECT email FROM usuario LIMIT 5;"
   ```

3. Verificar que el archivo `application-docker.properties` tenga `validate`:
   ```bash
   docker exec gmarm-backend-dev cat /app/BOOT-INF/classes/application-docker.properties | grep ddl-auto
   ```

### Caracteres Especiales Mal Mostrados
1. Verificar encoding de PostgreSQL:
   ```bash
   docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "SHOW server_encoding;"
   ```
   Debe ser: `UTF8`

2. Verificar que el volumen se recreó:
   ```bash
   docker volume ls | grep postgres_data_dev
   docker volume inspect gmarm_postgres_data_dev
   ```
   Debe tener una fecha de creación reciente.

## 📝 NOTAS IMPORTANTES

1. **El volumen se DEBE eliminar** para aplicar la configuración UTF-8.
2. **Hibernate DEBE estar en `validate`** para estabilidad.
3. **El SQL maestro (`00_gmarm_completo.sql`) es la única fuente de verdad**.
4. **NO usar `docker-compose down -v`** después del fix, solo `down`.
5. **Siempre esperar al menos 60 segundos** después de `up` para que PostgreSQL inicialice completamente.

## 🎯 RESULTADO ESPERADO

Después de aplicar esta solución:
- ✅ El servidor DEV será **estable** (no más error 400 intermitente)
- ✅ Los caracteres especiales se verán **correctamente**
- ✅ Los datos **persistirán** después de reinicios
- ✅ El frontend **compilará** sin errores
- ✅ La asignación de series estará **funcional**

---

**Fecha**: 2025-10-26  
**Prioridad**: 🚨 CRÍTICA  
**Estado**: ✅ SOLUCIÓN LISTA PARA APLICAR


# 🚀 Instrucciones para Aplicar Cambios en DEV

## 📦 Cambios Incluidos en este Deploy

- ✅ Funcionalidad de **Asignación de Series** para SALES_CHIEF y FINANCE
- ✅ **500 series de armas** agregadas al SQL maestro (persistencia automática)
- ✅ Endpoints `/api/asignacion-series/**` configurados como públicos
- ✅ **Solución completa** al problema de pérdida de datos en DEV
- ✅ **ReservaPendienteDTO** para evitar recursión infinita en JSON
- ✅ Nombres de modelos PLAN PILOTO actualizados según lista oficial

---

## 🔧 Instrucciones Paso a Paso

### **1. Conectarse al Servidor DEV**

```bash
ssh usuario@72.167.52.14
```

### **2. Navegar al Directorio del Proyecto**

```bash
cd /ruta/al/proyecto/gmarm
# Verificar que estás en la rama dev
git branch
```

### **3. Hacer Pull de los Cambios**

```bash
git pull origin dev
```

**Salida esperada:**
```
remote: Enumerating objects: 69, done.
remote: Counting objects: 100% (69/69), done.
...
Updating f935bcc..275fc3a
Fast-forward
 17 files changed, 1787 insertions(+), 240 deletions(-)
 create mode 100644 SOLUCION_PERSISTENCIA_DATOS_DEV.md
 create mode 100644 backend/src/main/java/com/armasimportacion/dto/ReservaPendienteDTO.java
 create mode 100644 datos/CODIGOS_PLAN_PILOTO.txt
 create mode 100644 datos/insert_series_cz_p09.sql
 create mode 100644 datos/template_insert_series.sql
```

### **4. ⚠️ IMPORTANTE: Recrear Volumen de Base de Datos**

**Por qué es necesario:**
- El SQL maestro ahora incluye las 500 series
- PostgreSQL solo ejecuta scripts en `/docker-entrypoint-initdb.d/` cuando crea el volumen por primera vez
- Si no eliminamos el volumen, las series no se cargarán

```bash
# Detener servicios y eliminar volumen
docker-compose -f docker-compose.dev.yml down -v
```

**⚠️ NOTA:** Esto eliminará todos los datos actuales de la base de datos DEV, pero se recargarán automáticamente desde el SQL maestro actualizado.

### **5. Levantar Servicios**

```bash
# Reconstruir y levantar todos los servicios
docker-compose -f docker-compose.dev.yml up -d --build
```

**Tiempo estimado:** 2-5 minutos

### **6. Verificar que los Servicios Estén Corriendo**

```bash
docker ps --filter "name=gmarm-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

**Salida esperada:**
```
NAMES                  STATUS                  PORTS
gmarm-frontend-dev     Up 2 minutes           0.0.0.0:5173->5173/tcp
gmarm-backend-dev      Up 2 minutes           0.0.0.0:8080->8080/tcp
gmarm-postgres-dev     Up 2 minutes (healthy) 0.0.0.0:5432->5432/tcp
```

### **7. Esperar a que el Backend Termine de Iniciar**

```bash
# Verificar logs del backend (esperar mensaje "Started ArmasimportacionApplication")
docker logs gmarm-backend-dev --tail 50 --follow
```

**Presionar `Ctrl+C` cuando veas:**
```
Started ArmasimportacionApplication in XX.XXX seconds
```

### **8. ✅ Verificar Datos Cargados**

#### **Verificar 500 Series:**
```bash
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "SELECT COUNT(*) as total_series FROM arma_serie;"
```
**Esperado:** `500`

#### **Verificar Usuarios:**
```bash
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "SELECT email, nombres, apellidos FROM usuario;"
```
**Esperado:** Al menos 7 usuarios (admin, jefe, vendedores, etc.)

#### **Verificar Modelos PLAN PILOTO:**
```bash
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "SELECT COUNT(*) FROM arma WHERE codigo LIKE '%PLAN-PILOTO%';"
```
**Esperado:** `17`

#### **Verificar Distribución de Series por Modelo:**
```bash
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "
SELECT 
    a.nombre, 
    COUNT(aser.id) AS series 
FROM arma a 
LEFT JOIN arma_serie aser ON a.id = aser.arma_id 
WHERE a.codigo LIKE '%PLAN-PILOTO%' 
GROUP BY a.nombre 
ORDER BY a.nombre;
"
```

---

## 🧪 Probar el Login

### **Opción 1: Desde el Navegador**

1. Ir a: `http://72.167.52.14:5173`
2. Intentar login con:
   - **Email:** `jefe@test.com`
   - **Password:** `123456`
3. Debería funcionar sin error 400

### **Opción 2: Desde la Terminal del Servidor**

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jefe@test.com",
    "password": "123456"
  }'
```

**Salida esperada (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "usuario": {
    "id": 3,
    "email": "jefe@test.com",
    "nombres": "María",
    "apellidos": "Jefe Ventas",
    "roles": [...]
  }
}
```

---

## 🔍 Solución de Problemas

### **Error 400 en Login Persiste**

**Posibles causas:**

1. **Backend no terminó de iniciar:**
   ```bash
   docker logs gmarm-backend-dev --tail 100
   ```
   Buscar: `Started ArmasimportacionApplication`

2. **Variables de entorno incorrectas:**
   ```bash
   docker exec gmarm-backend-dev env | grep SPRING
   ```
   Verificar:
   - `SPRING_DATASOURCE_URL=jdbc:postgresql://postgres_dev:5432/gmarm_dev`
   - `SPRING_PROFILES_ACTIVE=docker`

3. **Frontend apuntando a URL incorrecta:**
   ```bash
   docker exec gmarm-frontend-dev env | grep VITE
   ```
   Verificar:
   - `VITE_API_BASE_URL=http://72.167.52.14:8080`

4. **Base de datos vacía:**
   ```bash
   docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "SELECT COUNT(*) FROM usuario;"
   ```
   Si muestra `0`, el SQL maestro no se ejecutó. Volver al paso 4.

### **Error de CORS**

Si ves errores de CORS en la consola del navegador:

```bash
# Verificar logs del backend
docker logs gmarm-backend-dev --tail 50 | grep CORS
```

**Solución:**
```bash
# Editar docker-compose.dev.yml (si es necesario)
nano docker-compose.dev.yml

# Verificar que SPRING_CORS_ALLOWED_ORIGINS incluya tu URL
# SPRING_CORS_ALLOWED_ORIGINS: ${SPRING_CORS_ALLOWED_ORIGINS:-http://localhost:5173,http://127.0.0.1:5173,http://72.167.52.14:5173,http://72.167.52.14:80}

# Reiniciar backend
docker-compose -f docker-compose.dev.yml restart backend_dev
```

### **Error 500 en Asignación de Series**

```bash
# Ver logs del backend en tiempo real
docker logs gmarm-backend-dev --follow

# En otra terminal, probar el endpoint
curl http://72.167.52.14:8080/api/asignacion-series/pendientes
```

---

## 📊 Checklist de Verificación

- [ ] Pull completado sin conflictos
- [ ] Servicios levantados correctamente (`docker ps`)
- [ ] Backend iniciado (`docker logs gmarm-backend-dev`)
- [ ] 500 series cargadas (`SELECT COUNT(*) FROM arma_serie`)
- [ ] 7+ usuarios cargados (`SELECT COUNT(*) FROM usuario`)
- [ ] 17 modelos PLAN PILOTO (`SELECT COUNT(*) FROM arma WHERE codigo LIKE '%PLAN-PILOTO%'`)
- [ ] Login funciona sin error 400
- [ ] Tab "Asignación de Series" visible para SALES_CHIEF/FINANCE
- [ ] Endpoint `/api/asignacion-series/pendientes` responde `[]` (sin errores)

---

## 🎯 Resultado Esperado

Después de completar estos pasos:

✅ **Login funciona** sin error 400
✅ **Todos los usuarios** están disponibles
✅ **500 series** cargadas automáticamente
✅ **17 modelos PLAN PILOTO** con nombres correctos
✅ **Tab "Asignación de Series"** visible para roles autorizados
✅ **Persistencia de datos** garantizada entre reinicios

---

## 📞 Soporte

Si encuentras algún problema durante la aplicación:

1. **Capturar logs:**
   ```bash
   docker logs gmarm-backend-dev > backend_logs.txt
   docker logs gmarm-postgres-dev > postgres_logs.txt
   ```

2. **Verificar estado de servicios:**
   ```bash
   docker-compose -f docker-compose.dev.yml ps
   ```

3. **Revisar documentación completa:**
   - `SOLUCION_PERSISTENCIA_DATOS_DEV.md` (en el repositorio)

---

**Última actualización:** 2025-10-24
**Commit:** 275fc3a
**Branch:** dev


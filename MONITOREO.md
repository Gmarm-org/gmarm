# 📊 Guía de Acceso a Métricas y Monitoreo - GMARM

## 🎯 Resumen

Este documento explica cómo acceder a las métricas y alertas del sistema GMARM.

---

## 🔍 **1. Sistema de Monitoreo Automatizado (GitHub Actions)**

### Configuración Actual

| Aspecto | Detalle |
|---------|---------|
| **Frecuencia** | 2 veces al día (6:00 AM y 6:00 PM UTC) |
| **Horario Ecuador** | 1:00 AM y 1:00 PM (UTC-5) |
| **Comportamiento** | **SOLO genera alertas cuando algo falla** |
| **Ejecución Manual** | Disponible en GitHub Actions |

### ✅ **Cómo Funciona**

```
✅ TODO OK → Sin registros visibles, workflow pasa silenciosamente
❌ FALLO → Alerta visible con detalles del problema
```

### 📍 **Dónde Ver las Alertas**

1. **GitHub Actions Dashboard:**
   ```
   URL: https://github.com/Gmarm-org/gmarm/actions
   Workflow: "🔍 GMARM Monitoring & Alerts"
   ```

2. **Qué Monitorea:**
   - ✅ Salud del backend (`/api/health`)
   - ✅ Disponibilidad del frontend
   - ⚡ Performance (tiempo de respuesta < 3 segundos)

3. **Solo Verás Logs Cuando:**
   - ❌ Backend no responde
   - ❌ Frontend no está disponible
   - ⚠️ Backend es lento (> 3 segundos)

### 🚀 **Ejecutar Manualmente**

```powershell
# En GitHub:
# 1. Ir a: https://github.com/Gmarm-org/gmarm/actions
# 2. Seleccionar "🔍 GMARM Monitoring & Alerts"
# 3. Click en "Run workflow" → "Run workflow"
```

---

## 📊 **2. Grafana Dashboard (Monitoreo Visual)**

### 🔐 **Acceso a Grafana**

#### En Desarrollo Local:
```powershell
# 1. Levantar el stack de monitoreo
docker-compose -f docker-compose.monitoring.yml up -d

# 2. Acceder a Grafana
# URL: http://localhost:3000
# Usuario: admin
# Password: admin (cambiar en primer acceso)
```

#### En Producción:
```
URL: https://grafana.gmarm.com (si está configurado)
Usuario: admin
Password: [configurado en .env]
```

### 📈 **Qué Puedes Ver en Grafana**

1. **Logs en Tiempo Real** (Loki)
   - Logs del backend (JSON estructurado)
   - Logs de contenedores Docker
   - Filtrado por nivel (ERROR, WARN, INFO, DEBUG)

2. **Métricas del Sistema** (si se configura Prometheus)
   - CPU/Memoria por contenedor
   - Uso de disco
   - Conexiones de red

3. **Queries Personalizadas**
   - Buscar errores específicos
   - Filtrar por timestamp
   - Analizar patrones de logs

### 🚀 **Primeros Pasos en Grafana**

```powershell
# 1. Levantar servicios de monitoreo
docker-compose -f docker-compose.monitoring.yml up -d

# 2. Verificar que todo está corriendo
docker ps | findstr "grafana\|loki\|promtail"

# 3. Acceder a Grafana: http://localhost:3000
```

**En Grafana:**
1. Login con `admin` / `admin`
2. Ir a **Explore** (icono de brújula)
3. Seleccionar **Loki** como data source
4. Query ejemplo: `{job="gmarm-backend"} |= "ERROR"`

---

## 🔬 **3. Spring Boot Actuator (Métricas del Backend)**

### 📍 **Endpoints Disponibles**

#### Health Check:
```bash
# Local
curl http://localhost:8080/actuator/health

# Producción
curl https://api.gmarm.com/actuator/health
```

**Respuesta Esperada:**
```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "PostgreSQL",
        "validationQuery": "isValid()"
      }
    },
    "diskSpace": {
      "status": "UP"
    }
  }
}
```

#### Información de la App:
```bash
curl http://localhost:8080/actuator/info
```

#### Métricas (requiere autenticación en prod):
```bash
curl http://localhost:8080/actuator/metrics
```

### 🛠️ **Endpoints Habilitados**

| Endpoint | Descripción | URL |
|----------|-------------|-----|
| `/actuator/health` | Estado de salud del sistema | Público |
| `/actuator/info` | Información de la app | Público |
| `/actuator/metrics` | Métricas del sistema | Público (local) |

---

## 🚨 **4. Alertas y Notificaciones**

### 📢 **Tipos de Alertas**

#### 1. **Críticas** (Health Check Failure)
- ❌ Backend no responde
- ❌ Frontend no disponible
- 🔴 Se muestra en GitHub Actions inmediatamente

#### 2. **Performance** (Lentitud)
- ⚠️ Backend tarda > 3 segundos en responder
- 🟡 Se muestra en GitHub Actions

#### 3. **Info** (Todo OK)
- ✅ No genera ningún registro visible
- 🟢 Workflow pasa silenciosamente

### 📋 **Qué Hacer Cuando Recibes una Alerta**

#### Si Backend No Responde:
```powershell
# 1. SSH al servidor de producción
ssh usuario@servidor-produccion

# 2. Verificar contenedores
docker ps

# 3. Ver logs recientes
docker-compose -f docker-compose.prod.yml logs --tail=50 backend

# 4. Verificar salud de la BD
docker exec gmarm-postgres psql -U postgres -d gmarm_prod -c "SELECT 1;"

# 5. Reiniciar si es necesario
docker-compose -f docker-compose.prod.yml restart backend
```

#### Si Frontend No Disponible:
```powershell
# 1. Verificar contenedor
docker ps | findstr frontend

# 2. Ver logs
docker-compose -f docker-compose.prod.yml logs --tail=50 frontend

# 3. Reiniciar nginx
docker-compose -f docker-compose.prod.yml restart frontend
```

#### Si Backend Está Lento:
```powershell
# 1. Verificar recursos
docker stats

# 2. Verificar conexiones a BD
docker exec gmarm-postgres psql -U postgres -d gmarm_prod -c "SELECT count(*) FROM pg_stat_activity;"

# 3. Verificar queries lentas
docker-compose -f docker-compose.prod.yml logs backend | findstr "slow"

# 4. Revisar uso de CPU/Memoria
docker stats --no-stream
```

---

## 📚 **5. Comandos Útiles**

### Monitoreo Local (PowerShell):

```powershell
# Verificar estado de todos los servicios
docker ps

# Ver logs en tiempo real
docker-compose -f docker-compose.local.yml logs -f

# Ver solo logs de backend
docker-compose -f docker-compose.local.yml logs -f backend

# Verificar salud del backend
curl http://localhost:8080/actuator/health

# Ver métricas de contenedores
docker stats

# Levantar Grafana para visualización
docker-compose -f docker-compose.monitoring.yml up -d
```

### Acceso Rápido a Métricas:

```powershell
# Health Check
curl http://localhost:8080/actuator/health

# Info de la App
curl http://localhost:8080/actuator/info

# Métricas JVM
curl http://localhost:8080/actuator/metrics/jvm.memory.used

# Métricas de HTTP
curl http://localhost:8080/actuator/metrics/http.server.requests
```

---

## 🎛️ **6. Configuración Avanzada**

### Cambiar Frecuencia de Monitoreo:

Editar `.github/workflows/monitor.yml`:

```yaml
on:
  schedule:
    # 2 veces al día (actual)
    - cron: '0 6,18 * * *'
    
    # Alternativas:
    # - cron: '0 12 * * *'       # 1 vez al día (mediodía UTC)
    # - cron: '0 */6 * * *'      # Cada 6 horas
    # - cron: '*/30 * * * *'     # Cada 30 minutos
```

### Agregar Más Endpoints a Monitorear:

Editar `.github/workflows/monitor.yml` y agregar:

```yaml
- name: Check API Specific Endpoint
  run: |
    curl -f -s --max-time 30 "${{ env.BACKEND_PROD_URL }}/api/clientes"
```

---

## ✅ **Checklist de Verificación**

- [ ] **Spring Boot Actuator** habilitado (agregado en `pom.xml`)
- [ ] **Health endpoint** accesible: `http://localhost:8080/actuator/health`
- [ ] **GitHub Actions** configurado para 2 veces/día
- [ ] **Alertas** solo se generan cuando falla algo
- [ ] **Grafana** disponible (opcional): `http://localhost:3000`
- [ ] **Logs** siendo recolectados por Promtail → Loki

---

## 🔗 **Enlaces Rápidos**

| Recurso | URL |
|---------|-----|
| **GitHub Actions** | https://github.com/Gmarm-org/gmarm/actions |
| **Grafana Local** | http://localhost:3000 |
| **Actuator Health (Local)** | http://localhost:8080/actuator/health |
| **Actuator Health (Prod)** | https://api.gmarm.com/actuator/health |

---

## 📞 **Próximos Pasos**

1. ✅ **Probar el sistema:**
   ```powershell
   # Compilar backend con nueva dependencia de Actuator
   cd backend
   mvn clean compile -DskipTests
   
   # Reiniciar servicios
   cd ..
   docker-compose -f docker-compose.local.yml down
   docker-compose -f docker-compose.local.yml up -d --build
   
   # Verificar health
   curl http://localhost:8080/actuator/health
   ```

2. ✅ **Commit y Push:**
   ```powershell
   git add backend/pom.xml .github/workflows/monitor.yml GUIA_ACCESO_METRICAS.md
   git commit -m "feat: agregar Spring Boot Actuator y optimizar alertas de monitoreo"
   ```

3. ✅ **Verificar GitHub Actions:**
   - Ir a https://github.com/Gmarm-org/gmarm/actions
   - Ejecutar manualmente "🔍 GMARM Monitoring & Alerts"
   - Verificar que solo genera output si hay fallo

4. ✅ **Opcional - Levantar Grafana:**
   ```powershell
   docker-compose -f docker-compose.monitoring.yml up -d
   ```

---

**¡Sistema de monitoreo optimizado para generar alertas solo cuando hay problemas!** 🚀


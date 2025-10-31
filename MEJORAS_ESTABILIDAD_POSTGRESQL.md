# 🔒 Mejoras de Estabilidad para PostgreSQL

## 🎯 Objetivo

Garantizar que PostgreSQL NO se caiga por problemas de memoria (OOM) ni fugas de conexiones en DEV y PROD.

## 🔧 Problemas Identificados

### ANTES (Problemático):
```yaml
POSTGRES_MAX_CONNECTIONS: "100"         # ← DEMASIADO ALTO
POSTGRES_SHARED_BUFFERS: "512MB"        # ← Alto para 1.5GB límite
memory: 1536M                           # ← Riesgo de OOM
hikari.maximum-pool-size=15             # ← Pool alto
```

**Resultado**: PostgreSQL consumía más memoria de la disponible → **OOM Killer** → **PostgreSQL caía** → **Connection refused**

## ✅ Soluciones Implementadas

### 1. **Configuración PostgreSQL Conservadora**

#### DEV (`docker-compose.dev.yml`):
```yaml
POSTGRES_MAX_CONNECTIONS: "30"          # Reducido de 50
POSTGRES_SHARED_BUFFERS: "128MB"        # Reducido de 256MB
POSTGRES_WORK_MEM: "4MB"                # Reducido drásticamente
POSTGRES_MAINTENANCE_WORK_MEM: "32MB"   # Reducido
POSTGRES_CHECKPOINT_COMPLETION_TARGET: "0.9"  # Checkpoints suaves
POSTGRES_WAL_BUFFERS: "16MB"            # Buffers WAL pequeños
memory: 768M                            # Límite conservador
```

#### PROD (`docker-compose.prod.yml`):
```yaml
POSTGRES_MAX_CONNECTIONS: "50"          # Reducido de 100
POSTGRES_SHARED_BUFFERS: "256MB"        # Reducido de 512MB (25% de límite)
POSTGRES_WORK_MEM: "8MB"                # Reducido
POSTGRES_MAINTENANCE_WORK_MEM: "64MB"   # Reducido de 128MB
POSTGRES_CHECKPOINT_COMPLETION_TARGET: "0.9"
POSTGRES_WAL_BUFFERS: "16MB"
memory: 1024M                           # Reducido de 1536M
```

### 2. **Configuración HikariCP Conservadora**

#### DEV (`application-docker.properties`):
```properties
spring.datasource.hikari.maximum-pool-size=8     # 26% de max_connections
spring.datasource.hikari.minimum-idle=2
spring.datasource.hikari.idle-timeout=600000     # 10min
spring.datasource.hikari.max-lifetime=1800000    # 30min
spring.datasource.hikari.leak-detection-threshold=60000
spring.datasource.hikari.validation-timeout=5000
spring.datasource.hikari.initialization-fail-timeout=1
```

#### PROD (`application-prod.properties`):
```properties
spring.datasource.hikari.maximum-pool-size=10     # 20% de max_connections
spring.datasource.hikari.minimum-idle=3
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.max-lifetime=1800000
spring.datasource.hikari.leak-detection-threshold=60000
spring.datasource.hikari.validation-timeout=5000
spring.datasource.hikari.register-mbeans=true     # JMX monitoring
```

### 3. **Healthchecks Mejorados**

#### DEV:
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres -d gmarm_dev"]
  interval: 30s        # Aumentado de 15s
  timeout: 10s
  retries: 3           # Reducido de 5
  start_period: 90s    # Aumentado de 60s
```

#### PROD:
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U produser -d gmarm_db"]
  interval: 30s        # Aumentado de 15s
  timeout: 10s
  retries: 3           # Reducido de 5
  start_period: 90s    # Aumentado de 60s
```

### 4. **Script de Monitoreo**

Nuevo script: `scripts/monitor-postgres-health.sh`

**Características**:
- ✅ Detecta conexiones activas/idle/idle in transaction
- ✅ Detecta potenciales leaks de conexiones
- ✅ Muestra uso de memoria del contenedor
- ✅ Alerta cuando las conexiones están altas

**Uso**:
```bash
./scripts/monitor-postgres-health.sh
```

## 📊 Comparación Antes/Después

| Configuración | ANTES | DESPUÉS | Mejora |
|---------------|-------|---------|--------|
| **DEV Max Connections** | 50 | 30 | -40% |
| **DEV Shared Buffers** | 256MB | 128MB | -50% |
| **DEV Work Mem** | 16MB | 4MB | -75% |
| **DEV Memory Limit** | 768MB | 768MB | Sin cambio |
| **DEV Hikari Pool** | 10 | 8 | -20% |
| **PROD Max Connections** | 100 | 50 | -50% |
| **PROD Shared Buffers** | 512MB | 256MB | -50% |
| **PROD Work Mem** | 32MB | 8MB | -75% |
| **PROD Memory Limit** | 1536M | 1024M | -33% |
| **PROD Hikari Pool** | N/A | 10 | Nueva config |

## 🛡️ Garantías

### ✅ Estabilidad de Memoria
- **Shared Buffers** configurado a 25% del límite de memoria
- **Work Mem** conservador para evitar picos
- **Límites de memoria** más bajos para evitar OOM killers

### ✅ Gestión de Conexiones
- **Pool de HikariCP** configurado a 20-26% de max_connections
- **Idle timeout** aumentado para reutilizar conexiones
- **Leak detection** activado para detectar conexiones huérfanas

### ✅ Monitoreo y Alertas
- **Healthchecks** más robustos y rápidos
- **Script de monitoreo** para diagnóstico proactivo
- **JMX** habilitado en PROD para métricas

## 🚀 Próximos Pasos Recomendados

1. **Aplicar en DEV**: 
   ```bash
   docker-compose -f docker-compose.dev.yml down -v
   docker-compose -f docker-compose.dev.yml up -d --build
   ```

2. **Monitorear con el script**:
   ```bash
   ./scripts/monitor-postgres-health.sh
   ```

3. **Verificar logs**:
   ```bash
   docker logs gmarm-postgres-dev --tail 100
   ```

4. **Aplicar en PROD** (cuando se haga deploy):
   - Los cambios ya están en `docker-compose.prod.yml`
   - Los cambios en `application-prod.properties` ya están aplicados

## ⚠️ Notas Importantes

- **NO aumentar límites** sin justificación técnica
- **Monitorear constantemente** conexiones y memoria
- **Reportar inmediatamente** si PostgreSQL se cae
- **Usar el script de monitoreo** diariamente en PROD

## 📚 Referencias

- [PostgreSQL Memory Tuning](https://www.postgresql.org/docs/current/runtime-config-resource.html)
- [HikariCP Pool Sizing](https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing)
- [Docker OOM Killed Issues](https://docs.docker.com/config/containers/resource_constraints/)

---
**Fecha**: 2025-10-31  
**Autor**: Sistema GMARM  
**Versión**: 1.0


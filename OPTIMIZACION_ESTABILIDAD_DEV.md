# 🛡️ OPTIMIZACIÓN DE ESTABILIDAD - SERVIDOR DEV

## 🔍 Problema Detectado

La base de datos PostgreSQL en DEV se **cae constantemente** debido a:

1. **Sin límites de recursos**: PostgreSQL/Backend consumían toda la RAM disponible
2. **OOM Killer**: El sistema Linux mata los procesos que consumen demasiada memoria
3. **Pool de conexiones excesivo**: Demasiadas conexiones abiertas simultáneamente
4. **Threads de Tomcat altos**: 200 threads consumían mucha RAM

---

## ✅ Optimizaciones Implementadas

### **1. PostgreSQL (`docker-compose.dev.yml`)**

#### **Límites de Recursos**
```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'      # Máximo 1 CPU
      memory: 768M     # Máximo 768MB RAM
    reservations:
      cpus: '0.5'      # Mínimo 0.5 CPU
      memory: 256M     # Mínimo 256MB RAM
```

#### **Configuración PostgreSQL Optimizada**
```yaml
environment:
  POSTGRES_SHARED_BUFFERS: "256MB"        # Memoria compartida
  POSTGRES_EFFECTIVE_CACHE_SIZE: "512MB"  # Cache total disponible
  POSTGRES_WORK_MEM: "16MB"               # Memoria por operación sorting
  POSTGRES_MAINTENANCE_WORK_MEM: "64MB"   # Memoria para VACUUM/INDEX
  POSTGRES_MAX_CONNECTIONS: "50"          # Máximo conexiones (antes: 100)
```

#### **Healthcheck Más Tolerante**
```yaml
healthcheck:
  interval: 15s        # Antes: 10s
  timeout: 10s         # Antes: 5s
  retries: 5
  start_period: 60s    # Antes: 30s (más tiempo para arrancar)
```

---

### **2. Backend Spring Boot (`application-docker.properties`)**

#### **Pool de Conexiones HikariCP**
```properties
# Optimizado para servidores con recursos limitados
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=2              # Antes: 5
spring.datasource.hikari.idle-timeout=300000         # Antes: 600000
spring.datasource.hikari.max-lifetime=1200000        # Antes: 1800000
spring.datasource.hikari.leak-detection-threshold=60000  # NUEVO: detectar fugas
spring.datasource.hikari.connection-test-query=SELECT 1  # NUEVO: test de conexión
```

#### **Tomcat Optimizado**
```properties
server.tomcat.max-threads=50              # Antes: 200
server.tomcat.min-spare-threads=5         # Antes: 10
server.tomcat.max-connections=50          # NUEVO
server.tomcat.accept-count=10             # NUEVO
```

#### **Límites de Recursos Docker**
```yaml
environment:
  JAVA_OPTS: "-Xms256m -Xmx512m -XX:+UseG1GC -XX:MaxGCPauseMillis=200"

deploy:
  resources:
    limits:
      cpus: '1.5'
      memory: 768M
    reservations:
      cpus: '0.5'
      memory: 384M
```

---

### **3. Frontend (`docker-compose.dev.yml`)**

```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
    reservations:
      cpus: '0.25'
      memory: 256M
```

---

## 📊 Resumen de Recursos

| Servicio    | CPU Min | CPU Max | RAM Min | RAM Max | Conexiones Max |
|-------------|---------|---------|---------|---------|----------------|
| PostgreSQL  | 0.5     | 1.0     | 256MB   | 768MB   | 50             |
| Backend     | 0.5     | 1.5     | 384MB   | 768MB   | 10 (pool)      |
| Frontend    | 0.25    | 0.5     | 256MB   | 512MB   | N/A            |
| **TOTAL**   | **1.25**| **3.0** | **896MB**| **2GB** |                |

**Recomendación**: El servidor debe tener **mínimo 2GB RAM** y **2 CPUs** para correr cómodamente.

---

## 🚀 Cómo Aplicar en el Servidor DEV

### **Paso 1: Pull de los cambios**
```bash
cd /path/to/gmarm
git pull origin dev
```

### **Paso 2: Detener servicios actuales**
```bash
docker-compose -f docker-compose.dev.yml down
```

### **Paso 3: Rebuild con nueva configuración**
```bash
docker-compose -f docker-compose.dev.yml build --no-cache
```

### **Paso 4: Levantar servicios con límites**
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### **Paso 5: Monitorear recursos**
```bash
# Ver uso de recursos en tiempo real
docker stats

# Ver logs de PostgreSQL
docker logs -f gmarm-postgres-dev

# Ver logs de Backend
docker logs -f gmarm-backend-dev
```

---

## 🔍 Monitoreo de Estabilidad

### **Comando rápido para verificar salud**
```bash
# Ver estado de todos los contenedores
docker ps

# Ver uso de recursos
docker stats --no-stream

# Ver si PostgreSQL está respondiendo
docker exec gmarm-postgres-dev pg_isready -U postgres -d gmarm_dev
```

### **Script de monitoreo automático**
```bash
# Crear archivo monitor-stability.sh
cat > monitor-stability.sh << 'EOF'
#!/bin/bash
echo "🔍 Monitoreando estabilidad de GMARM DEV..."
while true; do
    clear
    echo "=== $(date) ==="
    echo ""
    echo "📊 Estado de contenedores:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.State}}"
    echo ""
    echo "💾 Uso de recursos:"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
    echo ""
    echo "🔌 PostgreSQL Health:"
    docker exec gmarm-postgres-dev pg_isready -U postgres -d gmarm_dev
    echo ""
    echo "⏳ Actualizando en 10 segundos... (Ctrl+C para salir)"
    sleep 10
done
EOF

chmod +x monitor-stability.sh
./monitor-stability.sh
```

---

## ⚠️ Qué hacer si PostgreSQL sigue cayéndose

### **1. Revisar logs del sistema**
```bash
# Ver si el OOM killer está matando procesos
sudo dmesg | grep -i "killed process"
sudo journalctl -u docker --since "1 hour ago" | grep -i "oom"
```

### **2. Reducir aún más los límites**
Si el servidor tiene < 2GB RAM, ajustar:

```yaml
# En docker-compose.dev.yml
postgres_dev:
  deploy:
    resources:
      limits:
        memory: 512M  # Reducir de 768M a 512M

backend_dev:
  deploy:
    resources:
      limits:
        memory: 512M  # Reducir de 768M a 512M
```

### **3. Aumentar swap del servidor**
```bash
# Verificar swap actual
free -h

# Si no hay swap o es poco, crear 2GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Hacer permanente
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### **4. Actualizar memoria del servidor**
Si el problema persiste, considerar aumentar la RAM del servidor a **4GB** o más.

---

## 📈 Mejoras Esperadas

✅ **Estabilidad**: PostgreSQL no debería caerse más por falta de memoria  
✅ **Performance**: Menos overhead de threads/conexiones innecesarias  
✅ **Monitoreo**: Detección de fugas de conexiones (leak-detection)  
✅ **Recuperación**: Healthchecks más tolerantes para evitar falsas alarmas  
✅ **Predictibilidad**: Límites claros de recursos por contenedor  

---

## 🎯 Siguientes Pasos

1. ✅ Aplicar cambios en servidor DEV
2. ⏳ Monitorear durante 24-48 horas
3. ⏳ Ajustar límites si es necesario
4. ⏳ Considerar monitoreo automático (Prometheus + Grafana)
5. ⏳ Evaluar upgrade de servidor si los recursos son insuficientes

---

**Fecha**: 2025-10-30  
**Autor**: Sistema GMARM  
**Versión**: 1.0


# 🚨 SOLUCIÓN URGENTE: OOM Killer en Servidor DEV

## 📋 Diagnóstico del Problema

**Fecha**: 2025-11-10  
**Severidad**: 🔴 CRÍTICA  
**Estado**: Requiere acción INMEDIATA

---

## 🔍 Problemas Detectados

### 1. 🦠 MALWARE/CRYPTOMINERS ACTIVOS

El servidor está infectado con procesos maliciosos:

```bash
# Procesos sospechosos detectados por OOM Killer:
- mysql (UID:70)          # No deberían tener MySQL
- kdevtmpfsi (UID:70)     # Nombre típico de cryptominer
```

**Consumo de memoria:**
- Cada proceso `mysql`: ~860MB
- Cada proceso `kdevtmpfsi`: ~860-900MB
- **20+ procesos asesinados en 1 hora**

### 2. 💾 Memoria Agotada

```
RAM Total:      3.8Gi
RAM Libre:      164Mi (4%)
SWAP Usado:     510Mi (de 2.0Gi)
```

**Contenedores Docker:**
- PostgreSQL: 1.443GiB / 1.5GiB (96.21%) ⚠️
- Backend: 252.6MiB / 256MiB (98.68%) ⚠️
- Frontend: 115.6MiB / 384MiB (30.11%) ✅

### 3. 🗄️ Base de Datos Perdida

```
❌ CRÍTICO: Base de datos 'gmarm_dev' NO EXISTE
```

PostgreSQL fue asesinado por OOM Killer y perdió la BD.

---

## 🚀 SOLUCIONES INMEDIATAS

### PASO 1: ELIMINAR PROCESOS MALICIOSOS (URGENTE)

**Ejecutar en el servidor:**

```bash
# 1. Identificar procesos sospechosos
ps aux | grep -E "mysql|kdevtmpfsi" | grep -v grep

# 2. Matar todos los procesos maliciosos
sudo pkill -9 mysql
sudo pkill -9 kdevtmpfsi

# 3. Buscar archivos binarios maliciosos
sudo find /tmp /var/tmp /home -name "*mysql*" -o -name "*kdevtmpfsi*" 2>/dev/null

# 4. Eliminar binarios encontrados
# sudo rm -rf /ruta/del/archivo/malicioso

# 5. Verificar crontabs (pueden estar reiniciando el malware)
sudo crontab -l
sudo crontab -e  # Eliminar líneas sospechosas

# 6. Verificar systemd services
sudo systemctl list-units | grep -E "mysql|kdevtmpfsi"

# 7. Revisar .bashrc y .profile de todos los usuarios
cat ~/.bashrc
cat ~/.profile
```

**⚠️ NOTA IMPORTANTE:**
- Los procesos con UID:70 sugieren que corren bajo un usuario específico
- Pueden estar inyectados en un contenedor Docker comprometido
- Necesitan auditoría de seguridad completa

---

### PASO 2: AUMENTAR LÍMITES DE MEMORIA DOCKER

**Archivo: `docker-compose.dev.yml`**

```yaml
services:
  postgres_dev:
    image: postgres:15-alpine
    container_name: gmarm-postgres-dev
    deploy:
      resources:
        limits:
          memory: 2G          # ⬆️ Aumentar de 1.5G a 2G
        reservations:
          memory: 512M
    environment:
      # ... resto de configuración

  backend_dev:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: gmarm-backend-dev
    deploy:
      resources:
        limits:
          memory: 512M        # ⬆️ Aumentar de 256M a 512M
        reservations:
          memory: 256M
    # ... resto de configuración

  frontend_dev:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: gmarm-frontend-dev
    deploy:
      resources:
        limits:
          memory: 512M        # ⬆️ Aumentar de 384M a 512M
        reservations:
          memory: 128M
    # ... resto de configuración
```

**⚠️ IMPORTANTE:**
- **Total con nuevos límites**: 2G + 512M + 512M = **3GB**
- **RAM disponible**: 3.8Gi
- Dejar ~800Mi para el sistema operativo y otros procesos
- **SOLO funciona si eliminan el malware primero**

---

### PASO 3: RECREAR BASE DE DATOS

```bash
# 1. Detener servicios
cd ~/deploy/dev
docker-compose -f docker-compose.dev.yml down

# 2. Eliminar volúmenes (perder datos actuales)
docker-compose -f docker-compose.dev.yml down -v

# 3. Aplicar cambios de memoria en docker-compose.dev.yml

# 4. Levantar servicios
docker-compose -f docker-compose.dev.yml up -d

# 5. Verificar que BD existe
docker exec gmarm-postgres-dev psql -U postgres -l

# 6. Si NO existe, crearla manualmente
docker exec gmarm-postgres-dev psql -U postgres -c \
  "CREATE DATABASE gmarm_dev WITH ENCODING='UTF8' LC_COLLATE='C' LC_CTYPE='C';"

# 7. Ejecutar script maestro
cat ~/deploy/dev/datos/00_gmarm_completo.sql | \
  docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev

# 8. Verificar datos
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c \
  "SELECT COUNT(*) FROM usuario;"
```

---

### PASO 4: CONFIGURAR MONITOREO DE RECURSOS

**Crear script de monitoreo: `~/deploy/dev/scripts/monitor-recursos.sh`**

```bash
#!/bin/bash

# Monitor de recursos cada 5 minutos
while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$TIMESTAMP] Uso de Recursos:"
    
    # Memoria del sistema
    free -h
    
    # Docker stats
    docker stats --no-stream --format \
      "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
    
    # Procesos sospechosos
    SUSPICIOUS=$(ps aux | grep -E "mysql|kdevtmpfsi" | grep -v grep)
    if [ -n "$SUSPICIOUS" ]; then
        echo "⚠️  ALERTA: Procesos sospechosos detectados!"
        echo "$SUSPICIOUS"
        
        # Notificar (configurar webhook o email)
        # curl -X POST "webhook_url" -d "Malware detectado en servidor DEV"
    fi
    
    echo "---"
    sleep 300  # 5 minutos
done
```

**Ejecutar en background:**

```bash
chmod +x ~/deploy/dev/scripts/monitor-recursos.sh
nohup bash ~/deploy/dev/scripts/monitor-recursos.sh > /tmp/monitor-recursos.log 2>&1 &
```

---

### PASO 5: VERIFICAR INTEGRIDAD DEL SISTEMA

```bash
# 1. Verificar usuarios del sistema
cat /etc/passwd | grep -E "mysql|kdevtmpfsi"

# 2. Verificar procesos en ejecución
ps aux | head -50

# 3. Verificar conexiones de red sospechosas
sudo netstat -tulpn | grep ESTABLISHED

# 4. Verificar uso de CPU por proceso
top -b -n 1 | head -20

# 5. Auditar logs del sistema
sudo journalctl -xe | grep -E "mysql|kdevtmpfsi"

# 6. Verificar integridad de contenedores Docker
docker ps -a
docker inspect gmarm-backend-dev | grep -i "env"
docker inspect gmarm-postgres-dev | grep -i "env"
docker inspect gmarm-frontend-dev | grep -i "env"
```

---

## 🛡️ PREVENCIÓN FUTURA

### 1. Hardening del Servidor

```bash
# Instalar fail2ban
sudo apt update
sudo apt install fail2ban -y

# Configurar firewall (UFW)
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 8080/tcp  # Backend (solo desde localhost)
sudo ufw allow 5173/tcp  # Frontend (solo desde localhost)
sudo ufw allow 5432/tcp  # PostgreSQL (solo desde localhost)
```

### 2. Monitoreo Continuo

**Instalar htop y glances:**

```bash
sudo apt install htop glances -y
```

**Crear alerta de memoria:**

```bash
# Agregar a cron (cada 5 minutos)
*/5 * * * * /home/gmarmin/deploy/dev/scripts/monitor-recursos.sh
```

### 3. Limitar Procesos por Usuario

```bash
# Editar /etc/security/limits.conf
sudo nano /etc/security/limits.conf

# Agregar:
* soft nproc 200
* hard nproc 300
```

### 4. Actualizar Sistema

```bash
sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y
```

---

## 📊 Configuración Recomendada de Memoria

Para un servidor con **3.8Gi RAM**:

| Componente | Memoria | Justificación |
|------------|---------|---------------|
| PostgreSQL | 2.0Gi | Base de datos necesita más memoria |
| Backend | 512Mi | JVM + Spring Boot |
| Frontend | 384Mi | Node.js + Vite dev server |
| Sistema Operativo | 800Mi | Kernel, daemons, SSH, etc. |
| **TOTAL** | **3.7Gi** | Dentro del límite |

**⚠️ CRÍTICO:** Si el malware no se elimina, **NINGUNA configuración funcionará**.

---

## 🚨 SECUENCIA DE EJECUCIÓN URGENTE

**Ejecutar EN ORDEN:**

```bash
# 1. MATAR PROCESOS MALICIOSOS
sudo pkill -9 mysql
sudo pkill -9 kdevtmpfsi

# 2. VERIFICAR QUE NO HAYA MÁS
ps aux | grep -E "mysql|kdevtmpfsi"

# 3. BUSCAR BINARIOS
sudo find /tmp /var/tmp /home -name "*mysql*" -o -name "*kdevtmpfsi*"

# 4. ACTUALIZAR docker-compose.dev.yml (memoria aumentada)

# 5. REINICIAR SERVICIOS
cd ~/deploy/dev
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d

# 6. RECREAR BD
cat datos/00_gmarm_completo.sql | \
  docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev

# 7. VERIFICAR
bash scripts/diagnostico-dev.sh
```

---

## 📞 CONTACTO Y SOPORTE

Si el problema persiste después de estos pasos:

1. **Auditoría de seguridad completa** del servidor
2. **Reinstalación limpia** del sistema operativo
3. **Migración a servidor nuevo** con más RAM (mínimo 8Gi)

---

## 📝 CHECKLIST

- [ ] Procesos maliciosos eliminados
- [ ] Binarios maliciosos borrados
- [ ] Crontabs verificados
- [ ] docker-compose.dev.yml actualizado con más memoria
- [ ] Servicios reiniciados
- [ ] Base de datos recreada
- [ ] Script de monitoreo activo
- [ ] Firewall configurado
- [ ] Sistema actualizado

---

**Última actualización**: 2025-11-10  
**Prioridad**: 🔴 CRÍTICA  
**Requiere**: Acceso root al servidor


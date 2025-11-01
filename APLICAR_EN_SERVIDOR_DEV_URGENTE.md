# 🚨 APLICAR EN SERVIDOR DEV - URGENTE

**Fecha**: 2025-11-01  
**Prioridad**: 🔥 CRÍTICA  
**Tiempo estimado**: 10-15 minutos  
**Impacto**: Resuelve caídas de PostgreSQL cada 12 horas

---

## 🎯 QUÉ SE ARREGLÓ

✅ **PostgreSQL ultra-estable** (usa solo 7% de RAM)  
✅ **OOM Protection** (kernel NO lo matará)  
✅ **Restart automático** (always)  
✅ **Network config corregida** (listen_addresses = '*')  
✅ **Admin dashboard sin errores** (403, JSON, NaN)  
✅ **Paginación implementada** (20 items/página)

---

## 🔥 COMANDOS PARA EJECUTAR EN EL SERVIDOR

### Opción 1: RESET COMPLETO (RECOMENDADO - Borra datos de prueba)

```bash
# 1. SSH al servidor
ssh usuario@72.167.52.14

# 2. Ir al directorio del proyecto
cd /ruta/del/proyecto/gmarm

# 3. Pull de cambios
git pull origin dev

# 4. Detener TODO y eliminar volúmenes
docker-compose -f docker-compose.dev.yml down -v

# 5. Limpiar sistema
docker system prune -f

# 6. Levantar TODO desde cero
docker-compose -f docker-compose.dev.yml up -d --build

# 7. Ver logs en tiempo real
docker-compose -f docker-compose.dev.yml logs -f
```

**⏱️ Tiempo**: ~15 minutos  
**⚠️ Advertencia**: Elimina todos los datos de prueba

---

### Opción 2: ACTUALIZACIÓN SIN PERDER DATOS

```bash
# 1. SSH al servidor
ssh usuario@72.167.52.14

# 2. Ir al directorio del proyecto
cd /ruta/del/proyecto/gmarm

# 3. Pull de cambios
git pull origin dev

# 4. Rebuild PostgreSQL (SIN eliminar volumen)
docker-compose -f docker-compose.dev.yml up -d --no-deps --force-recreate postgres_dev

# 5. Esperar 30 segundos
sleep 30

# 6. Rebuild Backend
docker-compose -f docker-compose.dev.yml up -d --no-deps --build backend_dev

# 7. Verificar
docker ps
```

**⏱️ Tiempo**: ~10 minutos  
**✅ Ventaja**: Mantiene los datos existentes

---

## 🔍 VERIFICACIÓN POST-DEPLOY

### 1. Estado de Contenedores
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

**Debe mostrar:**
```
gmarm-postgres-dev    Up X seconds (healthy)
gmarm-backend-dev     Up X seconds (healthy)
gmarm-frontend-dev    Up X seconds
```

### 2. Memoria de PostgreSQL
```bash
docker stats gmarm-postgres-dev --no-stream
```

**Debe mostrar:**
```
MEM USAGE / LIMIT: ~35-50 MiB / 512 MiB (~7-10%)
```

### 3. PostgreSQL Escuchando en Red
```bash
docker exec gmarm-postgres-dev netstat -tuln | grep 5432
```

**Debe mostrar:**
```
tcp  0.0.0.0:5432  LISTEN
```

### 4. Backend Conectado
```bash
docker logs gmarm-backend-dev 2>&1 | grep "Started ArmasimportacionApplication"
```

**Debe mostrar:**
```
Started ArmasimportacionApplication in XXX seconds
```

### 5. Datos en BD
```bash
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "SELECT COUNT(*) FROM usuario; SELECT COUNT(*) FROM arma;"
```

**Debe mostrar:**
```
 count 
-------
     7

 count 
-------
    47
```

### 6. Test desde Navegador
```
URL: http://72.167.52.14:5173
Login: admin@armasimportacion.com / admin123
```

**Debe funcionar:**
- ✅ Login exitoso (sin error 400/403)
- ✅ Dashboard de admin carga
- ✅ Usuarios muestra lista sin error JSON
- ✅ Estadísticas muestran números (no NaN)
- ✅ Roles y Licencias sin 403

---

## 📊 MONITOREO CONTINUO

### Script de Monitoreo (Ejecutar cada hora)

Crear archivo: `~/monitor-gmarm.sh`
```bash
#!/bin/bash

echo "========== GMARM DEV MONITORING =========="
echo "Timestamp: $(date)"
echo ""

# 1. Estado contenedores
echo "📊 Estado Contenedores:"
docker ps --format "{{.Names}}: {{.Status}}"

# 2. Memoria PostgreSQL
echo ""
echo "💾 Memoria PostgreSQL:"
docker stats gmarm-postgres-dev --no-stream --format "{{.MemUsage}} ({{.MemPerc}})"

# 3. Healthchecks
echo ""
echo "❤️ Health PostgreSQL:"
docker inspect gmarm-postgres-dev --format='{{.State.Health.Status}}'

echo ""
echo "❤️ Health Backend:"
docker inspect gmarm-backend-dev --format='{{.State.Health.Status}}'

# 4. Conexiones activas
echo ""
echo "🔌 Conexiones PostgreSQL:"
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -tAc "SELECT count(*) FROM pg_stat_activity WHERE datname='gmarm_dev';"

# 5. Queries lentas
echo ""
echo "🐌 Queries lentas (>1s):"
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -tAc "SELECT count(*) FROM pg_stat_activity WHERE state = 'active' AND now() - query_start > interval '1 second';"

echo ""
echo "=========================================="
```

**Instalar:**
```bash
chmod +x ~/monitor-gmarm.sh

# Ejecutar cada hora
crontab -e
# Agregar:
0 * * * * ~/monitor-gmarm.sh >> ~/gmarm-monitor.log 2>&1
```

### Ver Logs de Monitoreo
```bash
tail -f ~/gmarm-monitor.log
```

---

## 🚨 SI ALGO FALLA

### PostgreSQL se cayó
```bash
# 1. Ver por qué
docker logs gmarm-postgres-dev --tail 100

# 2. Ver si el kernel lo mató
dmesg | grep -i "killed process"

# 3. Reiniciar
docker-compose -f docker-compose.dev.yml restart postgres_dev

# 4. Verificar
docker ps
```

### Backend no conecta
```bash
# 1. Verificar network
docker exec gmarm-postgres-dev netstat -tuln | grep 5432
# Debe mostrar: 0.0.0.0:5432

# 2. Reiniciar backend
docker-compose -f docker-compose.dev.yml restart backend_dev

# 3. Ver logs
docker logs gmarm-backend-dev -f
```

### Uso de memoria alto
```bash
# Si PostgreSQL usa >400MB, reducir config:
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "ALTER SYSTEM SET shared_buffers = '64MB';"
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "ALTER SYSTEM SET work_mem = '1MB';"
docker-compose -f docker-compose.dev.yml restart postgres_dev
```

---

## ✅ CHECKLIST FINAL

Antes de considerar completo:

- [ ] Git pull exitoso en servidor
- [ ] Docker compose up -d completado
- [ ] PostgreSQL (healthy) en `docker ps`
- [ ] Backend (healthy) en `docker ps`
- [ ] PostgreSQL usa < 100MB RAM
- [ ] Login funciona en navegador
- [ ] Admin dashboard carga sin errores
- [ ] /api/usuarios retorna datos
- [ ] No hay errores 403
- [ ] No hay NaN en estadísticas
- [ ] Script de monitoreo instalado
- [ ] Verificar después de 1 hora
- [ ] Verificar después de 6 horas
- [ ] Verificar después de 24 horas

---

**Si todos los checks pasan, el sistema está LISTO PARA 24/7** ✅


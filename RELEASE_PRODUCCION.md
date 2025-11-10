# 🚀 RELEASE A PRODUCCIÓN - GMARM

**Fecha programada**: Mañana en la noche  
**Versión**: 1.0.0  
**Branch**: main  
**Estado**: ✅ LISTO PARA DESPLIEGUE

---

## 📊 CONFIGURACIÓN DE MEMORIA

### Ambiente ACTUAL (DEV):
- RAM Total: 3.8GB
- PostgreSQL: 2GB (52%)
- Backend: 512MB (13%)
- Frontend: 512MB (13%)
- **Total usado**: ~3GB (79%)
- **RAM libre**: ~800MB

### Ambiente PRODUCCIÓN (DEV apagado):
- RAM Total: 3.8GB disponible
- PostgreSQL: **2.5GB** (66%) ⬆️
- Backend: **768MB** (20%) ⬆️
- Frontend: **384MB** (10%) ➡️
- **Total usado**: **3.65GB** (96%)
- **RAM libre**: ~150MB (para SO)

**🎯 Optimización**: +650MB para PostgreSQL y Backend

---

## 📋 CHECKLIST PRE-PRODUCCIÓN

### ✅ Archivos Preparados

- [x] `docker-compose.prod.yml` - Configuración optimizada para 3.8GB
- [x] `scripts/deploy-prod.sh` - Script automatizado de despliegue
- [x] `scripts/backup-prod.sh` - Backup automático de BD
- [x] `scripts/rollback-prod.sh` - Rollback de emergencia
- [x] `env.prod.example` - Plantilla de variables de entorno
- [x] `AGENTS.md` - Guías con seguridad desde el diseño
- [x] `datos/00_gmarm_completo.sql` - Script maestro actualizado

### 📝 Configuración

- [ ] **Crear archivo `.env`** desde `env.prod.example`
  ```bash
  cp env.prod.example .env
  nano .env  # Completar variables
  ```

- [ ] **Variables OBLIGATORIAS**:
  - [ ] `POSTGRES_PASSWORD` (generar seguro: `openssl rand -base64 32`)
  - [ ] `JWT_SECRET` (generar: `openssl rand -base64 64`)
  - [ ] `API_URL` (URL del backend en producción)
  - [ ] `CORS_ORIGINS` (dominios permitidos)

- [ ] **Verificar que `.env` NO está en git**:
  ```bash
  git check-ignore .env  # Debe retornar: .env
  ```

### 🔒 Seguridad

- [ ] Passwords fuertes generados
- [ ] JWT_SECRET único y seguro
- [ ] CORS configurado solo para dominios de producción
- [ ] Firewall configurado (puertos 80, 443, 22 solamente)
- [ ] SSH con claves (no passwords)
- [ ] Usuarios Docker no-root configurados

### 🗄️ Base de Datos

- [ ] Script maestro `00_gmarm_completo.sql` actualizado
- [ ] Backup automático configurado (30 días retención)
- [ ] Plan de rollback documentado

---

## 🚀 PASOS DE DESPLIEGUE

### PASO 1: Preparación en LOCAL

```bash
# En Windows (LOCAL)
cd C:\Users\Flia Tenemaza Cadena\Documents\gmarmworspace\gmarm

# Verificar que estás en branch dev
git branch

# Merge a main (SOLO SI TODO FUNCIONA EN DEV)
git checkout main
git pull origin main
git merge dev
git push origin main
```

### PASO 2: En el SERVIDOR

```bash
# SSH al servidor
ssh usuario@servidor_ip

# Ir al directorio de producción
cd ~/deploy/prod

# Pull de la rama main
git pull origin main

# Crear .env desde plantilla
cp env.prod.example .env
nano .env  # Completar TODAS las variables

# Verificar configuración
cat docker-compose.prod.yml | grep mem_limit
```

### PASO 3: Detener DEV Definitivamente

```bash
# Detener ambiente DEV
cd ~/deploy/dev
docker-compose -f docker-compose.dev.yml down

# Opcional: Backup final de DEV (si hay datos importantes)
docker exec gmarm-postgres-dev pg_dump -U postgres -d gmarm_dev > ~/backup-dev-final.sql

# Volver a directorio de prod
cd ~/deploy/prod
```

### PASO 4: Despliegue Automatizado

```bash
# Dar permisos a scripts
chmod +x scripts/*.sh

# Ejecutar despliegue
bash scripts/deploy-prod.sh
```

**El script hará:**
1. ✅ Verificar requisitos (Docker, variables)
2. ✅ Crear backup pre-despliegue (seguridad)
3. ✅ Build de imágenes
4. ✅ Levantar servicios con nuevos límites
5. ✅ Health checks
6. ✅ Verificación de BD
7. ✅ Reporte de recursos

### PASO 5: Verificación Post-Despliegue

```bash
# Verificar servicios
docker-compose -f docker-compose.prod.yml ps

# Verificar logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Health check
curl http://localhost:8080/api/health

# Verificar memoria
docker stats --no-stream
```

---

## 📊 MONITOREO POST-DESPLIEGUE

### Primeras 2 Horas

```bash
# Monitoreo continuo de recursos
watch -n 5 'docker stats --no-stream'

# Logs en tiempo real
docker-compose -f docker-compose.prod.yml logs -f

# Verificar que NO haya OOM
dmesg | grep -i "out of memory"
```

### Métricas Esperadas

| Servicio | CPU | Memoria | Estado |
|----------|-----|---------|--------|
| PostgreSQL | < 20% | 30-50% de 2.5GB | Healthy |
| Backend | < 15% | 40-60% de 768MB | Healthy |
| Frontend | < 5% | 20-30% de 384MB | Healthy |

**🚨 ALERTAS:**
- Si PostgreSQL > 90% memoria → Ejecutar `docker-compose restart postgres_prod`
- Si Backend > 90% memoria → Ver logs, posible memory leak
- Si hay OOM Killer → ROLLBACK INMEDIATO

---

## 🔄 PLAN DE ROLLBACK

### Si algo falla en las primeras 24 horas:

```bash
# Opción 1: Rollback al último backup
bash scripts/rollback-prod.sh backups/backup-pre-deploy-YYYYMMDD-HHMMSS.sql.gz

# Opción 2: Volver a DEV temporalmente
cd ~/deploy/dev
docker-compose -f docker-compose.dev.yml up -d
```

### Si necesitas volver a versión anterior de código:

```bash
cd ~/deploy/prod
git log --oneline -10  # Ver últimos commits
git reset --hard <commit_hash>  # Volver a commit específico
bash scripts/deploy-prod.sh
```

---

## 📈 OPTIMIZACIONES APLICADAS

### PostgreSQL (2.5GB)
- ✅ `shared_buffers=640MB` (25% de RAM)
- ✅ `effective_cache_size=1.8GB` (72% de RAM)
- ✅ `work_mem=8MB` (queries complejas)
- ✅ `maintenance_work_mem=160MB` (VACUUM/ANALYZE)
- ✅ `max_connections=50` (producción)
- ✅ `autovacuum=on` con 2 workers
- ✅ `fsync=on`, `synchronous_commit=on` (seguridad PROD)

### Backend (768MB)
- ✅ JVM: `-Xms256m -Xmx640m`
- ✅ G1GC con pause time de 200ms
- ✅ Metaspace: 128MB
- ✅ String deduplication
- ✅ Compressed OOPs

### Frontend (384MB)
- ✅ Archivos estáticos compilados
- ✅ Nginx con compresión gzip
- ✅ Cache de assets
- ✅ Usuario no-root

---

## 🔐 SEGURIDAD EN PRODUCCIÓN

### Implementado ✅

1. **Docker**:
   - Límites de memoria y CPU
   - Usuarios no-root (uid 1000)
   - Healthchecks configurados
   - Logging estructurado

2. **Backend**:
   - Validación de entrada en todos los endpoints
   - CORS restrictivo (solo dominios permitidos)
   - JWT con secreto fuerte
   - Passwords con BCrypt
   - SQL Injection prevention (JPA)

3. **Base de Datos**:
   - Password seguro (no default)
   - Puerto estándar solo localhost
   - Backups automáticos
   - Logs de conexiones

4. **Sistema**:
   - Firewall configurado
   - SSH con claves
   - Fail2Ban instalado
   - Actualizaciones automáticas

---

## 📝 BACKUPS AUTOMÁTICOS

### Configuración

```bash
# Agregar a cron
crontab -e

# Backup diario a las 2 AM
0 2 * * * /ruta/deploy/prod/scripts/backup-prod.sh >> /tmp/backup-prod.log 2>&1

# Verificar que funciona
bash scripts/backup-prod.sh
```

### Retención

- **Backups diarios**: 30 días
- **Backups manuales**: Indefinido
- **Ubicación**: `~/deploy/prod/backups/`

### Restaurar Backup

```bash
# Listar backups disponibles
ls -lt backups/

# Restaurar
bash scripts/restore-backup.sh backups/gmarm-prod-YYYYMMDD-HHMMSS.sql.gz
```

---

## 🧪 PRUEBAS POST-DESPLIEGUE

### Funcionalidades Críticas

- [ ] **Login**
  - Admin
  - Vendedor
  - Bodeguero

- [ ] **Gestión de Clientes**
  - Crear cliente civil
  - Crear cliente militar
  - Crear compañía de seguridad
  - Validación de cédula/RUC

- [ ] **Gestión de Armas**
  - Reservar arma
  - Vender arma
  - Ver inventario

- [ ] **Gestión de Pagos**
  - Pago de contado
  - Pago a crédito
  - Ver cuotas

- [ ] **Reportes**
  - Reporte de ventas
  - Reporte de inventario
  - Reporte de clientes

### Performance

- [ ] Página de login < 2s
- [ ] Listado de armas < 3s
- [ ] Creación de cliente < 5s
- [ ] Generación de contrato < 10s

---

## 📞 CONTACTOS DE EMERGENCIA

### Equipo Técnico

- **Desarrollador Principal**: [Nombre]
- **DevOps**: [Nombre]
- **DBA**: [Nombre]

### Escalamiento

1. **Nivel 1**: Desarrollador principal
2. **Nivel 2**: DevOps + DBA
3. **Nivel 3**: Arquitecto de software

---

## ✅ CHECKLIST FINAL

Verificar ANTES de considerar el despliegue exitoso:

- [ ] Todos los servicios están HEALTHY
- [ ] Backend responde a health check
- [ ] Frontend es accesible
- [ ] Login funciona correctamente
- [ ] Base de datos tiene datos
- [ ] PostgreSQL < 90% memoria
- [ ] Backend < 90% memoria
- [ ] NO hay eventos OOM en `dmesg`
- [ ] Logs no muestran errores críticos
- [ ] Backups automáticos configurados
- [ ] Firewall configurado
- [ ] Monitoreo activo

---

## 📊 MÉTRICAS DE ÉXITO

### Primera Semana

- ✅ Uptime > 99%
- ✅ Tiempo de respuesta promedio < 500ms
- ✅ 0 eventos de OOM Killer
- ✅ 0 errores críticos en logs
- ✅ Usuarios activos diarios > X
- ✅ Transacciones completadas > Y

---

## 🎯 PRÓXIMOS PASOS

### Semana 1-2

- Monitoreo intensivo 24/7
- Ajustes finos de configuración
- Optimización de queries lentas
- Documentación de lecciones aprendidas

### Mes 1

- Configurar alertas automáticas (Sentry, Prometheus)
- Implementar CI/CD completo
- Añadir tests de integración
- Plan de escalamiento horizontal

---

**Fecha de documento**: 2025-11-10  
**Última actualización**: 2025-11-10  
**Versión**: 1.0.0  
**Estado**: ✅ READY FOR PRODUCTION

---

**🚀 TODO LISTO PARA MAÑANA EN LA NOCHE**

**Tiempo estimado de despliegue**: 20-30 minutos  
**Downtime esperado**: 5-10 minutos  
**Plan de rollback**: < 10 minutos

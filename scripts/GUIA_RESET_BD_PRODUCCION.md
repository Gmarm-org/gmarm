# 🔴 GUÍA: Reset BD en Producción

## ⚠️ ADVERTENCIAS CRÍTICAS

**ESTE SCRIPT ES MUY DESTRUCTIVO EN PRODUCCIÓN:**
- ❌ Elimina **TODOS los datos** de la base de datos
- ❌ Elimina **TODOS los documentos** generados y subidos
- ❌ **NO crea respaldos automáticos**
- ⚠️ **Solo usar cuando estés 100% seguro**

## 📋 Pasos ANTES de Ejecutar

### 1. Conectarse al Servidor de Producción

```bash
# Conectarse vía SSH
ssh usuario@servidor-produccion

# O si usas configuración SSH
ssh prod
```

### 2. Navegar al Directorio del Proyecto

```bash
cd /ruta/al/proyecto/gmarm
# Ejemplo:
# cd /var/www/gmarm
# o
# cd /home/usuario/gmarm
```

### 3. (OPCIONAL pero RECOMENDADO) Crear Backup Manual

```bash
# Backup de la base de datos
docker exec gmarm-postgres-prod pg_dump -U postgres gmarm_prod > backup_prod_$(date +%Y%m%d_%H%M%S).sql

# Backup de documentos (si son importantes)
tar -czf backup_documentos_$(date +%Y%m%d_%H%M%S).tar.gz documentacion/ uploads/

# Verificar que los backups se crearon
ls -lh backup_*.sql backup_*.tar.gz
```

### 4. Verificar Estado Actual

```bash
# Ver servicios corriendo
docker-compose -f docker-compose.prod.yml ps

# Ver datos en BD
docker exec gmarm-postgres-prod psql -U postgres -d gmarm_prod -c "SELECT COUNT(*) FROM cliente;"
docker exec gmarm-postgres-prod psql -U postgres -d gmarm_prod -c "SELECT COUNT(*) FROM usuario;"
```

## 🚀 Ejecutar el Script

### Opción 1: Script Bash (Recomendado en Linux)

```bash
# Dar permisos de ejecución (solo primera vez)
chmod +x scripts/reset-bd-desde-cero.sh

# Ejecutar en producción
./scripts/reset-bd-desde-cero.sh prod
```

### Opción 2: Ejecutar Manualmente (Si el script falla)

```bash
# 1. Detener servicios y eliminar volúmenes
docker-compose -f docker-compose.prod.yml down -v

# 2. Eliminar documentos (cuidado con esto)
rm -rf documentacion/documentos_cliente/*
rm -rf documentacion/contratos_generados/*
rm -rf documentacion/documentos_importacion/*
rm -rf documentacion/autorizaciones/*
rm -rf uploads/clientes/*
rm -rf uploads/images/weapons/*
rm -rf backend/uploads/*

# 3. Iniciar solo PostgreSQL
docker-compose -f docker-compose.prod.yml up -d postgres_prod

# 4. Esperar a que PostgreSQL inicie (30 segundos)
sleep 30

# 5. Eliminar y recrear BD
docker exec gmarm-postgres-prod psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS gmarm_prod;"
docker exec gmarm-postgres-prod psql -U postgres -d postgres -c "CREATE DATABASE gmarm_prod WITH ENCODING='UTF8' LC_COLLATE='C.UTF-8' LC_CTYPE='C.UTF-8';"

# 6. Cargar SQL maestro
docker exec -i gmarm-postgres-prod psql -U postgres -d gmarm_prod < datos/00_gmarm_completo.sql

# 7. Iniciar todos los servicios
docker-compose -f docker-compose.prod.yml up -d
```

## ✅ Verificación Post-Ejecución

### 1. Verificar Servicios

```bash
# Ver estado de servicios
docker-compose -f docker-compose.prod.yml ps

# Ver logs del backend
docker logs gmarm-backend-prod --tail 50

# Ver logs del frontend
docker logs gmarm-frontend-prod --tail 50
```

### 2. Verificar Base de Datos

```bash
# Verificar datos cargados
docker exec gmarm-postgres-prod psql -U postgres -d gmarm_prod -c "SELECT COUNT(*) FROM usuario;"
docker exec gmarm-postgres-prod psql -U postgres -d gmarm_prod -c "SELECT COUNT(*) FROM arma;"
docker exec gmarm-postgres-prod psql -U postgres -d gmarm_prod -c "SELECT COUNT(*) FROM cliente;"

# Verificar usuarios creados
docker exec gmarm-postgres-prod psql -U postgres -d gmarm_prod -c "SELECT id, username, email FROM usuario;"
```

### 3. Verificar Acceso Web

```bash
# Verificar que el frontend responde
curl -I https://tu-dominio.com

# Verificar que el backend responde
curl -I https://tu-dominio.com/api/health
```

### 4. Probar Login

1. Ir a: `https://tu-dominio.com`
2. Intentar login con usuario admin:
   - Email: `admin@armasimportacion.com`
   - Password: `admin123`

## 🔧 Solución de Problemas

### Error: "Permission denied"
```bash
# Dar permisos al script
chmod +x scripts/reset-bd-desde-cero.sh
```

### Error: "docker-compose: command not found"
```bash
# Usar docker compose (sin guion) si es Docker Compose v2
docker compose -f docker-compose.prod.yml down -v
```

### Error: "PostgreSQL no está listo"
```bash
# Ver logs de PostgreSQL
docker logs gmarm-postgres-prod

# Verificar salud
docker exec gmarm-postgres-prod pg_isready -U postgres

# Si no está listo, esperar más tiempo
sleep 60
```

### Error: "No se encuentra SQL maestro"
```bash
# Verificar que existe el archivo
ls -lh datos/00_gmarm_completo.sql

# Si no existe, hacer pull del repositorio
git pull origin main
```

### Servicios no inician después del reset
```bash
# Ver logs de cada servicio
docker logs gmarm-backend-prod
docker logs gmarm-frontend-prod
docker logs gmarm-postgres-prod

# Reiniciar servicios manualmente
docker-compose -f docker-compose.prod.yml restart
```

## 📊 Checklist Pre-Ejecución

- [ ] ✅ Backup de base de datos creado
- [ ] ✅ Backup de documentos creado (si son importantes)
- [ ] ✅ Verificado que no hay usuarios activos en el sistema
- [ ] ✅ Notificado al equipo sobre el mantenimiento
- [ ] ✅ Acceso SSH al servidor verificado
- [ ] ✅ SQL maestro actualizado en `datos/00_gmarm_completo.sql`
- [ ] ✅ Docker y docker-compose funcionando
- [ ] ✅ Conexión a internet estable

## 📞 Contacto de Emergencia

Si algo sale mal y necesitas restaurar desde backup:

```bash
# Restaurar base de datos desde backup
cat backup_prod_YYYYMMDD_HHMMSS.sql | docker exec -i gmarm-postgres-prod psql -U postgres -d postgres
docker exec gmarm-postgres-prod psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS gmarm_prod;"
docker exec gmarm-postgres-prod psql -U postgres -d postgres -c "CREATE DATABASE gmarm_prod;"
cat backup_prod_YYYYMMDD_HHMMSS.sql | docker exec -i gmarm-postgres-prod psql -U postgres -d gmarm_prod

# Restaurar documentos (si hiciste backup)
tar -xzf backup_documentos_YYYYMMDD_HHMMSS.tar.gz
```

## 🎯 Comando Completo (Copy-Paste)

```bash
# 1. Conectarse y navegar
cd /ruta/al/proyecto/gmarm

# 2. Backup (RECOMENDADO)
docker exec gmarm-postgres-prod pg_dump -U postgres gmarm_prod > backup_prod_$(date +%Y%m%d_%H%M%S).sql

# 3. Ejecutar script
chmod +x scripts/reset-bd-desde-cero.sh
./scripts/reset-bd-desde-cero.sh prod

# 4. Verificar
docker-compose -f docker-compose.prod.yml ps
docker exec gmarm-postgres-prod psql -U postgres -d gmarm_prod -c "SELECT COUNT(*) FROM usuario;"
```

---

**Última actualización:** $(date)
**Script version:** 1.0


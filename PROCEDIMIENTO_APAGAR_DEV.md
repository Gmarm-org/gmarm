# 🔴 PROCEDIMIENTO: Apagar Ambiente DEV

**Fecha**: 2025-11-10  
**Objetivo**: Dar de baja DEV para liberar recursos para PRODUCCIÓN  
**Tiempo estimado**: 10 minutos

---

## ⚠️ IMPORTANTE ANTES DE EMPEZAR

✅ **Verifica que tienes acceso al servidor**  
✅ **Confirma que nadie más está usando DEV**  
✅ **Ten a mano las credenciales del servidor**

---

## 📋 PASO A PASO

### PASO 1: Conectar al Servidor

```bash
# SSH al servidor
ssh gmarmin@72.167.52.14

# Verificar que estás conectado
whoami
# Debe mostrar: gmarmin
```

---

### PASO 2: Backup Final de DEV (Opcional pero Recomendado)

```bash
# Ir al directorio DEV
cd ~/deploy/dev

# Crear directorio para backup final
mkdir -p ~/backups-dev-final

# Verificar que PostgreSQL DEV está corriendo
docker ps | grep postgres-dev

# Si está corriendo, hacer backup
docker exec gmarm-postgres-dev pg_dump -U postgres -d gmarm_dev > \
  ~/backups-dev-final/gmarm-dev-final-$(date +%Y%m%d-%H%M%S).sql

# Comprimir backup
gzip ~/backups-dev-final/gmarm-dev-final-*.sql

# Verificar que se creó
ls -lh ~/backups-dev-final/
```

**¿Por qué?** Por si acaso hay datos de prueba que quieras conservar.

**Si no hay datos importantes en DEV, SALTA este paso.**

---

### PASO 3: Ver Estado Actual de DEV

```bash
# Ver servicios corriendo
docker-compose -f docker-compose.dev.yml ps

# Ver uso de recursos
docker stats --no-stream | grep dev
```

**Anota la memoria que están usando los contenedores DEV.**

---

### PASO 4: Detener Servicios DEV

```bash
# Detener todos los servicios DEV
docker-compose -f docker-compose.dev.yml down

# Ver que se detuvieron
docker ps | grep dev
# No debería mostrar nada
```

**✅ Resultado Esperado:**
```
[+] Running 3/3
 ✔ Container gmarm-frontend-dev   Removed
 ✔ Container gmarm-backend-dev    Removed
 ✔ Container gmarm-postgres-dev   Removed
```

---

### PASO 5: Eliminar Volúmenes DEV (Liberar Espacio)

```bash
# Eliminar volúmenes (libera espacio en disco)
docker-compose -f docker-compose.dev.yml down -v

# Verificar que se eliminaron
docker volume ls | grep dev
# No debería mostrar volúmenes de dev
```

**⚠️ IMPORTANTE:** Esto ELIMINA la base de datos de DEV permanentemente.

---

### PASO 6: Limpiar Imágenes Docker Viejas (Opcional)

```bash
# Ver espacio usado
docker system df

# Limpiar imágenes y contenedores no usados
docker system prune -f

# Ver espacio liberado
docker system df
```

---

### PASO 7: Verificar Memoria Liberada

```bash
# Ver memoria del sistema
free -h

# Ver procesos Docker
docker ps -a

# No debería haber contenedores de DEV
```

**✅ Resultado Esperado:**
```
              total        used        free      shared  buff/cache   available
Mem:           3.8Gi       500Mi       3.0Gi        10Mi       300Mi       3.2Gi
```

Deberías tener **~3GB libres** ahora (antes tenías ~800MB).

---

### PASO 8: Verificar Puerto 5432 Libre

```bash
# Verificar que PostgreSQL DEV liberó el puerto
netstat -tuln | grep 5432

# O con ss
ss -tuln | grep 5432
```

**✅ Resultado Esperado:** 
- No debe mostrar nada, o solo muestra `:::5432` sin el proceso `postgres-dev`

---

### PASO 9: Confirmar que TODO está Apagado

```bash
# Ver TODOS los contenedores (incluyendo detenidos)
docker ps -a

# Eliminar contenedores detenidos de DEV (limpieza final)
docker rm -f $(docker ps -aq -f name=dev) 2>/dev/null || echo "No hay contenedores dev para eliminar"

# Ver imágenes de DEV
docker images | grep dev
```

---

### PASO 10: Documentar Estado Final

```bash
# Crear reporte
cat > ~/dev-shutdown-report.txt << EOF
======================================
APAGADO DE DEV - $(date)
======================================

MEMORIA LIBERADA:
$(free -h)

CONTENEDORES ACTIVOS:
$(docker ps)

VOLÚMENES:
$(docker volume ls)

ESPACIO EN DISCO:
$(df -h ~)

BACKUP FINAL:
$(ls -lh ~/backups-dev-final/)

======================================
EOF

# Ver reporte
cat ~/dev-shutdown-report.txt
```

---

## ✅ VERIFICACIÓN FINAL

Ejecuta estos comandos para confirmar que TODO está bien:

```bash
# 1. No hay contenedores de DEV
docker ps | grep dev
# → Debe estar VACÍO

# 2. Memoria disponible
free -h | grep Mem
# → Debe mostrar ~3GB disponibles

# 3. Puerto 5432 disponible
ss -tuln | grep 5432
# → No debe mostrar proceso postgres-dev

# 4. Backup existe (si lo hiciste)
ls -lh ~/backups-dev-final/
# → Debe mostrar tu backup
```

---

## 📊 CHECKLIST

Marca cuando completes cada paso:

- [ ] **PASO 1**: Conectado al servidor ✅
- [ ] **PASO 2**: Backup final de DEV creado (opcional)
- [ ] **PASO 3**: Estado actual revisado
- [ ] **PASO 4**: Servicios DEV detenidos
- [ ] **PASO 5**: Volúmenes DEV eliminados
- [ ] **PASO 6**: Imágenes limpias (opcional)
- [ ] **PASO 7**: Memoria verificada (~3GB libres)
- [ ] **PASO 8**: Puerto 5432 libre
- [ ] **PASO 9**: TODO confirmado apagado
- [ ] **PASO 10**: Reporte creado

---

## 🎯 RESULTADO ESPERADO

**ANTES de apagar DEV:**
```
RAM Total:    3.8GB
RAM Usada:    3.0GB (DEV + Sistema)
RAM Libre:    800MB
```

**DESPUÉS de apagar DEV:**
```
RAM Total:    3.8GB
RAM Usada:    500MB (Solo Sistema)
RAM Libre:    3.3GB ← ✅ Lista para PROD
```

---

## 🚀 SIGUIENTE PASO

Una vez que confirmes que DEV está apagado y tienes ~3GB libres:

```bash
# Ir al directorio de PROD
cd ~/deploy/prod

# Verificar que tienes los archivos actualizados
git status
git pull origin main

# Continuar con RELEASE_PRODUCCION.md
```

---

## 🔄 SI NECESITAS REACTIVAR DEV (ROLLBACK)

```bash
cd ~/deploy/dev

# Levantar servicios
docker-compose -f docker-compose.dev.yml up -d

# Restaurar backup (si lo hiciste)
cat ~/backups-dev-final/gmarm-dev-final-*.sql.gz | \
  gunzip | docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev
```

---

## ⚠️ PROBLEMAS COMUNES

### Problema 1: "Container is in use"

```bash
# Forzar eliminación
docker rm -f gmarm-postgres-dev gmarm-backend-dev gmarm-frontend-dev
```

### Problema 2: "Volume is in use"

```bash
# Ver qué lo está usando
docker ps -a

# Eliminar todos los contenedores detenidos
docker container prune -f

# Intentar de nuevo
docker volume rm gmarm_postgres_data_dev
```

### Problema 3: Puerto 5432 aún ocupado

```bash
# Ver qué proceso lo usa
sudo lsof -i :5432

# Si es postgres viejo, detenerlo
sudo systemctl stop postgresql
```

---

## 📞 ¿NECESITAS AYUDA?

Si algo no sale como esperado:

1. **NO continúes** con el despliegue a PROD
2. **Copia** el output del comando que falló
3. **Ejecuta** el comando de diagnóstico:
   ```bash
   docker ps -a
   docker volume ls
   free -h
   ```
4. **Contacta** al equipo con esa información

---

**Estado**: ⏳ LISTO PARA EJECUTAR  
**Última revisión**: 2025-11-10


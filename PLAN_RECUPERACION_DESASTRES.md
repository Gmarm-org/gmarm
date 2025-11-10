# 🆘 PLAN DE RECUPERACIÓN DE DESASTRES (DR)

**Última actualización**: 2025-11-10  
**Objetivo**: Garantizar recuperación de datos en caso de falla catastrófica

---

## 🎯 GARANTÍAS DE DATOS

### ✅ Backups Automáticos

```bash
# Frecuencia: Cada 6 horas (00:00, 06:00, 12:00, 18:00)
# Retención: 30 días
# Ubicación: ~/deploy/prod/backups/
# Verificación: Diaria a las 01:00 AM
```

### ✅ Punto de Recuperación (RPO)

**RPO = 6 horas máximo**  
_En el peor caso, pierdes máximo 6 horas de datos_

### ✅ Tiempo de Recuperación (RTO)

**RTO = 10-15 minutos**  
_Tiempo para restaurar desde un backup_

---

## 📋 ESCENARIOS DE DESASTRE

### Escenario 1: OOM Killer Mata PostgreSQL (como hoy)

**Síntomas:**
- PostgreSQL se reinicia constantemente
- Base de datos vacía o corrupta
- Logs muestran "out of memory"

**Solución:**

```bash
# 1. Verificar último backup disponible
ls -lht backups/gmarm-prod-*.sql.gz | head -5

# 2. Restaurar último backup
bash scripts/restore-backup.sh backups/gmarm-prod-YYYYMMDD-HHMMSS.sql.gz

# 3. Verificar datos
bash scripts/verificar-datos-prod.sh

# Tiempo estimado: 10 minutos
```

---

### Escenario 2: Servidor se Apaga/Reinicia Inesperadamente

**Síntomas:**
- No puedes conectarte al servidor
- Servicios Docker no responden

**Solución:**

```bash
# 1. Conectar al servidor
ssh usuario@servidor

# 2. Verificar servicios
cd ~/deploy/prod
docker-compose -f docker-compose.prod.yml ps

# 3. Levantar servicios si están caídos
docker-compose -f docker-compose.prod.yml up -d

# 4. Verificar datos
bash scripts/verificar-datos-prod.sh

# Tiempo estimado: 5 minutos
```

---

### Escenario 3: Datos Corruptos o Borrados Accidentalmente

**Síntomas:**
- Datos faltantes o incorrectos
- Reportes de usuarios sobre información perdida

**Solución:**

```bash
# 1. Identificar cuándo se perdieron los datos
# "Los datos estaban bien ayer a las 3 PM"

# 2. Buscar backup más cercano a ese momento
ls -lht backups/ | grep "20251109-1[4-5]"  # 2-3 PM del día anterior

# 3. Restaurar ese backup específico
bash scripts/restore-backup.sh backups/gmarm-prod-20251109-150000.sql.gz

# 4. Verificar datos
bash scripts/verificar-datos-prod.sh

# Tiempo estimado: 15 minutos
```

---

### Escenario 4: Disco Lleno

**Síntomas:**
- PostgreSQL no puede escribir
- Mensajes de "no space left on device"

**Solución:**

```bash
# 1. Verificar uso de disco
df -h

# 2. Limpiar backups antiguos manualmente
find backups/ -name "*.sql.gz" -mtime +7 -delete  # Eliminar > 7 días

# 3. Limpiar logs de Docker
docker system prune -f

# 4. Reiniciar servicios
docker-compose -f docker-compose.prod.yml restart

# Tiempo estimado: 5 minutos
```

---

### Escenario 5: Actualización Fallida

**Síntomas:**
- Después de actualizar, la aplicación no funciona
- Errores en logs del backend

**Solución:**

```bash
# 1. Rollback de código
git log --oneline -10
git reset --hard <commit_hash_anterior>

# 2. Rebuild y reinicio
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# 3. Si persiste, restaurar backup
bash scripts/restore-backup.sh backups/backup-pre-deploy-*.sql.gz

# Tiempo estimado: 20 minutos
```

---

## 🔧 SCRIPTS DE RECUPERACIÓN

### 1. Configurar Backups Automáticos (UNA VEZ)

```bash
cd ~/deploy/prod
bash scripts/setup-backup-automatico.sh
```

**Esto configura:**
- ✅ Backups cada 6 horas
- ✅ Verificación diaria de datos
- ✅ Alertas de memoria
- ✅ Limpieza automática (30 días)

---

### 2. Backup Manual (Antes de Cambios Críticos)

```bash
# Antes de actualizar o hacer cambios grandes
bash scripts/backup-prod.sh
```

**Crear backup en momento específico:**
```bash
# Ejemplo: Antes de migración de datos
mkdir -p backups/manual
docker exec gmarm-postgres-prod pg_dump -U postgres -d gmarm_prod | \
  gzip > backups/manual/pre-migracion-$(date +%Y%m%d-%H%M%S).sql.gz
```

---

### 3. Verificar Salud del Sistema

```bash
# Ejecutar diariamente (o cuando sospeches problemas)
bash scripts/verificar-datos-prod.sh
```

**Qué verifica:**
- ✅ PostgreSQL corriendo
- ✅ Base de datos existe
- ✅ Datos en tablas críticas
- ✅ Integridad referencial
- ✅ Último backup disponible
- ✅ Uso de memoria y disco

---

### 4. Restaurar Backup

```bash
# Restaurar último backup
ULTIMO=$(ls -t backups/gmarm-prod-*.sql.gz | head -1)
bash scripts/restore-backup.sh $ULTIMO

# Restaurar backup específico
bash scripts/restore-backup.sh backups/gmarm-prod-20251109-120000.sql.gz
```

---

## 📊 MONITOREO CONTINUO

### Alertas Automáticas (configuradas en cron)

```bash
# Cada 5 minutos: Alerta si PostgreSQL > 90% memoria
*/5 * * * * docker stats --no-stream gmarm-postgres-prod | \
  awk 'NR==2 {if(substr($7,1,length($7)-1) > 90) print "⚠️ MEMORIA CRÍTICA"}' \
  >> /tmp/memory-alerts.log

# Cada 2 horas: Alerta si no hay backups recientes
0 */2 * * * bash scripts/verificar-datos-prod.sh >> /tmp/verify.log 2>&1
```

### Ver Alertas

```bash
# Ver alertas de memoria
tail -50 /tmp/memory-alerts.log

# Ver log de verificación
tail -50 /tmp/verify.log

# Ver log de backups
tail -50 /tmp/backup-prod-cron.log
```

---

## 🧪 PRUEBAS DE RECUPERACIÓN

### Probar Restauración (en ambiente de prueba)

```bash
# 1. Hacer backup del estado actual
bash scripts/backup-prod.sh

# 2. Modificar datos a propósito
docker exec gmarm-postgres-prod psql -U postgres -d gmarm_prod -c \
  "DELETE FROM cliente WHERE id > 100;"

# 3. Restaurar backup
ULTIMO=$(ls -t backups/gmarm-prod-*.sql.gz | head -1)
bash scripts/restore-backup.sh $ULTIMO

# 4. Verificar que los datos volvieron
bash scripts/verificar-datos-prod.sh
```

**⚠️ IMPORTANTE:** Hacer esto en DEV, NO en PROD

---

## 📞 CONTACTOS DE EMERGENCIA

### Escalamiento

1. **Nivel 1** (0-15 minutos): Seguir scripts de recuperación
2. **Nivel 2** (15-30 minutos): Contactar a DevOps
3. **Nivel 3** (30+ minutos): Escalar a arquitecto

### Información Crítica para Soporte

Antes de contactar soporte, recopilar:

```bash
# 1. Estado de servicios
docker-compose -f docker-compose.prod.yml ps > /tmp/docker-status.txt

# 2. Logs recientes
docker-compose -f docker-compose.prod.yml logs --tail=100 > /tmp/docker-logs.txt

# 3. Uso de recursos
docker stats --no-stream > /tmp/docker-stats.txt

# 4. Estado de datos
bash scripts/verificar-datos-prod.sh > /tmp/verify-status.txt

# 5. Backups disponibles
ls -lht backups/*.sql.gz | head -20 > /tmp/backups.txt

# Comprimir todo
tar -czf soporte-$(date +%Y%m%d-%H%M%S).tar.gz /tmp/*.txt
```

---

## ✅ CHECKLIST DE RECUPERACIÓN

### Después de Cualquier Restauración

- [ ] Verificar que PostgreSQL está corriendo
- [ ] Verificar que backend responde a health check
- [ ] Verificar que frontend es accesible
- [ ] Login funciona con usuario admin
- [ ] Contar registros en tablas críticas
- [ ] Verificar último registro creado (fecha)
- [ ] Crear backup inmediato post-recuperación
- [ ] Documentar qué pasó y cómo se resolvió
- [ ] Actualizar este documento si es necesario

---

## 📈 MEJORAS FUTURAS

### Corto Plazo (1 mes)

- [ ] Backups offsite (copia en otro servidor)
- [ ] Alertas por email/Slack
- [ ] Dashboard de monitoreo (Grafana)
- [ ] Tests automáticos de restauración

### Largo Plazo (3 meses)

- [ ] Replicación de PostgreSQL (standby)
- [ ] Backups incrementales (menos espacio)
- [ ] Monitoreo avanzado (Prometheus)
- [ ] Plan de DR completo documentado

---

## 📝 REGISTRO DE INCIDENTES

### 2025-11-10: OOM Killer en DEV

**Problema:** Malware + límites de memoria bajos  
**Impacto:** Base de datos perdida  
**Solución:** Eliminación de malware + aumento de límites Docker  
**Tiempo de recuperación:** 30 minutos  
**Lección:** SIEMPRE tener backups automáticos

### Template para Futuros Incidentes

```
Fecha: YYYY-MM-DD HH:MM
Problema: [Descripción breve]
Impacto: [Qué dejó de funcionar]
Solución: [Cómo se resolvió]
Tiempo: [Minutos hasta recuperación total]
Prevención: [Qué cambiar para evitar recurrencia]
```

---

## 🎯 OBJETIVOS DE DISPONIBILIDAD

### SLA (Service Level Agreement)

- **Uptime objetivo**: 99.5% mensual (~3.6 horas downtime/mes)
- **RPO**: 6 horas máximo
- **RTO**: 15 minutos máximo
- **Backups**: 4 diarios + retención 30 días

### Métricas a Monitorear

| Métrica | Objetivo | Crítico |
|---------|----------|---------|
| PostgreSQL memoria | < 80% | > 90% |
| Disco | < 80% | > 90% |
| Backup antigüedad | < 6h | > 12h |
| Tiempo de respuesta | < 500ms | > 2s |

---

**Última revisión**: 2025-11-10  
**Próxima revisión**: 2025-12-10  
**Responsable**: DevOps Team


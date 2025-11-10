# 🚨 INSTRUCCIONES URGENTES - SERVIDOR DEV

## ⚡ EJECUTAR INMEDIATAMENTE

**Fecha**: 2025-11-10  
**Problema**: Malware/Cryptominers + OOM Killer  
**Tiempo estimado**: 10 minutos

---

## 🔥 PASO 1: COMMIT Y PUSH (en LOCAL)

```powershell
# Windows (LOCAL)
cd C:\Users\Flia Tenemaza Cadena\Documents\gmarmworspace\gmarm

git add .
git commit -m "fix: aumentar límites memoria Docker + scripts eliminar malware"
git push origin dev
```

---

## 🔥 PASO 2: PULL EN SERVIDOR (SSH)

```bash
# SSH al servidor DEV
ssh gmarmin@72.167.52.14

# Ir al directorio del proyecto
cd ~/deploy/dev

# Pull de cambios
git pull origin dev
```

---

## 🔥 PASO 3: ELIMINAR MALWARE

```bash
# Dar permisos de ejecución
chmod +x scripts/eliminar-malware-urgente.sh

# Ejecutar con sudo
sudo bash scripts/eliminar-malware-urgente.sh
```

**⚠️ IMPORTANTE:** Este script:
- ✅ Mata procesos `mysql` y `kdevtmpfsi`
- ✅ Busca y elimina binarios maliciosos
- ✅ Verifica crontabs sospechosos
- ✅ Revisa servicios systemd

**Si el script encuentra archivos maliciosos, ELIMÍNÁLOS cuando pregunte.**

---

## 🔥 PASO 4: VERIFICAR QUE NO HAYA MÁS PROCESOS

```bash
# Esperar 2 minutos
sleep 120

# Verificar nuevamente
ps aux | grep -E "mysql|kdevtmpfsi"

# Si aparecen procesos, volver a ejecutar:
sudo bash scripts/eliminar-malware-urgente.sh
```

---

## 🔥 PASO 5: RECREAR BASE DE DATOS

```bash
# Dar permisos
chmod +x scripts/recrear-bd-dev.sh

# Ejecutar (NO necesita sudo)
bash scripts/recrear-bd-dev.sh
```

**Este script:**
- ✅ Detiene servicios Docker
- ✅ Elimina volúmenes antiguos
- ✅ Levanta servicios con **nuevos límites de memoria**:
  - PostgreSQL: 2GB (antes 1.5GB)
  - Backend: 512MB (antes 256MB)
  - Frontend: 512MB (antes 384MB)
- ✅ Recrea la base de datos
- ✅ Ejecuta script maestro

---

## 🔥 PASO 6: DIAGNÓSTICO FINAL

```bash
# Ejecutar diagnóstico
bash scripts/diagnostico-dev.sh
```

**Verificar que:**
- ✅ `OOM Killed: false` (NO debe estar asesinado)
- ✅ Base de datos `gmarm_dev` existe
- ✅ PostgreSQL < 90% de memoria
- ✅ Backend < 90% de memoria
- ✅ NO hay procesos `mysql` o `kdevtmpfsi`

---

## 📊 CONFIGURACIÓN ACTUALIZADA

### Nuevos Límites de Memoria Docker:

| Servicio | ANTES | AHORA | Cambio |
|----------|-------|-------|--------|
| PostgreSQL | 1.5GB | 2.0GB | +33% ⬆️ |
| Backend | 256MB | 512MB | +100% ⬆️ |
| Frontend | 384MB | 512MB | +33% ⬆️ |
| **TOTAL** | **2.14GB** | **3.0GB** | **+40%** |

### JVM Backend Optimizado:

```
ANTES: -Xms96m -Xmx192m
AHORA: -Xms128m -Xmx384m -XX:+UseG1GC -XX:MaxMetaspaceSize=96m
```

---

## 🚨 SI EL PROBLEMA PERSISTE

### Opción A: Monitoreo Continuo

```bash
# Ejecutar monitor en background
nohup bash scripts/diagnostico-dev.sh > /tmp/monitor.log 2>&1 &

# Revisar cada 5 minutos
watch -n 300 "tail -50 /tmp/monitor.log"
```

### Opción B: Aumentar SWAP

```bash
# Verificar SWAP actual
free -h

# Si SWAP < 4GB, aumentar:
sudo fallocate -l 4G /swapfile2
sudo chmod 600 /swapfile2
sudo mkswap /swapfile2
sudo swapon /swapfile2

# Hacer permanente (agregar a /etc/fstab)
echo '/swapfile2 none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Opción C: Reiniciar Servidor (último recurso)

```bash
# Solo si nada más funciona
sudo reboot
```

---

## 🔒 SEGURIDAD POST-INCIDENTE

### 1. Cambiar Contraseñas

```bash
# Cambiar contraseña del usuario
passwd

# Cambiar contraseña de root (si aplica)
sudo passwd root
```

### 2. Actualizar Sistema

```bash
sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y
```

### 3. Instalar Fail2Ban

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 4. Configurar Firewall

```bash
# Permitir solo puertos necesarios
sudo ufw enable
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw status
```

### 5. Auditoría Completa

```bash
# Verificar últimos logins
last -20

# Verificar intentos fallidos de SSH
sudo grep "Failed password" /var/log/auth.log | tail -20

# Verificar usuarios del sistema
cat /etc/passwd | tail -10
```

---

## 📞 CONTACTO DE EMERGENCIA

Si después de seguir todos los pasos el problema persiste:

1. **Capturar logs completos:**
   ```bash
   bash scripts/diagnostico-dev.sh > diagnostico-$(date +%Y%m%d-%H%M%S).log
   ```

2. **Enviar diagnóstico completo**

3. **Considerar:**
   - Reinstalación limpia del servidor
   - Migración a servidor con más RAM (8GB recomendado)
   - Contratación de auditoría de seguridad

---

## ✅ CHECKLIST FINAL

Después de ejecutar todos los pasos, verificar:

- [ ] Procesos maliciosos eliminados (mysql, kdevtmpfsi)
- [ ] Binarios maliciosos borrados
- [ ] Servicios Docker reinitiados con nuevos límites
- [ ] Base de datos `gmarm_dev` existe y tiene datos
- [ ] PostgreSQL < 90% de memoria
- [ ] Backend < 90% de memoria
- [ ] NO hay eventos OOM Killer nuevos
- [ ] Frontend accesible (http://72.167.52.14:5173)
- [ ] Backend accesible (http://72.167.52.14:8080)
- [ ] Contraseñas cambiadas
- [ ] Sistema actualizado
- [ ] Firewall configurado

---

## 🎯 OBJETIVO FINAL

**Servidor DEV estable con:**
- ✅ 0% uso de SWAP
- ✅ PostgreSQL < 85% memoria
- ✅ Backend < 85% memoria
- ✅ Sin procesos maliciosos
- ✅ Base de datos funcional
- ✅ Aplicación accesible

---

**TIEMPO TOTAL ESTIMADO:** 10-15 minutos

**¡EJECUTA AHORA!** ⚡


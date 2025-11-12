# 🚨 EJECUTAR REBUILD FORZADO DEL FRONTEND - AHORA

## ❌ **Problema Confirmado**
NINGUNO de los cambios del último push está visible en producción:
- ❌ Ver documentos (PDFs)
- ❌ Monto a pagar (input de cuotas con decimales)
- ❌ Scroll en visualización (modal de cliente)
- ❌ Template de autorización (logos)
- ❌ Ver datos factura siempre (botón siempre visible)

**Causa:** El frontend NO se rebuildeó correctamente durante el deploy automático.

---

## ✅ **Solución: Rebuild Forzado**

### **Opción 1: Ejecutar desde tu máquina (Windows PowerShell)**

```powershell
# Conectar al servidor y ejecutar el script
ssh gmarmin@72.167.52.14 "cd ~/deploy/prod && git pull origin main && bash scripts/force-rebuild-frontend-prod.sh"
```

**Esto hará:**
1. ⏹️ Detener servicios
2. 🗑️ Eliminar imagen vieja del frontend
3. 🧹 Limpiar caché de Docker
4. 🔄 Rebuild COMPLETO sin caché del frontend
5. 🚀 Levantar todos los servicios
6. ⏳ Esperar 90 segundos
7. 🔍 Verificar que todo esté corriendo

**Tiempo estimado:** ~5 minutos

---

### **Opción 2: Ejecutar directamente en el servidor (SSH)**

```bash
# 1. Conectar al servidor
ssh gmarmin@72.167.52.14

# 2. Ir al directorio de producción
cd ~/deploy/prod

# 3. Actualizar código
git pull origin main

# 4. Ejecutar script de rebuild
bash scripts/force-rebuild-frontend-prod.sh
```

---

## 🔍 **Verificar que Funcione**

Después de ejecutar el script:

### **1. Abrir en modo incógnito:**
```
https://gmarm.com
```

### **2. Verificar cada cambio:**

✅ **Finanzas > Pagos:**
- [ ] Botón "Ver Datos Factura" debe aparecer SIEMPRE (incluso con estado PENDIENTE)
- [ ] NO solo "Ver Cuotas"

✅ **Jefe Ventas > Ver cliente:**
- [ ] Modal con scroll vertical funcional
- [ ] Poder hacer scroll para ver toda la información

✅ **Vendedor > Crear cliente > Pagos:**
- [ ] Input de monto: poder escribir "250.55" fluidamente
- [ ] Al cambiar monto de cuota 1, la cuota 2 se recalcula automáticamente

✅ **Finanzas > Clientes Asignados > Generar Autorización:**
- [ ] PDF con logo CZ ocupando ~40% del ancho (solo imagen, sin texto extra)
- [ ] Watermark en esquina inferior derecha

✅ **Todos los módulos:**
- [ ] PDFs de documentos/contratos se abren correctamente (no error 404)

---

## ⚠️ **Si el Script Falla**

### **Plan B: Rebuild Manual Paso a Paso**

```bash
ssh gmarmin@72.167.52.14

cd ~/deploy/prod

# 1. Detener servicios
docker-compose -f docker-compose.prod.yml down

# 2. Eliminar imagen vieja
docker rmi gmarm-frontend-prod -f

# 3. Limpiar caché
docker system prune -f

# 4. Rebuild sin caché (CRÍTICO)
docker-compose -f docker-compose.prod.yml build --no-cache frontend

# 5. Rebuild backend también (por si acaso)
docker-compose -f docker-compose.prod.yml build --no-cache backend

# 6. Levantar servicios
docker-compose -f docker-compose.prod.yml up -d

# 7. Esperar 90 segundos
sleep 90

# 8. Verificar
docker ps
curl http://localhost:8080/api/health
```

---

## 📊 **Logs en Tiempo Real**

Si quieres ver qué está pasando mientras rebuilds:

```bash
# Terminal 1: Ver logs del frontend
docker logs -f gmarm-frontend-prod

# Terminal 2: Ver logs del backend
docker logs -f gmarm-backend-prod
```

---

## 🔒 **GARANTÍA DE DATOS**

✅ Este proceso NO afecta los datos
✅ La base de datos NO se elimina
✅ Los volúmenes persisten
✅ Solo se reconstruye el código (backend/frontend)

---

## 📝 **Después del Rebuild**

1. **Limpiar caché del navegador:**
   - Ctrl + Shift + R (forzar recarga)
   - O abrir en modo incógnito

2. **Verificar con el checklist de arriba**

3. **Si TODO funciona:**
   - ✅ Los cambios están aplicados
   - ✅ Puedes usar el sistema normalmente

4. **Si ALGO no funciona:**
   - Reportar qué específicamente no se ve
   - Revisar logs: `docker logs gmarm-frontend-prod --tail=50`

---

## ⏰ **Momento Ideal para Ejecutar**

- **AHORA** (si no hay usuarios activos)
- **O mañana temprano** (antes de que usuarios entren)

**Downtime:** ~5 minutos durante el rebuild

---

## 🆘 **Contacto de Emergencia**

Si el script no funciona o hay problemas:
1. Verificar que servicios estén corriendo: `docker ps`
2. Ver logs del deploy: `docker logs gmarm-backend-prod --tail=100`
3. Reportar el error específico

---

**🚀 Ejecuta el comando de la Opción 1 y en ~5 minutos todos los cambios deberían estar visibles.**


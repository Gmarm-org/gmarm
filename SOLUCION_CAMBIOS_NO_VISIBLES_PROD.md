# 🔧 Solución: Cambios No Visibles en Producción

## 📊 **Estado Actual del Deploy**

✅ **Deploy ejecutado exitosamente** (hace 2 horas)
✅ Backend buildeado correctamente
✅ Frontend buildeado correctamente
✅ Servicios Docker iniciados
⚠️ **Backend health check falló desde `api.gmarm.com`**

---

## 🚀 **Solución 1: Limpiar Caché del Navegador (MÁS PROBABLE)**

### **Síntomas:**
- Los cambios no se ven en el navegador
- Los archivos JS/CSS están cacheados
- El backend está funcionando pero parece "viejo"

### **Solución:**
```
1. En Chrome/Edge/Firefox: Presiona Ctrl + Shift + R (forzar recarga sin caché)
2. O Ctrl + F5 (Windows) / Cmd + Shift + R (Mac)
3. O abrir modo incógnito: Ctrl + Shift + N
4. O limpiar caché del navegador:
   - Chrome: Configuración > Privacidad > Borrar datos de navegación
   - Seleccionar "Imágenes y archivos en caché"
   - Tiempo: "Última hora"
```

---

## 🔍 **Solución 2: Verificar que Nginx esté Proxying Correctamente**

### **En el servidor (SSH):**

```bash
# 1. Verificar configuración Nginx
sudo nginx -t

# 2. Recargar Nginx (si es necesario)
sudo systemctl reload nginx

# 3. Verificar que api.gmarm.com apunte al backend
curl -I https://api.gmarm.com/api/health

# Debería retornar: 200 OK
# Si retorna 502 Bad Gateway, el backend no está respondiendo
# Si retorna 404, Nginx no está configurado correctamente
```

---

## 🐳 **Solución 3: Verificar Servicios Docker**

### **En el servidor (SSH):**

```bash
cd ~/deploy/prod

# 1. Verificar que los contenedores estén corriendo
docker ps

# Debería mostrar:
# - gmarm-frontend-prod (Up)
# - gmarm-backend-prod (Up, healthy)
# - gmarm-postgres-prod (Up, healthy)

# 2. Verificar logs del backend (buscar errores)
docker logs gmarm-backend-prod --tail=50

# 3. Verificar que el backend responda localmente
curl http://localhost:8080/api/health

# Debería retornar: {"environment":"production","service":"GMARM Backend"...}

# 4. Si el backend no responde, reiniciar servicios
docker-compose -f docker-compose.prod.yml restart backend

# 5. Esperar 60 segundos y verificar nuevamente
sleep 60
curl http://localhost:8080/api/health
```

---

## 🔧 **Solución 4: Si Nada Funciona (Reinicio Total)**

### **En el servidor (SSH):**

```bash
cd ~/deploy/prod

# 1. Detener servicios
docker-compose -f docker-compose.prod.yml down

# 2. Limpiar imágenes viejas (opcional)
docker system prune -f

# 3. Rebuild sin caché (forzar actualización)
docker-compose -f docker-compose.prod.yml up -d --build --force-recreate

# 4. Esperar 90 segundos
sleep 90

# 5. Verificar servicios
docker ps
docker logs gmarm-backend-prod --tail=30
curl http://localhost:8080/api/health

# 6. Si todo está bien, verificar desde Nginx
curl https://api.gmarm.com/api/health
```

---

## 🎯 **Diagnóstico Rápido**

### **¿Qué cambios NO se ven?**

1. **Template de autorización (logos):**
   - Archivo: `backend/src/main/resources/templates/autorizaciones/autorizacion_venta.html`
   - Prueba: Generar un nuevo documento de autorización
   - ✅ Si se rebuildeó, debe verse el cambio

2. **Modal de cliente (scroll):**
   - Archivo: `frontend/src/pages/JefeVentas/JefeVentas.tsx`
   - Prueba: Abrir detalle de cliente en Jefe de Ventas
   - ✅ Debe tener scroll vertical

3. **Botón "Ver Datos Factura" (siempre visible):**
   - Archivo: `frontend/src/pages/Finanzas/PagosFinanzas.tsx`
   - Prueba: Ir a Finanzas > Pagos
   - ✅ Debe aparecer botón incluso si pago no está COMPLETADO

4. **Input de cuotas (decimales fluidos):**
   - Archivo: `frontend/src/pages/Vendedor/components/PaymentForm.tsx`
   - Prueba: Crear cliente, ir a pagos, cambiar monto de cuota
   - ✅ Debe permitir escribir 250.55 sin problemas

---

## 📝 **Comando Para Verificar Estado Actual**

```bash
ssh gmarmin@72.167.52.14 "cd ~/deploy/prod && \
  echo '=== SERVICIOS ===' && \
  docker ps --filter name=gmarm && \
  echo '' && \
  echo '=== BACKEND HEALTH ===' && \
  curl -s http://localhost:8080/api/health | jq && \
  echo '' && \
  echo '=== NGINX TO BACKEND ===' && \
  curl -I https://api.gmarm.com/api/health 2>&1 | head -5"
```

---

## ✅ **Checklist de Verificación**

- [ ] Ctrl+Shift+R en el navegador (forzar recarga sin caché)
- [ ] Abrir en modo incógnito
- [ ] Verificar `docker ps` (servicios corriendo)
- [ ] Verificar `curl http://localhost:8080/api/health` (backend responde)
- [ ] Verificar `curl https://api.gmarm.com/api/health` (Nginx proxy funciona)
- [ ] Verificar logs del backend: `docker logs gmarm-backend-prod --tail=50`
- [ ] Si falla, reiniciar: `docker-compose restart backend`
- [ ] Último recurso: `docker-compose down && docker-compose up -d --build --force-recreate`

---

## 🔒 **IMPORTANTE: Datos Seguros**

✅ Todos los comandos anteriores NO afectan los datos
✅ Volúmenes Docker persisten (`postgres_data_prod`)
✅ Reiniciar servicios NO borra la base de datos
✅ `down` sin `-v` NO elimina volúmenes

---

## 📞 **Si el Problema Persiste**

1. **Verificar commit en el servidor:**
   ```bash
   ssh gmarmin@72.167.52.14 "cd ~/deploy/prod && git log --oneline -3"
   ```
   - Debe mostrar el commit `ea469fd` (última actualización)

2. **Verificar timestamp del build:**
   ```bash
   ssh gmarmin@72.167.52.14 "docker images | grep gmarm"
   ```
   - Debe mostrar imágenes creadas hace ~2 horas

3. **Verificar .env protegido:**
   ```bash
   ssh gmarmin@72.167.52.14 "cd ~/deploy/prod && cat .env | head -5"
   ```
   - Debe mostrar las variables de entorno

---

**🌙 Empieza por Ctrl+Shift+R en el navegador - Es la causa más común.**


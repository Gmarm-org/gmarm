# 🚨 Solución CORS - Pasos INMEDIATOS para Producción

## El Problema
El backend en producción NO tiene los cambios de CORS aplicados. Necesitas reconstruir el contenedor.

## ⚡ Solución Rápida (5 minutos)

### En el servidor de producción, ejecuta:

```bash
# 1. Ir al directorio del proyecto
cd ~/deploy/prod  # O donde tengas el proyecto

# 2. Actualizar código
git pull origin main

# 3. Reconstruir backend con los cambios de CORS
docker-compose -f docker-compose.prod.yml build backend --no-cache

# 4. Reiniciar backend
docker-compose -f docker-compose.prod.yml stop backend
docker-compose -f docker-compose.prod.yml rm -f backend
docker-compose -f docker-compose.prod.yml up -d backend

# 5. Esperar 30 segundos y verificar logs
sleep 30
docker logs gmarm-backend-prod | tail -50

# 6. Verificar que las variables de entorno están correctas
docker exec gmarm-backend-prod printenv | grep SPRING_CORS
```

**Debe mostrar:**
```
SPRING_CORS_ALLOWED_ORIGINS=https://gmarm.com,https://www.gmarm.com
SPRING_CORS_ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
SPRING_CORS_ALLOWED_HEADERS=*
```

### 7. Verificar que el backend está corriendo:

```bash
docker ps | grep backend
docker logs gmarm-backend-prod | tail -50
```

**IMPORTANTE:** El backend debe mostrar "Started Application" en los logs. Si hay errores, el backend está crasheando.

### 8. Probar conexión directa al backend (saltando nginx):

```bash
# Probar health check directamente
curl http://localhost:8080/api/health

# Si funciona, el problema puede ser nginx. Si no funciona, el backend está crasheando.
```

### 9. Probar que CORS funciona (después de que el backend responda):

```bash
curl -X OPTIONS http://localhost:8080/api/auth/login \
  -H "Origin: https://gmarm.com" \
  -H "Access-Control-Request-Method: POST" \
  -i
```

Si ves `Access-Control-Allow-Origin: https://gmarm.com` en la respuesta, **está funcionando**.

**NOTA:** Si obtienes error 502 Bad Gateway, el backend no está respondiendo. Ver sección "Si obtienes error 502" abajo.

### 8. Limpiar cache del navegador

En el navegador:
- Presiona `Ctrl + Shift + R` (o `Cmd + Shift + R` en Mac) para hacer hard refresh
- O abre una ventana de incógnito

---

## ❌ Si obtienes error 502 Bad Gateway:

**El backend no está respondiendo.** Sigue estos pasos:

### 1. Verificar estado del contenedor:

```bash
docker ps -a | grep backend
```

### 2. Ver logs del backend (MUY IMPORTANTE):

```bash
docker logs gmarm-backend-prod
```

**Busca:**
- ✅ "Started Application" → Backend inició correctamente
- ❌ Errores de compilación → Necesitas rebuild
- ❌ Errores de conexión a BD → PostgreSQL no está accesible
- ❌ Excepciones → Error en el código

### 3. Si el backend está crasheando, reconstruir:

```bash
cd ~/deploy/prod
git pull origin main
docker-compose -f docker-compose.prod.yml build backend --no-cache
docker-compose -f docker-compose.prod.yml up -d backend

# Esperar 60 segundos para que inicie
sleep 60

# Ver logs nuevamente
docker logs gmarm-backend-prod | tail -100
```

### 4. Si el backend está corriendo pero nginx no lo encuentra:

Verificar configuración de nginx. Debe apuntar a:
- `proxy_pass http://gmarm-backend-prod:8080;` (si nginx está en Docker)
- `proxy_pass http://localhost:8080;` (si nginx está en el host)

---

## ❌ Si NO funciona después de esto:

1. **Verificar que el código se actualizó:**
   ```bash
   git log --oneline -3
   ```
   Debe incluir el commit `fix: corregir configuración CORS...`

2. **Verificar que el contenedor tiene el código nuevo:**
   ```bash
   docker exec gmarm-backend-prod ls -la /app/BOOT-INF/classes/com/armasimportacion/config/ | grep SecurityConfig
   ```

3. **Ver logs del backend para errores:**
   ```bash
   docker logs gmarm-backend-prod 2>&1 | grep -i "error\|exception\|cors" | tail -20
   ```

4. **Si hay un proxy reverso (nginx), verificar configuración:**
   - El proxy debe pasar los headers CORS sin modificarlos
   - No debe agregar/remover headers `Access-Control-*`

---

**Última actualización:** 2024-12-23


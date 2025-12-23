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

### 7. Probar que funciona:

```bash
curl -X OPTIONS https://api.gmarm.com/api/auth/login \
  -H "Origin: https://gmarm.com" \
  -H "Access-Control-Request-Method: POST" \
  -i
```

Si ves `Access-Control-Allow-Origin: https://gmarm.com` en la respuesta, **está funcionando**.

### 8. Limpiar cache del navegador

En el navegador:
- Presiona `Ctrl + Shift + R` (o `Cmd + Shift + R` en Mac) para hacer hard refresh
- O abre una ventana de incógnito

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


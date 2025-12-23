# 🔍 Diagnóstico: Error 502 Bad Gateway

## ❌ El Problema

Nginx está funcionando pero no puede conectarse al backend. Esto significa:
- ✅ Nginx está corriendo
- ❌ Backend no está respondiendo o está crasheando

## 🔧 Pasos de Diagnóstico

### 1. Verificar que el backend está corriendo

```bash
docker ps | grep backend
```

**Debe mostrar el contenedor `gmarm-backend-prod` en estado "Up"**

### 2. Ver logs del backend (MUY IMPORTANTE)

```bash
docker logs gmarm-backend-prod
```

**Busca:**
- ¿El backend inició correctamente? (debe decir "Started Application")
- ¿Hay errores de compilación?
- ¿Hay errores de conexión a la base de datos?
- ¿Hay errores de configuración?

### 3. Verificar que el backend está escuchando en el puerto correcto

```bash
docker exec gmarm-backend-prod netstat -tlnp | grep 8080
```

O:

```bash
docker exec gmarm-backend-prod ps aux | grep java
```

### 4. Verificar la configuración de nginx

```bash
# Ver configuración de nginx (depende de dónde esté)
cat /etc/nginx/sites-available/gmarm  # O el archivo de configuración de nginx
```

**Busca:**
- ¿A qué puerto está intentando conectar nginx?
- ¿Está apuntando a `localhost:8080` o a `gmarm-backend-prod:8080`?
- Si usa Docker, debe apuntar al nombre del servicio: `gmarm-backend-prod:8080`

### 5. Probar conexión directa al backend (saltando nginx)

```bash
# Desde el servidor
curl http://localhost:8080/api/health

# O si nginx está en el mismo contenedor/host
curl http://gmarm-backend-prod:8080/api/health
```

## 🚨 Causas Comunes

### 1. Backend crasheando al iniciar
**Síntoma:** Logs muestran excepción al inicio
**Solución:** Ver logs, corregir error

### 2. Backend no puede conectarse a PostgreSQL
**Síntoma:** Errores de conexión a BD
**Solución:** Verificar que PostgreSQL está corriendo y accesible

### 3. Nginx apuntando al puerto/host incorrecto
**Síntoma:** Backend funciona pero nginx no lo encuentra
**Solución:** Verificar configuración de nginx

### 4. Backend todavía iniciando
**Síntoma:** Backend está "Up" pero no responde aún
**Solución:** Esperar 30-60 segundos y probar de nuevo

### 5. Error en el código (compilación falló)
**Síntoma:** Backend no inició porque el build falló
**Solución:** Ver logs de build: `docker logs gmarm-backend-prod` desde el inicio

## ✅ Solución Rápida

Si el backend está crasheando, reconstruir:

```bash
cd ~/deploy/prod
docker-compose -f docker-compose.prod.yml build backend --no-cache
docker-compose -f docker-compose.prod.yml up -d backend

# Esperar 60 segundos
sleep 60

# Ver logs
docker logs gmarm-backend-prod | tail -100
```


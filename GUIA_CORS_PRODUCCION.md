# 🔒 Guía de Configuración CORS en Producción

## 📋 Problema

El error de CORS en producción indica que el preflight request (OPTIONS) no está pasando:

```
Access to fetch at 'https://api.gmarm.com/api/auth/login' from origin 'https://gmarm.com' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## ✅ Solución Implementada

### 1. **Permitir OPTIONS explícitamente en SecurityConfig**

Se agregó una regla para permitir todas las peticiones OPTIONS (preflight):

```java
.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
```

### 2. **Mejorar parsing de variables de entorno**

Se mejoró el método `corsConfigurationSource()` para:
- Limpiar espacios en blanco de los orígenes permitidos
- Manejar correctamente los métodos y headers
- Asegurar que los valores se parsean correctamente

### 3. **Configuración en docker-compose.prod.yml**

Asegúrate de que las variables de entorno estén configuradas correctamente:

```yaml
environment:
  - SPRING_CORS_ALLOWED_ORIGINS=https://gmarm.com,https://www.gmarm.com
  - SPRING_CORS_ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
  - SPRING_CORS_ALLOWED_HEADERS=*
```

**⚠️ IMPORTANTE:**
- **NO incluyas** `https://api.gmarm.com` en los orígenes permitidos (el API no hace CORS a sí mismo)
- **SÍ incluye** `https://gmarm.com` y `https://www.gmarm.com` (frontend)

## 🔍 Verificación

### 1. **Verificar variables de entorno en el contenedor**

```bash
docker exec gmarm-backend-prod env | grep SPRING_CORS
```

Deberías ver:
```
SPRING_CORS_ALLOWED_ORIGINS=https://gmarm.com,https://www.gmarm.com
SPRING_CORS_ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
SPRING_CORS_ALLOWED_HEADERS=*
```

### 2. **Probar preflight request manualmente**

```bash
curl -X OPTIONS https://api.gmarm.com/api/auth/login \
  -H "Origin: https://gmarm.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

Deberías ver en la respuesta:
```
< Access-Control-Allow-Origin: https://gmarm.com
< Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
< Access-Control-Allow-Headers: *
```

### 3. **Verificar logs del backend**

```bash
docker logs gmarm-backend-prod | grep -i cors
```

## 🔧 Pasos de Despliegue INMEDIATO

### ⚠️ IMPORTANTE: El backend en producción DEBE ser reconstruido para aplicar los cambios

### 1. **SSH al servidor de producción**

```bash
ssh usuario@servidor_ip
cd ~/deploy/prod  # O donde esté el proyecto
```

### 2. **Actualizar código**

```bash
git pull origin main
```

### 3. **Verificar docker-compose.prod.yml**

Asegúrate de que la línea 16 tenga (SIN `api.gmarm.com`):
```yaml
- SPRING_CORS_ALLOWED_ORIGINS=https://gmarm.com,https://www.gmarm.com
```

### 4. **Reconstruir y reiniciar el backend (OBLIGATORIO)**

**Opción A: Rebuild solo del backend (recomendado, más rápido)**
```bash
docker-compose -f docker-compose.prod.yml build backend --no-cache
docker-compose -f docker-compose.prod.yml stop backend
docker-compose -f docker-compose.prod.yml rm -f backend
docker-compose -f docker-compose.prod.yml up -d backend
```

**Opción B: Rebuild completo (si Opción A no funciona)**
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### 5. **Esperar a que el backend inicie (30-60 segundos)**

```bash
# Monitorear logs hasta que veas "Started Application"
docker logs -f gmarm-backend-prod
# Presiona Ctrl+C cuando veas que inició correctamente
```

### 6. **Verificar variables de entorno**

```bash
docker exec gmarm-backend-prod printenv | grep SPRING_CORS
```

**DEBE mostrar:**
```
SPRING_CORS_ALLOWED_ORIGINS=https://gmarm.com,https://www.gmarm.com
SPRING_CORS_ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
SPRING_CORS_ALLOWED_HEADERS=*
```

### 7. **Probar preflight request**

```bash
curl -X OPTIONS https://api.gmarm.com/api/auth/login \
  -H "Origin: https://gmarm.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

**Debes ver en la respuesta:**
```
< HTTP/1.1 200 OK
< Access-Control-Allow-Origin: https://gmarm.com
< Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
< Access-Control-Allow-Headers: *
```

### 8. **Verificar que funciona en el navegador**

1. Abre el navegador en `https://gmarm.com`
2. Abre las herramientas de desarrollo (F12)
3. Intenta hacer login
4. Verifica que no hay errores de CORS en la consola

## 🐛 Troubleshooting

### Si el error persiste:

1. **Verificar que el backend está usando las variables de entorno correctas:**
   ```bash
   docker exec gmarm-backend-prod printenv | grep SPRING_CORS
   ```

2. **Verificar que el contenedor se reinició con el nuevo código:**
   ```bash
   docker logs gmarm-backend-prod | tail -20
   ```
   
   Deberías ver logs recientes que indiquen que el backend se inició.

3. **Verificar que OPTIONS está siendo manejado:**
   ```bash
   curl -X OPTIONS https://api.gmarm.com/api/auth/login \
     -H "Origin: https://gmarm.com" \
     -i
   ```
   
   Deberías recibir una respuesta `200 OK` con headers CORS.

4. **Verificar el código fuente del SecurityConfig:**
   ```bash
   docker exec gmarm-backend-prod cat /app/BOOT-INF/classes/com/armasimportacion/config/SecurityConfig.class | strings | grep -i "options\|cors"
   ```
   
   (O mejor, verificar los logs de arranque del Spring Boot)

5. **Limpiar cache del navegador:**
   - Presiona `Ctrl + Shift + R` (o `Cmd + Shift + R` en Mac) para hacer un hard refresh
   - O abre una ventana de incógnito

## 📝 Notas Técnicas

### ¿Por qué `setAllowedOriginPatterns` y no `setAllowedOrigins`?

- `setAllowedOriginPatterns` permite usar patrones (útil para subdominios)
- `setAllowedOrigins` requiere URLs exactas y no permite usar `*` cuando `allowCredentials` es `true`
- Como `allowCredentials` es `false` en nuestro caso, podríamos usar cualquiera, pero `patterns` es más flexible

### ¿Por qué permitir OPTIONS explícitamente?

Spring Security a veces bloquea las peticiones OPTIONS antes de que lleguen al filtro CORS. Al permitir OPTIONS explícitamente en `SecurityFilterChain`, nos aseguramos de que el preflight pase.

## ✅ Checklist Post-Despliegue

- [ ] Variables de entorno configuradas correctamente
- [ ] Backend reiniciado con nuevo código
- [ ] Preflight request (OPTIONS) funciona
- [ ] Login funciona desde `https://gmarm.com`
- [ ] No hay errores de CORS en la consola del navegador
- [ ] Headers CORS presentes en las respuestas

---

**Última actualización:** 2024-12-23  
**Problema resuelto:** CORS preflight blocking en producción


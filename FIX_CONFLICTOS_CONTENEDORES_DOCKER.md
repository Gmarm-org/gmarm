# 🔧 Solución: Conflictos de Contenedores en Pipeline CI/CD

## 📋 Problema Identificado

### ❌ **Error:**
```
Error response from daemon: Conflict. The container name "/gmarm-postgres-dev" is already in use by container "23b001ea5dd58a715554916d66a2ed3705b27589e24844df77cd7314ae6b0afc". You have to remove (or rename) that container to be able to reuse that name.
Network dev_gmarm_network Error
Container gmarm-postgres-dev Error
```

### 🔍 **Causa Raíz:**
Cuando el pipeline de GitHub Actions falla o se interrumpe:
1. Los contenedores quedan en estado "Exited" pero **NO se eliminan**
2. Las redes Docker quedan creadas pero marcadas como huérfanas
3. Al intentar ejecutar `docker-compose up -d` nuevamente, Docker detecta que ya existen contenedores con esos nombres
4. Resultado: **Conflicto de nombres y el despliegue falla**

---

## ✅ Solución Implementada

### 1. **Limpieza de Contenedores Zombies**

**Archivo:** `deploy-server.sh` (línea 56-58)

```bash
# Limpiar contenedores zombies que puedan quedar
echo "🧹 Limpiando contenedores huérfanos..."
docker rm -f $(docker ps -a -q --filter "name=gmarm-") 2>/dev/null || true
```

**Explicación:**
- Busca todos los contenedores (activos y detenidos) que tengan "gmarm-" en su nombre
- Los fuerza a eliminar con `rm -f`
- `2>/dev/null || true` evita errores si no hay contenedores que limpiar

### 2. **Limpieza de Redes Huérfanas**

**Archivo:** `deploy-server.sh` (línea 60-62)

```bash
# Limpiar redes huérfanas que puedan quedar
echo "🧹 Limpiando redes huérfanas..."
docker network prune -f || true
```

**Explicación:**
- Elimina todas las redes no utilizadas
- El flag `-f` fuerza la eliminación sin confirmación
- `|| true` evita errores si no hay redes que limpiar

### 3. **Forzar Recreación de Contenedores**

**Archivo:** `deploy-server.sh` (línea 87-89)

```bash
# Iniciar los servicios (forzar recreación para evitar conflictos)
echo "🚀 Iniciando servicios..."
docker-compose -f $COMPOSE_FILE up -d --force-recreate
```

**Explicación:**
- El flag `--force-recreate` fuerza a Docker a recrear contenedores incluso si ya existen
- En combinación con la limpieza previa, garantiza que no haya conflictos

---

## 🔄 Flujo Completo de Limpieza

```
GitHub Actions ejecuta deploy-server.sh
  ↓
1. docker-compose down --remove-orphans
   - Detiene y elimina contenedores definidos en compose
  ↓
2. docker rm -f $(docker ps -a -q --filter "name=gmarm-")
   - Elimina CUALQUIER contenedor con "gmarm-" (incluyendo zombies)
  ↓
3. docker network prune -f
   - Elimina redes huérfanas que puedan quedar
  ↓
4. docker system prune -f --volumes=false
   - Limpia imágenes no utilizadas (PERO NO volúmenes)
  ↓
5. docker-compose build --no-cache
   - Construye nuevas imágenes
  ↓
6. docker-compose up -d --force-recreate
   - Crea contenedores nuevos (sin conflictos)
```

---

## 📊 Impacto

### ✅ **Ventajas:**
1. **Elimina conflictos:** Los contenedores zombies no causan problemas
2. **Limpieza completa:** Las redes huérfanas no interfieren
3. **Recreación forzada:** Garantiza contenedores frescos en cada despliegue
4. **Mantiene datos:** Los volúmenes siguen preservados (BD intacta)

### ⚠️ **Consideraciones:**
1. **Inicio más lento:** La limpieza y recreación toma unos segundos adicionales
2. **Uso temporal:** Solo se aplica durante despliegues automáticos
3. **No afecta local:** Los comandos manuales siguen funcionando igual

---

## 🧪 Verificación

Para verificar que funciona:

```bash
# En el servidor, después de un despliegue fallido:
docker ps -a | grep gmarm-

# Deberías ver SOLO los contenedores activos (Up)
# NO deberías ver contenedores "Exited"

# Verificar redes:
docker network ls | grep gmarm

# Deberías ver SOLO la red activa
```

---

## 📝 Archivos Modificados

**`deploy-server.sh`:**
- Línea 56-58: Limpieza de contenedores zombies
- Línea 60-62: Limpieza de redes huérfanas
- Línea 87-89: Uso de `--force-recreate`

---

## 🎯 Próximos Pasos

1. ✅ El pipeline ya tiene los cambios aplicados
2. ⏭️ El próximo despliegue debería completarse sin conflictos
3. 📊 Monitorear que no haya más errores de conflictos de nombres

---

*Última actualización: 29 de Octubre de 2025*


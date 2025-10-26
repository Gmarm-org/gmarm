# 🚀 EJECUTAR EN SERVIDOR DEV - GUÍA RÁPIDA

## 📋 PROBLEMA ACTUAL
- ❌ Error 400 en login (intermitente)
- ❌ Caracteres con tildes/ñ salen extraños
- ❌ Base de datos inestable (se cae o pierde datos)

## ✅ SOLUCIÓN

### OPCIÓN 1: Script Automático (MÁS RÁPIDO) ⭐

```bash
# 1. Conectar al servidor
ssh user@72.167.52.14

# 2. Ir al directorio del proyecto
cd /ruta/del/proyecto/gmarm

# 3. Crear el script
nano fix-dev-database-utf8-y-estabilidad.sh

# 4. Pegar el contenido del script (ver archivo: fix-dev-database-utf8-y-estabilidad.sh)

# 5. Dar permisos de ejecución
chmod +x fix-dev-database-utf8-y-estabilidad.sh

# 6. Ejecutar
./fix-dev-database-utf8-y-estabilidad.sh

# 7. Esperar a que termine (2-3 minutos)

# 8. Probar login: http://72.167.52.14:5173
```

### OPCIÓN 2: Comandos Manuales (PASO A PASO)

```bash
# 1. Conectar al servidor
ssh user@72.167.52.14
cd /ruta/del/proyecto/gmarm

# 2. Detener servicios
docker-compose -f docker-compose.dev.yml down

# 3. Eliminar volumen de PostgreSQL (IMPORTANTE)
docker volume rm gmarm_postgres_data_dev

# 4. Actualizar archivo backend
nano backend/src/main/resources/application-docker.properties

# Buscar estas líneas y cambiar 'update' por 'validate':
# spring.jpa.hibernate.ddl-auto=validate
# spring.jpa.hibernate.hbm2ddl.auto=validate

# Guardar: Ctrl+O, Enter, Ctrl+X

# 5. Reconstruir y levantar servicios
docker-compose -f docker-compose.dev.yml up -d --build

# 6. Esperar 60 segundos
sleep 60

# 7. Verificar que todo esté OK
docker-compose -f docker-compose.dev.yml ps

# 8. Ver cantidad de registros
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "SELECT COUNT(*) FROM usuario;"
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "SELECT COUNT(*) FROM arma_serie;"

# 9. Verificar UTF-8
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "SHOW server_encoding;"

# 10. Probar caracteres especiales
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "SELECT nombres FROM usuario WHERE nombres LIKE '%á%' OR nombres LIKE '%ñ%' LIMIT 3;"
```

## 🧪 VERIFICAR QUE FUNCIONÓ

### 1. Login
```
URL: http://72.167.52.14:5173
Usuario: jefe@test.com
Password: JefeVentas2024!

Resultado esperado: Login exitoso ✅
```

### 2. Caracteres Especiales
```
- Ir a cualquier usuario o cliente
- Buscar nombres con tildes (José, María, etc.)
- Resultado esperado: Se ven correctamente ✅
```

### 3. Estabilidad
```bash
# Reiniciar backend
docker-compose -f docker-compose.dev.yml restart backend_dev

# Esperar 30 segundos
sleep 30

# Probar login nuevamente
# Resultado esperado: Sigue funcionando ✅
```

## 📊 DATOS ESPERADOS

Después de ejecutar el script, deberías ver:

```
👥 Usuarios: 8
🔫 Armas: 59
🔢 Series: 500
📝 Encoding: UTF8
```

## 🚨 SI ALGO SALE MAL

### Ver logs del backend
```bash
docker-compose -f docker-compose.dev.yml logs -f backend_dev
```

### Ver logs de PostgreSQL
```bash
docker-compose -f docker-compose.dev.yml logs -f postgres_dev
```

### Reiniciar todo de nuevo
```bash
docker-compose -f docker-compose.dev.yml down
docker volume rm gmarm_postgres_data_dev
docker-compose -f docker-compose.dev.yml up -d --build
```

## ⏱️ TIEMPO ESTIMADO

- **Opción 1 (Script)**: 2-3 minutos
- **Opción 2 (Manual)**: 5-7 minutos

## 📝 ARCHIVOS QUE SE MODIFICAN

1. `backend/src/main/resources/application-docker.properties`
   - Cambio: `ddl-auto=update` → `ddl-auto=validate`

2. Volumen Docker: `gmarm_postgres_data_dev`
   - Se elimina y recrea con UTF-8 correcto

## ✅ RESULTADO FINAL

Después de esto:
- ✅ Login funcionará siempre (sin error 400)
- ✅ Tildes y ñ se verán bien
- ✅ Base de datos será estable
- ✅ 500 series disponibles para asignar

---

**💡 TIP**: Si no estás seguro de la ruta del proyecto, usa:
```bash
find / -name "docker-compose.dev.yml" 2>/dev/null
```


# 🔧 Solución: Preservar Datos de Base de Datos en Despliegues CI/CD

## 📋 Problema Identificado

### ❌ **Síntoma:**
- Cada vez que se hacía push a `dev` y se desplegaba a través de GitHub Actions, la base de datos se reiniciaba completamente
- Se perdían todos los datos: clientes, documentos, contratos, pagos, etc.
- No había trazabilidad de datos en el entorno de desarrollo

### 🔍 **Causa Raíz:**
El script `deploy-server.sh` ejecutaba `docker-compose down --volumes`, lo que eliminaba **TODOS** los volúmenes de Docker, incluyendo el volumen persistente de PostgreSQL:

```bash
# ❌ ANTES: Eliminaba volúmenes en cada despliegue
docker-compose -f $COMPOSE_FILE down --volumes --remove-orphans
```

**Resultado:** El volumen `postgres_data_dev` se eliminaba, forzando a PostgreSQL a reejecutar el script de inicialización `00_gmarm_completo.sql` desde cero.

---

## ✅ Solución Implementada

### 1. **Modificación del Script de Despliegue**

**Archivo:** `deploy-server.sh` (línea 52-55)

```bash
# ✅ DESPUÉS: Preserva volúmenes para mantener datos
docker-compose -f $COMPOSE_FILE down --remove-orphans
```

**Cambio:** Se eliminó el flag `--volumes` del comando `docker-compose down`.

### 2. **Comportamiento Esperado**

Ahora, cuando se despliega a través de GitHub Actions:

1. ✅ Se detienen los contenedores existentes
2. ✅ Se eliminan contenedores huérfanos
3. ✅ **Se preservan los volúmenes** (incluyendo `postgres_data_dev`)
4. ✅ Se construyen nuevas imágenes con los cambios
5. ✅ Se reinician los contenedores con la misma base de datos

**Resultado:** Los datos persisten entre despliegues.

---

## 🔄 Flujo de Despliegue Mejorado

### Despliegue Normal (cambios en código):
```
Push a dev → GitHub Actions → deploy-server.sh
  ↓
docker-compose down (SIN --volumes) ← ✅ Preserva datos
  ↓
docker-compose build --no-cache
  ↓
docker-compose up -d
  ↓
Base de datos con datos anteriores + código nuevo
```

### Despliegue con Reset de BD (requerido):
```
# Si necesitas resetear la BD, ejecutar manualmente:
./reset-dev-database.sh
  ↓
docker-compose down -v ← ✅ Solo cuando quieres resetear
  ↓
PostgreSQL ejecuta 00_gmarm_completo.sql desde cero
```

---

## 📊 Impacto

### ✅ **Ventajas:**
1. **Trazabilidad:** Los datos de pruebas persisten entre despliegues
2. **Continuidad:** No pierdes información de clientes, pagos, contratos
3. **Eficiencia:** No necesitas re-ingresar datos de prueba constantemente
4. **Testing:** Puedes probar flujos completos a lo largo del tiempo

### ⚠️ **Consideraciones:**
1. **Script maestro:** El SQL maestro (`00_gmarm_completo.sql`) se ejecuta **SOLO** si el volumen está vacío
2. **Migraciones:** Si cambias el esquema de BD, necesitas aplicar migraciones manualmente o resetear
3. **Reset manual:** Si necesitas resetear la BD, usa `./reset-dev-database.sh`

---

## 🛠️ Scripts Disponibles

### Resetear Base de Datos (Linux):
```bash
./reset-dev-database.sh
```

### Resetear Base de Datos (PowerShell):
```powershell
.\reset-dev-database.ps1
```

### Ver Estado de la Base de Datos:
```bash
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "SELECT COUNT(*) FROM cliente;"
```

---

## 📝 Archivos Modificados

1. **`deploy-server.sh`** (línea 52-55):
   - Se eliminó `--volumes` del comando `docker-compose down`
   - Se agregó comentario explicativo

---

## 🎯 Próximos Pasos

1. ✅ **Commit:** Este cambio ya está aplicado
2. ⏭️ **Próximo despliegue:** Los datos se preservarán
3. 📊 **Monitoreo:** Verificar que los datos persisten después del próximo push a `dev`

---

*Última actualización: 29 de Octubre de 2025*


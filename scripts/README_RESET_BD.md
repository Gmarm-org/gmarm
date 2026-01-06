# Scripts de Reset de Base de Datos

## 📋 Descripción

Scripts para reiniciar completamente la base de datos desde cero y eliminar todos los documentos generados/subidos para liberar espacio en el servidor.

## 🚀 Uso

### Linux/Mac (Bash)

```bash
# Ambiente local (por defecto)
./scripts/reset-bd-desde-cero.sh

# Ambiente específico
./scripts/reset-bd-desde-cero.sh local
./scripts/reset-bd-desde-cero.sh dev
./scripts/reset-bd-desde-cero.sh prod
```

**Antes de ejecutar, dar permisos de ejecución:**
```bash
chmod +x scripts/reset-bd-desde-cero.sh
```

### Windows (PowerShell)

```powershell
# Ambiente local (por defecto)
.\scripts\reset-bd-desde-cero.ps1

# Ambiente específico
.\scripts\reset-bd-desde-cero.ps1 -Ambiente local
.\scripts\reset-bd-desde-cero.ps1 -Ambiente dev
.\scripts\reset-bd-desde-cero.ps1 -Ambiente prod
```

## ⚠️ ADVERTENCIAS

**ESTE SCRIPT ES DESTRUCTIVO. Realiza las siguientes acciones:**

1. ❌ **Elimina completamente la base de datos** (sin crear respaldos)
2. 🗑️ **Elimina TODOS los documentos generados:**
   - `documentacion/documentos_cliente/*`
   - `documentacion/contratos_generados/*`
   - `documentacion/documentos_importacion/*`
   - `documentacion/autorizaciones/*`
3. 🗑️ **Elimina TODOS los archivos subidos:**
   - `uploads/clientes/*`
   - `uploads/images/weapons/*` (archivos, mantiene estructura)
   - `backend/uploads/*`
4. 🔄 **Recrea la base de datos** desde el SQL maestro (`datos/00_gmarm_completo.sql`)
5. 🔧 **Resetea todas las secuencias** de IDs

## 📁 Estructura de Directorios Limpiados

```
documentacion/
├── documentos_cliente/          ❌ ELIMINADO
├── contratos_generados/         ❌ ELIMINADO
├── documentos_importacion/      ❌ ELIMINADO
└── autorizaciones/              ❌ ELIMINADO

uploads/
├── clientes/                    ❌ ELIMINADO
└── images/
    └── weapons/                 ❌ ELIMINADO (archivos)

backend/
└── uploads/                     ❌ ELIMINADO
```

## ✅ Proceso del Script

1. **Confirmación del usuario** (debe escribir "SI")
2. **Detiene servicios Docker** y elimina volúmenes
3. **Elimina documentos y uploads** (libera espacio)
4. **Inicia PostgreSQL** solo
5. **Recrea la base de datos** desde SQL maestro
6. **Verifica datos** cargados
7. **Inicia todos los servicios**

## 📊 Verificación Post-Ejecución

Después de ejecutar el script, verifica:

```bash
# Ver estado de servicios
docker-compose -f docker-compose.local.yml ps

# Verificar datos en BD
docker exec gmarm-postgres-local psql -U postgres -d gmarm_local -c "SELECT COUNT(*) FROM usuario;"
docker exec gmarm-postgres-local psql -U postgres -d gmarm_local -c "SELECT COUNT(*) FROM arma;"
```

## 🔍 Solución de Problemas

### Error: "Cannot start maven from wrapper"
- No es crítico, el script sigue funcionando
- El backend se compilará cuando se inicie el contenedor

### Error: "PostgreSQL no está listo"
- Espera unos segundos más y verifica: `docker logs gmarm-postgres-local`
- Si persiste, reinicia manualmente: `docker-compose -f docker-compose.local.yml restart postgres_local`

### Error: "No se encuentra el archivo SQL maestro"
- Verifica que existe: `ls datos/00_gmarm_completo.sql`
- Asegúrate de estar en el directorio raíz del proyecto

## 💡 Casos de Uso

### Desarrollo Local
```bash
./scripts/reset-bd-desde-cero.sh local
```

### Servidor de Desarrollo
```bash
./scripts/reset-bd-desde-cero.sh dev
```

### Producción (⚠️ MUCHO CUIDADO)
```bash
./scripts/reset-bd-desde-cero.sh prod
```

**NOTA:** En producción, considera hacer un backup antes:
```bash
docker exec gmarm-postgres-prod pg_dump -U postgres gmarm_prod > backup_$(date +%Y%m%d_%H%M%S).sql
```


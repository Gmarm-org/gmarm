# 🧹 LIMPIEZA ARCHIVOS JSON Y SH

## 📊 RESUMEN

**Archivos analizados**:
- `.json`: 15 archivos
- `.sh`: 36 archivos

**Propuesta de limpieza**:
- ✅ **MANTENER**: 15 archivos `.json` + 18 scripts `.sh` útiles
- ❌ **ELIMINAR**: 6 archivos `.json` temporales + 18 scripts `.sh` obsoletos

---

## 🔴 ARCHIVOS JSON A ELIMINAR (6)

### Archivos de Test Temporales en Raíz:

| Archivo | Razón |
|---------|-------|
| `test-login.json` | ❌ Archivo de test temporal (credenciales hardcodeadas) |
| `test-create-cliente.json` | ❌ Archivo de test temporal |
| `test-create-cliente-fechas.json` | ❌ Archivo de test temporal |
| `test-create-cliente-credito-2.json` | ❌ Archivo de test temporal |
| `test-create-cliente-credito-6.json` | ❌ Archivo de test temporal |
| `test-debug-cliente.json` | ❌ Archivo de debug temporal |

**Nota**: Estos archivos eran para testing manual durante desarrollo. Ya no son necesarios.

---

## ✅ ARCHIVOS JSON A MANTENER (9)

### Configuración del Proyecto:

| Archivo | Propósito |
|---------|-----------|
| `package.json` | ✅ Configuración raíz del workspace |
| `package-lock.json` | ✅ Lock file de dependencias raíz |
| `frontend/package.json` | ✅ Dependencias del frontend |
| `frontend/package-lock.json` | ✅ Lock file de frontend |
| `frontend/tsconfig.json` | ✅ Configuración TypeScript principal |
| `frontend/tsconfig.app.json` | ✅ Configuración TypeScript app |
| `frontend/tsconfig.node.json` | ✅ Configuración TypeScript Node |

### Schemas de Validación (Backend):

| Archivo | Propósito |
|---------|-----------|
| `backend/src/main/resources/schemas/cliente-create.schema.json` | ✅ Schema validación creación cliente |
| `backend/src/main/resources/schemas/cliente-response.schema.json` | ✅ Schema validación respuesta cliente |

---

## 🔴 SCRIPTS SH A ELIMINAR (18)

### Categoría: Duplicados/Redundantes (8)

| Script | Razón |
|--------|-------|
| `reset-dev-database.sh` | ❌ Duplicado: existe `scripts/reset-db-dev-100-funcional.sh` (mejor) |
| `deploy-dev-server.sh` | ❌ Duplicado: existe `scripts/deploy-dev.sh` |
| `deploy-server.sh` | ❌ Redundante: usar `scripts/deploy-dev.sh` directamente |
| `diagnose-deploy.sh` | ❌ Temporal: existe `scripts/diagnostico-dev.sh` (mejor) |
| `setup-docker-dev.sh` | ❌ Obsoleto: configuración inicial ya aplicada |
| `scripts/reset-dev-db.sh` | ❌ Redundante: existe versión "100-funcional" |
| `scripts/reset-db-dev-definitivo.sh` | ❌ Redundante: existe versión "100-funcional" |
| `scripts/reset-db-dev-forzado.sh` | ❌ Redundante: existe versión "100-funcional" |

### Categoría: Obsoletos - Init DB (4)

| Script | Razón |
|--------|-------|
| `scripts/init-db.sh` | ❌ Obsoleto: BD ya inicializada, usar reset completo |
| `scripts/init-db-first-time.sh` | ❌ Obsoleto: BD ya inicializada |
| `scripts/init-db-utf8.sh` | ❌ Obsoleto: UTF-8 ya configurado correctamente |
| `fix-dev-database-utf8-y-estabilidad.sh` | ❌ Obsoleto: problema ya resuelto |

### Categoría: Temporales/Fixes Específicos (3)

| Script | Razón |
|--------|-------|
| `scripts/fix-403-dev.sh` | ❌ Fix temporal: problema ya resuelto definitivamente |
| `scripts/fix-oom-definitivo.sh` | ❌ Fix aplicado: cambios ahora en docker-compose |
| `scripts/fix-postgres-loop-dev.sh` | ❌ Fix temporal: problema resuelto con startup faseado |

### Categoría: Clean/Migrate (3)

| Script | Razón |
|--------|-------|
| `scripts/clean-db.sh` | ❌ Peligroso: mejor usar reset completo con backup |
| `scripts/clean-dev.sh` | ❌ Redundante: usar `docker-compose down -v` |
| `scripts/migrate-db.sh` | ❌ Obsoleto: no usamos migraciones, solo SQL maestro |

---

## ✅ SCRIPTS SH A MANTENER (18)

### Categoría: Deployment y Setup (4)

| Script | Propósito |
|--------|-----------|
| `server-setup.sh` | ✅ Setup inicial del servidor (una vez) |
| `scripts/deploy-dev.sh` | ✅ Deploy principal en DEV |
| `scripts/setup-swap.sh` | ✅ Configuración SWAP (crítico para OOM) |
| `scripts/ensure-db-exists.sh` | ✅ Garantiza BD existe (parte de entrypoint) |

### Categoría: Reset y Recuperación (1)

| Script | Propósito |
|--------|-----------|
| `scripts/reset-db-dev-100-funcional.sh` | ✅ Reset completo 100% funcional (EL MEJOR) |

### Categoría: Monitoreo y Diagnóstico (3)

| Script | Propósito |
|--------|-----------|
| `scripts/diagnostico-dev.sh` | ✅ Diagnóstico completo del sistema |
| `scripts/monitor-and-heal-dev.sh` | ✅ Monitoreo con auto-recuperación |
| `scripts/monitor-postgres-health.sh` | ✅ Monitoreo específico PostgreSQL |
| `scripts/monitor-system.sh` | ✅ Monitoreo general del sistema |

### Categoría: Utilidades PostgreSQL (4)

| Script | Propósito |
|--------|-----------|
| `scripts/docker-postgres-entrypoint.sh` | ✅ Entrypoint custom PostgreSQL |
| `scripts/postgres-entrypoint.sh` | ✅ Entrypoint wrapper PostgreSQL |
| `scripts/init-postgres-garantizado.sh` | ✅ Inicialización garantizada |
| `scripts/wait-for-db.sh` | ✅ Espera hasta que BD esté lista |

### Categoría: Verificación y Testing (4)

| Script | Propósito |
|--------|-----------|
| `scripts/check-dev.sh` | ✅ Verificación rápida del estado DEV |
| `scripts/verificar-series-dev.sh` | ✅ Verifica series de armas |
| `scripts/fix-sequences-dev.sh` | ✅ Fix secuencias BD (útil si hay problemas) |
| `scripts/test-github-actions.sh` | ✅ Testing de GitHub Actions |

### Categoría: Reinicio (2)

| Script | Propósito |
|--------|-----------|
| `scripts/reiniciar-servidor-dev.sh` | ✅ Reinicio completo servidor DEV |

---

## 📋 COMANDOS DE LIMPIEZA

### Eliminar archivos JSON temporales (6):

```powershell
Remove-Item test-login.json
Remove-Item test-create-cliente.json
Remove-Item test-create-cliente-fechas.json
Remove-Item test-create-cliente-credito-2.json
Remove-Item test-create-cliente-credito-6.json
Remove-Item test-debug-cliente.json
```

### Eliminar scripts SH obsoletos (18):

```bash
# Raíz (5 scripts)
rm reset-dev-database.sh
rm deploy-dev-server.sh
rm deploy-server.sh
rm diagnose-deploy.sh
rm setup-docker-dev.sh
rm fix-dev-database-utf8-y-estabilidad.sh

# scripts/ (12 scripts)
rm scripts/reset-dev-db.sh
rm scripts/reset-db-dev-definitivo.sh
rm scripts/reset-db-dev-forzado.sh
rm scripts/init-db.sh
rm scripts/init-db-first-time.sh
rm scripts/init-db-utf8.sh
rm scripts/fix-403-dev.sh
rm scripts/fix-oom-definitivo.sh
rm scripts/fix-postgres-loop-dev.sh
rm scripts/clean-db.sh
rm scripts/clean-dev.sh
rm scripts/migrate-db.sh
```

---

## 📊 RESULTADO FINAL

### Antes:
- 15 archivos `.json` (6 temporales innecesarios)
- 36 scripts `.sh` (18 obsoletos/redundantes)

### Después:
- 9 archivos `.json` útiles (configuración + schemas)
- 18 scripts `.sh` útiles (organizados por categoría)

### Beneficios:
- 📁 24 archivos menos (más limpio)
- 📖 Scripts claramente organizados
- 🚀 Solo lo necesario para operación
- ✅ Mejor mantenibilidad

---

## 📚 SCRIPTS ÚTILES FINALES

### Para Servidor (Linux):

```bash
# Setup inicial (una vez)
sudo bash server-setup.sh
sudo bash scripts/setup-swap.sh

# Deployment
bash scripts/deploy-dev.sh

# Reset completo (si hay problemas)
bash scripts/reset-db-dev-100-funcional.sh

# Monitoreo
bash scripts/diagnostico-dev.sh
bash scripts/monitor-and-heal-dev.sh
bash scripts/monitor-postgres-health.sh

# Verificación
bash scripts/check-dev.sh
bash scripts/verificar-series-dev.sh

# Reinicio
bash scripts/reiniciar-servidor-dev.sh
```

---

**Fecha**: 2024-11-03  
**Estado**: Propuesta de limpieza fase 2  
**Acción**: Revisar y aprobar antes de ejecutar eliminación


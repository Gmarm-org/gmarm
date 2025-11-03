# 🧹 LIMPIEZA DE SCRIPTS - ANÁLISIS

## 📊 RESUMEN

**Total scripts**: 21 archivos `.ps1`
- **Raíz**: 17 scripts
- **scripts/**: 4 scripts

**Propuesta**:
- ✅ **MANTENER**: 4 scripts útiles
- ❌ **ELIMINAR**: 17 scripts obsoletos/redundantes

---

## ✅ SCRIPTS ÚTILES (MANTENER - 4)

### 📂 Raíz del Proyecto

| Script | Propósito | Razón |
|--------|-----------|-------|
| `start-local.ps1` | Inicia servicios locales | ✅ Comando rápido para desarrolladores Windows |
| `stop-local.ps1` | Detiene servicios locales | ✅ Comando rápido para desarrolladores Windows |
| `restart-backend-only.ps1` | Reinicia solo backend | ✅ Útil para desarrollo rápido (cambios Java) |

### 📂 scripts/

| Script | Propósito | Razón |
|--------|-----------|-------|
| `scripts/monitor-system-simple.ps1` | Monitoreo básico del sistema | ✅ Útil para Windows, versión simplificada |

---

## ❌ SCRIPTS OBSOLETOS (ELIMINAR - 17)

### 🔴 Categoría: Duplicados/Redundantes (6)

| Script | Razón para Eliminar |
|--------|---------------------|
| `reset-dev-database.ps1` | ❌ Duplicado: existe `scripts/reset-dev-db.ps1` (mejor versión) |
| `restart-complete.ps1` | ❌ Redundante: usar `docker-compose restart` directamente |
| `restart-dev-env.ps1` | ❌ Redundante: usar `docker-compose -f docker-compose.dev.yml restart` |
| `restart-frontend-local.ps1` | ❌ Muy específico: usar `docker-compose restart frontend_local` |
| `restart-frontend-dev.ps1` | ❌ Muy específico: usar `docker-compose restart frontend_dev` |
| `scripts/monitor-system.ps1` | ❌ Redundante: existe `monitor-system-simple.ps1` y `.sh` |

### 🔴 Categoría: Temporales/Debug (3)

| Script | Razón para Eliminar |
|--------|---------------------|
| `diagnose-server.ps1` | ❌ Script temporal de debugging (ya existe `diagnose-server.sh` mejor) |
| `test-armas.ps1` | ❌ Script de test temporal (no parte del proyecto final) |
| `scripts/fix-sequences-dev.ps1` | ❌ Fix específico temporal (ya aplicado en BD) |

### 🔴 Categoría: Obsoletos - Generación de Imágenes (4)

| Script | Razón para Eliminar |
|--------|---------------------|
| `generate-unique-weapon-svgs.ps1` | ❌ Generación de imágenes obsoleta (ya no se usan SVGs generados) |
| `generate-weapon-svgs.ps1` | ❌ Generación de imágenes obsoleta |
| `download-real-weapon-images.ps1` | ❌ Descarga de imágenes obsoleta (imágenes ya en repo) |
| `download-weapon-images.ps1` | ❌ Descarga de imágenes obsoleta |

### 🔴 Categoría: Verificación Temporal (2)

| Script | Razón para Eliminar |
|--------|---------------------|
| `verify-contracts-simple.ps1` | ❌ Script de verificación temporal (debug) |
| `verify-contracts.ps1` | ❌ Script de verificación temporal (debug) |

### 🔴 Categoría: Ya No Necesarios (2)

| Script | Razón para Eliminar |
|--------|---------------------|
| `scripts/init-db-utf8.ps1` | ❌ Ya no necesario: BD ya configurada con UTF-8 correcto |
| `scripts/reset-dev-db.ps1` | ❌ Mejor usar versión `.sh` en servidor (Linux) |

---

## 📋 COMANDOS DE LIMPIEZA

### Eliminar Scripts Obsoletos:

```powershell
# RAÍZ (14 scripts)
Remove-Item reset-dev-database.ps1
Remove-Item restart-complete.ps1
Remove-Item restart-dev-env.ps1
Remove-Item restart-frontend-local.ps1
Remove-Item restart-frontend-dev.ps1
Remove-Item diagnose-server.ps1
Remove-Item test-armas.ps1
Remove-Item generate-unique-weapon-svgs.ps1
Remove-Item generate-weapon-svgs.ps1
Remove-Item download-real-weapon-images.ps1
Remove-Item download-weapon-images.ps1
Remove-Item verify-contracts-simple.ps1
Remove-Item verify-contracts.ps1

# scripts/ (3 scripts)
Remove-Item scripts/monitor-system.ps1
Remove-Item scripts/fix-sequences-dev.ps1
Remove-Item scripts/init-db-utf8.ps1
Remove-Item scripts/reset-dev-db.ps1
```

---

## 📚 SCRIPTS ÚTILES FINALES

### Para Desarrollo Local (Windows):

```powershell
# Iniciar servicios
.\start-local.ps1

# Detener servicios
.\stop-local.ps1

# Reiniciar solo backend (después de cambios Java)
.\restart-backend-only.ps1

# Monitoreo del sistema
.\scripts\monitor-system-simple.ps1
```

### Para Servidor (Linux) - Usar `.sh`:

```bash
# Reset de BD en DEV
bash scripts/reset-db-dev-100-funcional.sh

# Diagnóstico
bash scripts/diagnostico-dev.sh

# Monitoreo
bash scripts/monitor-and-heal-dev.sh
```

---

## ✅ RESULTADO FINAL

**Antes**:
- 21 scripts `.ps1` (confuso, difícil de mantener)

**Después**:
- 4 scripts `.ps1` útiles (claros, específicos)
- Scripts `.sh` para servidor (mejor para producción)

**Beneficios**:
- 📁 Menos archivos en raíz (más limpio)
- 📖 Más fácil de entender qué scripts usar
- 🚀 Mejor mantenibilidad
- ✅ Separación clara: `.ps1` para Windows local, `.sh` para servidor Linux

---

**Fecha**: 2024-11-03  
**Estado**: Propuesta de limpieza  
**Acción**: Revisar y aprobar antes de ejecutar eliminación


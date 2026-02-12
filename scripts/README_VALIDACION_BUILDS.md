# 🔍 Validación de Builds - GMARM

## ¿Qué es esto?

Sistema automático de validación de builds para evitar que código que no compila llegue al CI/CD.

## 🎯 Componentes

### 1. Pre-push Hook (Automático)
Se ejecuta **automáticamente** antes de cada `git push`.

**Ubicación:** `.git/hooks/pre-push`

**Qué hace:**
1. Compila el Frontend (`npm run build`)
2. Compila el Backend (`docker-compose build`)
3. **Bloquea el push** si alguno falla
4. Muestra errores de compilación

**Ejemplo de uso:**
```bash
git push

# Output:
# 🔍 Pre-push validation: Verificando builds...
# 📦 [1/2] Compilando Frontend...
# ✅ Frontend build exitoso
# 🏗️  [2/2] Compilando Backend (Docker)...
# ✅ Backend build exitoso
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ✅ Todos los builds pasaron - Permitiendo push
```

### 2. Script de Validación Manual
Ejecuta la misma validación **sin hacer push**.

**Ubicación:** `scripts/validate-build.sh`

**Cuándo usarlo:**
- Antes de hacer commit
- Para verificar que tu código compila
- Después de cambios grandes
- Antes de crear un Pull Request

**Uso:**
```bash
# Desde el directorio raíz del proyecto
./scripts/validate-build.sh

# O desde cualquier lugar
bash scripts/validate-build.sh
```

## 🚫 ¿Qué pasa si un build falla?

### Frontend falla:
```bash
❌ Frontend build FALLÓ

Errores del frontend:
Error: src/pages/RoleSelection/RoleSelection.tsx(7,9):
error TS6133: 'navigate' is declared but its value is never read.

❌ PUSH BLOQUEADO
```

**Solución:**
1. Lee los errores mostrados
2. Corrige los errores en tu código
3. Vuelve a intentar el push

### Backend falla:
```bash
❌ Backend build FALLÓ

Errores del backend:
[ERROR] /app/src/main/java/.../Controller.java:[45,8]
cannot find symbol

❌ PUSH BLOQUEADO
```

**Solución:**
1. Lee los errores de compilación
2. Corrige los errores en tu código Java
3. Vuelve a intentar el push

## 📋 Logs de Compilación

Si necesitas ver los logs completos:

```bash
# Frontend
cat /tmp/frontend-build.log

# Backend
cat /tmp/backend-build.log
```

## ⚙️ Deshabilitar temporalmente (NO RECOMENDADO)

Si necesitas hacer push sin validación (emergencia):

```bash
git push --no-verify
```

**⚠️ ADVERTENCIA:** Esto saltará el pre-push hook y puede causar que el CI/CD falle.

## 🔧 Mantenimiento

### Actualizar pre-push hook
Si necesitas modificar el pre-push hook:

```bash
# Editar
nano .git/hooks/pre-push

# Asegurar que sea ejecutable
chmod +x .git/hooks/pre-push
```

### Reinstalar pre-push hook
Si por alguna razón el hook se borra:

```bash
# Copiar el script de validación como base
cp scripts/validate-build.sh .git/hooks/pre-push

# Hacer ejecutable
chmod +x .git/hooks/pre-push
```

## 📊 Estadísticas

- **Tiempo promedio Frontend:** ~3-5 segundos
- **Tiempo promedio Backend:** ~30-60 segundos (primera vez), ~5-10 segundos (con cache)
- **Tiempo total:** ~40-70 segundos

## 🎓 Mejores Prácticas

1. ✅ **Ejecutar validación manual** antes de commit grandes
2. ✅ **No usar --no-verify** a menos que sea absolutamente necesario
3. ✅ **Corregir errores inmediatamente** - no acumularlos
4. ✅ **Revisar logs completos** si el error no es claro
5. ✅ **Hacer commits pequeños** - más fáciles de validar

## 🐛 Troubleshooting

### "docker-compose command not found"
```bash
# Instalar Docker Desktop
# https://www.docker.com/products/docker-desktop
```

### "npm command not found"
```bash
# Instalar Node.js
# https://nodejs.org/
```

### Hook no se ejecuta
```bash
# Verificar que existe y es ejecutable
ls -la .git/hooks/pre-push

# Si no es ejecutable
chmod +x .git/hooks/pre-push
```

## 📚 Referencias

- [Git Hooks Documentation](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)
- [Pre-push Hook](https://git-scm.com/docs/githooks#_pre_push)
- [TypeScript Compiler](https://www.typescriptlang.org/docs/handbook/compiler-options.html)
- [Maven Lifecycle](https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle.html)

---

**Última actualización:** Febrero 2026

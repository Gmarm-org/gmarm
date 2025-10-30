# 🔄 Solución: Limpiar Cache de Navegador

## 🚨 Problema Detectado

Las imágenes muestran datos que **NO existen en la BD**:
- "CZ P-10 PARA" - **NO EXISTE** en `00_gmarm_completo.sql`
- Nombres de armas diferentes entre navegadores
- "caracteres extraños" que no deberían existir

## ✅ **SOLUCIÓN: Limpiar Cache del Navegador**

### **Opción 1: Hard Refresh (Más Rápido)**

| Navegador | Comando |
|-----------|---------|
| **Chrome/Edge** | `Ctrl + Shift + R` o `Ctrl + F5` |
| **Firefox** | `Ctrl + Shift + R` o `Ctrl + F5` |
| **Safari** | `Cmd + Shift + R` |
| **Opera** | `Ctrl + F5` |

### **Opción 2: Limpiar Cache Manualmente**

#### **Google Chrome / Edge**
1. Abrir DevTools: `F12`
2. Click derecho en el botón de **Refresh** (⟳)
3. Seleccionar **"Empty Cache and Hard Reload"**

#### **Firefox**
1. Abrir DevTools: `F12`
2. Ir a pestaña **Network**
3. Marcar checkbox **"Disable cache"**
4. Hacer `F5` para refrescar

### **Opción 3: Limpieza Completa del Navegador**

```
Chrome/Edge:
- Ctrl + Shift + Delete
- Seleccionar "All time"
- Marcar: Cached images and files
- Click "Clear data"

Firefox:
- Ctrl + Shift + Delete
- Seleccionar "Everything"
- Marcar: Cache
- Click "Clear Now"
```

## 🔍 **Verificar que los Datos Sean Correctos**

Después de limpiar cache, los datos deben coincidir con la BD:

### **Armas Correctas en BD:**
- ✅ **CZ P-10 C** (NO "PARA")
- ✅ **CZ P-10 F OR** (NO "PARA")
- ✅ **CZ P-10 C OR FDE**
- ✅ **CZ P-09 F Nocturne FDE**
- ✅ **CZ Shadow 2 Carry**
- ✅ **CZ Shadow 2 Compact OR**

### **Valores de Pago:**
- ✅ Números a texto **COMPLETAMENTE EN MAYÚSCULAS**
- ✅ Ejemplo: "QUINIENTOS VEINTINUEVE" (NO "QUINIENTOS VEINTInueve")

## 🧪 **Prueba de Verificación**

1. Abrir `http://localhost:5173` o `http://72.167.52.14:5173`
2. Hacer **Hard Refresh**: `Ctrl + Shift + R`
3. Iniciar sesión como vendedor
4. Crear un **nuevo cliente** (no usar uno existente de cache)
5. Seleccionar arma: **CZ P-10 F OR**
6. Verificar que el nombre sea **EXACTO**: "CZ P-10 F OR"
7. Generar contrato
8. Verificar que los números estén en **mayúsculas**: "VEINTINUEVE", "DOSCIENTOS"

## 🚨 **Si Persiste el Problema**

### **Verificar en el Backend**
```bash
# Ver datos en PostgreSQL
docker exec gmarm-postgres-local psql -U postgres -d gmarm_dev -c "SELECT nombre FROM arma WHERE nombre LIKE '%P-10%';"
```

Deberías ver:
```
CZ P-10 C
CZ P-10 F OR
CZ P-10 C OR FDE
CZ P-10 SC FDE
...
```

### **Verificar Logs del Backend**
```bash
docker logs gmarm-backend-local | grep -i "arma"
```

### **Limpiar TODO y Reiniciar**
```bash
# Detener servicios
docker-compose -f docker-compose.local.yml down -v

# Limpiar cache de navegador (Ctrl + Shift + Delete)

# Reiniciar servicios
docker-compose -f docker-compose.local.yml up -d --build

# Esperar arranque y hacer Hard Refresh
```

## 📋 **Checklist de Verificación**

- [ ] Hard Refresh hecho (`Ctrl + Shift + R`)
- [ ] Nombres de armas coinciden con BD
- [ ] No aparece "PARA" en ningún nombre
- [ ] Números en contrato están en MAYÚSCULAS
- [ ] Fechas correctas (sin desfases)
- [ ] Estado militar dinámico (activo/pasivo)
- [ ] Imágenes cargan correctamente
- [ ] Stock se muestra (si es Expoferia)

## 🎯 **En el Servidor DEV**

```bash
# En el servidor, ejecutar:
cd /path/to/gmarm
git pull origin dev
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d --build

# Los usuarios deben hacer Hard Refresh en sus navegadores
```

---

**Fecha**: 2025-10-30  
**Versión**: 1.0


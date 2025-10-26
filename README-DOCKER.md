pero# 🐳 Docker para Desarrollo - GMARM

## 🚀 Inicio Rápido

### 🏠 **Desarrollo LOCAL:**
```powershell
.\start-local.ps1
```

### 🌐 **Desarrollo en SERVIDOR:**
```powershell
.\restart-dev-env.ps1
```

---

## 📁 **Archivos de Configuración**

### 🏠 **Local** (`docker-compose.local.yml`)
- Frontend: http://localhost:5173
- Backend: http://localhost:8080
- Base de datos: postgresql://localhost:5432

### 🌐 **Servidor** (`docker-compose.dev.yml`)
- Frontend: http://72.167.52.14:5173
- Backend: http://72.167.52.14:8080
- Base de datos: postgresql://72.167.52.14:5432

---

## 🔧 **Scripts Disponibles**

### 🏠 **Local:**
- `start-local.ps1` - Iniciar todo
- `stop-local.ps1` - Detener todo
- `restart-frontend-local.ps1` - Reiniciar frontend

### 🌐 **Servidor:**
- `restart-dev-env.ps1` - Reiniciar todo
- `restart-frontend-dev.ps1` - Reiniciar frontend

---

## ⚠️ **Importante**
- **NO ejecutes** ambos entornos al mismo tiempo
- **Usa LOCAL** para desarrollo en tu máquina
- **Usa SERVIDOR** para desarrollo remoto

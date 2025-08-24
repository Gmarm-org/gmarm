# 🚀 GMARM - GUÍA DE DESARROLLO

## 📋 ÍNDICE
- [Configuración Local](#configuración-local)
- [Configuración en Servidor](#configuración-en-servidor)
- [Solución de Problemas](#solución-de-problemas)
- [Comandos Útiles](#comandos-útiles)

---

## 🏠 CONFIGURACIÓN LOCAL

### ✅ Requisitos Previos
- Docker Desktop
- Docker Compose
- Git

### 🚀 Inicio Rápido
```bash
# 1. Clonar el repositorio
git clone <tu-repo>
cd gmarm

# 2. Iniciar servicios de desarrollo
docker-compose -f docker-compose.dev.yml up --build -d

# 3. Verificar servicios
docker-compose -f docker-compose.dev.yml ps
```

### 🌐 URLs Locales
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8080
- **Base de Datos**: localhost:5432

---

## 🖥️ CONFIGURACIÓN EN SERVIDOR

### 📁 Archivos de Configuración
- `docker-compose.dev.yml` - Configuración de servicios
- `env.dev.server` - Variables de entorno para servidor
- `deploy-dev-server.sh` - Script de despliegue automático

### 🚀 Despliegue en Servidor

#### **Opción 1: Script Automático (Recomendado)**
```bash
# 1. Subir archivos al servidor
scp -r . usuario@72.167.52.14:/ruta/destino

# 2. Conectar al servidor
ssh usuario@72.167.52.14

# 3. Ejecutar script de despliegue
chmod +x deploy-dev-server.sh
./deploy-dev-server.sh
```

#### **Opción 2: Manual**
```bash
# 1. Crear archivo de variables de entorno
cp env.dev.server .env.dev.local

# 2. Editar IPs según tu servidor
nano .env.dev.local

# 3. Desplegar servicios
docker-compose -f docker-compose.dev.yml --env-file .env.dev.local up --build -d
```

### 🌐 URLs del Servidor
- **Frontend**: http://72.167.52.14:5173
- **Backend**: http://72.167.52.14:8080
- **Base de Datos**: localhost:5432

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### ❌ Error de CORS
**Síntoma**: `Access to fetch at 'http://localhost:8080/api/auth/login' has been blocked by CORS policy`

**Causa**: El frontend está intentando acceder a localhost desde el servidor

**Solución**:
1. Verificar que `BACKEND_URL` en `.env.dev.local` apunte a la IP del servidor
2. Verificar que `FRONTEND_URL` en `.env.dev.local` apunte a la IP del servidor
3. Reiniciar servicios: `docker-compose -f docker-compose.dev.yml restart`

### ❌ Imágenes no cargan
**Síntoma**: Las imágenes de armas no se muestran

**Causa**: Las imágenes no están en el contenedor del frontend

**Solución**:
1. Verificar que las imágenes estén en `frontend/public/images/weapons/`
2. Reconstruir el contenedor: `docker-compose -f docker-compose.dev.yml up --build -d`

### ❌ Base de datos no conecta
**Síntoma**: Error de conexión a PostgreSQL

**Causa**: Base de datos no iniciada o credenciales incorrectas

**Solución**:
1. Verificar estado: `docker-compose -f docker-compose.dev.yml ps`
2. Ver logs: `docker-compose -f docker-compose.dev.yml logs postgres_dev`
3. Reiniciar: `docker-compose -f docker-compose.dev.yml restart postgres_dev`

---

## 📋 COMANDOS ÚTILES

### 🐳 Docker Compose
```bash
# Ver estado de servicios
docker-compose -f docker-compose.dev.yml ps

# Ver logs en tiempo real
docker-compose -f docker-compose.dev.yml logs -f

# Ver logs de un servicio específico
docker-compose -f docker-compose.dev.yml logs -f backend_dev
docker-compose -f docker-compose.dev.yml logs -f frontend_dev

# Reiniciar un servicio
docker-compose -f docker-compose.dev.yml restart backend_dev

# Detener todos los servicios
docker-compose -f docker-compose.dev.yml down

# Detener y eliminar volúmenes
docker-compose -f docker-compose.dev.yml down -v
```

### 🔍 Debugging
```bash
# Entrar al contenedor del backend
docker exec -it gmarm-backend-dev /bin/bash

# Entrar al contenedor del frontend
docker exec -it gmarm-frontend-dev /bin/bash

# Ver archivos en el contenedor
docker exec gmarm-frontend-dev ls -la /app/public/images/weapons/

# Ver logs del sistema
docker logs gmarm-backend-dev --tail 50
```

### 🧹 Limpieza
```bash
# Eliminar contenedores huérfanos
docker container prune -f

# Eliminar imágenes no utilizadas
docker image prune -f

# Eliminar volúmenes no utilizados (¡CUIDADO!)
docker volume prune -f

# Limpieza completa
docker system prune -a -f
```

---

## 📚 ESTRUCTURA DEL PROYECTO

```
gmarm/
├── backend/                 # Backend Spring Boot
│   ├── src/
│   ├── Dockerfile
│   └── pom.xml
├── frontend/               # Frontend React/TypeScript
│   ├── src/
│   ├── public/
│   │   └── images/weapons/ # Imágenes de armas
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── package.json
├── datos/                  # Scripts de base de datos
│   └── 00_gmarm_completo.sql
├── docker-compose.dev.yml  # Configuración de desarrollo
├── docker-compose.prod.yml # Configuración de producción
├── env.dev.server          # Variables para servidor
├── deploy-dev-server.sh    # Script de despliegue
└── README-DEV.md          # Esta guía
```

---

## 🎯 CARACTERÍSTICAS IMPLEMENTADAS

### ✅ Sistema de Imágenes Flexible
- Soporte para múltiples formatos: PNG, JPG, WebP, SVG, GIF
- Detección automática de formato
- Fallback automático entre formatos
- URLs sin extensiones en la base de datos

### ✅ Configuración CORS Inteligente
- Variables de entorno configurables
- Soporte para múltiples orígenes
- Configuración automática para desarrollo y servidor

### ✅ Base de Datos Limpia
- Script maestro SQL para inicialización
- Datos de prueba incluidos
- Estructura consistente

---

## 🚨 NOTAS IMPORTANTES

1. **Nunca subir `.env.dev.local` a Git** - Contiene credenciales
2. **Siempre verificar CORS** antes de hacer commit
3. **Las imágenes deben estar en `frontend/public/images/weapons/`**
4. **El backend debe estar expuesto en el puerto configurado**
5. **Verificar logs después de cada despliegue**

---

## 📞 SOPORTE

Si encuentras problemas:
1. Revisar logs: `docker-compose -f docker-compose.dev.yml logs -f`
2. Verificar estado: `docker-compose -f docker-compose.dev.yml ps`
3. Revisar esta guía de solución de problemas
4. Verificar configuración de variables de entorno

---

**🎉 ¡Desarrollo feliz!**

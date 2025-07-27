# 🚀 GUÍA DE DESPLIEGUE - DOCKER CI/CD

## 📋 RESUMEN DEL SISTEMA

El sistema está configurado para despliegue automatizado usando:
- **Docker Compose** para orquestación de contenedores
- **GitHub Actions** para CI/CD automatizado
- **Ubuntu Server** como entorno de producción
- **PostgreSQL** como base de datos

---

## 🔧 CONFIGURACIÓN DE AMBIENTES

### **🏗️ Desarrollo (dev)**
- **Branch:** `dev`
- **Docker Compose:** `docker-compose.dev.yml`
- **Puertos:**
  - Frontend: `3000:5173`
  - Backend: `8080:8080`
  - PostgreSQL: `5432:5432`

### **🚀 Producción (main)**
- **Branch:** `main`
- **Docker Compose:** `docker-compose.prod.yml`
- **Puertos:**
  - Frontend: `80:80`
  - Backend: `8080:8080`
  - PostgreSQL: `5433:5432`

---

## 🔑 CREDENCIALES POR AMBIENTE

### **👤 Desarrollo**
- **Admin:** `admin@armasimportacion.com` / `admin123`
- **Vendedor:** `vendedor@test.com` / `admin123`
- **Jefe Ventas:** `jefe@test.com` / `admin123`
- **Finanzas:** `finanzas@test.com` / `admin123`
- **Operaciones:** `operaciones@test.com` / `admin123`

### **👤 Producción**
- **Admin:** Configurar en variables de entorno
- **Otros usuarios:** Crear manualmente o migrar desde dev

---

## 🚀 DESPLIEGUE AUTOMATIZADO

### **1. Configuración de GitHub Secrets**

Configurar en el repositorio de GitHub:

```bash
# Secrets requeridos
SSH_PRIVATE_KEY=tu-clave-ssh-privada
SERVER_HOST=ip-del-servidor
SERVER_USER=usuario-del-servidor

# Secrets opcionales para producción
JWT_SECRET=clave-secreta-jwt-produccion
API_URL=https://tudominio.com/api
MAIL_HOST=smtp.gmail.com
MAIL_USERNAME=tu-email@gmail.com
MAIL_PASSWORD=tu-password-app
```

### **2. Estructura del Servidor**

```bash
/home/usuario/
├── deploy/
│   ├── dev/
│   │   ├── docker-compose.dev.yml
│   │   ├── .env.dev
│   │   └── datos/
│   └── prod/
│       ├── docker-compose.prod.yml
│       ├── .env.prod
│       └── datos/
```

### **3. Flujo de Despliegue**

#### **Desarrollo:**
```bash
# Push a branch 'dev'
git push origin dev

# GitHub Actions ejecuta:
# 1. Tests (backend + frontend)
# 2. Build de imágenes Docker
# 3. Deploy a servidor dev
# 4. Health check
```

#### **Producción:**
```bash
# Push a branch 'main'
git push origin main

# GitHub Actions ejecuta:
# 1. Tests (backend + frontend)
# 2. Build de imágenes Docker
# 3. Deploy a servidor prod
# 4. Health check
```

---

## 🛠️ DESPLIEGUE MANUAL

### **1. Preparar el Servidor**

```bash
# Conectar al servidor
ssh usuario@ip-servidor

# Crear directorios de despliegue
mkdir -p /home/usuario/deploy/{dev,prod}

# Clonar repositorio
cd /home/usuario/deploy/dev
git clone https://github.com/tu-usuario/gmarm.git .

cd /home/usuario/deploy/prod
git clone https://github.com/tu-usuario/gmarm.git .
```

### **2. Configurar Variables de Entorno**

#### **Desarrollo:**
```bash
cd /home/usuario/deploy/dev
cp env.prod.example .env.dev
nano .env.dev
```

#### **Producción:**
```bash
cd /home/usuario/deploy/prod
cp env.prod.example .env.prod
nano .env.prod
```

### **3. Ejecutar Despliegue**

#### **Desarrollo:**
```bash
cd /home/usuario/deploy/dev
docker compose -f docker-compose.dev.yml up -d --build
```

#### **Producción:**
```bash
cd /home/usuario/deploy/prod
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 🔍 MONITOREO Y LOGS

### **Verificar Estado de Contenedores**
```bash
# Ver contenedores activos
docker compose -f docker-compose.dev.yml ps

# Ver logs de un servicio
docker compose -f docker-compose.dev.yml logs backend
docker compose -f docker-compose.dev.yml logs frontend
docker compose -f docker-compose.dev.yml logs postgres_dev
```

### **Health Checks**
```bash
# Backend health
curl http://localhost:8080/actuator/health

# Frontend (desde navegador)
http://localhost:3000
```

### **Base de Datos**
```bash
# Conectar a PostgreSQL
docker exec -it gmarm-postgres-dev psql -U postgres -d gmarm_db

# Verificar tablas
\dt

# Verificar usuarios
SELECT username, email, estado FROM usuario;
```

---

## 🔧 MANTENIMIENTO

### **Actualizar Código**
```bash
# En el servidor
cd /home/usuario/deploy/dev
git pull origin dev
docker compose -f docker-compose.dev.yml up -d --build

cd /home/usuario/deploy/prod
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```

### **Backup de Base de Datos**
```bash
# Backup
docker exec gmarm-postgres-dev pg_dump -U postgres gmarm_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
docker exec -i gmarm-postgres-dev psql -U postgres gmarm_db < backup_file.sql
```

### **Limpiar Recursos**
```bash
# Limpiar contenedores no utilizados
docker system prune -f

# Limpiar imágenes no utilizadas
docker image prune -f

# Limpiar volúmenes no utilizados
docker volume prune -f
```

---

## 🚨 TROUBLESHOOTING

### **Problemas Comunes**

#### **1. Contenedor no inicia**
```bash
# Ver logs detallados
docker compose -f docker-compose.dev.yml logs --tail=100 backend

# Verificar configuración
docker compose -f docker-compose.dev.yml config
```

#### **2. Error de conexión a base de datos**
```bash
# Verificar que PostgreSQL esté corriendo
docker compose -f docker-compose.dev.yml ps postgres_dev

# Verificar logs de PostgreSQL
docker compose -f docker-compose.dev.yml logs postgres_dev
```

#### **3. Error de CORS**
```bash
# Verificar configuración CORS en backend
docker compose -f docker-compose.dev.yml logs backend | grep CORS

# Verificar variables de entorno
docker compose -f docker-compose.dev.yml exec backend env | grep CORS
```

#### **4. Error de JWT**
```bash
# Verificar variable JWT_SECRET
docker compose -f docker-compose.dev.yml exec backend env | grep JWT

# Verificar logs de autenticación
docker compose -f docker-compose.dev.yml logs backend | grep JWT
```

### **Comandos de Diagnóstico**
```bash
# Verificar recursos del sistema
docker system df

# Verificar uso de red
docker network ls
docker network inspect gmarm_gmarm-network

# Verificar volúmenes
docker volume ls
docker volume inspect gmarm_postgres_data_dev
```

---

## 📊 MÉTRICAS Y MONITOREO

### **Métricas del Sistema**
```bash
# Uso de CPU y memoria
docker stats

# Logs en tiempo real
docker compose -f docker-compose.dev.yml logs -f
```

### **Endpoints de Monitoreo**
- **Health Check:** `http://localhost:8080/actuator/health`
- **Info:** `http://localhost:8080/actuator/info`
- **Metrics:** `http://localhost:8080/actuator/metrics`

---

## 🔒 SEGURIDAD

### **Configuración de Seguridad**
- ✅ JWT con clave secreta configurable
- ✅ CORS configurado por ambiente
- ✅ Variables de entorno para credenciales
- ✅ Base de datos con usuarios específicos
- ✅ Contenedores aislados en red Docker

### **Recomendaciones de Seguridad**
1. **Cambiar credenciales por defecto** en producción
2. **Usar HTTPS** en producción
3. **Configurar firewall** en el servidor
4. **Hacer backups regulares** de la base de datos
5. **Monitorear logs** regularmente

---

## 📞 SOPORTE

### **Comandos Útiles**
```bash
# Reiniciar servicios
docker compose -f docker-compose.dev.yml restart

# Ver logs en tiempo real
docker compose -f docker-compose.dev.yml logs -f

# Ejecutar comandos en contenedor
docker compose -f docker-compose.dev.yml exec backend bash
docker compose -f docker-compose.dev.yml exec postgres_dev psql -U postgres
```

### **Contacto**
- **Documentación:** README_CREDENCIALES.md
- **Pruebas:** PRUEBAS_UNITARIAS.md
- **Configuración:** DEPLOYMENT_GUIDE.md

---

**¡Sistema de despliegue completo y listo para producción!** 🎉 
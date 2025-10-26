# 🎯 **GMARM - Sistema de Importación de Armas**

Sistema completo para la gestión de importación de armas con roles de usuario diferenciados.

[![CI/CD Pipeline](https://github.com/Gmarm-org/gmarm/actions/workflows/deploy.yml/badge.svg)](https://github.com/Gmarm-org/gmarm/actions/workflows/deploy.yml)
[![Monitoring](https://github.com/Gmarm-org/gmarm/actions/workflows/monitor.yml/badge.svg)](https://github.com/Gmarm-org/gmarm/actions/workflows/monitor.yml)

## 🚀 **Estado Actual**

- ✅ **Backend**: Spring Boot con autenticación JWT
- ✅ **Frontend**: React con TypeScript y Tailwind CSS
- ✅ **Base de datos**: PostgreSQL con esquema completo
- ✅ **Docker**: Configuración completa para desarrollo y producción
- ✅ **CI/CD**: GitHub Actions con deployment automático
- ✅ **Monitoring**: Health checks y alertas automáticas

## 🏗️ **Arquitectura**

```
Frontend (React) ←→ Backend (Spring Boot) ←→ PostgreSQL
```

## 🛠️ **Tecnologías**

- **Backend**: Java 17, Spring Boot 3.4.5, Spring Security, JWT
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Base de datos**: PostgreSQL 15
- **Contenedores**: Docker & Docker Compose

## 📁 **Estructura del Proyecto**

```
gmarm/
├── backend/          # Spring Boot API
├── frontend/         # React aplicación
├── datos/            # SQL maestro de base de datos
└── docker-compose.*.yml  # Configuración Docker
```

## 🚀 **Inicio Rápido**

### **1. Clonar y configurar**
```bash
git clone <repository>
cd gmarm
```

### **2. Iniciar con Docker**
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### **3. Acceder a la aplicación**
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8080
- **Base de datos**: localhost:5432

## 👥 **Usuarios de Prueba**

- **Vendedor**: `vendedor@test.com` / `admin123`
- **Admin**: `admin@armasimportacion.com` / `admin123`

## 📊 **Base de Datos**

Ejecutar el SQL maestro: `datos/00_gmarm_completo.sql`

## 🔧 **Desarrollo**

- **Backend**: Puerto 8080
- **Frontend**: Puerto 5173 (Hot reload)
- **Base de datos**: Puerto 5432

## 🔍 **Monitoreo y CI/CD**

### **GitHub Actions**
- ✅ **CI/CD Pipeline**: Build, test y deployment automático
- ✅ **Monitoring**: Health checks cada 30 minutos
- ✅ **Alertas**: Issues automáticos para problemas críticos

Ver documentación completa:
- [📋 MONITORING.md](MONITORING.md) - Guía completa de monitoreo
- [🚀 .github/README.md](.github/README.md) - Configuración de workflows

### **Scripts de Monitoreo Local**

```bash
# Linux/macOS
chmod +x scripts/monitor-system.sh
./scripts/monitor-system.sh

# Windows
.\scripts\monitor-system-simple.ps1
```

### **Estado del Sistema**

Verifica el estado en tiempo real:
- **GitHub Actions**: [Ver workflows](https://github.com/Gmarm-org/gmarm/actions)
- **Development**: http://72.167.52.14:5173
- **Production**: https://gmarm.com (cuando esté disponible)

## 📝 **Notas**

- Sistema en desarrollo activo
- Documentación se expandirá para producción
- SQL maestro contiene todo el esquema y datos necesarios
- CI/CD automático configurado para `dev` y `main` branches
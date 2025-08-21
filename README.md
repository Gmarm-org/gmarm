# 🎯 **GMARM - Sistema de Importación de Armas**

Sistema completo para la gestión de importación de armas con roles de usuario diferenciados.

## 🚀 **Estado Actual**

- ✅ **Backend**: Spring Boot con autenticación JWT
- ✅ **Frontend**: React con TypeScript y Tailwind CSS
- ✅ **Base de datos**: PostgreSQL con esquema completo
- ✅ **Docker**: Configuración completa para desarrollo y producción

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

## 📝 **Notas**

- Sistema en desarrollo activo
- Documentación se expandirá para producción
- SQL maestro contiene todo el esquema y datos necesarios
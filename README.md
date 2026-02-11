# 🎯 **GMARM - Sistema de Gestión de Importación de Armas y Municiones**

Sistema completo para la gestión de importación y comercialización de armas, con roles diferenciados, generación automática de documentos legales, y control de pagos e inventario.

[![CI/CD Pipeline](https://github.com/Gmarm-org/gmarm/actions/workflows/deploy.yml/badge.svg)](https://github.com/Gmarm-org/gmarm/actions/workflows/deploy.yml)
[![Monitoring](https://github.com/Gmarm-org/gmarm/actions/workflows/monitor.yml/badge.svg)](https://github.com/Gmarm-org/gmarm/actions/workflows/monitor.yml)

---

## 📋 **Tabla de Contenidos**

- [Estado Actual](#-estado-actual)
- [Características Principales](#-características-principales)
- [Arquitectura](#-arquitectura)
- [Tecnologías](#-tecnologías)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Inicio Rápido](#-inicio-rápido)
- [Configuración de Entornos](#-configuración-de-entornos)
- [Base de Datos](#-base-de-datos)
- [Usuarios y Roles](#-usuarios-y-roles)
- [Documentos Generados](#-documentos-generados)
- [Desarrollo](#-desarrollo)
- [Testing](#-testing)
- [CI/CD y Monitoreo](#-cicd-y-monitoreo)
- [Documentación Adicional](#-documentación-adicional)

---

## 🚀 **Estado Actual**

- ✅ **Backend**: Spring Boot 3.4.5 con autenticación JWT
- ✅ **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- ✅ **Base de datos**: PostgreSQL 15 con esquema completo
- ✅ **Docker**: Configuración completa para local, dev y producción
- ✅ **Generación de Documentos**: Contratos, solicitudes, cotizaciones con Thymeleaf
- ✅ **Gestión de Pagos**: Cuotas, estados, historial completo
- ✅ **Inventario**: Control de armas, reservas, disponibilidad
- ✅ **CI/CD**: GitHub Actions con deployment automático
- ✅ **Monitoring**: Health checks y alertas automáticas

---

## ✨ **Características Principales**

### **Gestión de Clientes**
- Registro de clientes civiles y uniformados (Policía, Fuerzas Armadas)
- Validación de cédula/RUC ecuatoriano
- Campos específicos por tipo (código ISSFA/ISSPOL, rango, estado militar)
- Información de contacto y dirección con provincias y cantones

### **Gestión de Armas**
- Catálogo completo con tipos, marcas, modelos, calibres
- Control de inventario y disponibilidad
- Sistema de reservas con límite de tiempo
- Precios con IVA configurable
- Imágenes y descripciones detalladas

### **Gestión de Licencias**
- Registro de licencias de importación
- Asociación con provincias y cantones
- Información del comerciante importador
- Validación de RUC y cédula

### **Sistema de Ventas**
- Generación automática de ventas desde reservas
- Cálculo automático de precios con IVA
- Estados de venta: PENDIENTE, COMPLETADO, CANCELADO
- Asociación con cliente, arma y licencia

### **Gestión de Pagos**
- Pagos al contado o a crédito
- Sistema de cuotas con fechas de vencimiento
- Estados de cuota: PENDIENTE, PAGADA, VENCIDA
- Historial completo de pagos
- Cálculo automático de saldos

### **Generación de Documentos**
- **Contratos de compra**: Específicos por tipo de cliente (Civiles, Policía, Fuerza Terrestre, Naval, Aérea)
- **Solicitudes de compra**: Formato oficial para Control de Armas
- **Cotizaciones**: Con desglose de precios, IVA y cuotas
- Generación en PDF con plantillas Thymeleaf
- Datos dinámicos y cálculos automáticos

### **Roles y Permisos**
- **Admin**: Control total del sistema
- **Vendedor**: Gestión de ventas, clientes, reservas
- **Cliente**: Visualización de su información y documentos

---

## 🏗️ **Arquitectura**

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │         │                  │         │                 │
│  React Frontend │ ◄─────► │  Spring Boot API │ ◄─────► │   PostgreSQL    │
│   (Port 5173)   │  HTTP   │   (Port 8080)    │  JDBC   │   (Port 5432)   │
│                 │   JWT   │                  │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                      │
                                      │ Thymeleaf
                                      ▼
                            ┌──────────────────┐
                            │  PDF Generation  │
                            │   (Contratos,    │
                            │   Solicitudes,   │
                            │   Cotizaciones)  │
                            └──────────────────┘
```

### **Backend - Módulos Principales**
- **Autenticación**: JWT con Spring Security
- **Clientes**: CRUD + validaciones específicas
- **Armas**: Catálogo + inventario + reservas
- **Ventas**: Generación + estados + historial
- **Pagos**: Cuotas + estados + historial
- **Documentos**: Generación PDF con plantillas Thymeleaf
- **Configuración**: Sistema de configuración dinámica (IVA, límites, etc.)

### **Frontend - Módulos Principales**
- **Auth**: Login, registro, protección de rutas
- **Dashboard**: Panel según rol (Admin/Vendedor)
- **Gestión de Clientes**: CRUD completo con validaciones
- **Catálogo de Armas**: Visualización + filtros + reservas
- **Ventas**: Creación + seguimiento + documentos
- **Pagos**: Registro + historial + estados

---

## 🛠️ **Tecnologías**

### **Backend**
- **Java 17**: Lenguaje base
- **Spring Boot 3.4.5**: Framework principal
- **Spring Security**: Autenticación y autorización
- **JWT**: Tokens de autenticación
- **JPA/Hibernate**: ORM para base de datos
- **Thymeleaf**: Generación de templates HTML/PDF
- **OpenPDF**: Conversión HTML a PDF
- **Maven**: Gestión de dependencias
- **PostgreSQL Driver**: Conexión a base de datos

### **Frontend**
- **React 18**: Librería de UI
- **TypeScript**: Type safety
- **Vite**: Build tool y dev server
- **Tailwind CSS**: Framework de estilos
- **React Router**: Navegación SPA
- **React Query (TanStack Query)**: Gestión de estado del servidor
- **Axios**: Cliente HTTP
- **Lucide React**: Iconos

### **Base de Datos**
- **PostgreSQL 15**: Base de datos relacional
- **SQL Script Maestro**: `datos/00_gmarm_completo.sql`

### **DevOps**
- **Docker**: Contenedores
- **Docker Compose**: Orquestación multi-contenedor
- **GitHub Actions**: CI/CD automatizado
- **Git**: Control de versiones

---

## 📁 **Estructura del Proyecto**

```
gmarm/
├── backend/                          # Spring Boot API
│   ├── src/main/java/com/armasimportacion/
│   │   ├── controller/              # REST Controllers
│   │   ├── service/                 # Lógica de negocio
│   │   ├── repository/              # Acceso a datos (JPA)
│   │   ├── model/                   # Entidades JPA
│   │   ├── dto/                     # Data Transfer Objects
│   │   ├── mapper/                  # Conversores Entity ↔ DTO
│   │   ├── config/                  # Configuración (Security, CORS, etc.)
│   │   └── util/                    # Utilidades
│   ├── src/main/resources/
│   │   ├── templates/               # Plantillas Thymeleaf (contratos, etc.)
│   │   ├── static/                  # Recursos estáticos
│   │   └── application*.properties  # Configuración por entorno
│   └── pom.xml                      # Dependencias Maven
│
├── frontend/                         # React App
│   ├── src/
│   │   ├── components/              # Componentes reutilizables
│   │   ├── pages/                   # Páginas/Vistas principales
│   │   ├── services/                # APIs y servicios
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── types/                   # TypeScript types
│   │   ├── utils/                   # Utilidades
│   │   └── App.tsx                  # Componente raíz
│   ├── public/                      # Assets públicos
│   ├── env.local                    # Variables de entorno LOCAL
│   ├── .env.prod                    # Variables de entorno PROD
│   ├── package.json                 # Dependencias npm
│   └── vite.config.ts               # Configuración Vite
│
├── datos/                            # Base de datos
│   ├── 00_gmarm_completo.sql        # SQL MAESTRO (fuente única de verdad)
│   └── migrations/                  # Migraciones (solo para referencia)
│
├── deploy/                           # Scripts de deployment
│   ├── deploy.sh                    # Deploy Linux/macOS
│   └── deploy.ps1                   # Deploy Windows
│
├── .github/workflows/                # GitHub Actions CI/CD
│   ├── deploy.yml                   # Pipeline de deployment
│   └── monitor.yml                  # Monitoreo automático
│
├── docker-compose.local.yml          # Docker para desarrollo LOCAL
├── docker-compose.prod.yml           # Docker para PRODUCCIÓN
│
├── AGENTS.md                         # Guía para agentes de IA
├── MONITORING.md                     # Guía de monitoreo
└── README.md                         # Este archivo
```

Ver documentación detallada:
- [📚 Backend README](backend/README.md)
- [📚 Frontend README](frontend/README.md)

---

## 🚀 **Inicio Rápido**

### **Requisitos Previos**
- **Docker** y **Docker Compose**
- **Git**
- **Java 17+** (solo para desarrollo local sin Docker)
- **Node.js 18+** y **npm** (solo para desarrollo local sin Docker)

### **1. Clonar el Repositorio**
```bash
git clone https://github.com/Gmarm-org/gmarm.git
cd gmarm
```

### **2. Configurar Variables de Entorno**

#### **Para LOCAL** (todo en localhost):
```powershell
# PowerShell (Windows)
# NO necesitas configurar nada, usa docker-compose.local.yml directamente
docker-compose -f docker-compose.local.yml up -d --build
```

### **3. Acceder a la Aplicación**
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **Base de datos**: localhost:5432
- **Health Check**: http://localhost:8080/actuator/health

### **4. Iniciar Sesión**
Ver [Usuarios y Roles](#-usuarios-y-roles) para credenciales de prueba.

---

## ⚙️ **Configuración de Entornos**

El proyecto soporta dos entornos configurables:

| Entorno | Docker Compose | Backend Properties | Frontend Env | Descripción |
|---------|---------------|-------------------|--------------|-------------|
| **LOCAL** | `docker-compose.local.yml` | `application-local.properties` | `env.local` | Desarrollo en localhost |
| **PROD** | `docker-compose.prod.yml` | `application-prod.properties` | `.env.prod` | Producción |

### **Regla de Oro: Coherencia Entre Archivos**
⚠️ **CRÍTICO**: Todos los archivos de configuración de un mismo ambiente **DEBEN** apuntar a las **MISMAS URLs/IPs**.

**Ejemplo - LOCAL:**
```
✅ docker-compose.local.yml → localhost
✅ backend/application-local.properties → localhost
✅ frontend/env.local → localhost
```

**Ejemplo - PROD:**
```
✅ docker-compose.prod.yml → URLs de producción
✅ backend/application-prod.properties → Variables de entorno
✅ frontend/.env.prod → URLs de producción
```

### **Configuración de Base de Datos**

**Importante para Caracteres Especiales (Tildes, Ñ):**
```yaml
# En docker-compose.*.yml
environment:
  POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C.UTF-8 --lc-ctype=C.UTF-8"
```

---

## 🗄️ **Base de Datos**

### **SQL Maestro (Fuente Única de Verdad)**
- **Archivo**: `datos/00_gmarm_completo.sql`
- **Contiene**: TODO el esquema + datos de prueba + configuraciones
- **Regla**: SIEMPRE actualizar el SQL maestro, NO crear migraciones separadas

### **Esquema Principal**

**Entidades Core:**
- `usuario` - Usuarios del sistema (admin, vendedor, cliente)
- `cliente` - Clientes civiles y uniformados
- `tipo_cliente` - Tipos de cliente (Civil, Militar, etc.)
- `arma` - Catálogo de armas
- `tipo_arma` - Clasificación de armas (Pistola, Revólver, etc.)
- `marca` - Marcas de armas (CZ, Glock, etc.)
- `calibre` - Calibres disponibles
- `licencia` - Licencias de importación
- `venta` - Registro de ventas
- `pago` - Registro de pagos
- `cuota` - Cuotas de pago
- `reserva` - Reservas temporales de armas

**Configuración:**
- `configuracion_sistema` - Configuración dinámica (IVA, límites, tasas, etc.)

**Geografía:**
- `provincia` - Provincias de Ecuador
- `canton` - Cantones de Ecuador

### **Usuarios de Prueba en SQL Maestro**

| Email | Password | Rol | Descripción |
|-------|----------|-----|-------------|
| `admin@armasimportacion.com` | `admin123` | ADMIN | Control total del sistema |
| `vendedor@test.com` | `admin123` | VENDEDOR | Gestión de ventas y clientes |

### **Restablecer Base de Datos**

```powershell
# PowerShell (Windows)
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up -d --build
```

```bash
# Bash (Linux/macOS)
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up -d --build
```

⚠️ **IMPORTANTE**: El flag `-v` elimina los volúmenes, forzando la recreación de la base de datos con el SQL maestro.

---

## 👥 **Usuarios y Roles**

### **Roles del Sistema**

#### **1. ADMIN**
- Control total del sistema
- Gestión de usuarios
- Gestión de licencias
- Gestión de armas (CRUD completo)
- Configuración del sistema
- Visualización de reportes

#### **2. VENDEDOR**
- Gestión de clientes (CRUD)
- Gestión de ventas
- Gestión de pagos y cuotas
- Generación de documentos
- Gestión de reservas
- Visualización de catálogo

#### **3. CLIENTE** (Futuro)
- Visualización de sus datos
- Visualización de sus compras
- Descarga de documentos
- Historial de pagos

### **Credenciales de Prueba**

```
Admin:
  Email: admin@armasimportacion.com
  Password: admin123

Vendedor:
  Email: vendedor@test.com
  Password: admin123
```

---

## 📄 **Documentos Generados**

El sistema genera automáticamente documentos legales en formato PDF usando plantillas Thymeleaf.

### **Tipos de Documentos**

#### **1. Contratos de Compra**
Plantillas específicas por tipo de cliente:

- **Civiles**: `contratos/civiles/contrato_compra.html`
- **Policía**: `contratos/uniformados/contrato_compra_policia.html` (usa **ISSPOL**)
- **Fuerza Terrestre**: `contratos/uniformados/contrato_compra_fuerza_terrestre.html` (usa **ISSFA**)
- **Fuerza Naval**: `contratos/uniformados/contrato_compra_fuerza_naval.html` (usa **ISSFA**)
- **Fuerza Aérea**: `contratos/uniformados/contrato_compra_fuerza_aerea.html` (usa **ISSFA**)

**Contenido:**
- Datos del comerciante importador (licencia)
- Datos completos del cliente (cédula, ISSFA/ISSPOL, dirección completa)
- Descripción del arma
- Precio sin IVA
- Forma de pago (contado o crédito con cuotas)
- Cláusulas legales específicas
- Anexos requeridos
- Firmas

#### **2. Solicitudes de Compra**
Formato oficial para Control de Armas del Comando Conjunto FF.AA.

Plantillas específicas:
- **Civiles**: `contratos/civiles/solicitud_compra.html`
- **Policía**: `contratos/uniformados/solicitud_compra_policia.html`
- **Fuerza Terrestre**: `contratos/uniformados/solicitud_compra_fuerza_terrestre.html`
- **Fuerza Naval**: `contratos/uniformados/solicitud_compra_fuerza_naval.html`
- **Fuerza Aérea**: `contratos/uniformados/solicitud_compra_fuerza_aerea.html`

**Contenido:**
- Fecha y ciudad (cantón de la licencia)
- Datos del comerciante
- Datos del solicitante (con rango si aplica)
- Descripción detallada del arma
- Firma del solicitante

#### **3. Cotizaciones**
Plantilla única: `cotizacion/cotizacion.html`

**Contenido:**
- Fecha y ciudad (cantón de la licencia)
- Datos del cliente
- Descripción del arma con precios
- Desglose de IVA
- Total
- Forma de pago (cuotas si aplica)
- Firmas

### **Ubicación de Plantillas**
```
backend/src/main/resources/templates/
├── contratos/
│   ├── civiles/
│   │   ├── contrato_compra.html
│   │   └── solicitud_compra.html
│   └── uniformados/
│       ├── contrato_compra_policia.html
│       ├── contrato_compra_fuerza_terrestre.html
│       ├── contrato_compra_fuerza_naval.html
│       ├── contrato_compra_fuerza_aerea.html
│       ├── solicitud_compra_policia.html
│       ├── solicitud_compra_fuerza_terrestre.html
│       ├── solicitud_compra_fuerza_naval.html
│       └── solicitud_compra_fuerza_aerea.html
└── cotizacion/
    └── cotizacion.html
```

### **Generación de Documentos**

**Servicio Backend:**
```java
// GestionDocumentosServiceHelper.java
- generarContrato(ventaId)         // Genera contrato según tipo de cliente
- generarSolicitudCompra(ventaId)  // Genera solicitud según tipo de cliente
- generarCotizacion(ventaId)       // Genera cotización
```

**Endpoints:**
```
GET /api/ventas/{ventaId}/documentos/contrato
GET /api/ventas/{ventaId}/documentos/solicitud-compra
GET /api/ventas/{ventaId}/documentos/cotizacion
```

---

## 💻 **Desarrollo**

### **Backend (Spring Boot)**

#### **Compilar sin Docker**
```bash
cd backend
./mvnw clean compile
./mvnw test
```

#### **Compilar con Docker** (recomendado si hay problemas de rutas en Windows)
```powershell
docker-compose -f docker-compose.local.yml build backend_local --no-cache
```

#### **Ejecutar en Modo Dev**
```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

#### **⚠️ IMPORTANTE: Reiniciar Después de Cambios**
Después de modificar **clases Java** o **templates** (`.html`, `.ftl`, `.vm`):

```powershell
# Recomendado: Rebuild completo
docker-compose -f docker-compose.local.yml down
docker-compose -f docker-compose.local.yml up -d --build

# Alternativa: Solo reiniciar backend
docker-compose -f docker-compose.local.yml restart backend_local
```

**Regla de Oro:** Los cambios en `.java` y templates NO se reflejan automáticamente en contenedores Docker.

### **Frontend (React + TypeScript)**

#### **Instalar Dependencias**
```bash
cd frontend
npm install
```

#### **Ejecutar en Modo Dev**
```bash
npm run dev
```

#### **Build para Producción**
```bash
npm run build
npm run preview  # Preview del build
```

#### **Linting**
```bash
npm run lint
```

### **Estructura de Desarrollo**

#### **Backend - Patrón Repository-Service-Controller**
```
Controller → Service → Repository → Database
                ↓
             Mapper
                ↓
              DTO
```

#### **Frontend - Patrón Component-Service-API**
```
Component → Custom Hook → API Service → Backend API
              ↓
         React Query
```

---

## 🧪 **Testing**

### **Backend Tests**
```bash
cd backend
./mvnw test                    # Todos los tests
./mvnw test -Dtest=ClienteServiceTest  # Test específico
```

### **Frontend Tests**
```bash
cd frontend
npm run test                   # Tests con Vitest
npm run test:coverage          # Coverage report
```

### **Verificar Build Antes de Push**

⚠️ **NUNCA pushear sin compilar:**

```powershell
# Windows (PowerShell)
cd backend
mvn clean install -DskipTests
cd ../frontend
npm run build
# Si ambos pasan ✅ → git push
```

```bash
# Linux/Mac (Bash)
cd backend
mvn clean install -DskipTests
cd ../frontend
npm run build
# Si ambos pasan ✅ → git push
```

---

## 🔍 **CI/CD y Monitoreo**

### **GitHub Actions Workflows**

#### **1. Deploy Pipeline** (`.github/workflows/deploy.yml`)
- Triggered: Push a `main` o `dev`
- Pasos:
  1. Checkout código
  2. Build backend (Maven)
  3. Build frontend (npm)
  4. Run tests
  5. Build Docker images
  6. Deploy (si está configurado)

#### **2. Monitoring** (`.github/workflows/monitor.yml`)
- Triggered: Cada 30 minutos (cron)
- Health checks:
  - Frontend (HTTP 200)
  - Backend API (HTTP 200)
  - Database connection
- Alertas: Crea issue automático si falla

### **Monitoreo Local**

```bash
# Linux/macOS
chmod +x scripts/monitor-system.sh
./scripts/monitor-system.sh

# Windows
.\scripts\monitor-system-simple.ps1
```

### **Estado del Sistema**
- **GitHub Actions**: [Ver workflows](https://github.com/Gmarm-org/gmarm/actions)
- **Local Health Check**: http://localhost:8080/actuator/health

Ver documentación completa:
- [📋 MONITORING.md](MONITORING.md)
- [🚀 .github/README.md](.github/README.md)

---

## 📚 **Documentación Adicional**

### **Para Desarrolladores**
- [📚 Backend README](backend/README.md) - Arquitectura, servicios, endpoints
- [📚 Frontend README](frontend/README.md) - Componentes, hooks, servicios
- [🤖 AGENTS.md](AGENTS.md) - Guía para agentes de IA

### **Para DevOps**
- [📋 MONITORING.md](MONITORING.md) - Configuración de monitoreo
- [🚀 .github/README.md](.github/README.md) - Workflows de CI/CD

### **Otras Guías**
- [📦 datos/migrations/README.md](datos/migrations/README.md) - Historial de cambios en BD
- [📧 backend/.../templates/email/README.md](backend/src/main/resources/templates/email/README.md) - Plantillas de email

---

## 🔐 **Seguridad**

### **Variables de Entorno Sensibles**
⚠️ **NUNCA** commitear:
- `.env` files (usar `.env.example`)
- Passwords hardcodeados
- JWT secrets
- Credenciales de base de datos

### **Configuración Segura**
- Todas las passwords deben estar en variables de entorno
- JWT secret debe ser aleatorio y largo (mínimo 256 bits)
- CORS configurado por entorno
- Rate limiting en endpoints públicos
- Validación de inputs en backend

Ver más en [AGENTS.md](AGENTS.md) sección "SEGURIDAD PRIMERO".

---

## 🤝 **Contribución**

### **Workflow de Desarrollo**
1. Crear rama desde `dev`: `git checkout -b feature/nombre-feature`
2. Hacer cambios y commits: `git commit -m "feat: descripción"`
3. **Compilar y verificar**: `mvn clean install && npm run build`
4. Push: `git push origin feature/nombre-feature`
5. Crear Pull Request a `dev`
6. Después de review y merge a `dev`, se puede hacer merge a `main`

### **Convenciones de Commits**
```
feat: nueva funcionalidad
fix: corrección de bug
docs: documentación
refactor: refactorización sin cambio de funcionalidad
test: tests
chore: tareas de mantenimiento
```

---

## 📞 **Soporte y Contacto**

- **Issues**: [GitHub Issues](https://github.com/Gmarm-org/gmarm/issues)
- **Documentación**: Este README + READMEs específicos
- **CI/CD Status**: [GitHub Actions](https://github.com/Gmarm-org/gmarm/actions)

---

## 📝 **Notas**

- Sistema en desarrollo activo
- SQL maestro es la fuente única de verdad para la base de datos
- CI/CD automático configurado para ramas `dev` y `main`
- Documentación se expandirá según necesidades de producción
- Para agentes de IA: ver [AGENTS.md](AGENTS.md) para contexto completo

---

## 📄 **Licencia**

[Especificar licencia del proyecto]

---

**Última actualización**: Enero 2026

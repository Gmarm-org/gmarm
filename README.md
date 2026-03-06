# GMARM - Sistema de Gestion de Importacion de Armas y Municiones

Sistema completo para la gestion de importacion y comercializacion de armas, con roles diferenciados, generacion automatica de documentos legales, y control de pagos e inventario.

---

## Estado Actual

- **Backend**: Spring Boot 3.4.5, Java 21 (LTS), PostgreSQL
- **Frontend**: React 19, TypeScript, Vite 7, Tailwind CSS
- **Documentos**: Contratos, solicitudes, cotizaciones, autorizaciones, recibos (PDF via Thymeleaf + Flying Saucer)
- **Infraestructura**: Docker Compose (local + prod + monitoring), GitHub Actions CI/CD

---

## Tecnologias

### Backend
- Java 21 (LTS) + Spring Boot 3.4.5
- Spring Security + JWT (jjwt 0.11.5)
- Spring Data JPA / Hibernate + PostgreSQL
- Thymeleaf + Flying Saucer (generacion PDF)
- Flyway (migraciones), Lombok, SpringDoc OpenAPI
- Apache POI (Excel), Spring Mail
- Maven

### Frontend
- React 19 + TypeScript 5.8
- Vite 7 + Tailwind CSS 3.4
- React Router 7
- @heroicons/react (iconos)
- xlsx (exportacion Excel)
- Context API (estado global)

### Infraestructura
- Docker + Docker Compose
- GitHub Actions (CI/CD + monitoring)
- PostgreSQL 15

---

## Estructura del Proyecto

```
gmarm/
├── backend/                          # Spring Boot API (Java 21)
│   ├── src/main/java/com/armasimportacion/
│   │   ├── config/                  # Security, CORS, Swagger, Jackson, Email
│   │   ├── controller/              # 37 REST Controllers
│   │   ├── service/                 # 42 servicios de negocio
│   │   │   └── helper/             # 4 helpers + 6 PDF generators
│   │   ├── repository/              # JPA Repositories
│   │   ├── model/                   # Entidades JPA
│   │   ├── dto/                     # Data Transfer Objects
│   │   ├── mapper/                  # Entity <-> DTO
│   │   ├── enums/                   # Enumeraciones
│   │   ├── exception/               # Excepciones custom
│   │   ├── security/                # JWT, filtros, auth
│   │   └── util/                    # Utilidades
│   ├── src/main/resources/
│   │   ├── templates/               # 28 plantillas Thymeleaf
│   │   │   ├── contratos/          # Contratos, solicitudes, cotizaciones
│   │   │   ├── autorizaciones/     # Autorizaciones de venta
│   │   │   ├── pedidos/            # Pedidos de armas
│   │   │   └── email/              # Templates de email (10)
│   │   └── application*.properties  # Config por entorno
│   └── pom.xml
│
├── frontend/                         # React 19 + TypeScript
│   ├── src/
│   │   ├── components/              # Componentes reutilizables
│   │   ├── contexts/                # AuthContext, TiposClienteContext
│   │   ├── pages/                   # 13 modulos por rol/funcion
│   │   │   ├── Admin/              # Panel administrativo
│   │   │   ├── Vendedor/           # Gestion de clientes y ventas
│   │   │   ├── JefeVentas/         # Aprobacion y supervision
│   │   │   ├── Finanzas/           # Control financiero
│   │   │   ├── Operaciones/        # Operaciones de importacion
│   │   │   ├── Pagos/              # Gestion de pagos
│   │   │   └── ...                 # Login, Profile, etc.
│   │   ├── services/                # 17 modulos API por dominio
│   │   ├── hooks/                   # Hooks globales
│   │   ├── types/                   # TypeScript types
│   │   ├── schemas/                 # Validacion
│   │   ├── config/                  # Configuracion por entorno
│   │   └── utils/                   # Utilidades
│   └── package.json
│
├── datos/
│   └── 00_gmarm_completo.sql        # SQL MAESTRO (fuente unica de verdad)
│
├── scripts/                          # 16 scripts operativos
│   ├── backup-prod.sh               # Backup rapido BD
│   ├── backup-completo-prod.sh      # Backup BD + archivos
│   ├── restore-backup.sh            # Restaurar desde backup
│   ├── reset-bd-desde-cero.sh       # Reset completo desde SQL maestro
│   ├── validate-build.sh            # Validacion pre-push
│   └── ...
│
├── .github/workflows/                # CI/CD + Monitoring
│
├── docker-compose.local.yml          # Desarrollo local
├── docker-compose.prod.yml           # Produccion
├── docker-compose.monitoring.yml     # Monitoring stack
│
├── CLAUDE.md                         # Guia para IAs (punto de entrada)
├── AGENTS.md                         # Convenciones y workflows
├── TECH_DEBT_BACKEND.md              # Deuda tecnica backend
└── TECH_DEBT_FRONTEND.md             # Deuda tecnica frontend
```

---

## Inicio Rapido

### Requisitos
- Docker y Docker Compose
- Git
- Java 21+ (solo sin Docker)
- Node.js 18+ (solo sin Docker)

### Levantar el proyecto

```bash
git clone https://github.com/Gmarm-org/gmarm.git
cd gmarm
docker-compose -f docker-compose.local.yml up -d --build
```

### Acceso
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:8080/actuator/health

### Credenciales de prueba

| Email | Password | Rol |
|-------|----------|-----|
| admin@armasimportacion.com | admin123 | ADMIN |
| vendedor@test.com | admin123 | VENDEDOR |

---

## Entornos

| Entorno | Docker Compose | Backend Properties | Descripcion |
|---------|---------------|-------------------|-------------|
| LOCAL | `docker-compose.local.yml` | `application-local.properties` | Desarrollo en localhost |
| PROD | `docker-compose.prod.yml` | `application-prod.properties` | Produccion |
| MONITORING | `docker-compose.monitoring.yml` | - | Stack de monitoreo |

---

## Base de Datos

- **SQL Maestro**: `datos/00_gmarm_completo.sql` (fuente unica de verdad)
- SIEMPRE actualizar el SQL maestro al cambiar el esquema
- NUNCA crear migraciones separadas

### Restablecer BD

```bash
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up -d --build
```

El flag `-v` elimina volumenes, forzando recreacion desde el SQL maestro.

---

## Generacion de Documentos

Documentos legales generados automaticamente en PDF con Thymeleaf + Flying Saucer.

### Tipos de documentos

| Documento | Ubicacion | Variantes |
|-----------|-----------|-----------|
| Contratos de compra | `contratos/uniformados/`, `contratos/companias/` | Policia, F. Terrestre, F. Naval, F. Aerea, Companias seguridad |
| Solicitudes de compra | `contratos/civiles/`, `contratos/uniformados/` | Civil + 4 uniformados |
| Cotizaciones | `contratos/uniformados/` | 4 tipos (una por fuerza) |
| Autorizaciones de venta | `autorizaciones/` | Unica |
| Recibos de pago | `templates/` | Unica |
| Pedidos de armas | `pedidos/` | Por grupo de importacion |

### Regla critica: ISSPOL vs ISSFA
- **Policia Nacional** -> ISSPOL (Instituto de Seguridad Social de la Policia)
- **Fuerzas Armadas** (Terrestre, Naval, Aerea) -> ISSFA (Instituto de Seguridad Social de las Fuerzas Armadas)

---

## Desarrollo

### Compilar antes de push (obligatorio)

```bash
cd backend && mvn clean install -DskipTests
cd ../frontend && npm run build
```

### Reiniciar despues de cambios en Java/templates

```bash
docker-compose -f docker-compose.local.yml restart backend_local
```

O rebuild completo:

```bash
docker-compose -f docker-compose.local.yml down
docker-compose -f docker-compose.local.yml up -d --build
```

### Convenciones de commits

```
feat: nueva funcionalidad
fix: correccion de bug
docs: documentacion
refactor: refactorizacion
test: tests
chore: mantenimiento
```

---

## Documentacion Adicional

| Documento | Descripcion |
|-----------|-------------|
| [CLAUDE.md](CLAUDE.md) | Guia principal para IAs - punto de entrada |
| [AGENTS.md](AGENTS.md) | Convenciones, workflows, patrones de codigo |
| [TECH_DEBT_BACKEND.md](TECH_DEBT_BACKEND.md) | Deuda tecnica backend |
| [TECH_DEBT_FRONTEND.md](TECH_DEBT_FRONTEND.md) | Deuda tecnica frontend |
| [.github/README.md](.github/README.md) | CI/CD y monitoring workflows |
| [scripts/GUIA_RESET_BD.md](scripts/GUIA_RESET_BD.md) | Guia de backup, reset y restauracion BD |
| [scripts/README_VALIDACION_BUILDS.md](scripts/README_VALIDACION_BUILDS.md) | Pre-push hooks y validacion |

---

**Ultima actualizacion**: Marzo 2026

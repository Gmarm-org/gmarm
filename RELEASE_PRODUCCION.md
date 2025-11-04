# 🚀 RELEASE A PRODUCCIÓN - GUÍA COMPLETA

**Fecha Creación**: 04/11/2024  
**Versión**: 1.0  
**Proyecto**: GMARM - Sistema de Gestión de Armas de Importación

---

## 📋 ÍNDICE

1. [Pre-requisitos](#pre-requisitos)
2. [Preparación para Producción](#preparación-para-producción)
3. [Primer Lanzamiento a PROD](#primer-lanzamiento-a-prod)
4. [Dar de Baja DEV](#dar-de-baja-dev)
5. [Workflow Post-Producción](#workflow-post-producción)
6. [Scripts de Actualización](#scripts-de-actualización)
7. [Versionamiento](#versionamiento)
8. [Plan de Rollback](#plan-de-rollback)
9. [Checklist de Verificación](#checklist-de-verificación)

---

## 🔧 PRE-REQUISITOS

### Antes de Lanzar a PROD, Verificar:

- [ ] **Sistema completo probado en LOCAL**
  - Login funcional (todos los roles)
  - CRUD de todos los catálogos
  - Generación de contratos
  - Flujo completo de ventas
  - Flujo completo de créditos
  - Reportes y estadísticas

- [ ] **Base de datos limpia**
  - Datos de prueba eliminados de DEV
  - SQL maestro actualizado y probado
  - Usuarios de producción creados (admin inicial)

- [ ] **Dominio y certificado SSL** (opcional pero recomendado)
  - Dominio apuntando al servidor (ej: gmarm.com.ec)
  - Certificado SSL configurado (Let's Encrypt gratis)

- [ ] **Backups configurados**
  - Script de backup diario listo
  - Ubicación de backups definida
  - Crontab configurado

- [ ] **Documentación actualizada**
  - Manual de usuario básico
  - Credenciales de admin documentadas (en lugar seguro)
  - Contactos de soporte técnico

---

## 🎯 PREPARACIÓN PARA PRODUCCIÓN

### Paso 1: Configurar `docker-compose.prod.yml`

**Crear archivo con configuración optimizada para producción:**

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres_prod:
    image: postgres:15-alpine
    container_name: gmarm-postgres-prod
    environment:
      POSTGRES_DB: gmarm_prod
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}  # Variable de entorno SEGURA
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
    ports:
      - "5433:5432"  # Puerto diferente a DEV (5432)
    volumes:
      - postgres_data_prod:/var/lib/postgresql/data
      - ./datos/00_gmarm_completo.sql:/docker-entrypoint-initdb.d/00_gmarm_completo.sql
    command:
      - "postgres"
      - "-c"
      - "listen_addresses=*"
      - "-c"
      - "max_connections=20"                    # Más que DEV
      - "-c"
      - "shared_buffers=256MB"                  # Mucho más que DEV (64MB)
      - "-c"
      - "work_mem=4MB"                          # Más que DEV (512kB)
      - "-c"
      - "maintenance_work_mem=64MB"             # Más que DEV (8MB)
      - "-c"
      - "effective_cache_size=1GB"              # Más que DEV (128MB)
      - "-c"
      - "checkpoint_completion_target=0.9"
      - "-c"
      - "wal_buffers=16MB"                      # Más que DEV (2MB)
      - "-c"
      - "autovacuum=on"                         # ACTIVADO en PROD
      - "-c"
      - "autovacuum_max_workers=2"
      - "-c"
      - "autovacuum_naptime=600s"               # Cada 10 min
      - "-c"
      - "autovacuum_work_mem=64MB"
      - "-c"
      - "fsync=on"                              # CRÍTICO en PROD
      - "-c"
      - "full_page_writes=on"                   # CRÍTICO en PROD
      - "-c"
      - "synchronous_commit=on"                 # CRÍTICO en PROD
      - "-c"
      - "log_connections=on"
      - "-c"
      - "log_statement=none"
    networks:
      - gmarm_network_prod
    restart: always
    mem_limit: 2g            # 2GB (DEV estará apagado)
    mem_reservation: 1g
    cpus: 1.5
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"

  backend_prod:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: gmarm-backend-prod
    ports:
      - "8081:8080"  # Puerto externo diferente a DEV
    environment:
      SPRING_PROFILES_ACTIVE: prod
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres_prod:5432/gmarm_prod
      SPRING_DATASOURCE_USERNAME: postgres
      SPRING_DATASOURCE_PASSWORD: ${POSTGRES_PASSWORD}
      SPRING_CORS_ALLOWED_ORIGINS: ${PROD_FRONTEND_URL:-http://72.167.52.14:80}
      SPRING_CORS_ALLOWED_METHODS: GET,POST,PUT,DELETE,OPTIONS
      SPRING_CORS_ALLOWED_HEADERS: "*"
      JAVA_OPTS: "-Xms256m -Xmx384m -XX:+UseG1GC -XX:MaxMetaspaceSize=128m -XX:+UseStringDeduplication"
    depends_on:
      postgres_prod:
        condition: service_healthy
    networks:
      - gmarm_network_prod
    restart: always
    mem_limit: 512m          # Doble que DEV
    mem_reservation: 256m
    cpus: 1.0
    volumes:
      - ./uploads:/app/uploads
      - ./documentacion:/app/documentacion
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8080/api/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 120s
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "10"

  frontend_prod:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: gmarm-frontend-prod
    ports:
      - "80:80"      # Nginx en puerto 80 (HTTP)
      - "443:443"    # Nginx en puerto 443 (HTTPS) si tienes SSL
    environment:
      VITE_API_BASE_URL: ${PROD_BACKEND_URL:-http://72.167.52.14:8081}
    depends_on:
      - backend_prod
    networks:
      - gmarm_network_prod
    restart: always
    mem_limit: 512m          # Más que DEV
    mem_reservation: 256m
    cpus: 0.75
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"

volumes:
  postgres_data_prod:

networks:
  gmarm_network_prod:
    driver: bridge
```

### Paso 2: Crear Variables de Entorno de PROD

**Crear archivo `.env.prod`** (NO commitear a Git):

```bash
# .env.prod
POSTGRES_PASSWORD=TuPasswordSuperSegura123!
PROD_BACKEND_URL=http://tu-dominio.com/api
PROD_FRONTEND_URL=http://tu-dominio.com
```

### Paso 3: Crear Dockerfile de PROD para Frontend

**Crear `frontend/Dockerfile.prod`:**

```dockerfile
# Build stage
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Crear `frontend/nginx.conf`:**

```nginx
server {
    listen 80;
    server_name _;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy (opcional si backend está en otro puerto)
    location /api {
        proxy_pass http://backend_prod:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 🚀 PRIMER LANZAMIENTO A PROD

### Día D - Checklist de Lanzamiento

**IMPORTANTE**: Hacer esto un **Sábado temprano** (menos usuarios potenciales)

#### 1. Pre-Lanzamiento (Local - Tu Máquina)

```bash
# 1.1 Verificar que todo compile
cd backend
mvn clean package -DskipTests

cd ../frontend
npm run build

# 1.2 Verificar versión y hacer tag
git tag -a v1.0.0 -m "Primera versión de producción"
git push origin v1.0.0

# 1.3 Crear rama de producción
git checkout -b main  # Si no existe
git push origin main
```

#### 2. En el Servidor

**2.1 Preparar Directorio de PROD:**

```bash
# Conectar al servidor
ssh usuario@72.167.52.14

# Crear estructura
cd ~
mkdir -p deploy/prod
cd deploy/prod

# Clonar repositorio (rama main/producción)
git clone https://github.com/Gmarm-org/gmarm.git .
git checkout main  # O la rama que uses para producción
```

**2.2 Configurar Variables de Entorno:**

```bash
# Crear archivo .env.prod
nano .env.prod

# Agregar:
POSTGRES_PASSWORD=TuPasswordSegura123!
PROD_BACKEND_URL=http://72.167.52.14:8081
PROD_FRONTEND_URL=http://72.167.52.14:80

# Proteger archivo
chmod 600 .env.prod
```

**2.3 Crear Script de Lanzamiento:**

```bash
# Crear scripts/launch-prod.sh
nano scripts/launch-prod.sh
```

Copiar el siguiente contenido:

```bash
#!/bin/bash

echo "🚀 LANZAMIENTO A PRODUCCIÓN - GMARM v1.0.0"
echo "=========================================="
echo ""

# Verificar que DEV esté apagado
DEV_RUNNING=$(docker ps --filter "name=gmarm-*-dev" -q)
if [ ! -z "$DEV_RUNNING" ]; then
    echo "⚠️  ADVERTENCIA: DEV está corriendo"
    echo "   Contenedores: $(docker ps --filter 'name=gmarm-*-dev' --format '{{.Names}}')"
    read -p "¿Apagar DEV primero? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🛑 Apagando DEV..."
        cd ~/deploy/dev
        docker-compose -f docker-compose.dev.yml down
        cd ~/deploy/prod
    else
        echo "❌ Cancelado. Apaga DEV manualmente primero."
        exit 1
    fi
fi

echo ""
echo "📋 Checklist Pre-Lanzamiento:"
echo "   [1/5] Verificando archivos de configuración..."

# Verificar que exista docker-compose.prod.yml
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ Error: docker-compose.prod.yml no existe"
    exit 1
fi

# Verificar que exista .env.prod
if [ ! -f ".env.prod" ]; then
    echo "❌ Error: .env.prod no existe"
    exit 1
fi

echo "   ✅ Archivos de configuración OK"
echo "   [2/5] Verificando recursos disponibles..."

# Verificar memoria disponible
FREE_MEM=$(free -m | awk 'NR==2{print $7}')
echo "      Memoria disponible: ${FREE_MEM}MB"

if [ $FREE_MEM -lt 2048 ]; then
    echo "   ⚠️  Memoria baja (menos de 2GB disponible)"
    echo "   Considerar reiniciar servidor o cerrar procesos"
    read -p "   ¿Continuar de todos modos? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "   ✅ Recursos OK"
echo "   [3/5] Creando directorios necesarios..."

# Crear directorios
mkdir -p uploads
mkdir -p documentacion
mkdir -p logs
mkdir -p backups

echo "   ✅ Directorios creados"
echo "   [4/5] Construyendo imágenes Docker..."

# Build con docker-compose
export $(cat .env.prod | xargs)
docker-compose -f docker-compose.prod.yml build

echo "   ✅ Imágenes construidas"
echo "   [5/5] Iniciando servicios..."

# Iniciar servicios
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "⏳ Esperando a que los servicios inicien (60 segundos)..."
sleep 60

echo ""
echo "📊 Estado de los servicios:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "💾 Verificando base de datos..."
sleep 10

# Verificar BD
BD_EXISTS=$(docker exec gmarm-postgres-prod psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='gmarm_prod'" 2>/dev/null)

if [ "$BD_EXISTS" = "1" ]; then
    echo "✅ Base de datos 'gmarm_prod' existe"
    
    # Verificar datos
    USUARIOS=$(docker exec gmarm-postgres-prod psql -U postgres -d gmarm_prod -tAc "SELECT COUNT(*) FROM usuario;" 2>/dev/null || echo "0")
    ARMAS=$(docker exec gmarm-postgres-prod psql -U postgres -d gmarm_prod -tAc "SELECT COUNT(*) FROM arma;" 2>/dev/null || echo "0")
    
    echo "   Usuarios: $USUARIOS"
    echo "   Armas: $ARMAS"
else
    echo "⚠️  Base de datos no existe, esto es normal en primer lanzamiento"
    echo "   Se creará automáticamente al iniciar"
fi

echo ""
echo "🏥 Health checks:"

# Verificar backend
sleep 30
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/api/health)
if [ "$BACKEND_HEALTH" = "200" ]; then
    echo "✅ Backend respondiendo correctamente"
else
    echo "⚠️  Backend no responde aún (código: $BACKEND_HEALTH)"
    echo "   Esto es normal, puede tardar 1-2 minutos más"
fi

# Verificar frontend
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80)
if [ "$FRONTEND_HEALTH" = "200" ]; then
    echo "✅ Frontend respondiendo correctamente"
else
    echo "⚠️  Frontend no responde aún (código: $FRONTEND_HEALTH)"
fi

echo ""
echo "📈 Uso de recursos:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

echo ""
echo "=========================================="
echo "🎉 ¡LANZAMIENTO COMPLETADO!"
echo "=========================================="
echo ""
echo "📍 URLs de acceso:"
echo "   Frontend: http://72.167.52.14"
echo "   Backend:  http://72.167.52.14:8081"
echo "   Health:   http://72.167.52.14:8081/api/health"
echo ""
echo "📝 Logs en tiempo real:"
echo "   Backend:   docker logs gmarm-backend-prod -f"
echo "   Frontend:  docker logs gmarm-frontend-prod -f"
echo "   PostgreSQL: docker logs gmarm-postgres-prod -f"
echo ""
echo "📊 Monitorear recursos:"
echo "   docker stats"
echo ""
echo "🔍 Verificar OOM Killer:"
echo "   docker inspect gmarm-postgres-prod --format='OOMKilled={{.State.OOMKilled}}'"
echo ""
echo "⚠️  IMPORTANTE: Configurar backups diarios"
echo "   bash scripts/setup-backups-prod.sh"
echo ""
```

**2.4 Dar permisos y ejecutar:**

```bash
chmod +x scripts/launch-prod.sh
bash scripts/launch-prod.sh
```

#### 3. Verificación Post-Lanzamiento

```bash
# 3.1 Verificar que todos los servicios estén UP
docker-compose -f docker-compose.prod.yml ps

# 3.2 Verificar logs (sin errores críticos)
docker logs gmarm-backend-prod --tail 50
docker logs gmarm-frontend-prod --tail 50
docker logs gmarm-postgres-prod --tail 50

# 3.3 Verificar API
curl http://72.167.52.14:8081/api/health

# 3.4 Verificar Frontend en navegador
# Abrir: http://72.167.52.14
# Hacer login con admin
# Probar CRUD básico

# 3.5 Verificar memoria
docker stats --no-stream

# 3.6 Verificar que NO haya OOM
docker inspect gmarm-postgres-prod --format='OOMKilled={{.State.OOMKilled}}'
# Debe mostrar: OOMKilled=false
```

---

## 🛑 DAR DE BAJA DEV

### Opción 1: Apagado Permanente (Recomendado)

```bash
cd ~/deploy/dev
docker-compose -f docker-compose.dev.yml down

# Opcional: Eliminar volúmenes (libera espacio en disco)
docker-compose -f docker-compose.dev.yml down -v

# Opcional: Eliminar imágenes de DEV (libera más espacio)
docker image rm dev-backend_dev dev-frontend_dev
```

### Opción 2: Apagado Temporal (Mantener para Testing)

```bash
# Solo detener sin eliminar
cd ~/deploy/dev
docker-compose -f docker-compose.dev.yml stop

# Para reactivar temporalmente (si necesitas probar algo):
docker-compose -f docker-compose.dev.yml start
```

### Verificar que DEV está Apagado

```bash
# No debe mostrar contenedores de DEV
docker ps | grep dev

# Verificar recursos liberados
free -h
docker stats --no-stream
```

---

## 🔄 WORKFLOW POST-PRODUCCIÓN

### Desarrollo Día a Día

```bash
# 1. LOCAL - Desarrollar cambios
LOCAL> cd ~/Documents/gmarmworspace/gmarm
LOCAL> git checkout -b feature/nueva-funcionalidad

# 2. Hacer cambios en código
LOCAL> # Editar archivos...

# 3. Probar en LOCAL
LOCAL> docker-compose -f docker-compose.local.yml restart

# 4. Probar exhaustivamente
LOCAL> # Login, CRUD, flujos completos...

# 5. Commit cuando esté listo
LOCAL> git add .
LOCAL> git commit -m "feat: nueva funcionalidad lista"

# 6. Merge a rama principal
LOCAL> git checkout main
LOCAL> git merge feature/nueva-funcionalidad

# 7. Crear tag de versión
LOCAL> git tag -a v1.0.1 -m "Fix: corrección de bug X"
LOCAL> git push origin main --tags
```

### Actualizar PROD

**Script automático:** `scripts/update-prod.sh`

```bash
#!/bin/bash

echo "🔄 ACTUALIZACIÓN DE PRODUCCIÓN"
echo "=============================="
echo ""

# Verificar que estamos en directorio correcto
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ Error: No estás en el directorio de PROD"
    exit 1
fi

# Mostrar versión actual
CURRENT_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "sin-version")
echo "📌 Versión actual: $CURRENT_TAG"

# Pull de cambios
echo ""
echo "📥 Descargando cambios..."
git fetch --tags
git pull origin main

# Mostrar nueva versión
NEW_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "sin-version")
echo "📌 Nueva versión: $NEW_TAG"

if [ "$CURRENT_TAG" = "$NEW_TAG" ]; then
    echo "✅ Ya estás en la última versión"
    read -p "¿Reiniciar servicios de todos modos? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# Mostrar cambios
echo ""
echo "📝 Cambios en esta actualización:"
git log $CURRENT_TAG..$NEW_TAG --oneline --decorate

echo ""
read -p "¿Continuar con la actualización? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Actualización cancelada"
    exit 1
fi

# Backup antes de actualizar
echo ""
echo "💾 Creando backup de seguridad..."
FECHA=$(date +%Y%m%d_%H%M%S)
docker exec gmarm-postgres-prod pg_dump -U postgres gmarm_prod > backups/pre_update_${NEW_TAG}_${FECHA}.sql
echo "✅ Backup guardado: backups/pre_update_${NEW_TAG}_${FECHA}.sql"

# Rebuild y restart
echo ""
echo "🔨 Rebuilding servicios..."
export $(cat .env.prod | xargs)
docker-compose -f docker-compose.prod.yml build

echo ""
echo "🔄 Reiniciando servicios..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "⏳ Esperando servicios (60 segundos)..."
sleep 60

# Verificar salud
echo ""
echo "🏥 Verificando salud de servicios..."

BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/api/health)
if [ "$BACKEND_HEALTH" = "200" ]; then
    echo "✅ Backend OK"
else
    echo "❌ Backend NO responde (código: $BACKEND_HEALTH)"
    echo "⚠️  Revisar logs: docker logs gmarm-backend-prod"
fi

FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80)
if [ "$FRONTEND_HEALTH" = "200" ]; then
    echo "✅ Frontend OK"
else
    echo "❌ Frontend NO responde (código: $FRONTEND_HEALTH)"
fi

echo ""
echo "=============================="
echo "✅ ACTUALIZACIÓN COMPLETADA"
echo "=============================="
echo ""
echo "📌 Versión: $NEW_TAG"
echo "🕐 Fecha: $(date)"
echo ""
echo "🔍 Monitorear por 10-15 minutos:"
echo "   docker logs gmarm-backend-prod -f"
echo ""
```

---

## 🏷️ VERSIONAMIENTO

### Esquema de Versiones (Semantic Versioning)

```
v MAJOR . MINOR . PATCH

Ejemplos:
- v1.0.0 - Primera versión de producción
- v1.0.1 - Fix de bug menor
- v1.1.0 - Nueva funcionalidad (compatible)
- v2.0.0 - Cambio mayor (breaking change)
```

### Cuándo Incrementar Versión

| Tipo | Incrementar | Ejemplo |
|------|-------------|---------|
| **PATCH** (v1.0.X) | Bug fixes, correcciones menores | Fix de validación, corrección de typo |
| **MINOR** (v1.X.0) | Nueva funcionalidad (compatible) | Nuevo catálogo, nuevo reporte |
| **MAJOR** (vX.0.0) | Cambio incompatible con versión anterior | Cambio en estructura de BD, nueva arquitectura |

### Crear Release

```bash
# En LOCAL después de probar todo

# 1. Commit de cambios
git add .
git commit -m "feat: nueva funcionalidad completada"

# 2. Crear tag
git tag -a v1.1.0 -m "Release v1.1.0 - Nueva funcionalidad de reportes"

# 3. Push con tags
git push origin main --tags

# 4. Crear Release en GitHub (opcional)
# - Ir a GitHub > Releases > New Release
# - Seleccionar tag v1.1.0
# - Agregar notas de release
# - Publicar
```

---

## ↩️ PLAN DE ROLLBACK

### Si algo falla después de actualizar

**Script de rollback:** `scripts/rollback-prod.sh`

```bash
#!/bin/bash

echo "↩️  ROLLBACK DE PRODUCCIÓN"
echo "========================"
echo ""

# Mostrar versiones disponibles
echo "📋 Versiones disponibles:"
git tag -l | tail -10

echo ""
read -p "Versión a la que volver (ej: v1.0.0): " TARGET_VERSION

if [ -z "$TARGET_VERSION" ]; then
    echo "❌ Debes especificar una versión"
    exit 1
fi

# Verificar que el tag existe
if ! git rev-parse $TARGET_VERSION >/dev/null 2>&1; then
    echo "❌ La versión $TARGET_VERSION no existe"
    exit 1
fi

echo ""
echo "⚠️  ADVERTENCIA: Vas a volver a $TARGET_VERSION"
echo "   Versión actual: $(git describe --tags)"
echo ""
read -p "¿Estás SEGURO? (escribe 'SI' para confirmar): " CONFIRM

if [ "$CONFIRM" != "SI" ]; then
    echo "❌ Rollback cancelado"
    exit 1
fi

# Backup antes de rollback
echo ""
echo "💾 Backup de seguridad..."
FECHA=$(date +%Y%m%d_%H%M%S)
docker exec gmarm-postgres-prod pg_dump -U postgres gmarm_prod > backups/pre_rollback_${FECHA}.sql

# Checkout a versión anterior
echo ""
echo "🔄 Volviendo a $TARGET_VERSION..."
git checkout $TARGET_VERSION

# Rebuild y restart
echo "🔨 Rebuilding..."
export $(cat .env.prod | xargs)
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "⏳ Esperando servicios..."
sleep 60

# Verificar
echo ""
echo "🏥 Verificando..."
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/api/health)
echo "Backend: $BACKEND_HEALTH"

echo ""
echo "========================"
echo "✅ ROLLBACK COMPLETADO"
echo "========================"
echo ""
echo "📌 Versión restaurada: $TARGET_VERSION"
echo ""
```

---

## 📋 BACKUPS AUTOMÁTICOS

### Script de Backup: `scripts/backup-prod.sh`

```bash
#!/bin/bash

BACKUP_DIR="/home/gmarmin/backups"
FECHA=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=7

# Crear directorio si no existe
mkdir -p $BACKUP_DIR

# Backup de base de datos
echo "💾 Backup de PostgreSQL..."
docker exec gmarm-postgres-prod pg_dump -U postgres gmarm_prod | gzip > $BACKUP_DIR/gmarm_prod_${FECHA}.sql.gz

# Backup de uploads
echo "📁 Backup de archivos..."
tar -czf $BACKUP_DIR/uploads_${FECHA}.tar.gz uploads/

# Limpiar backups antiguos (más de 7 días)
find $BACKUP_DIR -name "gmarm_prod_*.sql.gz" -mtime +$KEEP_DAYS -delete
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +$KEEP_DAYS -delete

echo "✅ Backup completado: $BACKUP_DIR/gmarm_prod_${FECHA}.sql.gz"
```

### Configurar Crontab

```bash
# Editar crontab
crontab -e

# Agregar backup diario a las 2 AM
0 2 * * * /home/gmarmin/deploy/prod/scripts/backup-prod.sh >> /home/gmarmin/backups/backup.log 2>&1
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

### Antes de cada Actualización

- [ ] Código probado completamente en LOCAL
- [ ] Versión taggeada en Git
- [ ] Backup reciente disponible
- [ ] Ventana de mantenimiento comunicada (si aplica)
- [ ] Plan de rollback listo

### Después de cada Actualización

- [ ] Backend responde (health check)
- [ ] Frontend carga correctamente
- [ ] Login funciona
- [ ] CRUD básico funciona
- [ ] No hay errores en logs
- [ ] PostgreSQL no tiene OOM
- [ ] Uso de memoria estable
- [ ] Backup post-actualización realizado

### Monitoreo Diario

- [ ] Verificar logs de errores
- [ ] Verificar uso de recursos
- [ ] Verificar que backups se ejecuten
- [ ] Verificar acceso a aplicación
- [ ] Revisar reportes de usuarios (si hay)

---

## 📞 CONTACTOS Y SOPORTE

**Desarrollador**: [Tu nombre]  
**Email**: [Tu email]  
**Servidor**: 72.167.52.14  
**Backups**: /home/gmarmin/backups  

---

## 📚 ANEXOS

### Comandos Útiles Rápidos

```bash
# Ver estado de PROD
cd ~/deploy/prod
docker-compose -f docker-compose.prod.yml ps

# Ver logs en tiempo real
docker logs gmarm-backend-prod -f

# Reiniciar solo un servicio
docker-compose -f docker-compose.prod.yml restart backend_prod

# Ver uso de recursos
docker stats --no-stream

# Backup manual
bash scripts/backup-prod.sh

# Actualizar
bash scripts/update-prod.sh

# Rollback
bash scripts/rollback-prod.sh

# Apagar todo
docker-compose -f docker-compose.prod.yml down

# Iniciar todo
docker-compose -f docker-compose.prod.yml up -d
```

---

**FIN DEL DOCUMENTO**

Fecha última actualización: 04/11/2024  
Versión documento: 1.0


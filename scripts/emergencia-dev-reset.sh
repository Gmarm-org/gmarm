#!/bin/bash

echo "🚨 SCRIPT DE EMERGENCIA - RESET COMPLETO DEL SISTEMA DEV"
echo "=========================================================="
echo ""
echo "⚠️  Este script va a:"
echo "   1. Detener TODOS los contenedores"
echo "   2. ELIMINAR todos los volúmenes (BD incluida)"
echo "   3. Limpiar el sistema Docker"
echo "   4. Recrear todo desde cero con límites optimizados"
echo ""
echo "Presiona Ctrl+C en los próximos 5 segundos para cancelar..."
sleep 5

echo ""
echo "🛑 Paso 1: Deteniendo todos los contenedores..."
docker-compose -f docker-compose.dev.yml down -v

echo ""
echo "🧹 Paso 2: Limpiando sistema Docker..."
docker system prune -f

echo ""
echo "📝 Paso 3: Actualizando configuración de PostgreSQL..."

# Crear docker-compose temporal con límites más altos
cat > docker-compose.dev.yml.tmp << 'EOF'
services:
  postgres_dev:
    image: postgres:15-alpine
    container_name: gmarm-postgres-dev
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-gmarm_dev}
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres_data_dev:/var/lib/postgresql/data
      - ./datos/00_gmarm_completo.sql:/docker-entrypoint-initdb.d/00_gmarm_completo.sql
    command:
      - "postgres"
      - "-c"
      - "listen_addresses=*"
      - "-c"
      - "max_connections=5"
      - "-c"
      - "shared_buffers=64MB"
      - "-c"
      - "work_mem=512KB"
      - "-c"
      - "maintenance_work_mem=8MB"
      - "-c"
      - "effective_cache_size=128MB"
      - "-c"
      - "checkpoint_completion_target=0.9"
      - "-c"
      - "wal_buffers=2MB"
      - "-c"
      - "autovacuum=off"
      - "-c"
      - "fsync=off"
      - "-c"
      - "log_connections=off"
      - "-c"
      - "log_statement=none"
    networks:
      - gmarm_network
    restart: always
    mem_limit: 1.5g
    mem_reservation: 512m
    cpus: 1.0
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 30
      start_period: 60s

  backend_dev:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: gmarm-backend-dev
    ports:
      - "${BACKEND_PORT:-8080}:8080"
    environment:
      SPRING_PROFILES_ACTIVE: docker
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres_dev:5432/${POSTGRES_DB:-gmarm_dev}
      SPRING_DATASOURCE_USERNAME: ${POSTGRES_USER:-postgres}
      SPRING_DATASOURCE_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      SPRING_CORS_ALLOWED_ORIGINS: ${SPRING_CORS_ALLOWED_ORIGINS:-http://localhost:5173,http://127.0.0.1:5173,http://72.167.52.14:5173,http://72.167.52.14:80}
      SPRING_CORS_ALLOWED_METHODS: GET,POST,PUT,DELETE,OPTIONS
      SPRING_CORS_ALLOWED_HEADERS: "*"
      JAVA_OPTS: "-Xms96m -Xmx192m -XX:+UseG1GC -XX:MaxMetaspaceSize=64m"
    depends_on:
      postgres_dev:
        condition: service_started
    networks:
      - gmarm_network
    restart: unless-stopped
    mem_limit: 256m
    mem_reservation: 96m
    cpus: 0.5
    volumes:
      - ./uploads:/app/uploads
      - ./documentacion:/app/documentacion
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8080/api/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 120s

  frontend_dev:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: gmarm-frontend-dev
    ports:
      - "${FRONTEND_PORT:-5173}:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - ./frontend/public:/app/public
    environment:
      VITE_API_BASE_URL: ${BACKEND_URL:-http://72.167.52.14:8080}
      VITE_FRONTEND_URL: ${FRONTEND_URL:-http://72.167.52.14:5173}
      VITE_WS_HOST: ${WS_HOST:-72.167.52.14}
      VITE_WS_PORT: ${WS_PORT:-5173}
      NODE_ENV: development
    depends_on:
      - backend_dev
    networks:
      - gmarm_network
    restart: unless-stopped
    mem_limit: 384m
    mem_reservation: 128m
    cpus: 0.5

volumes:
  postgres_data_dev:

networks:
  gmarm_network:
    driver: bridge
EOF

# Hacer backup del original
cp docker-compose.dev.yml docker-compose.dev.yml.backup
# Usar la versión temporal
mv docker-compose.dev.yml.tmp docker-compose.dev.yml

echo "✅ Configuración actualizada:"
echo "   - PostgreSQL: 1.5GB límite, autovacuum OFF"
echo "   - Backend: 192MB JVM, 256MB límite"
echo "   - Frontend: 384MB límite"

echo ""
echo "🐳 Paso 4: Iniciando SOLO PostgreSQL..."
docker-compose -f docker-compose.dev.yml up -d postgres_dev

echo ""
echo "⏳ Esperando a que PostgreSQL esté listo..."
for i in {1..60}; do
  if docker exec gmarm-postgres-dev pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL listo después de $i intentos"
    break
  fi
  echo "   Intento $i/60..."
  sleep 2
done

echo ""
echo "💾 Paso 5: Verificando base de datos..."
docker exec gmarm-postgres-dev psql -U postgres -c "SELECT version();" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ PostgreSQL funcionando correctamente"
  
  # Verificar si existe la BD
  BD_EXISTS=$(docker exec gmarm-postgres-dev psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='gmarm_dev'")
  if [ "$BD_EXISTS" = "1" ]; then
    echo "✅ Base de datos gmarm_dev ya existe"
  else
    echo "⚠️  Base de datos no existe, creándola..."
    docker exec gmarm-postgres-dev psql -U postgres -c "CREATE DATABASE gmarm_dev WITH ENCODING='UTF8' LC_COLLATE='C' LC_CTYPE='C';"
    echo "📥 Cargando datos del SQL maestro..."
    docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev < datos/00_gmarm_completo.sql
  fi
  
  # Verificar datos
  USUARIOS=$(docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -tAc "SELECT COUNT(*) FROM usuario;" 2>/dev/null || echo "0")
  echo "   Usuarios en BD: $USUARIOS"
else
  echo "❌ Error: PostgreSQL no responde correctamente"
  exit 1
fi

echo ""
echo "🚀 Paso 6: Iniciando Backend y Frontend..."
docker-compose -f docker-compose.dev.yml up -d --build

echo ""
echo "⏳ Esperando a que el backend inicie..."
sleep 30

echo ""
echo "📊 Paso 7: Estado final del sistema..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
docker stats --no-stream --format "table {{.Name}}\t{{CPUPerc}}\t{{MemUsage}}\t{{MemPerc}}"

echo ""
echo "=========================================================="
echo "✅ RESET COMPLETADO"
echo "=========================================================="
echo ""
echo "🔍 Para verificar que no haya más OOM Killer:"
echo "   docker inspect gmarm-postgres-dev --format='OOMKilled={{.State.OOMKilled}}'"
echo ""
echo "📝 Para monitorear memoria:"
echo "   watch -n 2 'docker stats --no-stream'"
echo ""


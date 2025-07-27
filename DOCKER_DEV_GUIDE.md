# 🐳 Guía de Despliegue en Docker - Entorno de Desarrollo

## 📋 Requisitos Previos

### En el servidor Ubuntu:
```bash
# Instalar Docker
sudo apt update
sudo apt install docker.io docker-compose

# Agregar usuario al grupo docker
sudo usermod -aG docker $USER

# Reiniciar sesión o ejecutar:
newgrp docker
```

## 🚀 Inicio Rápido

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd gmarm
```

### 2. Ejecutar el script de inicio
```bash
chmod +x setup-docker-dev.sh
./setup-docker-dev.sh
```

### 3. Verificar que todo esté funcionando
```bash
# Verificar contenedores
docker ps

# Ver logs del backend
docker-compose -f docker-compose.dev.yml logs backend

# Ver logs del frontend
docker-compose -f docker-compose.dev.yml logs frontend
```

## 🌐 Acceso al Sistema

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080/api
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **PostgreSQL**: localhost:5432

## 🔑 Credenciales por Defecto

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin123 | Administrador |
| vendedor1 | vendedor123 | Vendedor |
| test | test123 | Test |

## 📝 Comandos Útiles

### Ver logs en tiempo real
```bash
# Todos los servicios
docker-compose -f docker-compose.dev.yml logs -f

# Servicio específico
docker-compose -f docker-compose.dev.yml logs -f backend
docker-compose -f docker-compose.dev.yml logs -f frontend
docker-compose -f docker-compose.dev.yml logs -f postgres_dev
```

### Reiniciar servicios
```bash
# Reiniciar todo
docker-compose -f docker-compose.dev.yml restart

# Reiniciar servicio específico
docker-compose -f docker-compose.dev.yml restart backend
```

### Detener el sistema
```bash
docker-compose -f docker-compose.dev.yml down
```

### Limpiar todo (incluye volúmenes)
```bash
docker-compose -f docker-compose.dev.yml down --volumes --remove-orphans
docker system prune -f
```

## 🔧 Configuración

### Variables de Entorno

El sistema usa las siguientes variables de entorno:

**Backend:**
- `SPRING_PROFILES_ACTIVE=docker`
- `SPRING_DATASOURCE_URL=jdbc:postgresql://postgres_dev:5432/gmarm_db`
- `SPRING_DATASOURCE_USERNAME=postgres`
- `SPRING_DATASOURCE_PASSWORD=postgres`
- `APP_JWT_SECRET=devSecretKeyForJWT2024ArmasImportacionDevelopmentEnvironment`
- `APP_JWT_EXPIRATION=86400000`

**Frontend:**
- `VITE_API_BASE_URL=http://localhost:8080/api`
- `VITE_APP_NAME=Sistema de Importación de Armas`
- `VITE_DEV_MODE=true`

### Volúmenes

- `./backend/uploads:/app/uploads` - Archivos subidos por usuarios
- `./frontend:/app` - Código fuente del frontend (hot reload)
- `postgres_data_dev:/var/lib/postgresql/data` - Datos de PostgreSQL
- `./datos:/docker-entrypoint-initdb.d` - Scripts SQL de inicialización

## 🐛 Solución de Problemas

### El backend no inicia
```bash
# Verificar logs
docker-compose -f docker-compose.dev.yml logs backend

# Verificar que PostgreSQL esté funcionando
docker exec gmarm-postgres-dev pg_isready -U postgres
```

### El frontend no inicia
```bash
# Verificar logs
docker-compose -f docker-compose.dev.yml logs frontend

# Verificar que el backend esté funcionando
curl http://localhost:8080/api/health
```

### Problemas de conectividad
```bash
# Verificar que los puertos estén abiertos
netstat -tulpn | grep :8080
netstat -tulpn | grep :5173
netstat -tulpn | grep :5432
```

### Limpiar y reiniciar todo
```bash
# Detener y limpiar
docker-compose -f docker-compose.dev.yml down --volumes --remove-orphans
docker system prune -f

# Reconstruir
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up -d
```

## 📊 Monitoreo

### Ver uso de recursos
```bash
docker stats
```

### Ver información de contenedores
```bash
docker inspect gmarm-backend-dev
docker inspect gmarm-frontend-dev
docker inspect gmarm-postgres-dev
```

## 🔄 Actualizaciones

### Actualizar código
```bash
# Hacer pull del repositorio
git pull

# Reconstruir y reiniciar
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up -d
```

### Actualizar solo el frontend (hot reload)
```bash
# El frontend tiene hot reload, los cambios se reflejan automáticamente
# Solo reiniciar si hay cambios en package.json
docker-compose -f docker-compose.dev.yml restart frontend
```

## 🛡️ Seguridad

### Cambiar credenciales por defecto
```bash
# Conectarse a PostgreSQL
docker exec -it gmarm-postgres-dev psql -U postgres -d gmarm_db

# Cambiar contraseña de admin
UPDATE usuario SET password_hash = 'nueva_contraseña_hash' WHERE username = 'admin';
```

### Configurar firewall
```bash
# Permitir solo puertos necesarios
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 8080/tcp  # Backend
sudo ufw allow 5173/tcp  # Frontend
sudo ufw enable
```

## 📞 Soporte

Si encuentras problemas:

1. Verifica los logs: `docker-compose -f docker-compose.dev.yml logs`
2. Verifica el estado de los contenedores: `docker ps`
3. Verifica la conectividad: `curl http://localhost:8080/api/health`
4. Revisa esta guía de solución de problemas 
# 📊 **Archivos de Base de Datos - GMARM**

Este directorio contiene los archivos SQL necesarios para configurar la base de datos del sistema GMARM.

## 📁 **Archivos Incluidos**

### 1. **`gmarm_schema_mejorado.sql`**
- **Descripción**: Esquema completo de la base de datos con todas las mejoras implementadas
- **Contenido**:
  - Todas las tablas del sistema
  - Índices para optimizar consultas
  - Constraints de validación
  - Triggers para auditoría automática
  - Relaciones y foreign keys

### 2. **`gmarm_datos_prueba.sql`**
- **Descripción**: Datos de prueba para desarrollo y testing
- **Contenido**:
  - Catálogos iniciales (tipos de cliente, identificación, proceso, etc.)
  - Usuarios de prueba con diferentes roles
  - Licencias de importación
  - Modelos de armas del catálogo CZ
  - Clientes de ejemplo (civil, militar, empresa)
  - Grupos de importación de prueba
  - Asignaciones de armas
  - Respuestas de clientes
  - Notificaciones y documentos generados

## 🚀 **Instrucciones de Uso**

### **Para Desarrollo Local:**

1. **Crear la base de datos:**
   ```sql
   CREATE DATABASE gmarm_dev;
   ```

2. **Ejecutar el esquema:**
   ```bash
   psql -U tu_usuario -d gmarm_dev -f gmarm_schema_mejorado.sql
   ```

3. **Cargar datos de prueba:**
   ```bash
   psql -U tu_usuario -d gmarm_dev -f gmarm_datos_prueba.sql
   ```

### **Para Docker (usando docker-compose):**

1. **Iniciar los servicios:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d postgres_dev
   ```

2. **Esperar a que PostgreSQL esté listo (30-60 segundos)**

3. **Ejecutar los scripts:**
   ```bash
   # Conectar al contenedor
   docker exec -it postgres_dev psql -U devuser -d devdb
   
   # Dentro de psql, ejecutar:
   \i /path/to/gmarm_schema_mejorado.sql
   \i /path/to/gmarm_datos_prueba.sql
   ```

### **Para Producción:**

1. **Crear la base de datos de producción:**
   ```sql
   CREATE DATABASE gmarm_prod;
   ```

2. **Ejecutar solo el esquema (sin datos de prueba):**
   ```bash
   psql -U tu_usuario -d gmarm_prod -f gmarm_schema_mejorado.sql
   ```

## 🔧 **Configuración de la Aplicación**

### **application.properties:**
```properties
# Base de datos
spring.datasource.url=jdbc:postgresql://localhost:5432/gmarm_dev
spring.datasource.username=devuser
spring.datasource.password=devpass
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# Auditoría
spring.data.jpa.repositories.enabled=true
spring.jpa.properties.hibernate.jdbc.time_zone=UTC
```

## 👥 **Usuarios de Prueba**

### **Credenciales de Acceso:**

| Usuario | Contraseña | Rol | Descripción |
|---------|------------|-----|-------------|
| `admin` | `admin123` | Administrador | Acceso completo al sistema |
| `vendedor1` | `admin123` | Vendedor | Gestión de clientes y armas |
| `vendedor2` | `admin123` | Vendedor | Gestión de clientes y armas |
| `direccion_ventas` | `admin123` | Dirección de Ventas | Aprobación de solicitudes |
| `operaciones` | `admin123` | Operaciones | Gestión de importación |
| `finanzas` | `admin123` | Finanzas | Gestión de pagos |

## 📋 **Estructura de Datos**

### **Tablas Principales:**
- **`usuario`** - Usuarios del sistema
- **`rol`** - Roles y permisos
- **`cliente`** - Clientes del sistema
- **`tipo_cliente`** - Catálogo de tipos de cliente
- **`tipo_identificacion`** - Catálogo de tipos de identificación
- **`modelo_arma`** - Catálogo de modelos de armas
- **`asignacion_arma`** - Asignaciones de armas a clientes
- **`grupo_importacion`** - Grupos de importación
- **`licencia`** - Licencias de importación

### **Mejoras Implementadas:**
- ✅ **Campos de ubicación** (provincia, canton)
- ✅ **Campos para empresas** (RUC, nombre_empresa, etc.)
- ✅ **Estado militar** para uniformados
- ✅ **Auditoría completa** con fechas de creación/modificación
- ✅ **Constraints de validación** (edad mínima, formato email, etc.)
- ✅ **Triggers automáticos** para auditoría
- ✅ **Índices optimizados** para consultas frecuentes

## 🔍 **Consultas Útiles**

### **Verificar la instalación:**
```sql
-- Contar usuarios
SELECT COUNT(*) FROM usuario;

-- Contar clientes
SELECT COUNT(*) FROM cliente;

-- Ver tipos de cliente
SELECT * FROM tipo_cliente WHERE estado = true;

-- Ver modelos de armas
SELECT * FROM modelo_arma WHERE estado = 'DISPONIBLE';
```

### **Estadísticas básicas:**
```sql
-- Clientes por tipo
SELECT tc.nombre, COUNT(c.id) 
FROM cliente c 
JOIN tipo_cliente tc ON c.tipo_cliente_id = tc.id 
GROUP BY tc.nombre;

-- Usuarios por rol
SELECT r.nombre, COUNT(ur.usuario_id) 
FROM usuario_rol ur 
JOIN rol r ON ur.rol_id = r.id 
GROUP BY r.nombre;
```

## ⚠️ **Notas Importantes**

1. **Contraseñas**: Todos los usuarios de prueba tienen la contraseña `admin123` (hasheada con BCrypt)
2. **Datos de prueba**: Los datos incluidos son solo para desarrollo, no usar en producción
3. **Backup**: Siempre hacer backup antes de ejecutar scripts en bases de datos existentes
4. **Permisos**: Asegurarse de que el usuario de la base de datos tenga permisos suficientes

## 🆘 **Solución de Problemas**

### **Error de conexión:**
```bash
# Verificar que PostgreSQL esté corriendo
docker ps | grep postgres

# Verificar logs
docker logs postgres_dev
```

### **Error de permisos:**
```sql
-- Conectar como superusuario y otorgar permisos
GRANT ALL PRIVILEGES ON DATABASE gmarm_dev TO devuser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO devuser;
```

### **Error de constraints:**
```sql
-- Verificar constraints existentes
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'cliente'::regclass;
```

---

**¡Los archivos están listos para usar!** 🎉 
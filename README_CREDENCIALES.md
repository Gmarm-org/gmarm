# 🔐 CREDENCIALES Y CONFIGURACIÓN DE DESARROLLO

## 🚀 CONFIGURACIÓN RÁPIDA

### **1. Base de Datos**
```bash
# Crear base de datos PostgreSQL
createdb gmarm_db

# Ejecutar script de inicialización (opcional)
psql -d gmarm_db -f datos/usuario_admin_default.sql
```

### **2. Backend**
```bash
cd backend

# Configurar perfil de desarrollo
export SPRING_PROFILES_ACTIVE=dev

# Ejecutar aplicación
./mvnw spring-boot:run
```

### **3. Frontend**
```bash
cd frontend

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```

---

## 👤 USUARIOS POR DEFECTO

### **🔑 Administrador Principal**
- **Email:** `admin@armasimportacion.com`
- **Password:** `admin123`
- **Rol:** ADMIN (Acceso completo)

### **👥 Usuarios de Prueba**

#### **Vendedor**
- **Email:** `vendedor@test.com`
- **Password:** `admin123`
- **Rol:** VENDEDOR

#### **Jefe de Ventas**
- **Email:** `jefe@test.com`
- **Password:** `admin123`
- **Rol:** JEFE_VENTAS

#### **Finanzas**
- **Email:** `finanzas@test.com`
- **Password:** `admin123`
- **Rol:** FINANZAS

#### **Operaciones**
- **Email:** `operaciones@test.com`
- **Password:** `admin123`
- **Rol:** OPERACIONES

---

## 🌐 URLs DE ACCESO

### **Frontend**
- **URL Principal:** `http://localhost:5173`
- **Login:** `http://localhost:5173/login`
- **Dashboard:** `http://localhost:5173/dashboard`

### **Backend**
- **API Base:** `http://localhost:8080/api`
- **Swagger UI:** `http://localhost:8080/swagger-ui.html`
- **Health Check:** `http://localhost:8080/actuator/health`

---

## 🔧 CONFIGURACIÓN DE DESARROLLO

### **Variables de Entorno Backend**
```properties
# application-dev.properties
spring.datasource.url=jdbc:postgresql://localhost:5432/gmarm_db
spring.datasource.username=postgres
spring.datasource.password=postgres
spring.jpa.hibernate.ddl-auto=create-drop
app.jwt.secret=devSecretKeyForJWT2024ArmasImportacionDevelopmentEnvironment
```

### **Variables de Entorno Frontend**
```env
# .env
VITE_API_URL=http://localhost:8080/api
VITE_APP_NAME=Sistema de Importación de Armas
VITE_DEV_MODE=true
```

---

## 🧪 PRUEBAS INICIALES

### **1. Probar Login**
1. Ir a `http://localhost:5173/login`
2. Usar credenciales de admin: `admin@armasimportacion.com` / `admin123`
3. Verificar redirección al dashboard

### **2. Probar Dashboard**
1. Verificar que se muestren las estadísticas
2. Verificar que aparezcan los módulos según el rol
3. Probar navegación entre módulos

### **3. Probar Módulo Vendedor**
1. Ir a `/vendedor`
2. Crear un nuevo cliente
3. Verificar que se guarde correctamente
4. Probar edición y eliminación

### **4. Probar Módulo Usuario**
1. Ir a `/usuario` (solo admin)
2. Crear un nuevo usuario
3. Asignar roles
4. Verificar permisos

### **5. Probar API**
1. Ir a `http://localhost:8080/swagger-ui.html`
2. Probar endpoints de autenticación
3. Probar endpoints de usuarios
4. Probar endpoints de clientes

---

## 🔍 TROUBLESHOOTING

### **Error de Conexión a Base de Datos**
```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Verificar conexión
psql -h localhost -U postgres -d gmarm_db
```

### **Error de CORS**
- Verificar que el frontend esté en `http://localhost:5173`
- Verificar configuración CORS en `SecurityConfig.java`

### **Error de JWT**
- Verificar que la clave secreta esté configurada
- Verificar que el token se esté enviando en headers

### **Error de Permisos**
- Verificar que el usuario tenga los roles correctos
- Verificar configuración de `ProtectedRoute`

---

## 📊 DATOS DE PRUEBA INCLUIDOS

### **Tipos de Cliente**
- Civil
- Militar
- Empresa Seguridad
- Deportista

### **Tipos de Identificación**
- Cédula
- RUC
- Pasaporte

### **Categorías de Armas**
- Pistolas
- Rifles
- Escopetas

### **Modelos de Armas**
- Glock 17 (Pistola)
- AR-15 Sport (Rifle)

### **Ubicaciones**
- Todas las provincias de Ecuador
- Cantones por provincia

---

## 🚀 PRÓXIMOS PASOS

### **1. Pruebas Unitarias**
```bash
# Backend
cd backend
./mvnw test

# Frontend
cd frontend
npm test
```

### **2. Pruebas de Integración**
- Probar flujo completo de creación de cliente
- Probar asignación de armas
- Probar gestión de pagos

### **3. Pruebas de Rendimiento**
- Probar con múltiples usuarios
- Probar carga de datos
- Probar respuestas de API

---

## 📞 SOPORTE

Si encuentras algún problema:

1. **Verificar logs del backend:** `backend/logs/`
2. **Verificar consola del navegador:** F12 → Console
3. **Verificar Network tab:** F12 → Network
4. **Revisar configuración de base de datos**
5. **Verificar variables de entorno**

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [ ] Base de datos PostgreSQL creada
- [ ] Backend ejecutándose en puerto 8080
- [ ] Frontend ejecutándose en puerto 5173
- [ ] Login funcionando con admin
- [ ] Dashboard accesible
- [ ] Módulo Vendedor funcionando
- [ ] Módulo Usuario funcionando
- [ ] API documentada en Swagger
- [ ] CORS configurado correctamente
- [ ] JWT funcionando

**¡Sistema listo para desarrollo y pruebas!** 🎉 
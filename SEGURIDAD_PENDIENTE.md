# 🔐 Seguridad - Estado de Implementación Keycloak

## 📊 Estado General

**Rama**: `feature/seguridad`  
**Última actualización**: 2025-11-13  
**Estado**: ✅ FASE 1 Completada | ⏳ FASE 2-6 Pendientes

---

## ✅ FASE 1: Setup de Keycloak - COMPLETADA

### **Lo que se hizo:**

1. ✅ **Docker Compose configurado**
   - Archivo: `docker-compose.keycloak.yml`
   - Keycloak 26.0.5
   - PostgreSQL 15 dedicado (puerto 5433)
   - Límites de recursos: 1GB RAM, 1 CPU

2. ✅ **Scripts de gestión creados**
   - `scripts/start-keycloak.ps1` (Windows)
   - `scripts/stop-keycloak.ps1` (Windows)
   - `scripts/start-keycloak.sh` (Linux)
   - `scripts/stop-keycloak.sh` (Linux)

3. ✅ **Configuración de ejemplo**
   - `keycloak.env.example` - Template de configuración
   - `.env.keycloak` - Configuración local (no en git)

4. ✅ **Keycloak levantado y funcionando**
   - URL: http://localhost:8180
   - Admin: admin / admin123
   - Estado: ✅ Healthy

5. ✅ **Documentación completa**
   - `INTEGRACION_KEYCLOAK.md` - Plan completo de 6 fases

6. ✅ **Gitignore actualizado**
   - Protección de archivos `.env.keycloak`
   - Protección de datos de Keycloak

### **Configuración Manual Pendiente en Keycloak Admin Console:**

- [ ] **Realm "gmarm" creado**
  - URL: http://localhost:8180
  - Login: admin / admin123
  - Crear realm desde "Keycloak" → "Create Realm"

- [ ] **Client "gmarm-frontend" configurado**
  - Tipo: OpenID Connect
  - Client authentication: OFF (public)
  - Valid redirect URIs: `http://localhost:5173/*`
  - Web origins: `http://localhost:5173`

- [ ] **Client "gmarm-backend" configurado**
  - Tipo: OpenID Connect
  - Client authentication: ON (confidential)
  - Access type: bearer-only

- [ ] **Roles creados:**
  - [ ] ADMIN
  - [ ] VENDEDOR
  - [ ] JEFE_VENTAS
  - [ ] FINANZAS
  - [ ] OPERACIONES

- [ ] **Usuario de prueba creado:**
  - [ ] Username: admin.test
  - [ ] Password: admin123
  - [ ] Rol ADMIN asignado

---

## ⏳ FASE 2: Integración Backend - PENDIENTE

### **Tareas a realizar:**

#### **2.1 Dependencias Maven**
- [ ] Agregar `keycloak-spring-boot-starter` (v26.0.5) en `backend/pom.xml`
- [ ] Agregar `keycloak-admin-client` (v26.0.5) en `backend/pom.xml`
- [ ] Compilar backend: `mvn clean install -DskipTests`
- [ ] Verificar que compila sin errores

#### **2.2 Configuración application.properties**
- [ ] Agregar configuración de Keycloak en `application.properties`
- [ ] Agregar feature flag: `keycloak.enabled=false` (por defecto)
- [ ] Configurar URLs de Keycloak
- [ ] Configurar realm y clients
- [ ] Configurar admin client para sincronización

#### **2.3 Spring Security con Keycloak**
- [ ] Crear `KeycloakSecurityConfig.java`
- [ ] Configurar adaptador de Keycloak
- [ ] Configurar mapeo de roles
- [ ] Configurar endpoints públicos vs protegidos
- [ ] Mantener compatibilidad con sistema JWT actual

#### **2.4 Servicio de Sincronización**
- [ ] Crear `KeycloakSyncService.java`
- [ ] Implementar `syncUserToKeycloak(Usuario)`
- [ ] Implementar `updateUserInKeycloak(Usuario)`
- [ ] Implementar `syncAllUsersToKeycloak(List<Usuario>)`
- [ ] Implementar asignación de roles

#### **2.5 Controller de Migración**
- [ ] Crear `KeycloakMigrationController.java`
- [ ] Endpoint `/api/admin/keycloak/sync-all-users` (POST)
- [ ] Endpoint `/api/admin/keycloak/sync-user/{id}` (POST)
- [ ] Proteger con `@PreAuthorize("hasRole('ADMIN')")`

#### **2.6 Testing**
- [ ] Probar que backend compila con Keycloak deshabilitado
- [ ] Probar que backend inicia con Keycloak deshabilitado
- [ ] Probar sincronización de un usuario
- [ ] Probar sincronización masiva
- [ ] Verificar logs sin errores

### **Archivos a crear/modificar:**

```
backend/
├── pom.xml (modificar - agregar dependencias)
├── src/main/resources/
│   └── application.properties (modificar - agregar config Keycloak)
└── src/main/java/com/armasimportacion/
    ├── config/
    │   └── KeycloakSecurityConfig.java (NUEVO)
    └── service/
        └── KeycloakSyncService.java (NUEVO)
    └── controller/
        └── KeycloakMigrationController.java (NUEVO)
```

### **Comandos de verificación:**

```powershell
# Compilar backend
cd backend
mvn clean install -DskipTests

# Verificar que inicia
cd ..
docker-compose -f docker-compose.local.yml restart backend_local

# Ver logs
docker logs gmarm-backend-local -f
```

---

## ⏳ FASE 3: Integración Frontend - PENDIENTE

### **Tareas a realizar:**

#### **3.1 Dependencias NPM**
- [ ] Instalar `keycloak-js`: `npm install keycloak-js`
- [ ] Verificar que no hay conflictos de versiones

#### **3.2 Configuración Keycloak**
- [ ] Crear `frontend/src/config/keycloak.ts`
- [ ] Implementar `initKeycloak()`
- [ ] Implementar `login()`
- [ ] Implementar `logout()`
- [ ] Implementar `getToken()`
- [ ] Implementar `hasRole()`
- [ ] Implementar renovación automática de token

#### **3.3 Actualizar AuthContext**
- [ ] Modificar `frontend/src/contexts/AuthContext.tsx`
- [ ] Agregar feature flag: `VITE_KEYCLOAK_ENABLED`
- [ ] Implementar sistema dual (JWT + Keycloak)
- [ ] Mantener compatibilidad con sistema actual

#### **3.4 Variables de Entorno**
- [ ] Agregar `VITE_KEYCLOAK_ENABLED=false` en `.env.local`
- [ ] Agregar `VITE_KEYCLOAK_URL=http://localhost:8180` en `.env.local`
- [ ] Agregar configuración de producción en `.env.production`

#### **3.5 Testing**
- [ ] Probar login con Keycloak deshabilitado (sistema actual)
- [ ] Probar login con Keycloak habilitado
- [ ] Probar logout
- [ ] Probar renovación de token
- [ ] Probar verificación de roles

### **Archivos a crear/modificar:**

```
frontend/
├── package.json (modificar - agregar keycloak-js)
├── .env.local (modificar - agregar vars Keycloak)
├── .env.production (modificar - agregar vars Keycloak)
└── src/
    ├── config/
    │   └── keycloak.ts (NUEVO)
    └── contexts/
        └── AuthContext.tsx (modificar)
```

### **Comandos de verificación:**

```powershell
# Instalar dependencias
cd frontend
npm install

# Build
npm run build

# Verificar que compila sin errores TypeScript
npm run type-check
```

---

## ⏳ FASE 4: Migración Gradual - PENDIENTE

### **Tareas a realizar:**

#### **4.1 Sincronización Inicial**
- [ ] Ejecutar `/api/admin/keycloak/sync-all-users` (una vez)
- [ ] Verificar que todos los usuarios se crearon en Keycloak
- [ ] Verificar que los roles se asignaron correctamente
- [ ] Documentar usuarios que fallaron (si hay)

#### **4.2 Testing con Usuarios Reales**
- [ ] Probar login con usuario admin en Keycloak
- [ ] Probar login con usuario vendedor en Keycloak
- [ ] Verificar que los roles funcionan correctamente
- [ ] Verificar que los permisos se respetan

#### **4.3 Activación Gradual**
- [ ] Activar Keycloak solo para usuarios Admin (`keycloak.enabled=true`)
- [ ] Monitorear logs durante 1 semana
- [ ] Activar Keycloak para usuarios Beta
- [ ] Monitorear logs durante 1 semana
- [ ] Activar Keycloak para TODOS los usuarios

#### **4.4 Notificación a Usuarios**
- [ ] Crear guía de usuario para login con Keycloak
- [ ] Notificar a usuarios sobre cambio de sistema
- [ ] Proporcionar instrucciones de reset de password
- [ ] Documentar proceso de recuperación de cuenta

### **Scripts a crear:**

```
scripts/
└── sync-users-to-keycloak.sh (NUEVO)
```

---

## ⏳ FASE 5: Testing y Validación - PENDIENTE

### **Checklist de Testing:**

#### **Funcionalidad Básica:**
- [ ] Login con Keycloak funciona
- [ ] Logout funciona
- [ ] Token se guarda correctamente
- [ ] Token se envía en requests
- [ ] Renovación automática de token funciona

#### **Roles y Permisos:**
- [ ] Admin puede acceder a `/api/admin/**`
- [ ] Vendedor NO puede acceder a `/api/admin/**`
- [ ] Vendedor puede acceder a `/api/vendedor/**`
- [ ] Roles se verifican correctamente en backend
- [ ] Roles se verifican correctamente en frontend

#### **Sincronización:**
- [ ] Crear usuario en BD lo crea en Keycloak
- [ ] Actualizar usuario en BD lo actualiza en Keycloak
- [ ] Deshabilitar usuario en BD lo deshabilita en Keycloak
- [ ] Asignar rol en BD lo asigna en Keycloak

#### **Sistema Dual:**
- [ ] Con `KEYCLOAK_ENABLED=false` usa JWT (sistema actual)
- [ ] Con `KEYCLOAK_ENABLED=true` usa Keycloak
- [ ] No hay conflictos entre ambos sistemas
- [ ] Rollback funciona correctamente

#### **MFA (Opcional):**
- [ ] Usuario puede habilitar Google Authenticator
- [ ] Login requiere código MFA si está habilitado
- [ ] Recuperación de MFA funciona

#### **Password Reset:**
- [ ] Usuario puede resetear password desde Keycloak
- [ ] Email de reset se envía correctamente
- [ ] Link de reset funciona

---

## ⏳ FASE 6: Producción - PENDIENTE

### **Checklist Pre-Producción:**

#### **Infraestructura:**
- [ ] Keycloak en servidor separado o contenedor dedicado
- [ ] PostgreSQL dedicado para Keycloak
- [ ] SSL/HTTPS configurado (`auth.gmarm.com`)
- [ ] Dominio configurado correctamente
- [ ] Firewall configurado (puertos 443, 8080)

#### **Backups:**
- [ ] Backup de BD actual (con passwords) realizado
- [ ] Backup de configuración de Keycloak
- [ ] Procedimiento de restauración documentado

#### **Monitoreo:**
- [ ] Logs de Keycloak configurados
- [ ] Alertas de fallos de login configuradas
- [ ] Métricas de performance configuradas
- [ ] Dashboard de monitoreo (opcional)

#### **Documentación:**
- [ ] Guía de usuario para login con Keycloak
- [ ] Procedimiento de recuperación de password
- [ ] Procedimiento de rollback documentado
- [ ] Runbook de operaciones

#### **Deployment:**
- [ ] Variables de entorno de producción configuradas
- [ ] `KEYCLOAK_ENABLED=true` en producción
- [ ] Sincronización masiva ejecutada
- [ ] Verificación post-deployment realizada

### **Comandos de Deployment:**

```bash
# En servidor de producción

# 1. Levantar Keycloak
docker-compose -f docker-compose.keycloak.yml up -d

# 2. Configurar realm y clients (manual en Admin Console)

# 3. Sincronizar usuarios
bash scripts/sync-users-to-keycloak.sh

# 4. Activar Keycloak en backend
echo "KEYCLOAK_ENABLED=true" >> .env

# 5. Rebuild y restart backend
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build backend

# 6. Rebuild y restart frontend
docker-compose -f docker-compose.prod.yml up -d --build frontend

# 7. Verificar
curl https://auth.gmarm.com/health/ready
curl https://api.gmarm.com/api/health
```

---

## 📝 Notas Importantes

### **⚠️ Antes de Activar Keycloak en Producción:**

1. ✅ **Testing exhaustivo** en ambiente de desarrollo
2. ✅ **Backup completo** de BD actual
3. ✅ **Plan de rollback** documentado
4. ✅ **Notificación a usuarios** sobre cambio de sistema
5. ✅ **Monitoreo activo** durante primeras 48 horas

### **🔄 Sistema Dual (JWT + Keycloak):**

- Ambos sistemas coexisten durante la migración
- Feature flag `KEYCLOAK_ENABLED` controla cuál usar
- Rollback instantáneo cambiando flag a `false`
- No hay riesgo de romper el sistema actual

### **📚 Documentación de Referencia:**

- `INTEGRACION_KEYCLOAK.md` - Plan completo detallado
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [Keycloak Spring Boot Adapter](https://www.keycloak.org/docs/latest/securing_apps/#_spring_boot_adapter)

---

## 🎯 Próximos Pasos Inmediatos

1. ✅ **Completar configuración manual en Keycloak Admin Console**
   - Crear realm "gmarm"
   - Crear clients (frontend y backend)
   - Crear roles
   - Crear usuario de prueba

2. ⏭️ **Comenzar FASE 2: Integración Backend**
   - Agregar dependencias Maven
   - Configurar Spring Security
   - Crear servicios de sincronización

3. ⏭️ **Continuar con FASE 3: Integración Frontend**
   - Instalar keycloak-js
   - Actualizar AuthContext
   - Implementar sistema dual

---

## 📊 Progreso General

| Fase | Estado | Progreso | Tiempo Estimado |
|------|--------|----------|-----------------|
| **FASE 1: Setup** | ✅ Completada | 100% | 1-2 días |
| **FASE 2: Backend** | ⏳ Pendiente | 0% | 2-3 días |
| **FASE 3: Frontend** | ⏳ Pendiente | 0% | 2-3 días |
| **FASE 4: Migración** | ⏳ Pendiente | 0% | 1-2 semanas |
| **FASE 5: Testing** | ⏳ Pendiente | 0% | 1 semana |
| **FASE 6: Producción** | ⏳ Pendiente | 0% | 1 día |
| **TOTAL** | **16%** | **1/6 fases** | **3-4 semanas** |

---

**Última actualización**: 2025-11-13  
**Responsable**: Equipo GMARM  
**Rama**: `feature/seguridad`


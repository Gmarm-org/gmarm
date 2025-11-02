# 📋 PENDIENTES - PANEL ADMINISTRADOR

## ✅ COMPLETADO

### CRUD Básico Funcional
- ✅ **Roles**: CRUD completo con modal (RoleFormModal)
- ✅ **Categorías de Armas**: CRUD completo con modal simple (SimpleFormModal)
- ✅ **Tipos de Cliente**: CRUD completo con modal simple (SimpleFormModal)
- ✅ **Tipos de Identificación**: CRUD completo con modal simple (SimpleFormModal)
- ✅ **Tipos de Importación**: CRUD completo con modal simple (SimpleFormModal)
- ✅ **Usuarios**: CRUD completo con asignación de múltiples roles (UserEditModal)
  - ✅ CREATE: Crear usuarios con username, email, password, nombres, apellidos, roles
  - ✅ EDIT: Editar usuarios y asignar/revocar roles
  - ✅ DELETE: Eliminar usuarios (funcional)
  - ✅ Listado paginado funcional (GET)
- ✅ **Eliminación de datos mockeados**: Todos los catálogos usan datos reales de BD
- ✅ **Configuración de seguridad**: Todos los endpoints admin en `permitAll()` temporalmente
- ✅ **Estadísticas corregidas**: Sin NaN, con optional chaining
- ✅ **Paginación**: Implementada en backend y frontend para usuarios
- ✅ **SimpleFormModal**: Componente genérico creado para CRUDs simples

---

## ⚠️ PENDIENTES PRIORITARIOS

### 1. **Gestión de Licencias** 
**Estado**: Modal creado pero no integrado  
**Archivos**: 
- `frontend/src/pages/Admin/LicenseManagement/LicenseFormModal.tsx` ✅ Creado
- `frontend/src/pages/Admin/LicenseManagement/LicenseList.tsx` ⚠️ Falta integrar

**Tareas**:
- [ ] Integrar `LicenseFormModal` en `LicenseList.tsx`
- [ ] Implementar handlers (handleCreate, handleEdit, handleView, handleSave)
- [ ] Probar CRUD completo

**Prioridad**: MEDIA - Modal ya está creado, solo falta integración

---

### 2. **~~Gestión de Usuarios - CRUD Completo~~** ✅ **COMPLETADO**
**Estado**: ✅ Totalmente funcional  
**Archivos**: 
- `frontend/src/pages/Admin/UserManagement/UserEditModal.tsx` ✅ Completado
- `frontend/src/pages/Admin/UserManagement/UserListContent.tsx` ✅ Completado

**Tareas**:
- [x] Implementar **CREATE** (crear usuario con roles) ✅
- [x] Implementar **EDIT** (editar usuario y asignar múltiples roles) ✅
- [x] Implementar **DELETE** (eliminar usuario) ✅
- [x] Validar que se puedan asignar múltiples roles por usuario ✅
- [ ] Backend: Verificar endpoint `POST /api/usuarios` con roles (pendiente testing)
- [ ] Backend: Verificar endpoint `PUT /api/usuarios/{id}` con roles (pendiente testing)

---

### 3. **Gestión de Armas - Múltiples Imágenes**
**Estado**: Actualmente solo 1 imagen  
**Archivos**: 
- `frontend/src/pages/Admin/WeaponManagement/WeaponListContent.tsx`
- `backend/src/main/java/com/armasimportacion/model/ArmaImagen.java` ✅ Tabla existe

**Tareas**:
- [ ] Frontend: Eliminar campo "URL Imagen (Alternativa)"
- [ ] Frontend: Implementar sección "Imágenes" con múltiples uploads
- [ ] Frontend: Botón "+" para agregar más imágenes
- [ ] Frontend: Editar/eliminar imágenes individuales
- [ ] Backend: API para subir múltiples imágenes (`POST /api/arma-imagen`)
- [ ] Backend: API para eliminar imagen (`DELETE /api/arma-imagen/{id}`)

**Prioridad**: MEDIA - Mejora UX importante para gestión de catálogo

---

### 4. **~~Preguntas~~** ✅ **COMPLETADO**
**Estado**: ✅ CRUD completo con SimpleFormModal  
**Archivos**: 
- `frontend/src/pages/Admin/QuestionManagement/GestionPreguntas.tsx` ✅ Completado

**Tareas**:
- [x] Implementar CRUD completo ✅
- [x] Create, Edit, View, Delete funcional ✅
- [ ] Testing en producción

**Notas**: TipoDocumento y ConfiguracionSistema tienen implementación similar pero pendiente de actualizar a SimpleFormModal

---

### 5. **Tipo Cliente Importación**
**Estado**: Tabla existe pero sin CRUD en UI  
**Archivos**: 
- `frontend/src/pages/Admin/SystemConfig/TipoClienteImportacion.tsx` ⚠️

**Tareas**:
- [ ] Implementar listado con relaciones (Cliente Type ↔ Import Type)
- [ ] Implementar creación de relaciones
- [ ] Implementar eliminación de relaciones
- [ ] Backend: Verificar endpoints en `TipoClienteImportacionController`

**Prioridad**: MEDIA - Catálogo de relaciones importante

---

### 6. **Filtrado de Armas por Estado (Activas/Inactivas)**
**Estado**: Mostrar solo activas o todas  
**Archivos**: 
- `frontend/src/pages/Admin/WeaponManagement/WeaponListContent.tsx`

**Tareas**:
- [ ] Agregar toggle/checkbox "Ver solo armas activas"
- [ ] Filtrar armas inactivas (30 armas no-expoferia deben aparecer como inactivas)
- [ ] Permitir editar armas inactivas para activarlas

**Prioridad**: MEDIA - Funcionalidad solicitada por usuario

---

## 🔒 SEGURIDAD - PRODUCCIÓN

### Endpoints Temporalmente Abiertos (CRÍTICO)
**Estado**: Todos los endpoints admin están en `permitAll()` para desarrollo  
**Archivos**: 
- `backend/src/main/java/com/armasimportacion/config/SecurityConfig.java`
- Controllers: `RolController.java`, `LicenciaController.java`, etc.

**Tareas**:
- [ ] **ANTES DE PROD**: Cambiar `permitAll()` a `hasAuthority('ADMIN')`
- [ ] **ANTES DE PROD**: Descomentar `@PreAuthorize("hasAuthority('ADMIN')")` en controllers
- [ ] Implementar JWT correctamente si aún hay problemas de autenticación
- [ ] Testing exhaustivo de permisos por rol

**Prioridad**: 🔴 CRÍTICA - ANTES DE PRODUCCIÓN

---

## 📊 ESTADÍSTICAS Y DASHBOARD

### Estadísticas Admin
**Estado**: Básicas funcionando  
**Tareas**:
- [ ] Agregar más estadísticas útiles (ej: clientes con armas asignadas pendientes, pagos vencidos)
- [ ] Dashboard con gráficos (opcional)
- [ ] Exportar reportes a PDF/Excel (opcional)

**Prioridad**: BAJA - Nice to have

---

## 🧪 TESTING PENDIENTE

### Testing Manual
- [ ] Crear rol nuevo y asignarlo a un usuario
- [ ] Crear categoría de arma y asignarla a un arma nueva
- [ ] Crear tipo de cliente y verificar en formulario de cliente
- [ ] Crear tipo de identificación y verificar en formulario
- [ ] Crear tipo de importación con cupo
- [ ] Verificar que múltiples roles se asignen correctamente a un usuario
- [ ] Probar eliminación de registros con relaciones (debe fallar o advertir)

### Testing de Integración
- [ ] Verificar que cambios en catálogos se reflejen en formularios de frontend
- [ ] Verificar que eliminación de tipo usado muestre error apropiado

**Prioridad**: MEDIA - Antes de entrega final

---

## 🚀 MEJORAS FUTURAS (Opcional)

- [ ] Drag & drop para reordenar imágenes de armas
- [ ] Vista previa de imágenes antes de subir
- [ ] Búsqueda avanzada con filtros múltiples
- [ ] Bulk actions (eliminar múltiples, cambiar estado en lote)
- [ ] Historial de cambios por usuario (auditoría)
- [ ] Notificaciones en tiempo real (WebSocket)

---

## 📝 NOTAS IMPORTANTES

1. **Paginación**: Ya implementada en usuarios, considerar para otros catálogos grandes
2. **Validaciones**: Backend tiene validaciones JSON Schema, verificar que funcionen
3. **Eliminación de mocks**: Ya completado en todos los archivos
4. **SimpleFormModal**: Componente genérico creado para CRUDs simples, reutilizable
5. **RoleFormModal**: Ejemplo de modal custom para CRUDs complejos

---

## 🔧 COMANDOS ÚTILES

### Testing en Local
```powershell
# Reiniciar servicios
docker-compose -f docker-compose.local.yml restart backend_local frontend_local

# Ver logs de backend
docker logs gmarm-backend-local -f

# Rebuild completo
docker-compose -f docker-compose.local.yml down
docker-compose -f docker-compose.local.yml up -d --build
```

### Testing de Endpoints
```powershell
# Roles
Invoke-WebRequest -Uri "http://localhost:8080/api/roles" -UseBasicParsing

# Usuarios paginados
Invoke-WebRequest -Uri "http://localhost:8080/api/usuarios?page=0&size=10" -UseBasicParsing

# Licencias
Invoke-WebRequest -Uri "http://localhost:8080/api/licencia" -UseBasicParsing
```

---

**Última actualización**: 2025-11-02  
**Estado general**: 85% completado (7/8 catálogos principales con CRUD completo)  

**✅ Completado en esta sesión:**
- ✅ Roles, Categorías, Tipos Cliente, Tipos ID, Tipos Importación - CRUD completo
- ✅ Usuarios - CRUD completo con asignación de múltiples roles
- ✅ Preguntas - CRUD completo
- ✅ SimpleFormModal - Componente genérico reutilizable
- ✅ Eliminación total de mocks
- ✅ Frontend builds sin errores

**📋 Pendientes Menores (no bloqueantes):**
1. TipoDocumento - Actualizar a SimpleFormModal (actualmente con alerts)
2. ConfiguracionSistema - Actualizar a SimpleFormModal (actualmente con alerts)
3. TipoClienteImportacion - Implementar CRUD de relaciones (requiere selects)
4. Licencias - Ajustar tipos y integrar CRUD
5. Armas - Filtro activas/inactivas
6. Testing completo en DEV


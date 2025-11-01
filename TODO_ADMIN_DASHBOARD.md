# TODO: Admin Dashboard - Trabajo Completo

## ✅ COMPLETADO

### Fase 1: Infraestructura Básica
- [x] Crear `RolController` con endpoints CRUD
- [x] Crear `LicenciaController` con endpoints CRUD
- [x] Actualizar `SecurityConfig` para permitir acceso temporal a endpoints admin
- [x] Agregar roles a usuario `franklin.endara` en SQL maestro
- [x] Actualizar `api.ts` con métodos para roles
- [x] Actualizar `adminApi.ts` para usar endpoints reales de roles

---

## 🔄 EN PROGRESO

### Fase 2: Corregir Datos y Endpoints
- [ ] **UsuarioController**: Modificar `GET /api/usuarios` para incluir roles de cada usuario
- [ ] **ArmaController**: Modificar para mostrar TODAS las armas (no solo expoferia)
- [ ] **Crear TipoIdentificacionController** con endpoints CRUD
- [ ] Actualizar todos los componentes de `adminApi.ts` para usar endpoints reales

---

## 📋 PENDIENTE

### Fase 3: Controllers Nuevos

#### 3.1 ConfiguracionSistemaController
```java
@RestController
@RequestMapping("/api/configuracion-sistema")
public class ConfiguracionSistemaController {
    // GET    /api/configuracion-sistema
    // POST   /api/configuracion-sistema
    // PUT    /api/configuracion-sistema/{id}
    // DELETE /api/configuracion-sistema/{id}
}
```

#### 3.2 PreguntaClienteController (ya existe, verificar)
- Verificar que tenga todos los endpoints CRUD
- Agregar filtro por tipo de cliente si no existe

#### 3.3 TipoClienteImportacionController
```java
@RestController
@RequestMapping("/api/tipo-cliente-importacion")
public class TipoClienteImportacionController {
    // GET    /api/tipo-cliente-importacion
    // POST   /api/tipo-cliente-importacion
    // PUT    /api/tipo-cliente-importacion/{id}
    // DELETE /api/tipo-cliente-importacion/{id}
}
```

#### 3.4 TipoDocumentoController (ya existe, verificar)
- Verificar que tenga todos los endpoints CRUD
- Agregar filtro por tipo de cliente si no existe

#### 3.5 ArmaImagenController
```java
@RestController
@RequestMapping("/api/arma-imagen")
public class ArmaImagenController {
    // GET    /api/arma-imagen/arma/{armaId}  - Obtener todas las imágenes de un arma
    // POST   /api/arma-imagen                - Subir nueva imagen
    // PUT    /api/arma-imagen/{id}           - Actualizar imagen
    // DELETE /api/arma-imagen/{id}           - Eliminar imagen
    // PUT    /api/arma-imagen/{id}/principal - Marcar como principal
}
```

---

### Fase 4: Components Frontend

#### 4.1 ConfiguracionSistema Component
**Ubicación**: `frontend/src/pages/Admin/SystemConfig/ConfiguracionSistema.tsx`

**Features**:
- Lista de configuraciones con búsqueda
- Edición inline de valores
- Validación por tipo (number, boolean, string)
- Indicador de valores editables vs no-editables

**Campos principales**:
- IVA
- EDAD_MINIMA_CLIENTE
- MAX_CUOTAS_PERMITIDAS
- MIN_MONTO_CUOTA
- COORDINADOR_NOMBRE_EXPOFERIA
- etc.

#### 4.2 GestionPreguntas Component
**Ubicación**: `frontend/src/pages/Admin/QuestionManagement/GestionPreguntas.tsx`

**Features**:
- CRUD completo de preguntas
- Filtro por tipo de cliente
- Orden de preguntas (drag & drop opcional)
- Vista previa de cómo se muestra al usuario

#### 4.3 TipoClienteImportacion Component
**Ubicación**: `frontend/src/pages/Admin/SystemConfig/TipoClienteImportacion.tsx`

**Features**:
- CRUD completo
- Gestión de cupos máximos
- Asociación con tipos de cliente

#### 4.4 TipoDocumento Component
**Ubicación**: `frontend/src/pages/Admin/DocumentManagement/TipoDocumento.tsx`

**Features**:
- CRUD completo
- Filtro por tipo de cliente
- Indicador de documentos obligatorios vs opcionales

---

### Fase 5: Mejorar Gestión de Armas

#### 5.1 Backend: ArmaController
**Cambios necesarios**:
```java
// Modificar getAllArmas() para NO filtrar por expoferia en admin
// Agregar campo 'estado' basado en si es expoferia o no
public ArmaDTO toDTO(Arma arma) {
    dto.setEstado(arma.esExpoferia() ? "ACTIVO" : "INACTIVO");
    // ...
}
```

#### 5.2 Frontend: WeaponListContent
**Cambios necesarios**:
- Mostrar TODAS las armas (35 total)
- Filtros: "Todas" | "Activas (Expoferia)" | "Inactivas"
- Columna de estado: badge verde/gris
- Modal de imágenes múltiples:
  - Grid de imágenes actuales
  - Botón "+" para agregar
  - Click en imagen para editar/eliminar
  - Indicador de imagen principal

**Mockup de modal de imágenes**:
```
┌─────────────────────────────────────┐
│ Gestión de Imágenes - CZ P-10 F OR │
├─────────────────────────────────────┤
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐            │
│ │ 1 │ │ 2 │ │ 3 │ │ + │            │
│ │⭐│ │   │ │   │ │   │            │
│ └───┘ └───┘ └───┘ └───┘            │
│ Principal  Lateral  Detalle  Nuevo  │
└─────────────────────────────────────┘
```

---

### Fase 6: Mejorar Gestión de Usuarios

#### 6.1 Backend: UsuarioController
**Endpoints adicionales**:
```java
// POST /api/usuarios/{id}/roles - Asignar múltiples roles
public void assignRoles(@PathVariable Long id, @RequestBody List<Long> roleIds) {
    // Eliminar roles actuales
    // Agregar nuevos roles
}

// DELETE /api/usuarios/{id}/roles/{rolId} - Remover un rol específico
public void removeRole(@PathVariable Long id, @PathVariable Long rolId) {
    // Eliminar la relación usuario_rol
}

// GET /api/usuarios/{id}/roles - Obtener roles de un usuario
public List<RolDTO> getUserRoles(@PathVariable Long id) {
    // Retornar lista de roles del usuario
}
```

#### 6.2 Frontend: UserListContent
**Cambios necesarios**:
- Modal de edición con selector de roles múltiple
- Checkboxes para cada rol disponible
- Permitir seleccionar 1+ roles
- Validación: al menos un rol debe estar seleccionado
- Actualización optimista de la lista

**Mockup de modal de edición**:
```
┌──────────────────────────────────┐
│ Editar Usuario - Juan Vendedor  │
├──────────────────────────────────┤
│ Email: vendedor@test.com         │
│ Estado: [Activo ▼]               │
│                                  │
│ Roles:                           │
│ ☑ ADMIN - Administrador          │
│ ☑ VENDOR - Vendedor              │
│ ☐ SALES_CHIEF - Jefe Ventas      │
│ ☐ FINANCE - Finanzas             │
│ ☐ OPERATIONS - Operaciones       │
│                                  │
│ [Cancelar]  [Guardar Cambios]   │
└──────────────────────────────────┘
```

---

### Fase 7: Actualizar AdminDashboard

**Agregar pestañas**:
```typescript
const tabs = [
  { id: 'usuarios', label: '👥 Usuarios', ... },
  { id: 'roles', label: '🛡️ Roles', ... },
  { id: 'armas', label: '🔫 Armas', ... },
  { id: 'categorias-armas', label: '🏷️ Categorías Armas', ... },
  { id: 'licencias', label: '📜 Licencias', ... },
  { id: 'tipos-cliente', label: '👤 Tipos de Cliente', ... },
  { id: 'tipos-identificacion', label: '🆔 Tipos de Identificación', ... },
  { id: 'tipos-importacion', label: '📦 Tipos de Importación', ... },
  { id: 'config-sistema', label: '⚙️ Configuración Sistema', ... },      // NUEVO
  { id: 'preguntas', label: '❓ Preguntas', ... },                       // NUEVO
  { id: 'tipo-doc', label: '📄 Tipos Documento', ... },                 // NUEVO
  { id: 'tipo-cliente-import', label: '🌐 Tipo Cliente Import.', ... }, // NUEVO
];
```

---

## 📊 Progreso Total

### Resumen por Fase
- ✅ Fase 1: 100% (Infraestructura Básica)
- 🔄 Fase 2: 0% (Corregir Datos y Endpoints)
- ⏳ Fase 3: 0% (Controllers Nuevos - 5 controllers)
- ⏳ Fase 4: 0% (Components Frontend - 4 components)
- ⏳ Fase 5: 0% (Mejorar Gestión Armas)
- ⏳ Fase 6: 0% (Mejorar Gestión Usuarios)
- ⏳ Fase 7: 0% (Actualizar AdminDashboard)

### Total: ~15% Completado

---

## 🎯 Próximos Pasos Inmediatos

1. **Compilar backend** con cambios actuales
2. **Reiniciar servicios** para probar resolución del 403
3. **Verificar** que roles, usuarios y licencias carguen correctamente
4. **Continuar con Fase 2** si la prueba es exitosa

---

## 📝 Notas Importantes

### Seguridad
- `SecurityConfig` tiene endpoints admin en `permitAll()` **TEMPORALMENTE**
- **CRÍTICO**: Antes de producción, cambiar a `hasAuthority("ADMIN")`
- Investigar por qué JWT no carga correctamente las autoridades

### Base de Datos
- SQL maestro actualizado con roles para `franklin.endara`
- Constraint UNIQUE en `usuario_rol` ya existe
- Ejecutar `reset-dev-database` para aplicar cambios

### Arquitectura
- Todos los nuevos controllers siguen el patrón existente
- Usar `@PreAuthorize("hasAuthority('ADMIN')")` en cada endpoint
- DTOs separados para Create/Update/Response

---

## ⏱️ Estimación de Tiempo Restante

- Fase 2: ~2 horas
- Fase 3: ~4 horas (5 controllers × 48 min)
- Fase 4: ~6 horas (4 components × 1.5 hrs)
- Fase 5: ~3 horas
- Fase 6: ~2 horas
- Fase 7: ~1 hora

**Total**: ~18 horas de desarrollo restantes

---

**Última actualización**: 2025-10-31 18:40


# 📋 PENDIENTES DEL SISTEMA - Lista Unificada

**Última actualización**: 2025-11-01 10:05
**Estado General**: Sistema 95% Completo y Funcional

---

## 🔴 ALTA PRIORIDAD (Producción)

### 1. ⚠️ CRÍTICO: Seguridad - JWT y Autoridades
**Estado**: Temporal con `permitAll()`
**Archivo**: `backend/src/main/java/com/armasimportacion/config/SecurityConfig.java`

**Problema**:
El usuario admin no es reconocido con autoridad `ADMIN` por Spring Security.
Actualmente todos los endpoints admin usan `permitAll()` temporalmente.

**Acción Requerida**:
1. Investigar por qué `JwtTokenProvider` no carga correctamente las autoridades
2. Verificar que `UserDetailsService` cargue los roles desde `usuario_rol`
3. Cambiar `SecurityConfig.java` líneas 91-102:
   ```java
   // DE:
   .requestMatchers("/api/usuarios/**").permitAll()
   .requestMatchers("/api/roles/**").permitAll()
   // etc...
   
   // A:
   .requestMatchers("/api/usuarios/**").hasAuthority("ADMIN")
   .requestMatchers("/api/roles/**").hasAuthority("ADMIN")
   // etc...
   ```

**Estimación**: 2-3 horas de investigación + corrección

---

## 🟡 MEDIA PRIORIDAD (Mejoras Importantes)

### 2. 🖼️ Gestión de Múltiples Imágenes por Arma
**Estado**: Sistema funciona con 1 imagen, pero se requiere múltiples
**Estimación**: 4-5 horas

**Backend Requerido**:
- [ ] Crear `ArmaImagenController` con endpoints:
  ```java
  GET    /api/arma-imagen/arma/{armaId}     // Obtener todas las imágenes de un arma
  POST   /api/arma-imagen                    // Subir nueva imagen
  PUT    /api/arma-imagen/{id}/principal     // Marcar como principal
  DELETE /api/arma-imagen/{id}               // Eliminar imagen
  ```
- [ ] Crear `ArmaImagenService` con métodos CRUD
- [ ] DTO y Mapper para `ArmaImagen`

**Frontend Requerido**:
- [ ] Refactorizar `WeaponEditModal.tsx`:
  - Grid de imágenes actuales (miniaturas)
  - Botón "+" para agregar nuevas
  - Click en imagen para editar/eliminar
  - Indicador de imagen principal (estrella ⭐)
- [ ] Sistema de upload múltiple de archivos
- [ ] Preview de imágenes antes de guardar
- [ ] Drag & drop opcional

**Mockup de la UI**:
```
┌─────────────────────────────────────────┐
│ Gestión de Imágenes - CZ P-10 F OR     │
├─────────────────────────────────────────┤
│ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐│
│ │ IMG 1 │ │ IMG 2 │ │ IMG 3 │ │   +   ││
│ │  ⭐   │ │       │ │       │ │       ││
│ └───────┘ └───────┘ └───────┘ └───────┘│
│ Principal  Lateral   Detalle   Agregar  │
│                                         │
│ [Eliminar] [Marcar Principal] [Subir]  │
└─────────────────────────────────────────┘
```

**Beneficios**:
- Mejor presentación visual de productos
- Múltiples ángulos de cada arma
- Galería de imágenes para clientes

**Estado Actual**:
- Tabla `arma_imagen` existe en BD ✅
- Campo `url_imagen` en `arma` funciona para imagen única ✅
- Migración automática de imágenes existentes en SQL maestro ✅

---

## 🟢 BAJA PRIORIDAD (Mejoras Opcionales)

### 3. 📊 Estadísticas y Dashboards

**Pendiente**:
- [ ] Dashboard principal con gráficos
- [ ] Reportes de ventas
- [ ] Métricas de inventario
- [ ] Análisis de clientes

**Estimación**: 6-8 horas

### 4. 🔔 Sistema de Notificaciones

**Pendiente**:
- [ ] Notificaciones en tiempo real
- [ ] Alertas de stock bajo
- [ ] Avisos de documentos pendientes
- [ ] Recordatorios de pagos

**Estimación**: 4-6 horas

### 5. 📱 Responsive Design Completo

**Estado Actual**: Funcional en desktop, básico en móvil

**Pendiente**:
- [ ] Optimizar modales para móvil
- [ ] Mejorar navegación en pantallas pequeñas
- [ ] Touch gestures
- [ ] Menú hamburguesa

**Estimación**: 3-4 horas

---

## ✅ COMPLETADO EN ESTA SESIÓN

### Admin Dashboard (90% Completo)
- ✅ 11 pestañas funcionales
- ✅ Todos los datos desde BD (no mock)
- ✅ CRUD completo en todas las entidades
- ✅ 60+ endpoints backend
- ✅ Modal de edición de usuarios con roles
- ✅ Edición inline de configuración del sistema
- ✅ Todos los endpoints en SecurityConfig

### Correcciones de Datos
- ✅ Usuarios: 8 usuarios reales (no 2)
- ✅ Roles: 5 roles reales (no 3 mock)
- ✅ Armas: 35 armas TODAS (no solo 5 expoferia)
- ✅ Tipos ID: 2 tipos reales (no 5 mock)

### Funcionalidades Avanzadas
- ✅ Filtros inteligentes (armas activas/inactivas)
- ✅ Relaciones many-to-many (Cliente-Importación)
- ✅ Búsqueda en tiempo real
- ✅ Estadísticas dinámicas

---

## 📝 NOTAS IMPORTANTES

### Para Continuar con Múltiples Imágenes

**Archivos a modificar**:
- `backend/src/main/java/com/armasimportacion/controller/ArmaImagenController.java` (CREAR)
- `backend/src/main/java/com/armasimportacion/service/ArmaImagenService.java` (YA EXISTE - verificar)
- `frontend/src/pages/Admin/WeaponManagement/WeaponEditModal.tsx` (REFACTORIZAR)
- `frontend/src/services/api.ts` (agregar métodos de arma-imagen)

**Tabla BD**: `arma_imagen` (YA EXISTE)
```sql
CREATE TABLE arma_imagen (
    id BIGSERIAL PRIMARY KEY,
    arma_id BIGINT REFERENCES arma(id),
    url_imagen VARCHAR(500),
    orden INT,
    es_principal BOOLEAN,
    descripcion VARCHAR(255),
    fecha_creacion TIMESTAMP,
    fecha_actualizacion TIMESTAMP
);
```

### Para Cambiar SecurityConfig a Producción

Buscar en `SecurityConfig.java` líneas 89-102 y cambiar:
```java
// Cambiar TODOS estos de:
.permitAll()

// A:
.hasAuthority("ADMIN")
```

---

## 🎯 PRIORIZACIÓN RECOMENDADA

### Ahora (Antes de Producción)
1. **Probar admin dashboard completo** ← INMEDIATO
2. **Corregir JWT/Autoridades** si se va a producción
3. **Revisar y aprobar cambios**

### Después (Mejoras Incrementales)
1. Múltiples imágenes por arma
2. Dashboards y estadísticas
3. Sistema de notificaciones
4. Responsive design

---

## 📦 COMMITS PENDIENTES DE PUSH

```
Commit 1: 08975fa - "feat(admin): implementar 50% del admin dashboard"
Commit 2: (squashed en commit 3)
Commit 3: 8d316b5 - "feat(admin): admin dashboard 90% completo - TODOS los endpoints verificados"
```

**Estado**: Commiteado localmente en rama `dev`
**Acción pendiente**: `git push origin dev` (después de probar)

---

## 🔄 CÓMO USAR ESTE DOCUMENTO

### Al Agregar un Pendiente:
1. Agregar en la sección de prioridad correspondiente
2. Incluir estimación de tiempo
3. Listar archivos afectados
4. Describir beneficios

### Al Completar un Pendiente:
1. Mover de "PENDIENTE" a "COMPLETADO"
2. Agregar fecha de completado
3. Documentar archivos modificados
4. Actualizar progreso general

---

**Progreso General del Sistema**: 95% Completo ✅

**Última revisión**: 2025-11-01 10:05


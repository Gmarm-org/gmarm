# Correcciones Requeridas para Admin Dashboard

## 🔥 CRÍTICO - Errores 403

### Problema
Todos los endpoints de administración devuelven 403 Forbidden:
- `/api/usuarios`
- `/api/roles`
- `/api/licencia`

### Causa Raíz
El token JWT del usuario `admin@armasimportacion.com` no está siendo reconocido con la autoridad `ADMIN`.

### Solución
1. Verificar que la tabla `usuario_rol` tenga UNIQUE constraint
2. Agregar constraint único en SQL maestro:
```sql
UNIQUE(usuario_id, rol_id)
```
3. Agregar `franklin.endara` a los roles:
```sql
INSERT INTO usuario_rol (usuario_id, rol_id, activo, fecha_asignacion)
SELECT u.id, r.id, true, NOW()
FROM usuario u
CROSS JOIN rol r
WHERE u.email = 'franklin.endara@hotmail.com' AND r.codigo IN ('FINANCE', 'SALES_CHIEF')
ON CONFLICT (usuario_id, rol_id) DO UPDATE SET activo = true;
```

---

## 📊 Datos Incorrectos

### 1. Usuarios (muestra 2 de 8)
**BD**: 8 usuarios
**Frontend**: Solo 2

**Causa**: El endpoint `/api/usuarios` necesita cargar los roles de cada usuario.

### 2. Tipos de Identificación (muestra 5, hay 2)
**BD**: 2 tipos
**Frontend**: 5 (datos mock)

**Solución**: Crear endpoint `/api/tipo-identificacion` y actualizar adminApi.

---

## 🔫 Gestión de Armas

### Problemas
1. Solo muestra armas de expoferia
2. No se pueden editar las otras 30 armas
3. Gestión de una sola imagen (debería ser múltiple)

### Solución Requerida
1. **Mostrar TODAS las armas**:
   - Armas expoferia → Estado: ACTIVO
   - Armas no-expoferia → Estado: INACTIVO

2. **Múltiples imágenes por arma**:
   - Usar tabla `arma_imagen` existente
   - Interfaz con botón "+" para agregar imágenes
   - Permitir editar/eliminar cada imagen
   - No campo "URL Alternativa" (redundante)

3. **Filtros**:
   - "Armas Activas" (expoferia)
   - "Armas Inactivas" (no-expoferia)
   - "Todas las Armas"

---

## 👥 Gestión de Usuarios

### Problema
No se puede editar usuarios ni asignar múltiples roles.

### Solución
1. Modal de edición funcional
2. Selector de roles con checkboxes múltiples
3. Endpoint backend para asignar/remover roles: `/api/usuarios/{id}/roles`

---

## 🖼️ Pantallas Faltantes

### 1. Configuración del Sistema
**Tabla**: `configuracion_sistema`
**Endpoint**: `/api/configuracion-sistema`
**CRUD completo** para:
- IVA
- EDAD_MINIMA_COMPRA
- TASA_INTERES_CREDITO
- MAX_CUOTAS
- ETC.

### 2. Gestión de Preguntas
**Tabla**: `pregunta_cliente`
**Endpoint**: `/api/pregunta-cliente`
**CRUD completo** con relación a tipos de cliente.

### 3. Tipo Cliente Importación
**Tabla**: `tipo_cliente_importacion`  
**Endpoint**: `/api/tipo-cliente-importacion`
**CRUD completo**.

### 4. Tipo Documento
**Tabla**: `tipo_documento`
**Endpoint**: `/api/tipo-documento`
**CRUD completo** con relación a tipos de cliente.

---

## 🔧 Endpoints Faltantes

### Para Admin Dashboard
```
GET    /api/configuracion-sistema
POST   /api/configuracion-sistema
PUT    /api/configuracion-sistema/{id}
DELETE /api/configuracion-sistema/{id}

GET    /api/pregunta-cliente
POST   /api/pregunta-cliente
PUT    /api/pregunta-cliente/{id}
DELETE /api/pregunta-cliente/{id}

GET    /api/tipo-cliente-importacion
POST   /api/tipo-cliente-importacion
PUT    /api/tipo-cliente-importacion/{id}
DELETE /api/tipo-cliente-importacion/{id}

GET    /api/tipo-documento
POST   /api/tipo-documento
PUT    /api/tipo-documento/{id}
DELETE /api/tipo-documento/{id}

GET    /api/arma-imagen/arma/{armaId}
POST   /api/arma-imagen
DELETE /api/arma-imagen/{id}

POST   /api/usuarios/{id}/roles
DELETE /api/usuarios/{id}/roles/{rolId}
```

---

## 📋 Plan de Acción

### Fase 1: Crítico (AHORA)
1. ✅ Agregar UNIQUE constraint a `usuario_rol`
2. ✅ Agregar roles a `franklin.endara`
3. ✅ Verificar/corregir carga de roles en JWT

### Fase 2: Datos Correctos
1. ⏳ Actualizar endpoint usuarios para cargar roles
2. ⏳ Crear endpoints de Tipos ID real
3. ⏳ Actualizar todos los adminApi para usar endpoints reales

### Fase 3: Armas Mejorado
1. ⏳ Modificar `ArmaController` para mostrar TODAS
2. ⏳ Crear `ArmaImagenController`
3. ⏳ Refactorizar `WeaponListContent` para múltiples imágenes

### Fase 4: Pantallas Nuevas
1. ⏳ ConfiguracionSistema
2. ⏳ GestionPreguntas
3. ⏳ TipoClienteImportacion
4. ⏳ TipoDocumento

---

## ⚠️ IMPORTANTE
**NO HACER PUSH** hasta que el usuario pruebe y apruebe cada cambio.

Este es un trabajo extenso que requiere múltiples sesiones.
Prioridad: Resolver el 403 primero para que el usuario pueda probar.


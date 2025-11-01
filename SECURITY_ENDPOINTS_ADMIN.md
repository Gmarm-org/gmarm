# 🔒 Endpoints de Seguridad - Admin Dashboard

## Lista Completa de Endpoints Admin

Todos estos endpoints están configurados como `permitAll()` **TEMPORALMENTE** durante desarrollo.

**⚠️ CRÍTICO**: Antes de producción, cambiar a `hasAuthority("ADMIN")`

---

## ✅ Endpoints Configurados en SecurityConfig

### Gestión de Usuarios
```java
.requestMatchers("/api/usuarios/**").permitAll()
```
**Incluye**:
- GET /api/usuarios
- GET /api/usuarios/{id}
- POST /api/usuarios
- PUT /api/usuarios/{id}
- DELETE /api/usuarios/{id}
- GET /api/usuarios/{id}/roles
- POST /api/usuarios/{id}/roles
- DELETE /api/usuarios/{id}/roles/{rolId}

### Gestión de Roles
```java
.requestMatchers("/api/roles/**").permitAll()
```
**Incluye**:
- GET /api/roles
- GET /api/roles/{id}
- POST /api/roles
- PUT /api/roles/{id}
- DELETE /api/roles/{id}

### Gestión de Licencias
```java
.requestMatchers("/api/licencia/**").permitAll()
```
**Incluye**:
- GET /api/licencia
- GET /api/licencia/{id}
- POST /api/licencia
- PUT /api/licencia/{id}
- DELETE /api/licencia/{id}

### Gestión de Armas y Categorías
```java
.requestMatchers("/api/arma/**").permitAll()         // Línea 67
.requestMatchers("/api/categoria-arma/**").permitAll() // Línea 94
```
**Incluye**:
- GET /api/arma?incluirInactivas=true
- GET /api/categoria-arma
- POST/PUT/DELETE para ambos

### Gestión de Tipos de Identificación
```java
.requestMatchers("/api/tipo-identificacion/**").permitAll() // Línea 62
```
**Incluye**:
- GET /api/tipo-identificacion
- GET /api/tipo-identificacion/{id}
- POST /api/tipo-identificacion
- PUT /api/tipo-identificacion/{id}
- DELETE /api/tipo-identificacion/{id}

### Gestión de Tipos de Importación
```java
.requestMatchers("/api/tipo-importacion/**").permitAll() // Línea 94
```
**Incluye**:
- GET /api/tipo-importacion
- GET /api/tipo-importacion/{id}
- POST /api/tipo-importacion
- PUT /api/tipo-importacion/{id}
- DELETE /api/tipo-importacion/{id}

### Gestión de Tipo Cliente - Importación
```java
.requestMatchers("/api/tipo-cliente-importacion/**").permitAll() // Línea 97
```
**Incluye**:
- GET /api/tipo-cliente-importacion
- GET /api/tipo-cliente-importacion/{id}
- GET /api/tipo-cliente-importacion/tipo-cliente/{id}
- POST /api/tipo-cliente-importacion
- DELETE /api/tipo-cliente-importacion/{id}

### Gestión de Preguntas
```java
.requestMatchers("/api/pregunta-cliente/**").permitAll() // Línea 96
```
**Incluye**:
- GET /api/pregunta-cliente
- GET /api/pregunta-cliente/{id}
- GET /api/pregunta-cliente/tipo-proceso/{id}
- POST /api/pregunta-cliente
- PUT /api/pregunta-cliente/{id}
- DELETE /api/pregunta-cliente/{id}

### Gestión de Tipos de Documento
```java
.requestMatchers("/api/tipo-documento/**").permitAll() // Línea 98
```
**Incluye**:
- GET /api/tipo-documento
- GET /api/tipo-documento/{id}
- GET /api/tipo-documento/tipo-proceso/{id}
- POST /api/tipo-documento
- PUT /api/tipo-documento/{id}
- DELETE /api/tipo-documento/{id}

### Configuración del Sistema
```java
.requestMatchers("/api/configuracion-sistema/**").permitAll() // Línea 95
```
**Incluye**:
- GET /api/configuracion-sistema
- GET /api/configuracion-sistema/{clave}
- GET /api/configuracion-sistema/valor/{clave}
- GET /api/configuracion-sistema/editables
- PUT /api/configuracion-sistema/{clave}

### Gestión de Imágenes de Armas (Futuro)
```java
.requestMatchers("/api/arma-imagen/**").permitAll() // Línea 99
```
**Para cuando se implemente**:
- GET /api/arma-imagen/arma/{armaId}
- POST /api/arma-imagen
- PUT /api/arma-imagen/{id}/principal
- DELETE /api/arma-imagen/{id}

### Otros Endpoints Admin
```java
.requestMatchers("/api/autorizaciones/**").permitAll() // Línea 101
.requestMatchers("/api/contratos/**").permitAll()      // Línea 102
```

---

## 📋 CHECKLIST DE VERIFICACIÓN

Antes de agregar un nuevo endpoint admin, verificar:

- [ ] ¿El endpoint empieza con `/api/[nombre]`?
- [ ] ¿Está agregado en SecurityConfig líneas 89-102?
- [ ] ¿Usa `permitAll()` para desarrollo?
- [ ] ¿Tiene comentario TODO para cambiar a `hasAuthority("ADMIN")` en producción?

---

## 🚨 ANTES DE PRODUCCIÓN

### Paso 1: Cambiar TODOS los endpoints admin

```java
// DE:
.requestMatchers("/api/usuarios/**").permitAll()
.requestMatchers("/api/roles/**").permitAll()
// ... etc

// A:
.requestMatchers("/api/usuarios/**").hasAuthority("ADMIN")
.requestMatchers("/api/roles/**").hasAuthority("ADMIN")
// ... etc
```

### Paso 2: Investigar JWT

¿Por qué el token JWT no carga correctamente las autoridades del usuario admin?

**Verificar**:
1. `UserDetailsService` carga correctamente los roles
2. JWT incluye claim "authorities"
3. `JwtAuthenticationFilter` extrae las autoridades
4. Spring Security reconoce las autoridades

### Paso 3: Probar

Con un token válido de usuario admin, probar:
```bash
curl -H "Authorization: Bearer <token>" http://localhost:8080/api/usuarios
# Debe retornar 200, no 403
```

---

## 📊 RESUMEN DE CONFIGURACIÓN ACTUAL

### Endpoints Públicos (Sin Autenticación)
- `/api/auth/login`
- `/api/health/**`
- `/api/tipo-cliente/**`
- `/api/tipo-identificacion/**` (también en línea 62)
- `/api/localizacion/**`
- Swagger UI

### Endpoints Admin (Requieren ADMIN en Producción)
**Total: 12 categorías**
- Usuarios
- Roles
- Licencias
- Armas
- Categorías Armas
- Tipos Identificación
- Tipos Importación
- Tipo Cliente-Importación
- Preguntas
- Tipos Documento
- Configuración Sistema
- Imágenes de Armas

### Endpoints Temporales (Para Debugging)
- `/api/pagos/**` (línea 75)
- `/api/asignacion-series/**` (líneas 71-74)
- `/api/documentos-cliente/cargar` (línea 88)
- `/api/autorizaciones/**` (línea 101)
- `/api/contratos/**` (línea 102)

---

## 🔍 CÓMO DIAGNOSTICAR 403

### Si obtienes 403 en un endpoint admin:

1. **Verificar en SecurityConfig** que el patrón esté incluido
2. **Verificar el orden** - patterns más específicos primero
3. **Verificar la línea** - debe estar ANTES de `.anyRequest().authenticated()`
4. **Reiniciar backend** después de cambios en SecurityConfig
5. **Limpiar caché del navegador** - F5 no siempre es suficiente

### Ejemplo de Debugging:

```java
// MAL - Patrón específico DESPUÉS de genérico
.requestMatchers("/api/usuarios/**").permitAll()
.requestMatchers("/api/usuarios/vendedores").hasRole("ADMIN") // ❌ Nunca se ejecuta

// BIEN - Patrón específico PRIMERO
.requestMatchers("/api/usuarios/vendedores").hasRole("ADMIN")  
.requestMatchers("/api/usuarios/**").permitAll() // ✅ Orden correcto
```

---

**Última actualización**: 2025-11-01 09:35
**Versión SecurityConfig**: Líneas 56-106


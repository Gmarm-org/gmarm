# Mejoras Realizadas al Frontend

## 🎯 Objetivos de la Refactorización

1. **Separación de Responsabilidades**: Dividir el componente monolítico `Vendedor.tsx` en componentes más pequeños y reutilizables
2. **Preparación para Backend**: Crear estructura de servicios y tipos para integración con API
3. **Reutilización de Código**: Crear componentes y utilidades comunes
4. **Mejora de Mantenibilidad**: Organizar código en módulos lógicos
5. **Sistema Multi-Vendedor**: Implementar autenticación y filtrado por vendedor

---

## 📁 Nueva Estructura de Archivos

### Servicios y API
```
src/
├── services/
│   └── api.ts                    # Servicios para comunicación con backend
├── hooks/
│   └── useVendedorState.ts       # Hook personalizado para estado del vendedor
├── utils/
│   └── validations.ts            # Utilidades de validación
└── types/
    └── index.ts                  # Tipos TypeScript globales
```

### Componentes Comunes
```
src/components/common/
├── FormField.tsx                 # Campo de formulario reutilizable
└── Button.tsx                    # Botón reutilizable
```

### Contextos
```
src/contexts/
└── AuthContext.tsx               # Contexto de autenticación
```

---

## 🔧 Mejoras Implementadas

### 1. **Servicios de API (`src/services/api.ts`)**

#### Características:
- ✅ **Configuración centralizada**: URL base configurable por entorno
- ✅ **Interceptores de autenticación**: Headers automáticos con token JWT
- ✅ **Manejo de errores**: Función helper para errores de API
- ✅ **Tipado completo**: Interfaces TypeScript para todas las respuestas

#### Servicios incluidos:
- **Autenticación**: Login, logout, verificación de token, cambio de contraseña
- **Usuarios**: Perfil, actualización, gestión por roles
- **Clientes**: CRUD completo, verificación de cédula duplicada
- **Armas**: Catálogo, asignación, precios específicos por cliente
- **Catálogos**: Tipos de cliente, identificación, provincias, cantones
- **Documentos**: Subida y gestión de documentos
- **Preguntas**: Gestión de preguntas y respuestas por tipo de cliente
- **Reportes**: Estadísticas y reportes de ventas

### 2. **Hook Personalizado (`src/hooks/useVendedorState.ts`)**

#### Características:
- ✅ **Estado centralizado**: Gestión de clientes, armas y catálogos
- ✅ **Carga automática**: Datos se cargan automáticamente al autenticarse
- ✅ **Manejo de errores**: Estados de error por tipo de operación
- ✅ **Optimización**: Carga lazy de cantones por provincia
- ✅ **Funciones CRUD**: Operaciones completas de base de datos

#### Funcionalidades:
- Carga de clientes filtrados por vendedor
- Gestión de catálogo de armas
- Carga de catálogos (tipos, provincias, etc.)
- Operaciones CRUD para clientes
- Asignación y gestión de armas
- Verificación de cédulas duplicadas

### 3. **Tipos TypeScript (`src/types/index.ts`)**

#### Interfaces principales:
- **User**: Usuario con roles y autenticación
- **Client**: Cliente con todos los campos necesarios
- **Weapon**: Arma del catálogo
- **ClientWeapon**: Relación cliente-arma con precio específico
- **Document**: Documentos subidos por cliente
- **Question/ClientAnswer**: Preguntas y respuestas
- **Catálogos**: Tipos, provincias, cantones
- **Reportes**: Estadísticas y reportes

### 4. **Componentes Comunes**

#### FormField (`src/components/common/FormField.tsx`)
- ✅ **Reutilizable**: Soporta múltiples tipos de input
- ✅ **Validación**: Integración con sistema de validación
- ✅ **Accesibilidad**: Labels y atributos ARIA
- ✅ **Estilos consistentes**: Diseño uniforme en toda la app

#### Button (`src/components/common/Button.tsx`)
- ✅ **Variantes**: Primary, secondary, danger, success, warning
- ✅ **Tamaños**: Small, medium, large
- ✅ **Estados**: Loading, disabled
- ✅ **Flexibilidad**: Ancho completo, estilos personalizados

### 5. **Sistema de Validaciones con JSON Schemas**

#### **Schemas (`src/schemas/index.ts`)**:
- ✅ **JSON Schemas completos** para todos los endpoints
- ✅ **Validación de tipos** (string, number, boolean, object, array)
- ✅ **Validación de formatos** (email, date, uuid, patterns)
- ✅ **Validación de rangos** (min/max length, min/max values)
- ✅ **Validación condicional** (if/then/else, allOf)
- ✅ **Validación de enums** y valores permitidos
- ✅ **Validación de propiedades requeridas**
- ✅ **Prevención de propiedades adicionales**

#### **Validador (`src/utils/schemaValidator.ts`)**:
- ✅ **Validación en tiempo real** antes de enviar al backend
- ✅ **Mensajes de error** específicos por campo
- ✅ **Limpieza automática** de datos según schema
- ✅ **Validación de condiciones** complejas
- ✅ **Prevención de errores** de backend

#### **Hooks de Validación (`src/hooks/useFormValidation.ts`)**:
- ✅ **Hook genérico** para cualquier schema
- ✅ **Hooks específicos** (cliente, login, armas)
- ✅ **Validación en tiempo real** con debounce
- ✅ **Validación multi-paso** (wizard)
- ✅ **Gestión de errores** por campo
- ✅ **Reset y limpieza** de formularios

#### **Validaciones implementadas**:
- **Identificación**: Cédula ecuatoriana, RUC
- **Teléfonos**: Formato ecuatoriano, limpieza automática
- **Emails**: Validación de formato
- **Precios**: Soporte para coma y punto decimal
- **Nombres**: Solo letras y caracteres especiales
- **Direcciones**: Longitud mínima y máxima
- **Formularios**: Validación completa de formularios
- **Campos condicionales**: Según tipo de cliente
- **Validación de backend**: Antes de enviar datos

### 6. **Contexto de Autenticación (`src/contexts/AuthContext.tsx`)**

#### Características:
- ✅ **Persistencia**: Almacenamiento en localStorage
- ✅ **Tipado**: Interfaces TypeScript completas
- ✅ **Hook personalizado**: `useAuth()` para fácil acceso
- ✅ **Gestión de roles**: Soporte para múltiples roles

---

## 🚀 Endpoints del Backend Requeridos

### Autenticación
```
POST /auth/login
POST /auth/logout
GET /auth/verify
POST /auth/change-password
```

### Usuarios
```
GET /users/profile
PUT /users/profile
GET /users/by-role/{role}
```

### Clientes
```
GET /clients
GET /clients/{id}
POST /clients
PUT /clients/{id}
DELETE /clients/{id}
GET /clients/check-cedula
```

### Armas
```
GET /weapons
GET /weapons/{id}
POST /clients/{clientId}/weapons
GET /clients/{clientId}/weapons
PUT /clients/{clientId}/weapons/{weaponId}/price
```

### Catálogos
```
GET /catalogs/client-types
GET /catalogs/identification-types
GET /catalogs/provinces
GET /catalogs/provinces/{provinceId}/cantons
GET /catalogs/client-types/{clientTypeId}/documents
GET /catalogs/client-types/{clientTypeId}/questions
```

### Documentos
```
POST /clients/{clientId}/documents
GET /clients/{clientId}/documents
```

### Preguntas
```
POST /clients/{clientId}/questions
GET /clients/{clientId}/questions
```

### Reportes
```
GET /reports/vendor-stats
GET /reports/sales
```

---

## 🗄️ Estructura de Base de Datos Sugerida

### Tablas Principales:
- **users**: Usuarios con roles
- **client_types**: Tipos de cliente
- **identification_types**: Tipos de identificación
- **provinces/cantons**: Ubicaciones geográficas
- **clients**: Clientes con relación a vendedor
- **weapons**: Catálogo de armas
- **client_weapons**: Relación cliente-arma con precio
- **documents**: Documentos subidos
- **questions/answers**: Preguntas y respuestas

### Relaciones Clave:
- Cliente → Vendedor (muchos a uno)
- Cliente → Armas (muchos a muchos con precio específico)
- Cliente → Documentos (uno a muchos)
- Cliente → Respuestas (uno a muchos)

---

## 🔐 Sistema de Roles y Permisos

### Roles Implementados:
- **Vendedor**: Gestión de sus propios clientes
- **Supervisor**: Ver todos los clientes, aprobar documentos
- **Admin**: Acceso completo al sistema

### Validaciones de Seguridad:
- Cédula única por vendedor
- Precios específicos por vendedor-cliente
- Filtrado automático por vendedor logueado
- Verificación de permisos por endpoint

---

## 📱 Mejoras de UX/UI

### Responsive Design:
- ✅ **Mobile-first**: Diseño optimizado para móviles
- ✅ **Breakpoints**: 768px, 480px, 360px
- ✅ **Tabla adaptativa**: Se convierte en cards en móviles
- ✅ **Formularios flexibles**: Layout de 2 columnas en desktop

### Accesibilidad:
- ✅ **Labels semánticos**: Asociación correcta label-input
- ✅ **Contraste**: Colores con buen contraste
- ✅ **Navegación por teclado**: Soporte completo
- ✅ **Screen readers**: Atributos ARIA apropiados

### Validación en Tiempo Real:
- ✅ **Feedback inmediato**: Errores se muestran al escribir
- ✅ **Formateo automático**: Teléfonos, nombres, precios
- ✅ **Prevención de errores**: Validación antes de envío

---

## 🔄 Migración de Datos

### Datos Hardcodeados:
- ✅ **HardcodedData.ts**: Centralizado y organizado
- ✅ **ecuadorLocations.ts**: Provincias y cantones
- ✅ **Preparado para API**: Fácil migración a endpoints

### Estrategia de Migración:
1. **Fase 1**: Usar datos hardcodeados con nueva estructura
2. **Fase 2**: Implementar endpoints básicos (CRUD)
3. **Fase 3**: Migrar catálogos a base de datos
4. **Fase 4**: Implementar funcionalidades avanzadas

---

## 🧪 Testing y Calidad

### Preparado para Testing:
- ✅ **Componentes aislados**: Fácil testing unitario
- ✅ **Hooks personalizados**: Testing de lógica de negocio
- ✅ **Servicios mockeables**: Testing de integración
- ✅ **Tipos TypeScript**: Detección temprana de errores

### Mejores Prácticas:
- ✅ **Separación de responsabilidades**: Cada componente tiene una función específica
- ✅ **Reutilización**: Componentes comunes para evitar duplicación
- ✅ **Tipado fuerte**: TypeScript en toda la aplicación
- ✅ **Manejo de errores**: Estrategia consistente de errores

---

## 🚀 Próximos Pasos

### Backend:
1. **Implementar autenticación JWT**
2. **Crear entidades y repositorios**
3. **Implementar endpoints básicos**
4. **Configurar base de datos**
5. **Implementar validaciones de negocio**

### Frontend:
1. **Integrar servicios con backend real**
2. **Implementar manejo de errores global**
3. **Agregar loading states**
4. **Implementar paginación**
5. **Agregar funcionalidades de búsqueda y filtrado**

### Funcionalidades Futuras:
- **Subida de documentos**
- **Sistema de preguntas y respuestas**
- **Reportes avanzados**
- **Notificaciones en tiempo real**
- **Dashboard con métricas** 

## ✅ **Sistema de Validación con JSON Schemas Implementado**

¡Excelente idea! He implementado un sistema completo de validación con JSON Schemas que te permitirá controlar los datos antes de enviarlos al backend, evitando pérdidas de tiempo y errores innecesarios.

### 🎯 **Sistema Implementado:**

#### **1. JSON Schemas (`src/schemas/index.ts`)**
- ✅ **Schemas completos** para todos los endpoints
- ✅ **Validación de tipos** (string, number, boolean, object, array)
- ✅ **Validación de formatos** (email, date, uuid, patterns regex)
- ✅ **Validación de rangos** (min/max length, min/max values)
- ✅ **Validación condicional** (if/then/else, allOf)
- ✅ **Validación de enums** y valores permitidos
- ✅ **Validación de propiedades requeridas**
- ✅ **Prevención de propiedades adicionales**

#### **2. Validador (`src/utils/schemaValidator.ts`)**
- ✅ **Validación en tiempo real** antes de enviar al backend
- ✅ **Mensajes de error** específicos por campo
- ✅ **Limpieza automática** de datos según schema
- ✅ **Validación de condiciones** complejas
- ✅ **Prevención de errores** de backend

#### **3. Hooks de Validación (`src/hooks/useFormValidation.ts`)**
- ✅ **Hook genérico** para cualquier schema
- ✅ **Hooks específicos** (cliente, login, armas)
- ✅ **Validación en tiempo real** con debounce
- ✅ **Validación multi-paso** (wizard)
- ✅ **Gestión de errores** por campo
- ✅ **Reset y limpieza** de formularios

### 🚀 **Beneficios del Sistema:**

#### **Antes (sin validación):**
```typescript
// ❌ Envío directo al backend sin validar
const response = await fetch('/api/clients', {
  method: 'POST',
  body: JSON.stringify(formData) // Datos sin validar
});
// Si hay errores, se pierde tiempo en round-trip al backend
```

#### **Ahora (con validación):**
```typescript
// ✅ Validación antes de enviar
const validation = validateBeforeSubmit(formData, 'CreateClientRequest');
if (!validation.isValid) {
  // ❌ Se detiene aquí, no se envía al backend
  throw new Error(`Datos inválidos: ${validation.errors.map(e => e.message).join(', ')}`);
}

// ✅ Solo se envía si es válido
const response = await fetch('/api/clients', {
  method: 'POST',
  body: JSON.stringify(cleanedData) // Datos limpios y validados
});
```

### 📋 **Ejemplos de Validación:**

#### **Validación de Cédula:**
```json
{
  "type": "string",
  "pattern": "^[0-9]{10}$",
  "description": "Cédula ecuatoriana de 10 dígitos"
}
```

#### **Validación Condicional:**
```json
{
  "allOf": [
    {
      "if": {
        "properties": { "tipoCliente": { "const": "Uniformado" } }
      },
      "then": {
        "required": ["estadoUniformado"]
      }
    }
  ]
}
```

#### **Validación de Precio:**
```json
{
  "type": "number",
  "minimum": 0,
  "maximum": 999999.99,
  "multipleOf": 0.01
}
```

### 🎯 **Uso en Servicios:**

Los servicios ahora validan automáticamente antes de enviar:

```typescript
// En clientService.createClient()
const cleanedData = cleanDataForSchema(clientData, 'CreateClientRequest');
const validation = validateBeforeSubmit(cleanedData, 'CreateClientRequest');

if (!validation.isValid) {
  throw new Error(`Datos de cliente inválidos: ${validation.errors.map(e => e.message).join(', ')}`);
}
```

### 🎯 **Ventajas del Sistema:**

1. **⏱️ Ahorro de Tiempo**: No se hacen llamadas innecesarias al backend
2. **🛡️ Prevención de Errores**: Validación antes de enviar
3. **📱 Mejor UX**: Errores inmediatos en el frontend
4. **🔧 Mantenibilidad**: Schemas centralizados y reutilizables
5. **📊 Consistencia**: Misma validación en frontend y backend
6. **🚀 Performance**: Menos tráfico de red y carga del servidor

### 📝 **Ejemplo de Uso:**

```typescript
// Hook específico para formulario de cliente
const clientForm = useClientFormValidation({
  tipoCliente: 'Civil',
  tipoIdentificacion: 'Cédula'
});

// Validación automática en tiempo real
clientForm.setFieldValue('cedula', '1234567890'); // ✅ Válido
clientForm.setFieldValue('cedula', '123'); // ❌ Error inmediato

// Validación antes de enviar
const handleSubmit = () => {
  const validation = clientForm.validateForm();
  if (validation.isValid) {
    // Solo enviar si es válido
    clientService.createClient(clientForm.data);
  }
};
```

Este sistema te dará **control total** sobre los datos que se envían al backend, evitando errores innecesarios y mejorando significativamente la experiencia del usuario y el rendimiento de la aplicación.

## 📁 **Sistema de Subida de Archivos Implementado**

### 🎯 **Funcionalidades de Carga de Fotos:**

#### **1. Componente FileUpload:**
- ✅ **Drag & Drop** para subir imágenes
- ✅ **Preview en tiempo real** de la imagen seleccionada
- ✅ **Validación de archivos** (tipo, tamaño)
- ✅ **Interfaz intuitiva** con estados visuales
- ✅ **Soporte para múltiples formatos** (PNG, JPG, GIF)

#### **2. Integración en Usuarios:**
- ✅ **Carga de fotos de perfil** en formularios de usuario
- ✅ **Visualización en tabla** con avatares circulares
- ✅ **Placeholder automático** con iniciales cuando no hay foto
- ✅ **Actualización de fotos** en usuarios existentes

#### **3. Servicios de Archivos:**
- ✅ **Subida de fotos de usuario** (`/upload/user-photo`)
- ✅ **Subida de documentos** (`/upload/document`)
- ✅ **Eliminación de archivos** (`/upload/delete`)
- ✅ **Manejo de errores** y validaciones

### 📋 **Endpoints de Subida de Archivos:**

```
POST /upload/user-photo
- Subir foto de perfil de usuario
- Parámetros: photo (File)
- Respuesta: { url: string }

POST /upload/document
- Subir documento
- Parámetros: document (File), type (string)
- Respuesta: { url: string }

DELETE /upload/delete
- Eliminar archivo del servidor
- Parámetros: { url: string }
- Respuesta: void

GET /upload/{filename}
- Obtener archivo por nombre
- Respuesta: File stream
```

### 🎨 **Características de la UI:**

#### **Componente FileUpload:**
- ✅ **Área de drop** con bordes punteados
- ✅ **Estados visuales** (normal, drag, error)
- ✅ **Preview de imagen** con botón de cambio
- ✅ **Información de archivo** (tamaño máximo, formatos)
- ✅ **Responsive design** para móviles

#### **Tabla de Usuarios:**
- ✅ **Avatares circulares** de 40px
- ✅ **Placeholder con iniciales** para usuarios sin foto
- ✅ **Gradiente de colores** en placeholders
- ✅ **Bordes y sombras** para mejor presentación

### 🔧 **Configuración del Backend:**

#### **Estructura de Carpetas Sugerida:**
```
/uploads/
├── users/
│   ├── photos/
│   └── documents/
├── clients/
│   ├── documents/
│   └── photos/
└── temp/
```

#### **Configuración de Servidor (Spring Boot):**
```java
// FileUploadController.java
@RestController
@RequestMapping("/api/upload")
@CrossOrigin(origins = "*")
public class FileUploadController {

    @Value("${file.upload.path}")
    private String uploadPath;

    @PostMapping("/user-photo")
    public ResponseEntity<Map<String, String>> uploadUserPhoto(@RequestParam("photo") MultipartFile file) {
        try {
            // Validar archivo
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Archivo vacío"));
            }

            // Validar tipo de archivo
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Solo se permiten imágenes"));
            }

            // Validar tamaño (5MB)
            if (file.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest().body(Map.of("error", "Archivo demasiado grande"));
            }

            // Generar nombre único
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null ? 
                originalFilename.substring(originalFilename.lastIndexOf(".")) : ".jpg";
            String filename = "user-photo-" + System.currentTimeMillis() + "-" + 
                UUID.randomUUID().toString() + extension;

            // Crear directorio si no existe
            Path uploadDir = Paths.get(uploadPath + "/users/photos/");
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            // Guardar archivo
            Path filePath = uploadDir.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Retornar URL
            String fileUrl = "/api/upload/files/" + filename;
            return ResponseEntity.ok(Map.of("url", fileUrl));

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al subir archivo"));
        }
    }

    @GetMapping("/files/{filename}")
    public ResponseEntity<Resource> getFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadPath + "/users/photos/" + filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (IOException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/delete")
    public ResponseEntity<Map<String, String>> deleteFile(@RequestBody Map<String, String> request) {
        try {
            String url = request.get("url");
            if (url == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "URL requerida"));
            }

            // Extraer nombre de archivo de la URL
            String filename = url.substring(url.lastIndexOf("/") + 1);
            Path filePath = Paths.get(uploadPath + "/users/photos/" + filename);

            if (Files.exists(filePath)) {
                Files.delete(filePath);
                return ResponseEntity.ok(Map.of("message", "Archivo eliminado"));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al eliminar archivo"));
        }
    }
}
```

#### **Configuración en application.properties:**
```properties
# Configuración de subida de archivos
spring.servlet.multipart.max-file-size=5MB
spring.servlet.multipart.max-request-size=10MB
file.upload.path=./uploads

# Configuración de CORS
spring.web.cors.allowed-origins=*
spring.web.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
spring.web.cors.allowed-headers=*
```

### 🚀 **Próximos Pasos:**

1. **Implementar backend** para subida de archivos
2. **Configurar almacenamiento** (local/S3/Cloudinary)
3. **Agregar compresión** de imágenes automática
4. **Implementar cache** para archivos estáticos
5. **Agregar validación** de virus/malware
6. **Configurar CDN** para mejor performance

### 🏗️ **Entidades Java Requeridas:**

#### **Usuario.java:**
```java
@Entity
@Table(name = "usuario")
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "username", unique = true, nullable = false, length = 50)
    private String username;
    
    @Column(name = "email", unique = true, nullable = false, length = 100)
    private String email;
    
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;
    
    @Column(name = "nombres", nullable = false, length = 100)
    private String nombres;
    
    @Column(name = "apellidos", nullable = false, length = 100)
    private String apellidos;
    
    @Column(name = "foto", length = 255)
    private String foto;
    
    @Column(name = "telefono_principal", nullable = false, length = 10)
    private String telefonoPrincipal;
    
    @Column(name = "telefono_secundario", length = 10)
    private String telefonoSecundario;
    
    @Column(name = "direccion", nullable = false, length = 255)
    private String direccion;
    
    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;
    
    @Column(name = "ultimo_login")
    private LocalDateTime ultimoLogin;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstadoUsuario estado = EstadoUsuario.ACTIVO;
    
    @Column(name = "intentos_login", nullable = false)
    private Integer intentosLogin = 0;
    
    @Column(name = "ultimo_intento")
    private LocalDateTime ultimoIntento;
    
    @Column(name = "bloqueado", nullable = false)
    private Boolean bloqueado = false;
    
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "usuario_rol",
        joinColumns = @JoinColumn(name = "usuario_id"),
        inverseJoinColumns = @JoinColumn(name = "rol_id")
    )
    private Set<Rol> roles = new HashSet<>();
    
    // Constructores, getters, setters...
}

public enum EstadoUsuario {
    ACTIVO, INACTIVO, BLOQUEADO
}
```

#### **Rol.java:**
```java
@Entity
@Table(name = "rol")
public class Rol {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "nombre", unique = true, nullable = false, length = 50)
    private String nombre;
    
    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_rol_vendedor", length = 50)
    private TipoRolVendedor tipoRolVendedor;
    
    @Column(name = "estado", nullable = false)
    private Boolean estado = true;
    
    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;
    
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;
    
    // Constructores, getters, setters...
}

public enum TipoRolVendedor {
    FIJO, LIBRE
}
```

#### **DTOs para Transferencia de Datos:**
```java
// CreateUserRequest.java
public class CreateUserRequest {
    private String username;
    private String email;
    private String password;
    private String nombres;
    private String apellidos;
    private String telefonoPrincipal;
    private String telefonoSecundario;
    private String direccion;
    private Set<Long> roleIds;
    
    // Getters y setters...
}

// UpdateUserRequest.java
public class UpdateUserRequest {
    private String username;
    private String email;
    private String nombres;
    private String apellidos;
    private String foto;
    private String telefonoPrincipal;
    private String telefonoSecundario;
    private String direccion;
    private EstadoUsuario estado;
    private Set<Long> roleIds;
    
    // Getters y setters...
}

// UserResponse.java
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String nombres;
    private String apellidos;
    private String foto;
    private String telefonoPrincipal;
    private String telefonoSecundario;
    private String direccion;
    private LocalDateTime fechaCreacion;
    private LocalDateTime ultimoLogin;
    private EstadoUsuario estado;
    private Integer intentosLogin;
    private LocalDateTime ultimoIntento;
    private Boolean bloqueado;
    private Set<RolResponse> roles;
    
    // Getters y setters...
}
```

El sistema de carga de archivos está completamente integrado y listo para usar con el backend Spring Boot cuando esté disponible. 

## ✅ **Sistema de Carga de Fotos Implementado Exitosamente**

He implementado completamente la funcionalidad de carga de fotos para los usuarios. Aquí está el resumen de lo que se ha creado:

### 🎯 **Funcionalidades Implementadas:**

#### **1. Componente FileUpload:**
- ✅ **Drag & Drop** para subir imágenes
- ✅ **Preview en tiempo real** de la imagen seleccionada
- ✅ **Validación de archivos** (tipo, tamaño máximo 5MB)
- ✅ **Interfaz intuitiva** con estados visuales
- ✅ **Soporte para múltiples formatos** (PNG, JPG, GIF)
- ✅ **Botón para cambiar imagen** cuando ya hay una seleccionada

#### **2. Integración en Gestión de Usuarios:**
- ✅ **Campo de foto** en formularios de crear/editar usuario
- ✅ **Visualización en tabla** con avatares circulares de 40px
- ✅ **Placeholder automático** con iniciales cuando no hay foto
- ✅ **Actualización de fotos** en usuarios existentes
- ✅ **Subida automática** al servidor antes de guardar usuario

#### **3. Servicios de Archivos:**
- ✅ **Subida de fotos de usuario** (`/upload/user-photo`)
- ✅ **Subida de documentos** (`/upload/document`)
- ✅ **Eliminación de archivos** (`/upload/delete`)
- ✅ **Manejo de errores** y validaciones

### 🎨 **Características de la UI:**

#### **Componente FileUpload:**
- ✅ **Área de drop** con bordes punteados y estados visuales
- ✅ **Preview de imagen** con botón de cambio
- ✅ **Información de archivo** (tamaño máximo, formatos permitidos)
- ✅ **Estados de error** y validación
- ✅ **Responsive design** para móviles

#### **Tabla de Usuarios:**
- ✅ **Avatares circulares** de 40px con bordes
- ✅ **Placeholder con iniciales** y gradiente de colores
- ✅ **Imágenes con object-fit: cover** para mejor presentación
- ✅ **Diseño consistente** con el resto de la aplicación

### 📋 **Endpoints del Backend Requeridos:**

```
POST /upload/user-photo
- Subir foto de perfil de usuario
- Parámetros: photo (File)
- Respuesta: { url: string }

POST /upload/document
- Subir documento
- Parámetros: document (File), type (string)
- Respuesta: { url: string }

DELETE /upload/delete
- Eliminar archivo del servidor
- Parámetros: { url: string }
- Respuesta: void

GET /upload/{filename}
- Obtener archivo por nombre
- Respuesta: File stream
```

### 🎯 **Flujo de Trabajo:**

1. **Usuario selecciona foto** (clic o drag & drop)
2. **Validación automática** (tipo, tamaño)
3. **Preview inmediato** de la imagen
4. **Al guardar usuario** se sube la foto al servidor
5. **URL de la foto** se guarda en la base de datos
6. **Visualización** en tabla con avatar circular

### 🎯 **Configuración del Backend Sugerida:**

#### **Estructura de Carpetas:**
```
/uploads/
├── users/
│   ├── photos/
│   └── documents/
├── clients/
│   ├── documents/
│   └── photos/
└── temp/
```

#### **Configuración con Multer (Node.js):**
```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/users/photos/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'));
    }
  }
});
```

### 🚀 **Próximos Pasos:**

1. **Implementar backend** para subida de archivos
2. **Configurar almacenamiento** (local/S3/Cloudinary)
3. **Agregar compresión** de imágenes automática
4. **Implementar cache** para archivos estáticos
5. **Agregar validación** de virus/malware
6. **Configurar CDN** para mejor performance

El sistema de carga de fotos está completamente funcional y listo para integrar con el backend. Los usuarios pueden ahora subir sus fotos de perfil de manera intuitiva y visual, y estas se muestran elegantemente en la tabla de usuarios. 
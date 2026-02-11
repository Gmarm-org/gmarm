# 🏗️ **Backend - GMARM API**

API REST construida con Spring Boot 3.4.5 para el sistema de gestión de importación de armas.

---

## 📋 **Tabla de Contenidos**

- [Tecnologías](#-tecnologías)
- [Arquitectura](#-arquitectura)
- [Estructura de Paquetes](#-estructura-de-paquetes)
- [Entidades Principales](#-entidades-principales)
- [DTOs y Mappers](#-dtos-y-mappers)
- [Servicios](#-servicios)
- [Controllers y Endpoints](#-controllers-y-endpoints)
- [Generación de Documentos](#-generación-de-documentos)
- [Configuración](#-configuración)
- [Seguridad](#-seguridad)
- [Base de Datos](#-base-de-datos)
- [Testing](#-testing)
- [Build y Deploy](#-build-y-deploy)

---

## 🛠️ **Tecnologías**

- **Java 17**: Lenguaje base
- **Spring Boot 3.4.5**: Framework principal
- **Spring Data JPA**: Acceso a datos
- **Hibernate**: ORM
- **Spring Security**: Autenticación y autorización
- **JWT (java-jwt)**: Tokens de autenticación
- **Thymeleaf**: Motor de plantillas para documentos
- **OpenPDF**: Generación de PDFs
- **PostgreSQL Driver**: Conexión a base de datos
- **Lombok**: Reducción de boilerplate
- **Maven**: Gestión de dependencias

---

## 🏗️ **Arquitectura**

### **Patrón Repository-Service-Controller**

```
┌─────────────┐
│  Controller │  ← REST API Endpoints (JSON)
└──────┬──────┘
       │
┌──────▼──────┐
│   Service   │  ← Lógica de negocio
└──────┬──────┘
       │
┌──────▼──────┐
│  Repository │  ← Acceso a datos (JPA)
└──────┬──────┘
       │
┌──────▼──────┐
│  Database   │  ← PostgreSQL
└─────────────┘

      ┌────────────┐
      │   Mapper   │  ← Conversión Entity ↔ DTO
      └────────────┘
```

### **Flujo de una Petición**

1. **Cliente HTTP** → Request a `/api/...`
2. **Controller** → Recibe request, valida parámetros
3. **Service** → Ejecuta lógica de negocio
4. **Mapper** → Convierte DTO → Entity
5. **Repository** → Interactúa con base de datos
6. **Mapper** → Convierte Entity → DTO
7. **Controller** → Retorna ResponseEntity con DTO

---

## 📁 **Estructura de Paquetes**

```
com.armasimportacion/
├── config/                      # Configuración
│   ├── CorsConfig.java         # Configuración CORS
│   ├── SecurityConfig.java     # Spring Security + JWT
│   └── WebConfig.java          # Configuración web general
│
├── controller/                  # REST Controllers
│   ├── AuthController.java     # Login, registro, refresh token
│   ├── ClienteController.java  # CRUD clientes
│   ├── ArmaController.java     # CRUD armas
│   ├── VentaController.java    # CRUD ventas + documentos
│   ├── PagoController.java     # CRUD pagos y cuotas
│   ├── ReservaController.java  # Gestión de reservas
│   ├── LicenciaController.java # CRUD licencias
│   └── ConfiguracionController.java  # Configuración sistema
│
├── service/                     # Servicios (lógica de negocio)
│   ├── AuthService.java        # Autenticación
│   ├── ClienteService.java     # Lógica de clientes
│   ├── ArmaService.java        # Lógica de armas
│   ├── VentaService.java       # Lógica de ventas
│   ├── PagoService.java        # Lógica de pagos
│   ├── ReservaService.java     # Lógica de reservas
│   ├── LicenciaService.java    # Lógica de licencias
│   └── helper/
│       ├── GestionDocumentosServiceHelper.java  # Generación PDF
│       └── GestionPagosServiceHelper.java       # Cálculo de cuotas
│
├── repository/                  # Repositorios JPA
│   ├── UsuarioRepository.java
│   ├── ClienteRepository.java
│   ├── ArmaRepository.java
│   ├── VentaRepository.java
│   ├── PagoRepository.java
│   ├── CuotaRepository.java
│   ├── ReservaRepository.java
│   ├── LicenciaRepository.java
│   ├── ProvinciaRepository.java
│   ├── CantonRepository.java
│   └── ConfiguracionSistemaRepository.java
│
├── model/                       # Entidades JPA
│   ├── Usuario.java            # Usuarios del sistema
│   ├── Cliente.java            # Clientes
│   ├── TipoCliente.java        # Tipos de cliente
│   ├── Arma.java               # Armas
│   ├── TipoArma.java           # Tipos de arma
│   ├── Marca.java              # Marcas
│   ├── Calibre.java            # Calibres
│   ├── Venta.java              # Ventas
│   ├── Pago.java               # Pagos
│   ├── Cuota.java              # Cuotas de pago
│   ├── Reserva.java            # Reservas temporales
│   ├── Licencia.java           # Licencias de importación
│   ├── Provincia.java          # Provincias
│   ├── Canton.java             # Cantones
│   └── ConfiguracionSistema.java  # Configuración dinámica
│
├── dto/                         # Data Transfer Objects
│   ├── auth/
│   │   ├── LoginRequestDTO.java
│   │   ├── LoginResponseDTO.java
│   │   └── RegisterRequestDTO.java
│   ├── ClienteDTO.java
│   ├── ClienteCreateDTO.java
│   ├── ArmaDTO.java
│   ├── VentaDTO.java
│   ├── PagoDTO.java
│   ├── CuotaDTO.java
│   ├── ReservaDTO.java
│   └── LicenciaDTO.java
│
├── mapper/                      # Conversores Entity ↔ DTO
│   ├── ClienteMapper.java
│   ├── ArmaMapper.java
│   ├── VentaMapper.java
│   ├── PagoMapper.java
│   ├── ReservaMapper.java
│   └── LicenciaMapper.java
│
├── util/                        # Utilidades
│   ├── JwtUtil.java            # Generación y validación JWT
│   ├── CedulaValidator.java    # Validación de cédula ecuatoriana
│   ├── NumberToTextService.java  # Conversión números a texto
│   └── ValidationUtils.java    # Validaciones comunes
│
└── GmarmApplication.java        # Clase principal Spring Boot
```

---

## 🗃️ **Entidades Principales**

### **Usuario**
```java
@Entity
@Table(name = "usuario")
public class Usuario {
    @Id @GeneratedValue
    private Long id;
    private String email;
    private String password;  // BCrypt hash
    private String rol;       // ADMIN, VENDEDOR, CLIENTE
    private String nombres;
    private String apellidos;
}
```

### **Cliente**
```java
@Entity
@Table(name = "cliente")
public class Cliente {
    @Id @GeneratedValue
    private Long id;
    private String numeroIdentificacion;  // Cédula/RUC
    private String nombres;
    private String apellidos;
    
    @ManyToOne
    private TipoCliente tipoCliente;      // Civil, Militar, etc.
    
    // Solo para uniformados (militares/policías)
    private String estadoMilitar;         // ACTIVO, PASIVO
    private String codigoIssfa;           // Código ISSFA/ISSPOL
    private String rango;                 // Rango militar/policial
    
    @ManyToOne
    private Provincia provincia;
    
    @ManyToOne
    private Canton canton;
    
    private String direccion;
    private String telefonoPrincipal;
    private String email;
}
```

### **Arma**
```java
@Entity
@Table(name = "arma")
public class Arma {
    @Id @GeneratedValue
    private Long id;
    
    @ManyToOne
    private TipoArma tipoArma;            // Pistola, Revólver, etc.
    
    @ManyToOne
    private Marca marca;                  // CZ, Glock, etc.
    
    private String modelo;
    
    @ManyToOne
    private Calibre calibre;              // 9mm, .45 ACP, etc.
    
    private Integer cantidadAlimentadoras;
    private BigDecimal precio;
    private Integer cantidadDisponible;
    private String imagenUrl;
    private String descripcion;
}
```

### **Venta**
```java
@Entity
@Table(name = "venta")
public class Venta {
    @Id @GeneratedValue
    private Long id;
    
    @ManyToOne
    private Cliente cliente;
    
    @ManyToOne
    private Arma arma;
    
    @ManyToOne
    private Licencia licencia;
    
    private LocalDate fechaVenta;
    private BigDecimal precioTotal;       // Con IVA
    private String estado;                // PENDIENTE, COMPLETADO, CANCELADO
}
```

### **Pago**
```java
@Entity
@Table(name = "pago")
public class Pago {
    @Id @GeneratedValue
    private Long id;
    
    @ManyToOne
    private Venta venta;
    
    private String tipoPago;              // CONTADO, CREDITO
    private BigDecimal montoTotal;
    private BigDecimal montoCuota;        // Si es crédito
    private Integer numeroCuotas;         // Si es crédito
    
    @OneToMany(mappedBy = "pago", cascade = CascadeType.ALL)
    private List<Cuota> cuotas;
}
```

### **Cuota**
```java
@Entity
@Table(name = "cuota")
public class Cuota {
    @Id @GeneratedValue
    private Long id;
    
    @ManyToOne
    private Pago pago;
    
    private Integer numeroCuota;
    private BigDecimal monto;
    private LocalDate fechaVencimiento;
    private LocalDate fechaPago;
    private String estado;                // PENDIENTE, PAGADA, VENCIDA
}
```

### **Licencia**
```java
@Entity
@Table(name = "licencia")
public class Licencia {
    @Id @GeneratedValue
    private Long id;
    
    private String numeroLicencia;
    private String titulo;                // MSC, ING, etc.
    private String nombres;
    private String apellidos;
    private String cedula;
    private String ruc;
    
    @ManyToOne
    private Provincia provincia;
    
    @ManyToOne
    private Canton canton;
    
    private LocalDate fechaEmision;
    private LocalDate fechaVencimiento;
}
```

---

## 📦 **DTOs y Mappers**

### **¿Por qué usar DTOs?**
- ✅ **Separación de capas**: Entidades JPA vs respuestas API
- ✅ **Seguridad**: No exponer passwords, campos internos
- ✅ **Flexibilidad**: Diferentes vistas del mismo dato
- ✅ **Validación**: `@Valid`, `@NotNull`, etc.

### **Ejemplo: ClienteDTO**
```java
@Data
@Builder
public class ClienteDTO {
    private Long id;
    private String numeroIdentificacion;
    private String nombres;
    private String apellidos;
    private String tipoCliente;           // String, no objeto completo
    private String estadoMilitar;
    private String codigoIssfa;
    private String rango;
    private String provincia;             // String, no objeto completo
    private String canton;                // String, no objeto completo
    private String direccion;
    private String telefonoPrincipal;
    private String email;
}
```

### **Ejemplo: ClienteMapper**
```java
@Component
@RequiredArgsConstructor
public class ClienteMapper {
    private final TipoClienteRepository tipoClienteRepository;
    private final ProvinciaRepository provinciaRepository;
    private final CantonRepository cantonRepository;
    
    public ClienteDTO toDTO(Cliente entity) {
        return ClienteDTO.builder()
            .id(entity.getId())
            .numeroIdentificacion(entity.getNumeroIdentificacion())
            .nombres(entity.getNombres())
            .apellidos(entity.getApellidos())
            .tipoCliente(entity.getTipoCliente().getNombre())
            .provincia(entity.getProvincia().getNombre())
            .canton(entity.getCanton().getNombre())
            // ... otros campos
            .build();
    }
    
    public Cliente toEntity(ClienteCreateDTO dto) {
        Cliente entity = new Cliente();
        entity.setNombres(dto.getNombres());
        // Buscar TipoCliente por nombre
        TipoCliente tipo = tipoClienteRepository
            .findByNombre(dto.getTipoCliente())
            .orElseThrow(() -> new NotFoundException("Tipo cliente no encontrado"));
        entity.setTipoCliente(tipo);
        // ... otros campos
        return entity;
    }
}
```

---

## 🔧 **Servicios**

### **AuthService**
**Responsabilidad**: Autenticación y autorización

**Métodos principales:**
```java
LoginResponseDTO login(LoginRequestDTO request)
Usuario register(RegisterRequestDTO request)
String refreshToken(String token)
```

### **ClienteService**
**Responsabilidad**: Lógica de negocio de clientes

**Métodos principales:**
```java
ClienteDTO create(ClienteCreateDTO dto)
ClienteDTO update(Long id, ClienteDTO dto)
ClienteDTO findById(Long id)
List<ClienteDTO> findAll()
void delete(Long id)
List<ClienteDTO> findByTipoCliente(String tipoCliente)
```

**Validaciones:**
- Cédula ecuatoriana válida (algoritmo módulo 10)
- RUC válido (si aplica)
- Campos obligatorios según tipo de cliente
- Código ISSFA/ISSPOL solo para uniformados

### **ArmaService**
**Responsabilidad**: Lógica de negocio de armas

**Métodos principales:**
```java
ArmaDTO create(ArmaDTO dto)
ArmaDTO update(Long id, ArmaDTO dto)
ArmaDTO findById(Long id)
List<ArmaDTO> findAll()
List<ArmaDTO> findByTipoArma(String tipoArma)
List<ArmaDTO> findByMarca(String marca)
List<ArmaDTO> findDisponibles()
void decrementarDisponibilidad(Long armaId)
void incrementarDisponibilidad(Long armaId)
```

### **VentaService**
**Responsabilidad**: Lógica de negocio de ventas

**Métodos principales:**
```java
VentaDTO create(VentaCreateDTO dto)
VentaDTO findById(Long id)
List<VentaDTO> findAll()
List<VentaDTO> findByCliente(Long clienteId)
List<VentaDTO> findByEstado(String estado)
VentaDTO completar(Long id)
VentaDTO cancelar(Long id)
```

**Lógica:**
- Validar disponibilidad de arma
- Calcular precio total con IVA
- Decrementar disponibilidad de arma
- Generar pago asociado

### **PagoService**
**Responsabilidad**: Lógica de pagos y cuotas

**Métodos principales:**
```java
PagoDTO create(PagoCreateDTO dto)
PagoDTO findById(Long id)
List<CuotaDTO> findCuotasByPago(Long pagoId)
CuotaDTO pagarCuota(Long cuotaId)
void generarCuotas(Pago pago)
```

**Lógica:**
- Si CONTADO: 1 solo pago
- Si CREDITO: Generar N cuotas mensuales
- Calcular fechas de vencimiento (día 5 de cada mes)
- Estado inicial: PENDIENTE
- Al pagar: actualizar estado a PAGADA

### **GestionDocumentosServiceHelper**
**Responsabilidad**: Generación de documentos PDF

**Métodos principales:**
```java
byte[] generarContrato(Long ventaId)
byte[] generarSolicitudCompra(Long ventaId)
byte[] generarCotizacion(Long ventaId)
```

**Lógica:**
- Obtener datos de venta, cliente, arma, licencia, pago
- Preparar modelo de datos para Thymeleaf
- Seleccionar plantilla según tipo de cliente
- Renderizar HTML con Thymeleaf
- Convertir HTML a PDF con OpenPDF
- Retornar byte[]

---

## 🌐 **Controllers y Endpoints**

### **AuthController** (`/api/auth`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/login` | Login de usuario | No |
| POST | `/register` | Registro de usuario | No |
| POST | `/refresh` | Refresh de token JWT | Sí |

### **ClienteController** (`/api/clientes`)

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/` | Listar todos los clientes | ADMIN, VENDEDOR |
| GET | `/{id}` | Obtener cliente por ID | ADMIN, VENDEDOR |
| POST | `/` | Crear nuevo cliente | ADMIN, VENDEDOR |
| PUT | `/{id}` | Actualizar cliente | ADMIN, VENDEDOR |
| DELETE | `/{id}` | Eliminar cliente | ADMIN |
| GET | `/tipo/{tipo}` | Listar por tipo | ADMIN, VENDEDOR |

### **ArmaController** (`/api/armas`)

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/` | Listar todas las armas | Todos |
| GET | `/{id}` | Obtener arma por ID | Todos |
| POST | `/` | Crear nueva arma | ADMIN |
| PUT | `/{id}` | Actualizar arma | ADMIN |
| DELETE | `/{id}` | Eliminar arma | ADMIN |
| GET | `/disponibles` | Listar armas disponibles | Todos |
| GET | `/tipo/{tipo}` | Listar por tipo | Todos |
| GET | `/marca/{marca}` | Listar por marca | Todos |

### **VentaController** (`/api/ventas`)

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/` | Listar todas las ventas | ADMIN, VENDEDOR |
| GET | `/{id}` | Obtener venta por ID | ADMIN, VENDEDOR |
| POST | `/` | Crear nueva venta | ADMIN, VENDEDOR |
| PUT | `/{id}/completar` | Completar venta | ADMIN, VENDEDOR |
| PUT | `/{id}/cancelar` | Cancelar venta | ADMIN, VENDEDOR |
| GET | `/cliente/{clienteId}` | Ventas de un cliente | ADMIN, VENDEDOR |
| GET | `/{id}/documentos/contrato` | Descargar contrato PDF | ADMIN, VENDEDOR |
| GET | `/{id}/documentos/solicitud-compra` | Descargar solicitud PDF | ADMIN, VENDEDOR |
| GET | `/{id}/documentos/cotizacion` | Descargar cotización PDF | ADMIN, VENDEDOR |

### **PagoController** (`/api/pagos`)

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/venta/{ventaId}` | Obtener pago de una venta | ADMIN, VENDEDOR |
| GET | `/{pagoId}/cuotas` | Listar cuotas de un pago | ADMIN, VENDEDOR |
| PUT | `/cuotas/{cuotaId}/pagar` | Marcar cuota como pagada | ADMIN, VENDEDOR |

### **ReservaController** (`/api/reservas`)

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/` | Listar todas las reservas | ADMIN, VENDEDOR |
| GET | `/{id}` | Obtener reserva por ID | ADMIN, VENDEDOR |
| POST | `/` | Crear nueva reserva | ADMIN, VENDEDOR |
| DELETE | `/{id}` | Cancelar reserva | ADMIN, VENDEDOR |
| GET | `/cliente/{clienteId}` | Reservas de un cliente | ADMIN, VENDEDOR |

### **LicenciaController** (`/api/licencias`)

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/` | Listar todas las licencias | ADMIN |
| GET | `/{id}` | Obtener licencia por ID | ADMIN |
| POST | `/` | Crear nueva licencia | ADMIN |
| PUT | `/{id}` | Actualizar licencia | ADMIN |
| DELETE | `/{id}` | Eliminar licencia | ADMIN |

### **ConfiguracionController** (`/api/configuracion`)

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/` | Listar todas las configuraciones | ADMIN |
| GET | `/{clave}` | Obtener configuración por clave | ADMIN |
| PUT | `/{clave}` | Actualizar configuración | ADMIN |

---

## 📄 **Generación de Documentos**

### **Arquitectura de Generación de PDFs**

```
Venta → GestionDocumentosServiceHelper
           ↓
     Preparar datos (Model)
           ↓
     Seleccionar plantilla según tipo de cliente
           ↓
     Thymeleaf render HTML
           ↓
     OpenPDF convert HTML → PDF
           ↓
     Retornar byte[]
```

### **Plantillas Thymeleaf**

**Ubicación**: `src/main/resources/templates/`

**Estructura:**
```
templates/
├── contratos/
│   ├── civiles/
│   │   ├── contrato_compra.html
│   │   └── solicitud_compra.html
│   └── uniformados/
│       ├── contrato_compra_policia.html
│       ├── contrato_compra_fuerza_terrestre.html
│       ├── contrato_compra_fuerza_naval.html
│       ├── contrato_compra_fuerza_aerea.html
│       ├── solicitud_compra_policia.html
│       ├── solicitud_compra_fuerza_terrestre.html
│       ├── solicitud_compra_fuerza_naval.html
│       └── solicitud_compra_fuerza_aerea.html
└── cotizacion/
    └── cotizacion.html
```

### **Variables Disponibles en Plantillas**

**Datos del Cliente:**
```thymeleaf
${cliente.nombres}
${cliente.apellidos}
${cliente.numeroIdentificacion}
${cliente.email}
${cliente.telefonoPrincipal}
${clienteRango}                    <!-- Solo uniformados -->
${cliente.codigoIssfa}             <!-- ISSFA/ISSPOL -->
${estadoMilitarLowercase}          <!-- activo/pasivo -->
${clienteDireccionCompleta}        <!-- Dirección + Provincia + Cantón -->
```

**Datos de la Licencia:**
```thymeleaf
${licenciaTitulo}                  <!-- MSC, ING, etc. -->
${licenciaNombre}                  <!-- Nombre completo comerciante -->
${licenciaCedula}
${licenciaRuc}
${licenciaCiudad}                  <!-- Cantón de la licencia -->
```

**Datos del Arma:**
```thymeleaf
${arma.tipoArma}
${arma.marca}
${arma.modelo}
${arma.calibre}
${arma.cantidadAlimentadoras}
```

**Datos de Pago:**
```thymeleaf
${pago.tipoPago}                   <!-- CONTADO/CREDITO -->
${pago.montoTotal}                 <!-- Sin IVA -->
${precioConIva}                    <!-- Con IVA -->
${ivaPorcentaje}                   <!-- 15 -->
${pago.montoCuota}                 <!-- Si es crédito -->
${cuotas}                          <!-- Lista de cuotas -->
${cuotas[0].monto}
${cuotas[0].fechaVencimiento}
```

**Utilidades Thymeleaf:**
```thymeleaf
<!-- Fechas -->
${fechaActual}
${#temporals.format(fecha, 'dd/MM/yyyy')}

<!-- Números -->
${#numbers.formatDecimal(precio, 1, 2)}

<!-- Strings -->
${#strings.toUpperCase(texto)}
${#strings.capitalize(texto)}

<!-- Conversión número a texto -->
${numberToTextService.convertToText(monto)}
```

### **Ejemplo: Selección de Plantilla**

```java
private String obtenerPlantillaContrato(String tipoCliente) {
    return switch (tipoCliente) {
        case "Civil" -> "contratos/civiles/contrato_compra";
        case "Militar Fuerza Terrestre" -> "contratos/uniformados/contrato_compra_fuerza_terrestre";
        case "Militar Fuerza Naval" -> "contratos/uniformados/contrato_compra_fuerza_naval";
        case "Militar Fuerza Aérea" -> "contratos/uniformados/contrato_compra_fuerza_aerea";
        case "Policía Nacional" -> "contratos/uniformados/contrato_compra_policia";
        default -> "contratos/civiles/contrato_compra";
    };
}
```

---

## ⚙️ **Configuración**

### **application.properties** (base)
```properties
spring.application.name=gmarm-backend

# Server
server.port=8080

# JPA/Hibernate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=true

# Actuator (Health checks)
management.endpoints.web.exposure.include=health,info
management.endpoint.health.show-details=always
```

### **application-local.properties**
```properties
# Profile para desarrollo local (localhost)
spring.datasource.url=jdbc:postgresql://localhost:5432/gmarm_local
spring.datasource.username=postgres
spring.datasource.password=postgres

# Hibernate
spring.jpa.hibernate.ddl-auto=validate

# CORS
cors.allowed.origins=http://localhost:5173
```


### **application-prod.properties**
```properties
# Profile para producción
spring.datasource.url=${DATABASE_URL}
spring.datasource.username=${DATABASE_USERNAME}
spring.datasource.password=${DATABASE_PASSWORD}

# Hibernate
spring.jpa.hibernate.ddl-auto=validate

# CORS
cors.allowed.origins=${FRONTEND_URL}

# Security
jwt.secret=${JWT_SECRET}
```

---

## 🔐 **Seguridad**

### **Spring Security + JWT**

**Flujo de Autenticación:**
1. Cliente envía credenciales a `/api/auth/login`
2. Backend valida y genera JWT
3. Cliente incluye JWT en header `Authorization: Bearer <token>`
4. Backend valida JWT en cada request

**Configuración de Seguridad:**
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/**").authenticated()
            )
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
}
```

### **JWT Utilities**

```java
public class JwtUtil {
    
    public String generateToken(Usuario usuario) {
        return JWT.create()
            .withSubject(usuario.getEmail())
            .withClaim("rol", usuario.getRol())
            .withIssuedAt(new Date())
            .withExpiresAt(new Date(System.currentTimeMillis() + 24 * 60 * 60 * 1000))
            .sign(Algorithm.HMAC256(secret));
    }
    
    public String validateTokenAndGetEmail(String token) {
        DecodedJWT jwt = JWT.require(Algorithm.HMAC256(secret))
            .build()
            .verify(token);
        return jwt.getSubject();
    }
}
```

### **Password Hashing**

- **Algoritmo**: BCrypt
- **Configuración**: `@Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }`
- **Uso**: `passwordEncoder.encode(plainPassword)`

---

## 🗄️ **Base de Datos**

### **Conexión**

**Desarrollo Local:**
```
URL: jdbc:postgresql://localhost:5432/gmarm_local
User: postgres
Password: postgres
```

**Docker (LOCAL):**
```
URL: jdbc:postgresql://postgres:5432/gmarm_local
User: postgres
Password: postgres123
```

### **Hibernate DDL**

⚠️ **IMPORTANTE**: Siempre usar `validate`, **NUNCA** `create` o `create-drop` en Docker.

```properties
# ✅ CORRECTO
spring.jpa.hibernate.ddl-auto=validate

# ❌ INCORRECTO (borra datos)
spring.jpa.hibernate.ddl-auto=create-drop
```

### **Inicialización de Datos**

El SQL maestro (`datos/00_gmarm_completo.sql`) se ejecuta automáticamente al crear el contenedor de PostgreSQL.

---

## 🧪 **Testing**

### **Estructura de Tests**
```
src/test/java/com/armasimportacion/
├── service/
│   ├── ClienteServiceTest.java
│   ├── ArmaServiceTest.java
│   └── VentaServiceTest.java
├── controller/
│   ├── ClienteControllerTest.java
│   └── ArmaControllerTest.java
└── util/
    └── CedulaValidatorTest.java
```

### **Ejecutar Tests**

```bash
# Todos los tests
./mvnw test

# Test específico
./mvnw test -Dtest=ClienteServiceTest

# Con coverage
./mvnw test jacoco:report
```

### **Ejemplo de Test**

```java
@SpringBootTest
@Transactional
class ClienteServiceTest {
    
    @Autowired
    private ClienteService clienteService;
    
    @Test
    void testCrearCliente() {
        ClienteCreateDTO dto = ClienteCreateDTO.builder()
            .numeroIdentificacion("0123456789")
            .nombres("Juan")
            .apellidos("Pérez")
            .tipoCliente("Civil")
            .build();
        
        ClienteDTO result = clienteService.create(dto);
        
        assertNotNull(result.getId());
        assertEquals("Juan", result.getNombres());
    }
}
```

---

## 🏗️ **Build y Deploy**

### **Compilar**

```bash
# Limpiar y compilar
./mvnw clean compile

# Compilar sin tests
./mvnw clean install -DskipTests

# Package JAR
./mvnw package
```

### **Ejecutar Localmente**

```bash
# Con Maven wrapper
./mvnw spring-boot:run

# Con perfil específico
./mvnw spring-boot:run -Dspring-boot.run.profiles=local

# Con JAR
java -jar target/gmarm-backend-0.0.1-SNAPSHOT.jar
```

### **Docker Build**

```bash
# Build imagen
docker build -t gmarm-backend .

# Con docker-compose
docker-compose -f docker-compose.local.yml build backend_local

# Build sin cache
docker-compose -f docker-compose.local.yml build --no-cache backend_local
```

### **⚠️ Reiniciar Después de Cambios**

**Regla de Oro**: Después de modificar clases Java o templates:

```bash
# Opción 1: Rebuild completo (recomendado)
docker-compose -f docker-compose.local.yml down
docker-compose -f docker-compose.local.yml up -d --build

# Opción 2: Solo reiniciar
docker-compose -f docker-compose.local.yml restart backend_local
```

Los cambios en `.java` y templates NO se reflejan automáticamente en Docker.

---

## 📝 **Notas de Desarrollo**

### **Convenciones de Código**
- **Clases**: PascalCase (`ClienteService`)
- **Métodos/variables**: camelCase (`findById`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_CUOTAS`)
- **Paquetes**: lowercase (`com.armasimportacion`)

### **Clean Code**
- Máximo 500 líneas por clase
- Máximo 10 métodos públicos por clase
- Usar Lombok para reducir boilerplate
- Imports específicos, NO wildcards

### **Logs**
```java
@Slf4j
public class ClienteService {
    public ClienteDTO create(ClienteCreateDTO dto) {
        log.info("✅ Creando cliente: {}", dto.getNombres());
        // ...
        log.info("✅ Cliente creado con ID: {}", result.getId());
        return result;
    }
}
```

### **Manejo de Errores**
```java
// Custom exceptions
public class NotFoundException extends RuntimeException { }
public class ValidationException extends RuntimeException { }

// Global exception handler
@ControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorDTO> handleNotFound(NotFoundException ex) {
        return ResponseEntity.status(404).body(new ErrorDTO(ex.getMessage()));
    }
}
```

---

## 🔗 **Links Útiles**

- **Spring Boot Docs**: https://spring.io/projects/spring-boot
- **Spring Security**: https://spring.io/projects/spring-security
- **Thymeleaf**: https://www.thymeleaf.org/
- **OpenPDF**: https://github.com/LibrePDF/OpenPDF
- **PostgreSQL Driver**: https://jdbc.postgresql.org/

---

**Ver también:**
- [📚 README Principal](../README.md)
- [📚 Frontend README](../frontend/README.md)
- [🤖 AGENTS.md](../AGENTS.md)

---

**Última actualización**: Enero 2026

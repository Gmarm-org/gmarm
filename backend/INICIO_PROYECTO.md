# 🚀 **Guía de Inicio - Spring Boot 3.4.5 + Java 17**

## ✅ **Estado Actual del Proyecto**

### **Dependencias Configuradas:**
- ✅ **Spring Boot Web** - Servicios REST
- ✅ **Spring Boot Data JPA** - Persistencia
- ✅ **Spring Boot Security** - Autenticación y autorización
- ✅ **Spring Boot Validation** - Validación de datos
- ✅ **Spring Boot Mail** - Envío de emails
- ✅ **PostgreSQL** - Base de datos
- ✅ **JWT** - Tokens de autenticación
- ✅ **Swagger/OpenAPI** - Documentación API
- ✅ **Lombok** - Reducción de boilerplate
- ✅ **Hibernate Types** - Soporte JSONB
- ✅ **Commons IO** - Utilidades de archivos

## 🎯 **Tips de Inicio**

### **1. Configuración Inicial**

#### **application.properties:**
```properties
# ===== CONFIGURACIÓN DE BASE DE DATOS =====
spring.datasource.url=jdbc:postgresql://localhost:5432/gmarm_db
spring.datasource.username=postgres
spring.datasource.password=tu_password
spring.datasource.driver-class-name=org.postgresql.Driver

# ===== CONFIGURACIÓN JPA/HIBERNATE =====
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.use_sql_comments=true

# ===== CONFIGURACIÓN DE SUBIDA DE ARCHIVOS =====
spring.servlet.multipart.max-file-size=5MB
spring.servlet.multipart.max-request-size=10MB
file.upload.path=./uploads

# ===== CONFIGURACIÓN JWT =====
jwt.secret=tu_jwt_secret_muy_seguro_aqui_debe_ser_muy_largo_y_complejo
jwt.expiration=86400000
jwt.refresh-expiration=604800000

# ===== CONFIGURACIÓN DE EMAIL =====
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=tu_email@gmail.com
spring.mail.password=tu_app_password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true

# ===== CONFIGURACIÓN DEL SERVIDOR =====
server.port=8080
server.servlet.context-path=/api

# ===== CONFIGURACIÓN SWAGGER =====
springdoc.api-docs.path=/api-docs
springdoc.swagger-ui.path=/swagger-ui.html
springdoc.swagger-ui.operationsSorter=method

# ===== CONFIGURACIÓN DE LOGGING =====
logging.level.com.armasimportacion=DEBUG
logging.level.org.springframework.security=DEBUG
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE
```

### **2. Estructura de Paquetes Recomendada**

```
src/main/java/com/armasimportacion/
├── ArmasimportacionApplication.java
├── config/
│   ├── SecurityConfig.java
│   ├── CorsConfig.java
│   ├── SwaggerConfig.java
│   └── DatabaseConfig.java
├── controller/
│   ├── AuthController.java
│   ├── UserController.java
│   ├── RoleController.java
│   ├── FileUploadController.java
│   ├── ClientController.java
│   ├── WeaponController.java
│   └── AdminController.java
├── service/
│   ├── UserService.java
│   ├── RoleService.java
│   ├── FileService.java
│   ├── AuthService.java
│   ├── ClientService.java
│   ├── WeaponService.java
│   ├── EmailService.java
│   └── impl/
│       ├── UserServiceImpl.java
│       ├── RoleServiceImpl.java
│       ├── FileServiceImpl.java
│       ├── AuthServiceImpl.java
│       ├── ClientServiceImpl.java
│       ├── WeaponServiceImpl.java
│       └── EmailServiceImpl.java
├── repository/
│   ├── UserRepository.java
│   ├── RoleRepository.java
│   ├── ClientRepository.java
│   ├── WeaponRepository.java
│   └── ClientWeaponRepository.java
├── model/
│   ├── Usuario.java
│   ├── Rol.java
│   ├── Cliente.java
│   ├── Arma.java
│   ├── ClienteArma.java
│   ├── Provincia.java
│   ├── Canton.java
│   └── TipoCliente.java
├── dto/
│   ├── request/
│   │   ├── CreateUserRequest.java
│   │   ├── UpdateUserRequest.java
│   │   ├── LoginRequest.java
│   │   ├── CreateClientRequest.java
│   │   └── AssignWeaponRequest.java
│   ├── response/
│   │   ├── UserResponse.java
│   │   ├── LoginResponse.java
│   │   ├── ClientResponse.java
│   │   └── WeaponResponse.java
│   └── common/
│       ├── ApiResponse.java
│       └── PaginatedResponse.java
├── security/
│   ├── JwtTokenProvider.java
│   ├── UserDetailsServiceImpl.java
│   ├── JwtAuthenticationFilter.java
│   └── SecurityUtils.java
├── exception/
│   ├── GlobalExceptionHandler.java
│   ├── ResourceNotFoundException.java
│   ├── BadRequestException.java
│   ├── UnauthorizedException.java
│   └── ValidationException.java
├── util/
│   ├── FileUtils.java
│   ├── ValidationUtils.java
│   ├── EmailUtils.java
│   └── Constants.java
└── enums/
    ├── EstadoUsuario.java
    ├── TipoRolVendedor.java
    ├── TipoCliente.java
    └── TipoIdentificacion.java
```

### **3. Mejores Prácticas**

#### **A. Nomenclatura:**
- ✅ **Entidades**: PascalCase (Usuario, Cliente, Arma)
- ✅ **Repositorios**: PascalCase + Repository (UserRepository)
- ✅ **Servicios**: PascalCase + Service (UserService)
- ✅ **Controladores**: PascalCase + Controller (UserController)
- ✅ **DTOs**: PascalCase + Request/Response (CreateUserRequest)
- ✅ **Enums**: PascalCase (EstadoUsuario, TipoCliente)

#### **B. Anotaciones JPA:**
```java
@Entity
@Table(name = "usuario")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "username", unique = true, nullable = false, length = 50)
    private String username;
    
    @CreatedDate
    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;
    
    @LastModifiedDate
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;
}
```

#### **C. Validaciones:**
```java
public class CreateUserRequest {
    @NotBlank(message = "El username es obligatorio")
    @Size(min = 3, max = 50, message = "El username debe tener entre 3 y 50 caracteres")
    private String username;
    
    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El formato del email no es válido")
    private String email;
    
    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
    private String password;
}
```

#### **D. Manejo de Excepciones:**
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.error(ex.getMessage()));
    }
    
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(ValidationException ex) {
        return ResponseEntity.badRequest()
            .body(ApiResponse.error(ex.getMessage()));
    }
}
```

### **4. Configuración de Seguridad**

#### **SecurityConfig.java:**
```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/upload/files/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/api-docs/**").permitAll()
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

### **5. Configuración de Swagger**

#### **SwaggerConfig.java:**
```java
@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("GMARM API")
                .version("1.0")
                .description("API para gestión de importación de armas")
                .contact(new Contact()
                    .name("GMARM Team")
                    .email("contacto@gmarm.com"))
            )
            .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
            .components(new Components()
                .addSecuritySchemes("Bearer Authentication", 
                    new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")));
    }
}
```

### **6. Próximos Pasos Recomendados**

1. **📋 Crear entidades** basadas en tu estructura de BD
2. **🔐 Configurar seguridad** con JWT
3. **📁 Implementar subida de archivos**
4. **📧 Configurar envío de emails**
5. **✅ Agregar validaciones** con Bean Validation
6. **📚 Documentar API** con Swagger
7. **🧪 Crear tests** unitarios e integración
8. **🚀 Configurar Docker** para despliegue

### **7. Comandos Útiles**

```bash
# Compilar proyecto
mvn clean compile

# Ejecutar tests
mvn test

# Ejecutar aplicación
mvn spring-boot:run

# Crear JAR ejecutable
mvn clean package

# Ejecutar JAR
java -jar target/backend-armas-importacion-0.0.1-SNAPSHOT.jar
```

¡Perfecto! Ahora estás listo para empezar a crear las entidades basadas en tu estructura de base de datos. ¿Me puedes pasar la estructura de la BD para ayudarte a crear los models? 
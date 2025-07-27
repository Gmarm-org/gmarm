# 🚀 **Configuración Backend Spring Boot**

## 📋 **Dependencias Maven (pom.xml)**

```xml
<dependencies>
    <!-- Spring Boot Starter Web -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    
    <!-- Spring Boot Starter Data JPA -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    
    <!-- Spring Boot Starter Security -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    
    <!-- Spring Boot Starter Validation -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    
    <!-- PostgreSQL Driver -->
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
    </dependency>
    
    <!-- JWT -->
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.11.5</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.11.5</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-jackson</artifactId>
        <version>0.11.5</version>
        <scope>runtime</scope>
    </dependency>
    
    <!-- Lombok (opcional) -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
</dependencies>
```

## ⚙️ **Configuración (application.properties)**

```properties
# Configuración de Base de Datos
spring.datasource.url=jdbc:postgresql://localhost:5432/gmarm_db
spring.datasource.username=postgres
spring.datasource.password=tu_password
spring.datasource.driver-class-name=org.postgresql.Driver

# Configuración JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.properties.hibernate.format_sql=true

# Configuración de subida de archivos
spring.servlet.multipart.max-file-size=5MB
spring.servlet.multipart.max-request-size=10MB
file.upload.path=./uploads

# Configuración de CORS
spring.web.cors.allowed-origins=http://localhost:3000,http://localhost:5173
spring.web.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
spring.web.cors.allowed-headers=*
spring.web.cors.allow-credentials=true

# Configuración JWT
jwt.secret=tu_jwt_secret_muy_seguro_aqui
jwt.expiration=86400000

# Configuración del servidor
server.port=8080
server.servlet.context-path=/api
```

## 🏗️ **Estructura de Paquetes**

```
src/main/java/com/armasimportacion/
├── ArmasimportacionApplication.java
├── config/
│   ├── SecurityConfig.java
│   ├── CorsConfig.java
│   └── SwaggerConfig.java
├── controller/
│   ├── AuthController.java
│   ├── UserController.java
│   ├── RoleController.java
│   ├── FileUploadController.java
│   └── AdminController.java
├── service/
│   ├── UserService.java
│   ├── RoleService.java
│   ├── FileService.java
│   ├── AuthService.java
│   └── impl/
│       ├── UserServiceImpl.java
│       ├── RoleServiceImpl.java
│       └── FileServiceImpl.java
├── repository/
│   ├── UserRepository.java
│   └── RoleRepository.java
├── model/
│   ├── Usuario.java
│   ├── Rol.java
│   └── UsuarioRol.java
├── dto/
│   ├── CreateUserRequest.java
│   ├── UpdateUserRequest.java
│   ├── UserResponse.java
│   ├── LoginRequest.java
│   └── LoginResponse.java
├── security/
│   ├── JwtTokenProvider.java
│   ├── UserDetailsServiceImpl.java
│   └── JwtAuthenticationFilter.java
└── exception/
    ├── GlobalExceptionHandler.java
    ├── ResourceNotFoundException.java
    └── BadRequestException.java
```

## 🔐 **Configuración de Seguridad**

### **SecurityConfig.java:**
```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/upload/files/**").permitAll()
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
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000", "http://localhost:5173"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

## 📁 **Controlador de Subida de Archivos**

### **FileUploadController.java:**
```java
@RestController
@RequestMapping("/upload")
@CrossOrigin(origins = "*")
public class FileUploadController {

    @Value("${file.upload.path}")
    private String uploadPath;

    @PostMapping("/user-photo")
    public ResponseEntity<Map<String, String>> uploadUserPhoto(@RequestParam("photo") MultipartFile file) {
        try {
            // Validaciones
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Archivo vacío"));
            }

            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Solo se permiten imágenes"));
            }

            if (file.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest().body(Map.of("error", "Archivo demasiado grande"));
            }

            // Generar nombre único
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null ? 
                originalFilename.substring(originalFilename.lastIndexOf(".")) : ".jpg";
            String filename = "user-photo-" + System.currentTimeMillis() + "-" + 
                UUID.randomUUID().toString() + extension;

            // Crear directorio
            Path uploadDir = Paths.get(uploadPath + "/users/photos/");
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            // Guardar archivo
            Path filePath = uploadDir.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

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
}
```

## 🎯 **Próximos Pasos**

1. **Crear las entidades** Usuario y Rol
2. **Implementar repositorios** con Spring Data JPA
3. **Crear servicios** para lógica de negocio
4. **Implementar controladores** REST
5. **Configurar autenticación** JWT
6. **Agregar validaciones** con Bean Validation
7. **Implementar manejo de excepciones** global
8. **Configurar Swagger** para documentación API

El backend Spring Boot está listo para integrarse con el frontend React que ya tienes implementado. 
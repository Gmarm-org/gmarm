# 🔧 Deuda Técnica - Backend (Spring Boot + Java)

## 📋 Documento de Deuda Técnica y Reglas de Desarrollo

**Proyecto**: GMARM - Sistema de Gestión de Armas  
**Framework**: Spring Boot 3.x + Java 21  
**Fecha de Creación**: 9 de Noviembre, 2025
**Ultima Actualizacion**: 6 de Marzo, 2026

---

## 📐 Reglas de Clean Code - Backend

### 1. ✅ Tamaño de Clases y Métodos

**REGLA DE ORO**: Máximo 500 líneas por clase

```java
// ✅ BIEN - Clase enfocada
@Service
public class ClienteService {
    // ~300 líneas
    // Una responsabilidad: gestión de clientes
}

// ❌ MAL - Clase monolítica
@Service
public class GestionCompletaService {
    // ~1500 líneas
    // Múltiples responsabilidades mezcladas
}
```

**Límites Recomendados**:
- **Clase Service**: Máximo 500 líneas
- **Clase Controller**: Máximo 300 líneas
- **Método**: Máximo 50 líneas
- **Constructor**: Máximo 10 parámetros

---

### 2. ✅ Estructura de Clases Java

```java
@Service
@RequiredArgsConstructor  // ✅ Lombok para constructor
@Slf4j               // ✅ Logging con SLF4J
public class ClienteService {
    
    // 1️⃣ CONSTANTES
    private static final int EDAD_MINIMA = 25;
    
    // 2️⃣ DEPENDENCIAS (final + private)
    private final ClienteRepository clienteRepository;
    private final ClienteMapper clienteMapper;
    
    // 3️⃣ MÉTODOS PÚBLICOS (API del servicio)
    public ClienteDTO crear(ClienteCreateDTO dto) {
        log.info("Creando cliente: {}", dto.getNombres());
        validarDatos(dto);
        Cliente cliente = clienteMapper.toEntity(dto);
        Cliente guardado = clienteRepository.save(cliente);
        return clienteMapper.toDTO(guardado);
    }
    
    // 4️⃣ MÉTODOS PRIVADOS (helpers)
    private void validarDatos(ClienteCreateDTO dto) {
        // Validaciones
    }
}
```

---

### 3. ✅ Imports - NO usar Wildcards

```java
// ✅ BIEN - Imports específicos
import com.armasimportacion.model.Cliente;
import com.armasimportacion.dto.ClienteDTO;
import com.armasimportacion.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;

// ❌ MAL - Wildcard imports
import com.armasimportacion.model.*;
import com.armasimportacion.dto.*;
import org.springframework.*;
```

---

### 4. ✅ Nomenclatura y Convenciones

#### Clases
```java
// ✅ BIEN
public class ClienteService { }
public class ClienteDTO { }
public class ClienteCreateDTO { }
public class ResourceNotFoundException { }

// ❌ MAL
public class clienteService { }  // minúscula
public class Cliente_Service { } // snake_case
public class ClienteServiceImpl { } // "Impl" innecesario con @Service
```

#### Métodos
```java
// ✅ BIEN - Verbos descriptivos
public ClienteDTO crear(ClienteCreateDTO dto) { }
public void actualizar(Long id, ClienteDTO dto) { }
public void eliminar(Long id) { }
public ClienteDTO obtenerPorId(Long id) { }
public List<ClienteDTO> listarTodos() { }

// ❌ MAL
public ClienteDTO create1(ClienteCreateDTO dto) { } // números
public void upd(Long id, ClienteDTO dto) { } // abreviaciones
```

#### Variables
```java
// ✅ BIEN - CamelCase descriptivo
private final ClienteRepository clienteRepository;
private String numeroIdentificacion;
private LocalDateTime fechaCreacion;

// ❌ MAL
private final ClienteRepository cliente_repository; // snake_case
private String numId; // abreviado
private LocalDateTime fc; // abreviado
```

---

### 5. ✅ Uso de Annotations

```java
// ✅ BIEN - Annotations ordenadas
@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
@Slf4j
@Validated
public class ClienteController {
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'VENDEDOR')")
    public ResponseEntity<ClienteDTO> obtenerPorId(@PathVariable Long id) {
        // ...
    }
}

// ❌ MAL - Desordenadas
@Slf4j
@Validated
@RequiredArgsConstructor
@RequestMapping("/api/clientes")
@RestController
public class ClienteController { }
```

**Orden Recomendado**:
1. Spring annotations (`@Service`, `@RestController`)
2. Mapping annotations (`@RequestMapping`)
3. Lombok annotations (`@RequiredArgsConstructor`, `@Slf4j`)
4. Validation annotations (`@Validated`)
5. Security annotations (`@PreAuthorize`)

---

### 6. ✅ DTOs y Mappers

#### DTOs con Builder
```java
// ✅ BIEN
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClienteDTO {
    private Long id;
    private String nombres;
    private String apellidos;
    private String numeroIdentificacion;
    private String email;
    
    // NO lógica de negocio aquí
}
```

#### Mappers Específicos
```java
// ✅ BIEN - Mapper dedicado
@Component
public class ClienteMapper {
    
    public ClienteDTO toDTO(Cliente cliente) {
        if (cliente == null) return null;
        
        return ClienteDTO.builder()
            .id(cliente.getId())
            .nombres(cliente.getNombres())
            .apellidos(cliente.getApellidos())
            .numeroIdentificacion(cliente.getNumeroIdentificacion())
            .email(cliente.getEmail())
            .build();
    }
    
    public Cliente toEntity(ClienteCreateDTO dto) {
        if (dto == null) return null;
        
        Cliente cliente = new Cliente();
        cliente.setNombres(dto.getNombres());
        cliente.setApellidos(dto.getApellidos());
        cliente.setNumeroIdentificacion(dto.getNumeroIdentificacion());
        cliente.setEmail(dto.getEmail());
        return cliente;
    }
}

// ❌ MAL - Lógica en el modelo
@Entity
public class Cliente {
    public ClienteDTO toDTO() { } // NO hacer esto
}
```

---

### 7. ✅ Manejo de Excepciones

```java
// ✅ BIEN - Excepciones específicas
@Service
public class ClienteService {
    
    public ClienteDTO obtenerPorId(Long id) {
        return clienteRepository.findById(id)
            .map(clienteMapper::toDTO)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Cliente no encontrado con ID: " + id
            ));
    }
}

// ✅ BIEN - GlobalExceptionHandler
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(
        ResourceNotFoundException ex
    ) {
        ErrorResponse error = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(HttpStatus.NOT_FOUND.value())
            .error("Not Found")
            .message(ex.getMessage())
            .build();
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
}

// ❌ MAL - Try-catch genérico
try {
    // código
} catch (Exception e) {
    // manejar todo igual
}
```

---

### 8. ✅ Logging Efectivo

```java
// ✅ BIEN
@Slf4j
@Service
public class ClienteService {
    
    public ClienteDTO crear(ClienteCreateDTO dto) {
        log.info("✅ Creando cliente: nombres={}", dto.getNombres());
        log.debug("🔍 DEBUG: Datos completos: {}", dto);
        
        try {
            Cliente cliente = clienteMapper.toEntity(dto);
            Cliente guardado = clienteRepository.save(cliente);
            log.info("✅ Cliente creado exitosamente: ID={}", guardado.getId());
            return clienteMapper.toDTO(guardado);
        } catch (Exception e) {
            log.error("❌ Error creando cliente: {}", e.getMessage(), e);
            throw new BadRequestException("Error al crear cliente", e);
        }
    }
}

// ❌ MAL
System.out.println("Cliente creado"); // NO usar System.out
log.info("Cliente: " + cliente.toString()); // NO concatenar, usar {}
log.error(e.getMessage()); // Sin stack trace
```

**Niveles de Log**:
- `ERROR`: Errores que requieren atención inmediata
- `WARN`: Situaciones anormales pero manejables
- `INFO`: Eventos importantes del negocio
- `DEBUG`: Información detallada para debugging (solo en desarrollo)

---

### 9. ✅ Validaciones

```java
// ✅ BIEN - Validaciones con Bean Validation
@Data
public class ClienteCreateDTO {
    
    @NotBlank(message = "Nombres es obligatorio")
    @Size(min = 2, max = 100, message = "Nombres debe tener entre 2 y 100 caracteres")
    private String nombres;
    
    @NotBlank(message = "Email es obligatorio")
    @Email(message = "Email inválido")
    private String email;
    
    @NotNull(message = "Fecha de nacimiento es obligatoria")
    @Past(message = "Fecha de nacimiento debe ser en el pasado")
    private LocalDate fechaNacimiento;
}

// ✅ BIEN - Controller con @Valid
@PostMapping
public ResponseEntity<ClienteDTO> crear(@Valid @RequestBody ClienteCreateDTO dto) {
    ClienteDTO creado = clienteService.crear(dto);
    return ResponseEntity.status(HttpStatus.CREATED).body(creado);
}

// ✅ BIEN - Validaciones custom en servicio
@Service
public class ClienteService {
    
    private void validarEdadMinima(ClienteCreateDTO dto) {
        int edad = Period.between(dto.getFechaNacimiento(), LocalDate.now()).getYears();
        if (edad < 25) {
            throw new BadRequestException(
                "Cliente debe tener al menos 25 años para comprar armas"
            );
        }
    }
}
```

---

### 10. ✅ Transacciones

```java
// ✅ BIEN - @Transactional solo donde se necesita
@Service
@Transactional(readOnly = true) // Por defecto solo lectura
public class ClienteService {
    
    @Transactional // Escritura solo en métodos que modifican
    public ClienteDTO crear(ClienteCreateDTO dto) {
        Cliente cliente = clienteMapper.toEntity(dto);
        Cliente guardado = clienteRepository.save(cliente);
        return clienteMapper.toDTO(guardado);
    }
    
    // readOnly = true (heredado de clase)
    public ClienteDTO obtenerPorId(Long id) {
        return clienteRepository.findById(id)
            .map(clienteMapper::toDTO)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
    }
}

// ❌ MAL - @Transactional en toda la clase sin readOnly
@Service
@Transactional
public class ClienteService {
    // Todas las operaciones en transacción de escritura
}
```

---

## 🚨 Deuda Técnica Identificada

### 1. 🟢 Clases Service Grandes — MAYORMENTE RESUELTO (Feb 2026)

**Estado**: ✅ Refactorizado con SRP (Fases 10-13)

Las clases monolíticas se dividieron en servicios especializados:

| Clase Original | Antes | Feb 2026 | Mar 2026 | Accion |
|---------------|-------|---------|----------|--------|
| GestionClienteService | 2000+ | Eliminada | Eliminada | → 5 helpers + ClienteCompletoService orquestador |
| GestionDocumentosServiceHelper | 1623 | 134 | 135 | → 6 PDFGenerators en `helper/documentos/` |
| GrupoImportacionService | 1765 | 817 | 772 | → + ClienteService, MatchingService, ProcesoService |
| ClienteService | 1145 | 612 | 623 | → + ClienteQueryService (read-only) |
| ClienteController | 1038 | 556 | 467 | → + ClienteDocumentController |

**Estado actual (Marzo 2026)**:
- `ClienteCompletoService` (813 lineas) — Orquestador con helpers bien definidos, no es critico
- `GrupoImportacionService` (772 lineas) — Ya dividido en 3 sub-servicios, mejorado desde 817
- `ClienteQueryService` (566 lineas) — Crecio desde 396 por soft-delete y nuevas consultas, supera limite de 500
- `ClienteService` (623 lineas) — Ligeramente por encima del limite de 500
- `ClienteDocumentController` (547 lineas) — Crecio desde 404 por nuevas funcionalidades

**Prioridad**: 🟢 Baja (mejora incremental)

---

### 2. 🟢 Arquitectura de Helpers y Generadores PDF

**Estado**: ✅ Implementado y expandido

**Ubicación**: `service/helper/`
```
- GestionDocumentosServiceHelper.java  (orquestador, 134 líneas)
- GestionPagosServiceHelper.java
- GestionArmasServiceHelper.java
- GestionRespuestasServiceHelper.java
```

**Generadores PDF**: `service/helper/documentos/`
```
- ContratoPDFGenerator.java       (contratos ISSPOL/ISSFA/civil)
- CotizacionPDFGenerator.java     (cotizaciones)
- SolicitudCompraPDFGenerator.java (solicitudes de compra)
- AutorizacionPDFGenerator.java   (autorizaciones de venta)
- ReciboPDFGenerator.java         (recibos de cuotas)
- DocumentoPDFUtils.java          (utilidades compartidas)
```

**Ventaja**:
- ✅ Cada generador tiene responsabilidad única
- ✅ `DocumentoPDFUtils` centraliza lógica común (guardar, formatear, etc.)
- ✅ Facilita agregar nuevos tipos de documentos

**Recomendación**: Continuar usando este patrón para nueva funcionalidad.

---

### 3. 🔴 Falta de Tests Unitarios

**Problema**:
- No hay tests unitarios para servicios críticos
- No hay tests de integración
- Coverage: 0%

**Impacto**: 🔴 Alto - Riesgo de regresiones

**Solución Propuesta**:
```
backend/src/test/java/
├── com/armasimportacion/
│   ├── service/
│   │   ├── ClienteServiceTest.java
│   │   ├── ArmaServiceTest.java
│   │   └── ...
│   ├── controller/
│   │   ├── ClienteControllerTest.java
│   │   └── ...
│   └── integration/
│       ├── ClienteIntegrationTest.java
│       └── ...
```

**Frameworks**:
- JUnit 5
- Mockito
- Spring Boot Test
- TestContainers (para BD)

**Prioridad**: 🔴 Alta

---

### 4. 🟡 Validaciones Custom sin Tests

**Problema**:
- Validaciones de cédula, RUC en backend sin tests
- Validaciones de edad mínima sin verificar

**Solución**:
```java
// Crear tests unitarios
@Test
void deberiaValidarCedulaEcuatorianaValida() {
    String cedula = "1723456789";
    boolean resultado = validadorService.validarCedula(cedula);
    assertTrue(resultado);
}

@Test
void deberiaRechazarCedulaInvalida() {
    String cedula = "9999999999";
    boolean resultado = validadorService.validarCedula(cedula);
    assertFalse(resultado);
}
```

**Prioridad**: 🟡 Media-Alta

---

### 5. 🟢 Hardcodeo de Valores de Negocio — RESUELTO (Feb 2026)

**Estado**: ✅ Resuelto

**Implementado**:
- ✅ Tabla `configuracion_sistema` con claves `EDAD_MINIMA_CLIENTE` y `NUMERO_MAXIMO_CUOTAS`
- ✅ `ConfiguracionSistemaService` con helpers `getValorEntero()` y `getValorNumerico()`
- ✅ `ClienteService.validateEdadMinima()` lee de config con fallback 25
- ✅ `GestionPagosServiceHelper` lee max cuotas de config con fallback 12
- ✅ `Cliente.java` y `ClienteDTO.java` aceptan `edadMinima` como parámetro
- ✅ Configuraciones agregadas al SQL maestro `datos/00_gmarm_completo.sql`
- ✅ IVA ya tenía fallback aceptable como safety net (no requirió cambio)

**Prioridad**: ✅ Completado

---

### 6. 🟢 Documentación JavaDoc Inconsistente — POSPUESTO

**Estado**: Pospuesto — Bajo valor vs esfuerzo. Los servicios principales tienen logging descriptivo.

**Prioridad**: 🟢 Baja (pospuesto indefinidamente)

---

### 7. 🟢 Queries N+1 Potenciales — RESUELTO (Feb 2026)

**Estado**: ✅ Resuelto

**Fixes aplicados**:
- ✅ `ClienteQueryService.existsByNumeroIdentificacion()`: Reemplazado `findAll()` + stream con `clienteRepository.existsByNumeroIdentificacion()` directo
- ✅ `ClienteQueryService.getDetalleCompleto()`: Usa `findByIdWithCollections()` con `@EntityGraph` en vez de `findById()`
- ✅ `ClienteQueryService.findByEstado()`: Usa `findByEstadoWithRelations()` con `@EntityGraph`
- ✅ `ClienteQueryService.findByUsuarioCreador()`: Usa `findWithRelationsByUsuarioCreadorId()` con `@EntityGraph`
- ✅ `GrupoImportacionClienteService.obtenerClientesDisponibles()`: Reemplazado 3x `findAll()` con query JPQL `findClientesDisponiblesParaGrupo()`
- ✅ `ClienteRepository`: Agregados 4 métodos optimizados con `@EntityGraph` y `@Query`

**Prioridad**: ✅ Completado

---

### 8. 🟢 Seguridad de Endpoints

**Estado**: ⚠️ Revisar

**Verificar**:
- Todos los endpoints tienen `@PreAuthorize`
- Roles correctamente asignados
- No hay endpoints públicos no intencionales

**Ejemplo Correcto**:
```java
@RestController
@RequestMapping("/api/clientes")
@PreAuthorize("hasAnyRole('ADMIN', 'VENDEDOR')")
public class ClienteController {
    
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'VENDEDOR', 'GERENTE')")
    public List<ClienteDTO> listar() { }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'VENDEDOR')")
    public ClienteDTO crear(@Valid @RequestBody ClienteCreateDTO dto) { }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void eliminar(@PathVariable Long id) { }
}
```

**Prioridad**: 🔴 Alta

---

## 📋 Checklist de Código Limpio - Backend

### Al Crear una Nueva Clase
- [ ] Nombre descriptivo en PascalCase
- [ ] Máximo 500 líneas
- [ ] Una responsabilidad clara
- [ ] Imports específicos (no wildcards)
- [ ] Annotations en orden correcto
- [ ] JavaDoc en clase y métodos públicos

### Al Crear un Service
- [ ] Anotación `@Service`
- [ ] `@RequiredArgsConstructor` para inyección
- [ ] `@Slf4j` para logging
- [ ] `@Transactional(readOnly = true)` si aplica
- [ ] Dependencias como `private final`
- [ ] Métodos públicos primero, privados al final
- [ ] Validaciones antes de operaciones
- [ ] Logging de operaciones importantes
- [ ] Manejo específico de excepciones

### Al Crear un Controller
- [ ] Anotación `@RestController`
- [ ] `@RequestMapping` con path base
- [ ] `@PreAuthorize` en clase o métodos
- [ ] `@Valid` en @RequestBody
- [ ] `@PathVariable` y `@RequestParam` con nombres descriptivos
- [ ] ResponseEntity con status HTTP correcto
- [ ] Logging de requests importantes
- [ ] Manejo de errores con GlobalExceptionHandler

### Al Crear un DTO
- [ ] Anotaciones Lombok: `@Data`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`
- [ ] Validaciones con Bean Validation
- [ ] Sin lógica de negocio
- [ ] Nombres descriptivos de campos

### Al Crear un Mapper
- [ ] Anotación `@Component`
- [ ] Métodos específicos: `toDTO`, `toEntity`, `toCreateDTO`
- [ ] Validación de null
- [ ] Sin lógica de negocio compleja

---

## 🎯 Plan de Mejora Continua

### Fase 1: Fundamentos ✅ COMPLETADA (Feb 2026)
- [x] Revisar todas las clases Service > 400 líneas
- [x] Refactorizar servicios grandes usando Helpers y SRP
- [ ] Establecer reglas de linting con Checkstyle
- [ ] Configurar SonarQube o similar

### Fase 2: Testing (3 semanas)
- [ ] Implementar tests unitarios para servicios críticos
- [ ] Configurar TestContainers para tests de integración
- [ ] Objetivo: 70% code coverage
- [ ] CI/CD con tests automáticos

### Fase 3: Optimización (2 semanas)
- [x] Revisar y optimizar queries N+1 ✅ Resuelto (Feb 2026)
- [ ] Implementar caché donde aplique
- [ ] Optimizar endpoints lentos
- [ ] Monitoreo de performance

### Fase 4: Seguridad (1 semana)
- [ ] Auditoría de seguridad de endpoints
- [ ] Revisar roles y permisos
- [ ] Implementar rate limiting
- [ ] Logging de accesos sensibles

### Fase 5: Documentación (1 semana)
- [ ] JavaDoc completo en servicios públicos
- [ ] Swagger/OpenAPI actualizado
- [ ] Guía de desarrollo para nuevos devs
- [ ] Diagramas de arquitectura

---

## 📚 Recursos y Referencias

### Spring Boot Best Practices
- [Spring Boot Reference](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [Clean Code Java](https://github.com/JuanCrg90/Clean-Code-Notes)
- [SOLID Principles](https://www.baeldung.com/solid-principles)

### Testing
- [JUnit 5 User Guide](https://junit.org/junit5/docs/current/user-guide/)
- [Mockito Documentation](https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/Mockito.html)
- [TestContainers](https://www.testcontainers.org/)

### Performance
- [JPA Best Practices](https://www.baeldung.com/jpa-hibernate-projections)
- [Spring Data JPA Query Methods](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/#jpa.query-methods)

---

## 🔖 Versiones del Documento

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 2025-11-09 | Documento inicial con reglas de Clean Code y deuda técnica identificada |
| 1.1 | 2026-02-13 | Actualizar estado post-refactorización SRP (clases grandes resueltas, PDF generators, split services) |
| 1.2 | 2026-02-13 | Marcar hardcoded values y N+1 queries como RESUELTOS, JavaDoc como POSPUESTO |
| 1.3 | 2026-03-06 | Actualizar line counts reales, identificar regresiones (ClienteQueryService 566, ClienteDocumentController 547) |

---

**Nota**: Este documento es una guía viva que debe actualizarse conforme evolucionan las mejores prácticas del proyecto.


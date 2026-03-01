---
name: backend-patterns
description: Backend architecture patterns for Spring Boot applications. Use when building APIs, services, repositories, document generators, or reviewing backend code. Covers JPA/Hibernate ORM, SRP service pattern, Flyway migrations, Thymeleaf + OpenPDF document generation, and Docker deployment patterns.
---

# Backend Development Patterns - GMARM

Backend architecture patterns for Spring Boot 3.4.5 applications with Java 17, JPA/Hibernate, PostgreSQL, and Docker Compose.

## Project Structure

```
backend/src/main/java/com/armasimportacion/
├── controller/
│   ├── ClienteController.java          # CRUD, busquedas, estado
│   ├── ClienteDocumentController.java  # Contratos, documentos
│   └── GrupoImportacionController.java # Grupos de importacion
├── service/
│   ├── ClienteService.java             # CRUD + validaciones
│   ├── ClienteQueryService.java        # Consultas read-only
│   ├── ClienteCompletoService.java     # Orquestador creacion completa
│   ├── GrupoImportacionService.java    # CRUD grupos
│   ├── GrupoImportacionMatchingService.java # Matching/disponibilidad
│   └── helper/documentos/             # Generadores PDF
│       ├── ContratoPDFGenerator.java
│       ├── CotizacionPDFGenerator.java
│       ├── SolicitudCompraPDFGenerator.java
│       └── DocumentoPDFUtils.java
├── repository/    # JPA Repositories
├── model/         # Entidades JPA
├── dto/           # Data Transfer Objects
├── mapper/        # Entity <-> DTO
└── enums/         # Enums de negocio
```

## Entity Patterns (JPA/Hibernate)

Entities use JPA annotations and Lombok:

```java
@Entity
@Table(name = "cliente")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@EqualsAndHashCode(of = "id")
public class Cliente {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombres;

    @Column(nullable = false)
    private String apellidos;

    @Column(name = "numero_identificacion", unique = true)
    private String numeroIdentificacion;

    @Enumerated(EnumType.STRING)
    private EstadoCliente estado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_creador_id")
    private Usuario usuarioCreador;

    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL)
    private List<ClienteArma> armas;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_cliente_importacion_id")
    private TipoClienteImportacion tipoClienteImportacion;
}
```

**Key patterns:**

- `@Getter @Setter` on entities (NOT `@Data` — breaks equals/hashCode with lazy proxies)
- `@EqualsAndHashCode(of = "id")` — identity-based equality
- `FetchType.LAZY` by default on `@ManyToOne` and `@OneToMany`
- `@Enumerated(EnumType.STRING)` for enums (never ORDINAL)
- `@Builder` for convenient construction
- `@GeneratedValue(strategy = GenerationType.IDENTITY)` for auto-increment IDs

## Repository Pattern (Spring Data JPA)

Repositories extend `JpaRepository` with custom queries:

```java
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    @EntityGraph(attributePaths = {"usuarioCreador", "tipoClienteImportacion"})
    Optional<Cliente> findById(Long id);

    List<Cliente> findByEstado(EstadoCliente estado);

    @Query("SELECT c FROM Cliente c WHERE c.usuarioCreador.id = :vendedorId")
    List<Cliente> findByVendedorId(@Param("vendedorId") Long vendedorId);
}
```

**Key patterns:**

- `@EntityGraph` for explicit eager loading (avoids N+1)
- Prefer derived queries (auto-parameterized by Spring)
- Use `@Param` for JPQL parameters
- `Optional<T>` for single-result queries
- NEVER concatenate strings in `@Query`

## Service Layer (SRP Pattern)

Services are split by responsibility — writes vs reads:

### Write Service

```java
@Service
@RequiredArgsConstructor
public class ClienteService {
    private final ClienteRepository repository;
    private final ClienteMapper mapper;

    @Transactional
    public ClienteDTO crear(ClienteCreateDTO dto) {
        Cliente cliente = Cliente.builder()
            .nombres(dto.getNombres())
            .apellidos(dto.getApellidos())
            .estado(EstadoCliente.PENDIENTE)
            .build();
        cliente = repository.save(cliente);
        return mapper.toDTO(cliente);
    }
}
```

### Read Service

```java
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ClienteQueryService {
    private final ClienteRepository repository;
    private final ClienteMapper mapper;

    public ClienteDTO findByIdAsDTO(Long id) {
        Cliente entity = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente no encontrado"));
        return mapper.toDTO(entity);
    }
}
```

**Key patterns:**

- Write services: `@Transactional` (default: read-write)
- Read services: `@Transactional(readOnly = true)`
- `@RequiredArgsConstructor` for constructor injection via Lombok
- Business logic in services, NOT controllers

## Controller Patterns

```java
@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
public class ClienteController {
    private final ClienteService clienteService;
    private final ClienteQueryService clienteQueryService;

    @GetMapping("/{id}")
    public ResponseEntity<ClienteDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(clienteQueryService.findByIdAsDTO(id));
    }

    @PostMapping
    public ResponseEntity<ClienteDTO> crear(@RequestBody ClienteCreateDTO dto) {
        return ResponseEntity.ok(clienteService.crear(dto));
    }
}
```

## DTO Patterns

```java
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ClienteDTO {
    private Long id;
    private String nombres;
    private String apellidos;
    private String estado;
    // NO entity references
}

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ClienteCreateDTO {
    private String nombres;
    private String apellidos;
    private String numeroIdentificacion;
}
```

## Mapper Layer

```java
@Component
public class ClienteMapper {
    public ClienteDTO toDTO(Cliente entity) {
        return ClienteDTO.builder()
            .id(entity.getId())
            .nombres(entity.getNombres())
            .estado(entity.getEstado() != null ? entity.getEstado().name() : null)
            .build();
    }
}
```

## Document Generation (Thymeleaf + OpenPDF)

```
Controller -> Service -> *PDFGenerator -> DocumentoPDFUtils -> Thymeleaf + OpenPDF
```

```java
@Component
@RequiredArgsConstructor
public class ContratoPDFGenerator {
    private final DocumentoPDFUtils utils;

    public DocumentoGenerado generar(Cliente cliente, Pago pago, Licencia licencia) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("cliente", cliente);
        variables.put("pago", pago);
        String template = determinarTemplate(cliente);
        byte[] pdfBytes = utils.generarPdf(template, variables);
        // Save and return
    }

    private String determinarTemplate(Cliente cliente) {
        // ISSPOL = Policia, ISSFA = FF.AA. — NEVER confuse
        return switch (cliente.getTipoClienteImportacion().getNombre()) {
            case "POLICIA" -> "contratos/uniformados/contrato_compra_policia";
            case "FUERZA_TERRESTRE" -> "contratos/uniformados/contrato_compra_fuerza_terrestre";
            case "FUERZA_NAVAL" -> "contratos/uniformados/contrato_compra_fuerza_naval";
            case "FUERZA_AEREA" -> "contratos/uniformados/contrato_compra_fuerza_aerea";
            default -> "contratos/civiles/contrato_compra";
        };
    }
}
```

## Query Optimization

```java
// BAD: N+1
for (Cliente c : clienteRepository.findAll()) {
    c.getUsuarioCreador().getNombres(); // N queries!
}

// GOOD: @EntityGraph
@EntityGraph(attributePaths = {"usuarioCreador"})
List<Cliente> findAll();

// GOOD: JOIN FETCH
@Query("SELECT c FROM Cliente c JOIN FETCH c.usuarioCreador")
List<Cliente> findAllWithVendedor();

// GOOD: DTO projection
@Query("SELECT new com.armasimportacion.dto.ClienteListDTO(c.id, c.nombres, c.estado) FROM Cliente c")
List<ClienteListDTO> findAllForList();
```

## Database (Flyway + SQL Maestro)

SQL maestro is the single source of truth: `datos/00_gmarm_completo.sql`

```bash
# Recreate from scratch
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up -d --build
```

## Docker Commands

```bash
# Restart after Java/template changes
docker-compose -f docker-compose.local.yml restart backend_local

# Full rebuild
docker-compose -f docker-compose.local.yml down && docker-compose -f docker-compose.local.yml up -d --build

# Compile check
cd backend && mvn clean install -DskipTests

# Logs
docker logs gmarm-backend-local
```

---

These patterns are built for Spring Boot 3.4.5 with Java 17, JPA/Hibernate, PostgreSQL, Thymeleaf + OpenPDF, and Docker Compose.

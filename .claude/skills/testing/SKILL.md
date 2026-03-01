---
name: testing
description: Testing strategy and patterns for Spring Boot + React applications. Use when writing tests, reviewing test code, debugging test failures, deciding what to test, choosing between test types, or doing AI-assisted development that requires test coverage. Covers JUnit 5, Spring Boot Test, MockMvc, Mockito, and React Testing Library.
---

# Testing Strategy - GMARM

This project uses **JUnit 5 + Spring Boot Test** for backend and **Vitest/React Testing Library** for frontend (if configured).

## Core Principles

- **Test business logic, not framework plumbing** — focus on services and custom queries
- **Use the right test type** for the right layer — don't use @SpringBootTest for everything
- **Minimize mocking** — mock only external boundaries and dependencies
- **Test at the lowest level that provides confidence** — avoid redundant coverage

## Test Types & When to Use Them

### Controller Tests (`@WebMvcTest`) — HTTP Layer

Test HTTP routing, request/response serialization, and error handling:

```java
@WebMvcTest(ClienteController.class)
class ClienteControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ClienteService clienteService;

    @MockBean
    private ClienteQueryService clienteQueryService;

    @Test
    void getById_ReturnsCliente() throws Exception {
        ClienteDTO dto = ClienteDTO.builder().id(1L).nombres("Juan").build();
        when(clienteQueryService.findByIdAsDTO(1L)).thenReturn(dto);

        mockMvc.perform(get("/api/clientes/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.nombres").value("Juan"));
    }

    @Test
    void getById_NotFound_Returns404() throws Exception {
        when(clienteQueryService.findByIdAsDTO(999L))
            .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND));

        mockMvc.perform(get("/api/clientes/999"))
            .andExpect(status().isNotFound());
    }
}
```

**When to use:**
- New or modified endpoints
- Validating HTTP status codes and response structure
- Testing request validation

### Service Tests (Unit) — Business Logic

Test business logic with mocked dependencies:

```java
@ExtendWith(MockitoExtension.class)
class ClienteServiceTest {
    @Mock private ClienteRepository repository;
    @Mock private ClienteMapper mapper;
    @InjectMocks private ClienteService service;

    @Test
    void crear_SavesAndReturnsDTO() {
        ClienteCreateDTO dto = new ClienteCreateDTO();
        dto.setNombres("Juan");

        Cliente saved = Cliente.builder().id(1L).nombres("Juan").build();
        ClienteDTO expected = ClienteDTO.builder().id(1L).nombres("Juan").build();

        when(repository.save(any(Cliente.class))).thenReturn(saved);
        when(mapper.toDTO(saved)).thenReturn(expected);

        ClienteDTO result = service.crear(dto);

        assertEquals("Juan", result.getNombres());
        verify(repository).save(any(Cliente.class));
    }

    @Test
    void actualizarEstado_NotFound_Throws() {
        when(repository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class,
            () -> service.actualizarEstado(999L, EstadoCliente.APROBADO));
    }
}
```

**When to use:**
- Complex business logic with branching
- State transitions (PENDIENTE -> APROBADO)
- Validation rules
- Edge cases

### Repository Tests (`@DataJpaTest`) — Custom Queries

Test custom JPA queries against real database:

```java
@DataJpaTest
class ClienteRepositoryTest {
    @Autowired
    private ClienteRepository repository;

    @Test
    void findByEstado_ReturnsMatchingClientes() {
        List<Cliente> result = repository.findByEstado(EstadoCliente.APROBADO);

        assertThat(result).allMatch(c -> c.getEstado() == EstadoCliente.APROBADO);
    }

    @Test
    void findByVendedorId_ReturnsOnlyVendorClients() {
        List<Cliente> result = repository.findByVendedorId(1L);

        assertThat(result).allMatch(c -> c.getUsuarioCreador().getId().equals(1L));
    }
}
```

**When to use:**
- Custom `@Query` methods
- Derived queries with complex conditions
- Verifying `@EntityGraph` loads expected relations

### Integration Tests (`@SpringBootTest`) — Full Flow

Test complete flows with real Spring context:

```java
@SpringBootTest
@AutoConfigureMockMvc
class ClienteIntegrationTest {
    @Autowired private MockMvc mockMvc;

    @Test
    void crearCliente_FullFlow() throws Exception {
        String json = """
            {"nombres": "Juan", "apellidos": "Perez", "numeroIdentificacion": "1234567890"}
            """;

        mockMvc.perform(post("/api/clientes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").exists());
    }
}
```

**When to use:**
- Critical end-to-end flows
- Flows involving multiple services
- Document generation pipeline

## Test Priority by Layer

| Layer | Test Type | Priority |
|---|---|---|
| Controllers | @WebMvcTest + MockMvc | High |
| Services (business logic) | Unit with Mockito | High |
| Repositories (custom queries) | @DataJpaTest | Medium |
| Full flows | @SpringBootTest | Medium |
| Document generators | Unit (verify template vars) | Medium |

## What Must Be Tested

- New endpoints: happy path + error cases
- New service methods: business logic + edge cases
- Custom repository queries: verify correct results
- State transitions: verify enum state machine (PENDIENTE -> APROBADO)
- Document generators: verify template variables are set correctly
- ISSPOL vs ISSFA template selection: verify correct template per client type

## Anti-Patterns to Avoid

| Anti-Pattern | Issue | Fix |
|---|---|---|
| No assertions | Test does nothing | Add meaningful assertions |
| `@SpringBootTest` for everything | Slow, heavy context | Use `@WebMvcTest`/`@DataJpaTest` |
| Testing getters/setters | No value | Test business logic instead |
| Mocking the class under test | Wrong | Mock dependencies only |
| `Thread.sleep()` in tests | Flaky | Use `Awaitility` or synchronous design |
| Hardcoded test data | Fragile | Use builders/factories |

## Mocking Guidelines

| Prefer | Avoid |
|---|---|
| `@MockBean` for service dependencies | Mocking the repository inside service tests |
| `@Mock` + `@InjectMocks` for unit tests | Mocking the class under test |
| Real test database for @DataJpaTest | Mocking JPA repository methods |

**Mock only external boundaries:**
- External APIs
- File system operations
- Time-sensitive operations

## Running Tests

```bash
# All tests
cd backend && mvn test

# Specific test class
cd backend && mvn test -Dtest=ClienteServiceTest

# Specific test method
cd backend && mvn test -Dtest=ClienteServiceTest#crear_SavesAndReturnsDTO

# Skip tests during build
cd backend && mvn clean install -DskipTests
```

## AI-Generated Code Testing

Treat AI-generated code with appropriate skepticism:

- Always validate through tests that exercise real behavior
- Don't assume correctness just because it compiles
- If tests fail, fix the implementation — not the tests

### TDD Workflow for AI Development

**Phase 1: Write tests first (commit before implementation)**
1. Discuss requirements and edge cases
2. Write tests specifying expected behavior
3. Commit the tests

**Phase 2: Implement**
1. Implement feature to make tests pass
2. If tests fail, fix implementation — not tests

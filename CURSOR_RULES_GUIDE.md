# GMARM AI Agent Guide

## Mission

Build customer value rapidly using clean code principles, SOLID design, and Test-Driven Development within the GMARM system for firearm import management.

## What is GMARM?

The **Gestión de Importación de Armas (GMARM)** system manages the complete lifecycle of firearm imports for Ecuador. It connects property management companies, clients (civilians, military, security companies), and regulatory processes through automated workflows.

### Core Business Flow

1. **Administrators** manage system configuration, users, roles, weapons catalog, and licenses

2. **Sales Chiefs** supervise sales processes and approve client applications

3. **Vendors** (FIJO/LIBRE) create client records, assign weapons, and process payments

4. **Clients** (Civilians, Military, Security Companies, Athletes) apply for firearm imports

5. **Finance** manages payments, installments, and financial reconciliation

6. **Operations** handles document management and regulatory compliance

### Key Business Domains

- **Clients**: Civil, Military, Security Companies, Athletes with different requirements
- **Weapons**: Catalog management with stock control and series tracking
- **Licenses**: Import licenses with quotas and status management
- **Payments**: Payment plans, installments, and financial tracking
- **Documents**: Contracts, authorizations, and regulatory documents
- **Configuration**: System parameters (IVA, quotas, business rules)

## Architecture Overview

### Project Structure

```
gmarm/
├── backend/          # Spring Boot API (Java 17+)
│   ├── src/main/java/com/armasimportacion/
│   │   ├── controller/    # HTTP endpoints (@RestController)
│   │   ├── service/       # Business logic (@Service)
│   │   ├── repository/    # Data access (@Repository)
│   │   ├── model/         # Domain entities (@Entity)
│   │   ├── dto/           # Data transfer objects
│   │   ├── mapper/        # Entity ↔ DTO conversion
│   │   └── config/        # Configuration classes
│   └── src/main/resources/
│       ├── application.properties
│       └── application-*.properties (per environment)
│
├── frontend/         # React + TypeScript + Vite
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── services/      # API services
│   │   ├── contexts/      # React contexts (Auth, etc.)
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/          # Utility functions
│   └── env.*              # Environment configs
│
├── datos/            # Database scripts
│   └── 00_gmarm_completo.sql  # Master SQL (single source of truth)
│
└── docker-compose.*.yml  # Docker configurations per environment
```

### Module Anatomy (Backend)

```java
// Controller Layer
@RestController
@RequestMapping("/api/clientes")
public class ClienteController {
    // HTTP endpoints with proper status codes
}

// Service Layer
@Service
@RequiredArgsConstructor
public class ClienteService {
    // Business logic orchestration
    // Use DTOs, not entities
}

// Repository Layer
@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    // Data access (JPA/Hibernate)
}

// Entity Layer
@Entity
@Table(name = "cliente")
public class Cliente {
    // Domain model with JPA annotations
}

// DTO Layer
@Data
@Builder
public class ClienteDTO {
    // Data transfer object (snake_case for JSON)
}
```

## Development Workflow

### 1. Code Standards (ALWAYS)

**Backend (Java):**
- ✅ Classes < 500 lines, <10 public methods
- ✅ Functions < 20 statements
- ✅ Use Java 17+ features (records, pattern matching)
- ✅ DTOs instead of entities in controllers
- ✅ Constructor injection (Lombok @RequiredArgsConstructor)
- ✅ Stream API over loops when appropriate

**Frontend (TypeScript/React):**
- ✅ Components < 500 lines
- ✅ Functions < 20 statements
- ✅ No `any`, use explicit types
- ✅ Functional components with hooks
- ✅ SOLID principles applied
- ✅ KISS (Keep It Simple, Stupid)
- ✅ Maintainable variable names

### 2. Test-First Development (RECOMMENDED)

```bash
# Backend: Write test first
# Create: src/test/java/.../ClienteServiceTest.java

# Frontend: Write test first
# Create: src/__tests__/ClienteForm.test.tsx

# Run tests
cd backend && mvn test
cd frontend && npm test
```

### 3. Quick Commands

```powershell
# Backend
cd backend
mvn clean compile -DskipTests      # Compile without tests
mvn clean install                  # Build with tests
mvn spring-boot:run                # Run locally

# Frontend
cd frontend
npm install                         # Install dependencies
npm run dev                         # Development server
npm run build                       # Production build
npm run lint                        # Lint check

# Docker
docker-compose -f docker-compose.local.yml up -d        # Local
docker-compose -f docker-compose.prod.yml up -d         # Production
docker-compose -f docker-compose.local.yml restart backend_local  # Restart backend
```

## Critical Patterns

### Entity Pattern (JPA)

```java
@Entity
@Table(name = "cliente")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Cliente {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "numero_identificacion", nullable = false, unique = true)
    private String numeroIdentificacion;
    
    @Column(name = "nombres", nullable = false, length = 100)
    private String nombres;
    
    // Relationships
    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL)
    private List<Pago> pagos;
}
```

### Repository Pattern

```java
@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    Optional<Cliente> findByNumeroIdentificacion(String numeroIdentificacion);
    
    @Query("SELECT c FROM Cliente c WHERE c.estado = :estado")
    List<Cliente> findByEstado(@Param("estado") Boolean estado);
}
```

### Service Pattern

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class ClienteService {
    private final ClienteRepository clienteRepository;
    private final ClienteMapper clienteMapper;
    
    @Transactional
    public ClienteDTO create(ClienteCreateDTO dto) {
        // Validation
        validateClienteForCreate(dto);
        
        // Business logic
        Cliente cliente = clienteMapper.toEntity(dto);
        Cliente saved = clienteRepository.save(cliente);
        
        // Logging
        log.info("✅ Cliente creado: ID={}, nombres={}", saved.getId(), saved.getNombres());
        
        return clienteMapper.toDTO(saved);
    }
}
```

### Controller Pattern

```java
@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
public class ClienteController {
    private final ClienteService clienteService;
    
    @PostMapping
    public ResponseEntity<ClienteDTO> create(@Valid @RequestBody ClienteCreateDTO dto) {
        ClienteDTO created = clienteService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ClienteDTO> getById(@PathVariable Long id) {
        return clienteService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}
```

### React Component Pattern

```typescript
interface ClienteFormProps {
  mode: 'create' | 'edit' | 'view';
  cliente?: Cliente | null;
  onSave: (cliente: Cliente) => void;
}

const ClienteForm: React.FC<ClienteFormProps> = ({ mode, cliente, onSave }) => {
  // State (descriptive names)
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ClienteFormData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Custom hooks
  const { data: tiposCliente } = useQuery('tipos-cliente', apiService.getTiposCliente);
  
  // Event handlers (handle prefix)
  const handleInputChange = (field: keyof ClienteFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error guardando cliente:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render (< 500 lines, split if needed)
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};
```

## Testing Philosophy

### Backend (Java)
- **Integration Tests**: Test complete request flows with @SpringBootTest
- **Unit Tests**: Test service logic with mocked repositories
- **Target**: ≥80% coverage on critical paths
- **Tools**: JUnit 5 + Mockito

### Frontend (TypeScript)
- **Component Tests**: Test user interactions with React Testing Library
- **Integration Tests**: Test complete user flows
- **API Mocking**: Use MSW (Mock Service Worker)
- **Target**: ≥70% coverage on critical components
- **Tools**: Vitest + React Testing Library

## Anti-Patterns (AVOID)

### ❌ Direct Entity Exposure

```java
// WRONG: Return entity directly
@GetMapping("/{id}")
public Cliente getById(@PathVariable Long id) {
    return clienteRepository.findById(id).orElseThrow();
}

// RIGHT: Use DTO
@GetMapping("/{id}")
public ResponseEntity<ClienteDTO> getById(@PathVariable Long id) {
    return clienteService.findById(id)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
}
```

### ❌ Missing Validation

```java
// WRONG: No validation
@PostMapping
public ResponseEntity<?> create(@RequestBody ClienteDTO dto) {
    // ...
}

// RIGHT: Validate with @Valid
@PostMapping
public ResponseEntity<?> create(@Valid @RequestBody ClienteCreateDTO dto) {
    // ...
}
```

### ❌ Hardcoded Business Values

```java
// WRONG: Hardcoded IVA
double iva = 0.15; // 15%

// RIGHT: From configuracion_sistema
double iva = configuracionService.getIVA();
```

### ❌ Large Components

```typescript
// WRONG: 800+ line component
const ClienteForm = () => {
  // 800 lines of code
};

// RIGHT: Split into smaller components
const ClienteForm = () => {
  return (
    <>
      <ClienteBasicInfo />
      <ClientePaymentInfo />
      <ClienteWeaponSelection />
    </>
  );
};
```

### ❌ Missing Error Handling

```typescript
// WRONG: No error handling
const handleSave = async () => {
  await apiService.createCliente(data);
};

// RIGHT: Proper error handling
const handleSave = async () => {
  try {
    setIsLoading(true);
    await apiService.createCliente(data);
    toast.success('Cliente creado exitosamente');
  } catch (error) {
    console.error('Error:', error);
    toast.error('Error al crear cliente');
  } finally {
    setIsLoading(false);
  }
};
```

## File Creation Rules

### New Backend Feature

```bash
backend/src/main/java/com/armasimportacion/
├── controller/
│   └── {{Entity}}Controller.java
├── service/
│   └── {{Entity}}Service.java
├── repository/
│   └── {{Entity}}Repository.java
├── model/
│   └── {{Entity}}.java
├── dto/
│   ├── {{Entity}}DTO.java
│   ├── {{Entity}}CreateDTO.java
│   └── {{Entity}}UpdateDTO.java
└── mapper/
    └── {{Entity}}Mapper.java
```

### New Frontend Feature

```bash
frontend/src/
├── pages/
│   └── {{Feature}}/
│       └── {{Feature}}.tsx
├── components/
│   └── {{Feature}}/
│       ├── {{Component}}.tsx
│       └── {{Component}}.test.tsx
└── services/
    └── {{feature}}Api.ts
```

## Business Priorities

### Core Domain Focus

1. **Clients**: Multi-type client management (Civil, Military, Security, Athlete)
2. **Weapons**: Catalog and stock management with series tracking
3. **Licenses**: Import license lifecycle and quota management
4. **Payments**: Payment plans and installment tracking
5. **Documents**: Contract generation and regulatory compliance

### Value Delivery Metrics

- Feature completion with tests
- Code follows SOLID principles
- Components < 500 lines, functions < 20 statements
- Zero hardcoded business values
- All changes tested before push

## Quick Action Templates

### Create New Backend Feature

```bash
# 1. Create branch
git checkout -b feature/{{feature-name}}

# 2. Create entity, repository, service, controller, DTO, mapper
# Follow naming: *Entity.java, *Repository.java, *Service.java, etc.

# 3. Update SQL maestro if schema changes
# Edit: datos/00_gmarm_completo.sql

# 4. Compile and test
cd backend
mvn clean compile -DskipTests
mvn test

# 5. Restart Docker (CRITICAL after backend changes)
cd ..
docker-compose -f docker-compose.local.yml restart backend_local

# 6. Commit
git add .
git commit -m "feat({{module}}): {{description}}"
```

### Create New Frontend Feature

```bash
# 1. Create component (< 500 lines)
# Create: frontend/src/pages/{{Feature}}/{{Feature}}.tsx

# 2. Create API service
# Create: frontend/src/services/{{feature}}Api.ts

# 3. Build and test
cd frontend
npm run build
npm test

# 4. Commit
git add .
git commit -m "feat(frontend): {{description}}"
```

### Database Schema Change

```bash
# 1. Update SQL maestro (ONLY source of truth)
# Edit: datos/00_gmarm_completo.sql

# 2. Recreate database volume
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up -d

# 3. Verify data loaded
docker exec gmarm-postgres-local psql -U postgres -d gmarm_local -c "SELECT COUNT(*) FROM {{table}};"
```

## Technology Stack

### Core
- **Spring Boot 3.4.5**: Backend framework
- **Java 17+**: Language with modern features
- **PostgreSQL 15**: Primary database
- **JPA/Hibernate**: ORM for data access
- **React 18**: Frontend framework
- **TypeScript**: Type safety
- **Vite**: Build tool

### Testing
- **JUnit 5**: Backend test runner
- **Mockito**: Backend mocking
- **Vitest**: Frontend test runner
- **React Testing Library**: Component testing
- **MSW**: API mocking

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **GitHub Actions**: CI/CD pipelines
- **Spring Boot Actuator**: Health checks and metrics

## Success Checklist

Before submitting any code:

- [ ] Code compiles without errors (`mvn clean compile`, `npm run build`)
- [ ] Components/classes < 500 lines
- [ ] Functions < 20 statements
- [ ] No hardcoded values (use `configuracion_sistema`)
- [ ] DTOs used instead of entities in controllers
- [ ] Proper validation with @Valid
- [ ] Error handling implemented
- [ ] Security considerations addressed
- [ ] Tests written (if applicable)
- [ ] SQL maestro updated if schema changed
- [ ] Docker restarted after backend changes
- [ ] Follows naming conventions
- [ ] No sensitive data in code/logs
- [ ] SOLID principles applied
- [ ] KISS principle followed
- [ ] Variables are maintainable

## Remember

**Customer value > Perfect code**. Ship working features with clean code, iterate based on feedback. The architecture supports rapid changes - use it.

**Always follow the rules in `.cursor/rules/global.mdc`** - they are automatically applied by Cursor to maintain consistency.

**Refer to `AGENTS.md`** for project-specific conventions and detailed guidelines.

---

**Last Updated**: 2025-11-13  
**Version**: 2.0  
**Related**: `.cursor/rules/global.mdc`, `AGENTS.md`

# 🧪 GUÍA DE PRUEBAS UNITARIAS

## 🎯 OBJETIVO

Este documento proporciona una guía completa para implementar y ejecutar pruebas unitarias en el Sistema de Importación de Armas.

---

## 📋 CREDENCIALES DE DESARROLLO

### **🔑 Usuario Administrador**
- **Email:** `admin@armasimportacion.com`
- **Password:** `admin123`
- **Rol:** ADMIN

### **👥 Usuarios de Prueba**
- **Vendedor:** `vendedor@test.com` / `admin123`
- **Jefe Ventas:** `jefe@test.com` / `admin123`
- **Finanzas:** `finanzas@test.com` / `admin123`
- **Operaciones:** `operaciones@test.com` / `admin123`

---

## 🚀 CONFIGURACIÓN INICIAL

### **1. Ejecutar Script de Configuración**

#### **Windows:**
```bash
setup-dev.bat
```

#### **Linux/Mac:**
```bash
./setup-dev.sh
```

### **2. Iniciar Servicios**

#### **Backend:**
```bash
cd backend
mvnw.cmd spring-boot:run -Dspring.profiles.active=dev
```

#### **Frontend:**
```bash
cd frontend
npm run dev
```

---

## 🧪 PRUEBAS UNITARIAS - BACKEND

### **Estructura de Pruebas**

```
backend/src/test/
├── java/com/armasimportacion/
│   ├── ArmasimportacionApplicationTests.java
│   ├── service/
│   │   ├── UsuarioServiceTest.java
│   │   ├── ClienteServiceTest.java
│   │   └── AuthServiceTest.java
│   ├── controller/
│   │   ├── UsuarioControllerTest.java
│   │   └── ClienteControllerTest.java
│   └── repository/
│       ├── UsuarioRepositoryTest.java
│       └── ClienteRepositoryTest.java
└── resources/
    └── application-test.properties
```

### **Ejecutar Pruebas**

#### **Todas las Pruebas:**
```bash
cd backend
mvnw.cmd test
```

#### **Pruebas Específicas:**
```bash
# Pruebas de servicio
mvnw.cmd test -Dtest=UsuarioServiceTest

# Pruebas de controlador
mvnw.cmd test -Dtest=UsuarioControllerTest

# Pruebas con cobertura
mvnw.cmd test jacoco:report
```

### **Ejemplos de Pruebas**

#### **1. Prueba de Servicio (UsuarioServiceTest.java)**
```java
@Test
void testFindById() {
    // Arrange
    when(usuarioRepository.findById(1L)).thenReturn(Optional.of(testUsuario));

    // Act
    Usuario result = usuarioService.findById(1L);

    // Assert
    assertNotNull(result);
    assertEquals(testUsuario.getUsername(), result.getUsername());
}
```

#### **2. Prueba de Controlador (UsuarioControllerTest.java)**
```java
@Test
void testGetAllUsers() throws Exception {
    // Arrange
    List<Usuario> usuarios = Arrays.asList(testUsuario);
    when(usuarioService.findAll()).thenReturn(usuarios);

    // Act & Assert
    mockMvc.perform(get("/api/usuarios"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$[0].username").value("testuser"));
}
```

#### **3. Prueba de Repositorio (UsuarioRepositoryTest.java)**
```java
@Test
void testFindByUsername() {
    // Arrange
    Usuario usuario = new Usuario();
    usuario.setUsername("testuser");
    usuarioRepository.save(usuario);

    // Act
    Optional<Usuario> result = usuarioRepository.findByUsername("testuser");

    // Assert
    assertTrue(result.isPresent());
    assertEquals("testuser", result.get().getUsername());
}
```

---

## 🧪 PRUEBAS UNITARIAS - FRONTEND

### **Estructura de Pruebas**

```
frontend/src/
├── __tests__/
│   ├── components/
│   │   ├── Login.test.tsx
│   │   └── Dashboard.test.tsx
│   ├── pages/
│   │   ├── Vendedor.test.tsx
│   │   └── Usuario.test.tsx
│   └── services/
│       └── api.test.ts
├── setupTests.ts
└── jest.config.js
```

### **Configuración de Jest**

#### **jest.config.js**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
};
```

### **Ejecutar Pruebas**

#### **Todas las Pruebas:**
```bash
cd frontend
npm test
```

#### **Pruebas con Cobertura:**
```bash
npm test -- --coverage
```

#### **Pruebas en Modo Watch:**
```bash
npm test -- --watch
```

### **Ejemplos de Pruebas**

#### **1. Prueba de Componente (Login.test.tsx)**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login/Login';

test('renders login form', () => {
  render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
  
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
});

test('handles form submission', async () => {
  const mockLogin = jest.fn();
  
  render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
  
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'admin@armasimportacion.com' },
  });
  
  fireEvent.change(screen.getByLabelText(/contraseña/i), {
    target: { value: 'admin123' },
  });
  
  fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));
  
  // Verificar que se llamó la función de login
  expect(mockLogin).toHaveBeenCalledWith({
    email: 'admin@armasimportacion.com',
    password: 'admin123',
  });
});
```

#### **2. Prueba de Servicio (api.test.ts)**
```typescript
import apiService from '../services/api';

// Mock fetch
global.fetch = jest.fn();

test('login success', async () => {
  const mockResponse = {
    token: 'test-token',
    user: { id: 1, username: 'admin' }
  };
  
  (fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => mockResponse,
  });
  
  const result = await apiService.login({
    email: 'admin@armasimportacion.com',
    password: 'admin123'
  });
  
  expect(result.token).toBe('test-token');
  expect(result.user.username).toBe('admin');
});
```

---

## 🧪 PRUEBAS DE INTEGRACIÓN

### **Backend - Pruebas de Integración**

#### **1. Prueba de Flujo Completo**
```java
@SpringBootTest
@AutoConfigureTestDatabase
class ClienteIntegrationTest {
    
    @Autowired
    private ClienteService clienteService;
    
    @Autowired
    private UsuarioService usuarioService;
    
    @Test
    void testCreateClienteWithVendedor() {
        // Crear vendedor
        Usuario vendedor = createTestVendedor();
        
        // Crear cliente
        Cliente cliente = createTestCliente();
        cliente.setUsuarioCreador(vendedor);
        
        // Guardar cliente
        Cliente savedCliente = clienteService.save(cliente);
        
        // Verificar
        assertNotNull(savedCliente.getId());
        assertEquals(vendedor.getId(), savedCliente.getUsuarioCreador().getId());
    }
}
```

#### **2. Prueba de API Endpoints**
```java
@SpringBootTest
@AutoConfigureTestDatabase
class ClienteControllerIntegrationTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Test
    void testGetClientesEndpoint() {
        ResponseEntity<List<Cliente>> response = restTemplate.exchange(
            "/api/clientes",
            HttpMethod.GET,
            null,
            new ParameterizedTypeReference<List<Cliente>>() {}
        );
        
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }
}
```

### **Frontend - Pruebas de Integración**

#### **1. Prueba de Flujo de Login**
```typescript
test('complete login flow', async () => {
  render(
    <AuthProvider>
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    </AuthProvider>
  );
  
  // Llenar formulario
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'admin@armasimportacion.com' },
  });
  
  fireEvent.change(screen.getByLabelText(/contraseña/i), {
    target: { value: 'admin123' },
  });
  
  // Enviar formulario
  fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));
  
  // Verificar redirección
  await waitFor(() => {
    expect(window.location.pathname).toBe('/dashboard');
  });
});
```

---

## 📊 CUBRIMIENTO DE PRUEBAS

### **Backend - Cobertura**

#### **Configurar JaCoCo**
```xml
<!-- pom.xml -->
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.7</version>
    <executions>
        <execution>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals>
                <goal>report</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

#### **Generar Reporte**
```bash
mvnw.cmd test jacoco:report
```

### **Frontend - Cobertura**

#### **Configurar Jest Coverage**
```json
// package.json
{
  "jest": {
    "collectCoverageFrom": [
      "src/**/*.{ts,tsx}",
      "!src/**/*.d.ts",
      "!src/index.tsx",
      "!src/main.tsx"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

#### **Generar Reporte**
```bash
npm test -- --coverage --watchAll=false
```

---

## 🚀 PRUEBAS AUTOMATIZADAS

### **GitHub Actions**

#### **.github/workflows/test.yml**
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up JDK 17
        uses: actions/setup-java@v2
        with:
          java-version: '17'
      - name: Run Backend Tests
        run: |
          cd backend
          ./mvnw test
      - name: Upload coverage reports
        uses: codecov/codecov-action@v1

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      - name: Run Frontend Tests
        run: |
          cd frontend
          npm test -- --coverage --watchAll=false
```

---

## 📋 CHECKLIST DE PRUEBAS

### **✅ Pruebas Unitarias Backend**
- [ ] Servicios (UsuarioService, ClienteService, etc.)
- [ ] Controladores (UsuarioController, ClienteController, etc.)
- [ ] Repositorios (UsuarioRepository, ClienteRepository, etc.)
- [ ] Utilidades y helpers
- [ ] Validaciones y excepciones

### **✅ Pruebas Unitarias Frontend**
- [ ] Componentes React
- [ ] Hooks personalizados
- [ ] Servicios de API
- [ ] Utilidades y helpers
- [ ] Contextos (AuthContext, etc.)

### **✅ Pruebas de Integración**
- [ ] Flujos completos de usuario
- [ ] Endpoints de API
- [ ] Integración frontend-backend
- [ ] Base de datos

### **✅ Pruebas E2E**
- [ ] Flujo de login/logout
- [ ] Creación de clientes
- [ ] Gestión de usuarios
- [ ] Navegación entre módulos

---

## 🎯 METRICAS DE CALIDAD

### **Cobertura Mínima**
- **Backend:** 80%
- **Frontend:** 80%
- **Integración:** 70%

### **Tiempo de Ejecución**
- **Pruebas Unitarias:** < 30 segundos
- **Pruebas de Integración:** < 2 minutos
- **Pruebas E2E:** < 5 minutos

---

## 🚀 COMANDOS RÁPIDOS

### **Ejecutar Todas las Pruebas**
```bash
# Backend
cd backend && mvnw.cmd test

# Frontend
cd frontend && npm test

# Ambos
./run-all-tests.sh
```

### **Generar Reportes**
```bash
# Backend
mvnw.cmd test jacoco:report

# Frontend
npm test -- --coverage --watchAll=false
```

### **Pruebas en Modo Watch**
```bash
# Backend
mvnw.cmd test -Dspring.profiles.active=test

# Frontend
npm test -- --watch
```

---

## 📞 SOPORTE

Si encuentras problemas con las pruebas:

1. **Verificar configuración:** Revisar archivos de configuración
2. **Logs de error:** Revisar output detallado de las pruebas
3. **Dependencias:** Verificar que todas las dependencias estén instaladas
4. **Base de datos:** Verificar configuración de base de datos de prueba

---

**¡Sistema de pruebas completo y listo para desarrollo!** 🎉 
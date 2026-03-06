# AGENTS.md - Guías para Agentes de IA

## 🚨 REGLA CRÍTICA - SIEMPRE RECORDAR

**⚠️ CAMBIOS EN JAVA O TEMPLATES = REINICIAR SERVICIOS ⚠️**

**NUNCA OLVIDAR**: Después de modificar cualquier:
- **Clase Java** (`.java`) → `docker-compose -f docker-compose.local.yml restart backend_local`
- **Template** (`.html`, `.ftl`, `.vm`) → `docker-compose -f docker-compose.local.yml restart backend_local`
- **Configuración** (`.properties`, `.yml`) → `docker-compose -f docker-compose.local.yml restart backend_local`

**Los cambios NO se reflejan automáticamente en contenedores Docker. SIEMPRE reiniciar.**

---

## 🎯 Propósito
Este archivo contiene las mejores prácticas y convenciones específicas del proyecto GMARM para agentes de IA que trabajen en este codebase.

## 📋 Relación con Reglas Globales

**IMPORTANTE**: Este documento complementa las **reglas globales** en `.cursor/rules/global.mdc`.

- **`.cursor/rules/global.mdc`**: Reglas automáticas aplicadas por el editor (código, SOLID, KISS, etc.)
- **`AGENTS.md`**: Convenciones específicas del proyecto GMARM (configuración, workflows, Docker, etc.)
- **`CLAUDE.md`**: Guía principal para IAs trabajando en el proyecto

**Estos documentos trabajan juntos** - las reglas globales definen estándares de código, este documento define cómo aplicarlos en GMARM.

## 🏗️ Arquitectura del Proyecto

### Estructura Principal
```
gmarm/
├── backend/          # Spring Boot API (Java 21)
├── frontend/         # React 19 + TypeScript + Vite 7
├── datos/           # Base de datos (SQL maestro)
├── scripts/         # Scripts operativos (backup, reset, validación)
└── docker-compose.*.yml  # local, prod, monitoring
```

### Tecnologías
- **Backend**: Spring Boot 3.4.5, Java 21, Maven, PostgreSQL
- **Frontend**: React 19, TypeScript, Vite 7, Tailwind CSS
- **Base de Datos**: PostgreSQL con script maestro
- **Contenedores**: Docker + Docker Compose
- **CI/CD**: GitHub Actions con workflows automatizados

## 🛠️ Herramientas Disponibles (MCP - Model Context Protocol)

### GitHub MCP Server

**Acceso a GitHub Actions en tiempo real:**

```typescript
// Ver workflows en ejecución
github.list_workflows()

// Ver runs de un workflow específico
github.get_workflow_runs("deploy.yml")

// Ver logs de un run
github.get_workflow_run_logs(run_id)

// Ver status de un job
github.get_workflow_job(job_id)
```

**Cuándo usar:**
- ✅ Verificar estado de deploys automáticos
- ✅ Ver logs de CI/CD en tiempo real
- ✅ Diagnosticar errores de build
- ✅ Monitorear progreso de workflows

**Ejemplo de uso:**
```typescript
// Verificar si el deploy a producción está corriendo
const runs = await github.get_workflow_runs("deploy.yml");
const latestRun = runs.workflow_runs[0];
console.log(`Estado: ${latestRun.status}`);
console.log(`Conclusión: ${latestRun.conclusion}`);

// Ver logs si falló
if (latestRun.conclusion === 'failure') {
  const logs = await github.get_workflow_run_logs(latestRun.id);
  console.log(logs);
}
```

**Beneficios:**
- 🚀 No necesitar ir a GitHub UI
- 📊 Ver logs directamente en el chat
- ⚡ Respuesta más rápida a errores
- 🔍 Mejor diagnóstico de problemas

## 📋 Principios de Desarrollo

### 0.0 📐 **ESTÁNDARES DE CÓDIGO (Ver `.cursor/rules/global.mdc`)**

**IMPORTANTE**: Las siguientes reglas se aplican automáticamente por Cursor. Ver detalles completos en `.cursor/rules/global.mdc`.

#### **Límites de Código (OBLIGATORIO)**
- ✅ **Componentes React**: Máximo 500 líneas
- ✅ **Funciones**: Máximo 20 statements
- ✅ **Clases Java**: Máximo 500 líneas, <10 métodos públicos
- ✅ **Dividir** cuando se excedan estos límites

#### **Principios SOLID (OBLIGATORIO)**
- ✅ **Single Responsibility**: Un componente/clase, un propósito
- ✅ **Open/Closed**: Extender con composición, no modificar existente
- ✅ **Liskov Substitution**: Componentes intercambiables
- ✅ **Interface Segregation**: Interfaces específicas, no genéricas
- ✅ **Dependency Inversion**: Depender de abstracciones

#### **KISS (Keep It Simple, Stupid)**
- ✅ Soluciones simples sobre abstracciones complejas
- ✅ Evitar sobre-ingeniería
- ✅ Código comprensible para desarrolladores junior

#### **Variables Mantenibles**
- ✅ Nombres descriptivos y autodocumentados
- ✅ Prefijos: `is`/`has`/`can` (booleanos), `handle` (eventos), `on` (callbacks)
- ✅ Agrupar variables relacionadas
- ✅ Preferir `const` sobre `let`, evitar `var`

**Para más detalles**: Ver `.cursor/rules/global.mdc` y `CURSOR_RULES_GUIDE.md`

---

### 0. 🔒 **SEGURIDAD PRIMERO** 🔒

**REGLA DE ORO:** La seguridad NO es opcional. SIEMPRE implementar desde el inicio.

**✅ OBLIGATORIO en TODO desarrollo:**

#### 1. **Límites de Recursos en Docker**
```yaml
# ✅ SIEMPRE incluir en docker-compose
services:
  postgres:
    mem_limit: 2g              # OBLIGATORIO
    mem_reservation: 512m      # OBLIGATORIO
    cpus: 1.0                  # OBLIGATORIO
    restart: unless-stopped    # OBLIGATORIO (NO always en producción)
    
  backend:
    mem_limit: 512m
    mem_reservation: 128m
    cpus: 0.5
    read_only: true           # ✅ Filesystem read-only cuando sea posible
    user: "1000:1000"         # ✅ NO ejecutar como root
    
  frontend:
    mem_limit: 512m
    mem_reservation: 128m
    cpus: 0.5
```

#### 2. **Validación de Entrada (Backend)**
```java
// ✅ SIEMPRE validar TODO input del usuario
@PostMapping("/cliente")
public ResponseEntity<?> createCliente(@Valid @RequestBody ClienteDTO dto) {
    
    // ✅ Sanitizar strings
    String nombreLimpio = StringUtils.stripToEmpty(dto.getNombres())
        .replaceAll("[^a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]", "");
    
    // ✅ Validar longitud
    if (nombreLimpio.length() < 2 || nombreLimpio.length() > 100) {
        throw new ValidationException("Nombre inválido");
    }
    
    // ✅ Validar formato de cédula/RUC
    if (!validarCedula(dto.getNumeroIdentificacion())) {
        throw new ValidationException("Cédula inválida");
    }
    
    // ✅ Prevenir SQL Injection (usar JPA/JPQL, NO queries raw)
    // ❌ NUNCA: "SELECT * FROM usuario WHERE email = '" + email + "'"
    // ✅ SIEMPRE: repository.findByEmail(email)
}
```

#### 3. **Rate Limiting y Protección DDoS**
```java
// ✅ SIEMPRE implementar rate limiting
@Configuration
public class SecurityConfig {
    
    @Bean
    public RateLimiter rateLimiter() {
        return RateLimiter.create(100); // 100 requests por segundo
    }
}

// ✅ En endpoints públicos
@PostMapping("/login")
@RateLimited(maxRequests = 5, per = "1m") // 5 intentos por minuto
public ResponseEntity<?> login(@RequestBody LoginRequest request) {
    // ...
}
```

#### 4. **Secrets y Variables de Entorno**
```yaml
# ❌ NUNCA hardcodear en código
DATABASE_PASSWORD=postgres123

# ✅ SIEMPRE usar variables de entorno
environment:
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}  # Desde .env
  JWT_SECRET: ${JWT_SECRET}                # Desde .env
  
# ✅ .env NO debe estar en git (agregar a .gitignore)
```

#### 5. **Headers de Seguridad HTTP**
```java
// ✅ SIEMPRE configurar security headers
@Configuration
public class SecurityHeadersConfig {
    
    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return (web) -> web.httpBasic()
            .headers()
                .contentSecurityPolicy("default-src 'self'")
                .and()
                .xssProtection()
                .and()
                .frameOptions().deny()
                .and()
                .httpStrictTransportSecurity()
                    .maxAgeInSeconds(31536000)
                    .includeSubDomains(true);
    }
}
```

#### 6. **Logging y Auditoría**
```java
// ✅ SIEMPRE loggear acciones críticas
@Service
public class ClienteService {
    
    @Autowired
    private AuditLogger auditLogger;
    
    public Cliente create(ClienteDTO dto, Long usuarioId) {
        // ✅ Log con contexto
        log.info("👤 Usuario {} creando cliente con cédula {}", 
            usuarioId, 
            maskCedula(dto.getNumeroIdentificacion())
        );
        
        Cliente cliente = save(dto);
        
        // ✅ Auditoría de acción crítica
        auditLogger.log(
            AuditAction.CLIENTE_CREATED,
            usuarioId,
            cliente.getId(),
            "Cliente creado exitosamente"
        );
        
        return cliente;
    }
    
    // ✅ Enmascarar datos sensibles en logs
    private String maskCedula(String cedula) {
        return cedula.substring(0, 4) + "******";
    }
}
```

#### 7. **Dependencias Actualizadas**
```bash
# ✅ SIEMPRE mantener dependencias actualizadas
# Backend
mvn versions:display-dependency-updates

# Frontend
npm audit
npm audit fix

# ✅ NUNCA usar dependencias con vulnerabilidades críticas
```

#### 8. **CORS Restrictivo**
```java
// ❌ NUNCA permitir todos los orígenes en producción
@CrossOrigin(origins = "*") // ❌ MAL

// ✅ SIEMPRE especificar orígenes permitidos
@CrossOrigin(origins = {
    "https://produccion.com",
    "https://www.produccion.com"
})

// ✅ O mejor, configuración centralizada
@Configuration
public class CorsConfig {
    @Value("${cors.allowed.origins}")
    private String[] allowedOrigins;
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.asList(allowedOrigins));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE"));
        config.setAllowCredentials(true);
        return source;
    }
}
```

#### 9. **Contraseñas Seguras**
```java
// ✅ SIEMPRE usar bcrypt/argon2 para passwords
@Service
public class AuthService {
    
    @Autowired
    private PasswordEncoder passwordEncoder; // BCrypt
    
    public Usuario register(RegisterDTO dto) {
        // ✅ Hash del password
        String hashedPassword = passwordEncoder.encode(dto.getPassword());
        
        // ✅ Validar fuerza del password
        if (!isPasswordStrong(dto.getPassword())) {
            throw new WeakPasswordException();
        }
        
        usuario.setPassword(hashedPassword);
        return repository.save(usuario);
    }
    
    private boolean isPasswordStrong(String password) {
        // Mínimo 8 caracteres, 1 mayúscula, 1 número, 1 especial
        return password.length() >= 8 
            && password.matches(".*[A-Z].*")
            && password.matches(".*[0-9].*")
            && password.matches(".*[!@#$%^&*].*");
    }
}
```

#### 10. **Monitoreo y Alertas**
```yaml
# ✅ SIEMPRE configurar healthchecks
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s

# ✅ Logging estructurado
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

---

### 0.1. ⚠️ **NUNCA PUSHEAR SIN PROBAR** ⚠️

**REGLA DE ORO:** El código SIEMPRE se debe probar antes de hacer push a cualquier rama.

**Workflow correcto:**
1. ✅ Crear/modificar código
2. ✅ Hacer commit LOCAL (sin push)
3. ✅ **ESPERAR A QUE EL USUARIO PRUEBE**
4. ✅ Si funciona → el usuario aprueba el push
5. ✅ Si falla → corregir y volver al paso 2

**❌ NUNCA hacer esto:**
```bash
git add .
git commit -m "feat: nueva funcionalidad"
git push origin dev  # ← ❌ SIN PROBAR!
```

**✅ SIEMPRE hacer esto:**
```bash
git add .
git commit -m "feat: nueva funcionalidad"
# STOP! Esperar a que el usuario pruebe
# Usuario: "Funciona, puedes hacer push"
git push origin dev  # ← ✅ DESPUÉS DE PROBAR
```

**📦 ANTES DE HACER PUSH A DEV:**
**SIEMPRE** verificar que el código compile y construya correctamente:

```powershell
# Windows (PowerShell)
# 1. Backend: Limpiar y compilar
cd backend
mvn clean install -DskipTests

# 2. Frontend: Construir
cd ../frontend
npm run build

# 3. Si ambos pasan, entonces hacer push
cd ..
git push origin dev
```

```bash
# Linux/Mac (Bash)
# 1. Backend: Limpiar y compilar
cd backend
mvn clean install -DskipTests

# 2. Frontend: Construir
cd ../frontend
npm run build

# 3. Si ambos pasan, entonces hacer push
cd ..
git push origin dev
```

**Nota:** Si `mvn` no está instalado globalmente, usar `./mvnw` (wrapper de Maven incluido en el proyecto).

**🚨 Si alguno falla:**
- ❌ NO hacer push
- ✅ Corregir los errores
- ✅ Volver a probar
- ✅ Push solo cuando ambos pasen

**🔴 ERRORES COMUNES DE COMPILACIÓN:**

1. **Frontend - Error TypeScript**: `error TS2304: Cannot find name 'X'`
   - **Causa**: Falta importación, typo en nombre de variable, uso de API incorrecta
   - **Ejemplo**: `Cannot find name 'api'` → Usar `apiService` en lugar de `api`
   - **Solución**: Verificar imports, nombres de variables, y métodos disponibles

2. **Frontend - Error TypeScript**: `error TS2339: Property 'X' does not exist on type 'Y'`
   - **Causa**: Método/propiedad no existe en la clase/interfaz
   - **Ejemplo**: `Property 'get' does not exist on type 'ApiService'` → `ApiService` no tiene método público `get`, usar `request()` o crear método específico
   - **Solución**: Verificar la definición de la clase, agregar método si es necesario

3. **Backend - Compilación Maven falla**
   - **Solución alternativa**: Si `mvn` no funciona localmente (problemas de ruta), usar Docker:
   ```powershell
   docker-compose -f docker-compose.local.yml build backend_local --no-cache
   ```
   - ✅ Si la imagen se construye exitosamente, el código compila correctamente

**⚠️ NUNCA hacer push si el build falla. Los errores de compilación rompen el pipeline CI/CD y el trabajo de otros desarrolladores.**

**Excepciones (aún así, preguntar):**
- Correcciones de documentación (.md)
- Fixes de SQL maestro ya validados
- Cambios triviales de configuración

**Si el usuario dice "hay que probar":**
- ❌ NO hacer push automáticamente
- ✅ Dejar el código commiteado localmente
- ✅ Esperar feedback del usuario
- ✅ Hacer push solo cuando se apruebe

### 1. Clean Code
- **Máximo 500 líneas por clase/archivo**
- **Nombres descriptivos y fáciles de escribir/leer**
- **Funciones pequeñas y con una sola responsabilidad**
- **Comentarios solo cuando sea necesario explicar el "por qué", no el "qué"**

### 2. Estructura de Clases Java
```java
// ✅ BUENO
public class ClienteService {
    // Campos privados primero
    private final ClienteRepository clienteRepository;
    
    // Constructor
    public ClienteService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }
    
    // Métodos públicos
    // Métodos privados al final
}

// ❌ MALO
public class ClienteService { /* 800+ líneas */ }
```

### 3. Imports en Java
```java
// ✅ BUENO - Imports específicos
import com.armasimportacion.model.Cliente;
import com.armasimportacion.dto.ClienteDTO;
import org.springframework.stereotype.Service;

// ❌ MALO - Wildcard imports
import com.armasimportacion.model.*;
import org.springframework.*;
```

### 4. Manejo de PowerShell
```powershell
# ✅ BUENO - Comandos separados
cd backend
./mvnw clean compile

# ✅ BUENO - Usando ; para separar comandos
cd backend; ./mvnw clean compile

# ❌ MALO - && no funciona en PowerShell
cd backend && ./mvnw clean compile
```

### 5. Base de Datos
- **SIEMPRE actualizar `datos/00_gmarm_completo.sql`**
- **NO crear scripts de migración adicionales**
- **El SQL maestro es la fuente única de verdad**
- **Usar comentarios descriptivos en las columnas**

```sql
-- ✅ BUENO
CREATE TABLE IF NOT EXISTS cliente (
    id BIGSERIAL PRIMARY KEY,
    numero_identificacion VARCHAR(20) NOT NULL UNIQUE,
    -- Información militar (solo para uniformados)
    codigo_issfa VARCHAR(50) DEFAULT NULL
);
```

## 🔄 Flujo de Trabajo con Docker

### 1. ⚠️ CONFIGURACIÓN CRÍTICA POR AMBIENTE ⚠️

**🚨 REGLA DE ORO**: Cada archivo `docker-compose.*.yml` tiene su propio conjunto de configuraciones que DEBEN coincidir:

#### **📂 Archivos de Configuración por Ambiente:**

| Ambiente | Docker Compose | Env Backend | Env Frontend | URLs |
|----------|---------------|-------------|--------------|------|
| **LOCAL** | `docker-compose.local.yml` | `application-local.properties` | `env.local` | `localhost` |
| **PROD** | `docker-compose.prod.yml` | `application-prod.properties` | `env.prod` | Produccion |

#### **🎯 Coherencia Entre Archivos:**

**TODOS los archivos de configuración de un mismo ambiente DEBEN apuntar a las MISMAS URLs:**

**Ejemplo - Ambiente LOCAL:**
```
✅ docker-compose.local.yml → localhost
✅ backend/application-local.properties → localhost
✅ frontend/env.local → localhost
```

**Ejemplo - Ambiente PRODUCCIÓN:**
```
✅ docker-compose.prod.yml → URLs de producción
✅ backend/application-prod.properties → Variables de entorno
✅ frontend/.env.prod → URLs de producción
```

#### **🔧 Configuración de URLs por Entorno**

**Para desarrollo LOCAL:**
```powershell
# NO necesitas configurar variables de entorno
# Solo ejecutar:
docker-compose -f docker-compose.local.yml up -d --build
```

**Para PRODUCCIÓN:**
```powershell
# Configurar variables de entorno desde .env.prod
# O usar docker-compose con archivo de producción:
docker-compose -f docker-compose.prod.yml up -d --build
```

### 2. ⚠️ OBLIGATORIO: Reinicio Total Después de Cambios en Backend o Templates ⚠️

**🚨 REGLA CRÍTICA - SIEMPRE APLICAR**: Después de CUALQUIER cambio en:
- **Clases Java** (`.java` files) → **SIEMPRE REINICIAR BACKEND**
- **Templates** (archivos de plantilla como `.html`, `.ftl`, `.vm`, etc.) → **SIEMPRE REINICIAR BACKEND**
- **Archivos de configuración** (`.properties`, `.yml`, etc.) → **SIEMPRE REINICIAR BACKEND**

**⚠️ NUNCA OLVIDAR**: Cualquier modificación en código Java o templates requiere reinicio de servicios Docker.

**DEBES reiniciar los servicios** para que los cambios surtan efecto.

```powershell
# Backend: Cambios en Java
cd backend
mvn clean compile -DskipTests  # Primero compilar
cd ..

# REINICIO OBLIGATORIO
docker-compose -f docker-compose.local.yml restart backend_local frontend_local

# O mejor aún, rebuild completo para asegurar actualización
docker-compose -f docker-compose.local.yml down
docker-compose -f docker-compose.local.yml up -d --build
```

**⚠️ IMPORTANTE**: 
- Los cambios en `.java` y **templates** (`.html`, `.ftl`, `.vm`, etc.) NO se reflejan automáticamente en contenedores Docker
- `docker-compose restart` solo reinicia contenedores, NO reconstruye imágenes con código nuevo
- Para cambios significativos, usa `down` + `up --build` para asegurar actualización completa

**✅ Workflow Correcto para Cambios en Backend o Templates:**
1. Modificar código Java o templates
2. Compilar: `mvn clean compile -DskipTests` (dentro de `backend/`) - solo para Java
3. **Reiniciar servicios**: `docker-compose -f docker-compose.local.yml restart backend_local` o `restart` completo
4. Probar la funcionalidad
5. Si funciona → commit y push

**📝 NOTA IMPORTANTE**: 
- **Clases Java** (`.java`) → Requieren compilación + reinicio
- **Templates** (`.html`, `.ftl`, `.vm`) → Requieren reinicio (se cargan en memoria)
- **Archivos de configuración** (`.properties`, `.yml`) → Requieren reinicio

### 3. Volúmenes Importantes
```yaml
# Todos los entornos deben incluir estos volúmenes en el backend:
volumes:
  - ./uploads:/app/uploads           # Archivos subidos por usuarios
  - ./documentacion:/app/documentacion  # Documentos generados (contratos, etc.)
```

### 4. Configuración de PostgreSQL para UTF-8
```yaml
# Configuración requerida para caracteres especiales (tildes, acentos)
environment:
  POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C.UTF-8 --lc-ctype=C.UTF-8"
```

**⚠️ IMPORTANTE**: 
- El SQL maestro incluye correcciones automáticas para caracteres especiales que pueden corromperse durante la inserción (especialmente en PowerShell)
- **Problema conocido**: PowerShell puede mostrar caracteres especiales como `??` en la terminal, pero los datos están correctos en la base de datos
- Los caracteres especiales se mostrarán correctamente en la aplicación web

### 2. Verificar Build
```powershell
# Backend
cd backend
./mvnw clean compile
./mvnw test

# Frontend
cd frontend
npm run build
npm run lint
```

### 3. Archivos Docker Compose
- `docker-compose.local.yml` - Desarrollo local
- `docker-compose.prod.yml` - Produccion
- `docker-compose.monitoring.yml` - Stack de monitoreo

### 4. Configuración de Entornos
```powershell
# LOCAL - Todo en localhost (configuración fija en env.local)
docker-compose -f docker-compose.local.yml up -d

# DESARROLLO - Variables de entorno configurables
$env:BACKEND_URL="http://localhost:8080"
$env:FRONTEND_URL="http://localhost:5173"
$env:WS_HOST="localhost"
$env:WS_PORT="5173"
docker-compose -f docker-compose.local.yml up -d

# PRODUCCIÓN - Usar .env.prod (crear desde env.prod.example)
docker-compose -f docker-compose.prod.yml up -d
```

### 5. Solución de Problemas Comunes

#### Base de Datos Vacía Después de Reinicio
**Problema**: La base de datos se crea pero está vacía, sin datos del script maestro.

**Causas**:
- Hibernate recrea las tablas pero no ejecuta el script de inicialización
- El volumen de PostgreSQL persiste pero sin datos iniciales

**Solución**:
```powershell
# Opción 1: Reinicio completo con volumen limpio (RECOMENDADO)
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up -d

# Opción 2: Ejecutar script maestro manualmente
Get-Content datos/00_gmarm_completo.sql | docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev

# Verificar que los datos se cargaron
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "SELECT COUNT(*) FROM usuario;"
```

#### Error de Login 400 - Variables de Entorno Incorrectas
**Problema**: El frontend no puede conectarse al backend porque las URLs están mal configuradas.

**Solución**:
```powershell
# Verificar variables de entorno actuales
echo $env:BACKEND_URL
echo $env:FRONTEND_URL

# Configurar correctamente para desarrollo local
$env:BACKEND_URL="http://localhost:8080"
$env:FRONTEND_URL="http://localhost:5173"
$env:WS_HOST="localhost"
$env:WS_PORT="5173"

# Reiniciar servicios
docker-compose -f docker-compose.local.yml down
docker-compose -f docker-compose.local.yml up -d
```

#### Base de Datos Vacía - Hibernate DDL Auto
**Problema**: Las tablas se crean pero no tienen datos del script maestro.

**Solución**:
```properties
# En backend/src/main/resources/application-docker.properties
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.hibernate.hbm2ddl.auto=validate
```

**Si la base ya está vacía**:
```powershell
# Opción 1: Eliminar volumen y recrear (recomendado)
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up -d

# Opción 2: Ejecutar script maestro manualmente (si Opción 1 no funciona)
# PowerShell NO soporta redirección <, usar Get-Content
Get-Content datos/00_gmarm_completo.sql | docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev
```

#### Error de Schema Validation - Columna Faltante
**Problema**: Error `Schema-validation: missing column [nombre_columna] in table [nombre_tabla]`

**Causa**: 
- Has actualizado el modelo Java (entidad) agregando un nuevo campo
- El volumen de PostgreSQL tiene el esquema viejo sin la nueva columna
- Hibernate está configurado en modo `validate` y detecta la diferencia

**Solución**:
```powershell
# SIEMPRE eliminar volumen y recrear cuando cambies el esquema
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up -d --build

# Para DEV
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up -d --build
```

**⚠️ IMPORTANTE**: El flag `-v` elimina los volúmenes, lo que fuerza la recreación de la base de datos con el script maestro actualizado.

## 🎨 Convenciones de Frontend

### 1. Componentes React
```typescript
// ✅ BUENO - Máximo 500 líneas
interface ClientFormProps {
  mode: 'create' | 'edit' | 'view';
  client?: Client | null;
  onSave: (client: Client) => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ mode, client, onSave }) => {
  // Estado local
  const [formData, setFormData] = useState<ClientFormData>({});
  
  // Efectos
  useEffect(() => {
    // Lógica de efectos
  }, []);
  
  // Funciones helper
  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    // Lógica de cambio
  };
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

### 2. Tipos TypeScript
```typescript
// ✅ BUENO - Tipos específicos
interface Client {
  id: string;
  nombres: string;
  apellidos: string;
  codigoIssfa?: string;
  estadoMilitar?: 'ACTIVO' | 'PASIVO';
}

// ✅ BUENO - Enums para valores fijos
enum TipoCliente {
  CIVIL = 'Civil',
  MILITAR = 'Militar',
  EMPRESA = 'Compañía de Seguridad'
}
```

### 3. Manejo de Estados
```typescript
// ✅ BUENO - Estados específicos
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [formData, setFormData] = useState<ClientFormData>({});

// ❌ MALO - Estado genérico
const [state, setState] = useState<any>({});
```

## 🔧 Backend - Spring Boot

### 1. Estructura de Servicios
```java
@Service
@RequiredArgsConstructor
@Slf4j
public class ClienteService {
    
    private final ClienteRepository clienteRepository;
    private final ClienteMapper clienteMapper;
    
    public ClienteDTO create(ClienteCreateDTO dto) {
        // Validaciones
        validateClienteForCreate(dto);
        
        // Lógica de negocio
        Cliente cliente = clienteMapper.toEntity(dto);
        Cliente saved = clienteRepository.save(cliente);
        
        return clienteMapper.toDTO(saved);
    }
    
    private void validateClienteForCreate(ClienteCreateDTO dto) {
        // Validaciones privadas
    }
}
```

### 2. DTOs y Mappers
```java
// ✅ BUENO - DTOs con Builder
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClienteDTO {
    private Long id;
    private String nombres;
    private String apellidos;
    private String codigoIssfa;
}

// ✅ BUENO - Mappers específicos
@Component
public class ClienteMapper {
    
    public ClienteDTO toDTO(Cliente cliente) {
        if (cliente == null) return null;
        
        ClienteDTO dto = ClienteDTO.builder()
            .id(cliente.getId())
            .nombres(cliente.getNombres())
            .apellidos(cliente.getApellidos())
            .codigoIssfa(cliente.getCodigoIssfa())
            .build();
            
        return dto;
    }
}
```

### 3. Validaciones
```java
// ✅ BUENO - Validaciones en esquemas JSON
// backend/src/main/resources/schemas/cliente-create.schema.json
{
  "if": {
    "properties": { "tipoCliente": { "enum": ["Militar Fuerza Terrestre", "Militar Fuerza Naval", "Militar Fuerza Aérea"] } }
  },
  "then": {
    "required": ["estadoMilitar", "codigoIssfa"]
  }
}
```

## 🗄️ Base de Datos

### 1. Convenciones de Naming
```sql
-- ✅ BUENO - Snake_case para columnas
CREATE TABLE cliente (
    id BIGSERIAL PRIMARY KEY,
    numero_identificacion VARCHAR(20) NOT NULL,
    codigo_issfa VARCHAR(50) DEFAULT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ✅ BUENO - Comentarios descriptivos
-- Información militar (solo para uniformados - militares y policías)
estado_militar VARCHAR(20) DEFAULT NULL,
codigo_issfa VARCHAR(50) DEFAULT NULL
```

### 2. Tipos de Datos
```sql
-- ✅ BUENO - Tipos apropiados
BIGSERIAL PRIMARY KEY           -- Para IDs
VARCHAR(50)                     -- Para códigos
VARCHAR(100)                    -- Para nombres
TEXT                           -- Para descripciones largas
BOOLEAN DEFAULT false          -- Para flags
TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- Para fechas
```

## 🚀 Comandos de Desarrollo

### 1. Desarrollo Local
```powershell
# Backend
cd backend
./mvnw clean compile
./mvnw spring-boot:run

# Frontend
cd frontend
npm install
npm run dev
```

### 2. Docker Development
```powershell
# Desarrollo
docker-compose -f docker-compose.local.yml up --build

# Local
docker-compose -f docker-compose.local.yml up --build

# Limpiar
docker-compose -f docker-compose.local.yml down -v
docker system prune -f
```

### 3. Testing
```powershell
# Backend tests
cd backend
./mvnw test

# Frontend tests
cd frontend
npm run test

# Build verification
cd backend; ./mvnw clean compile
cd ../frontend; npm run build
```

## 📝 Convenciones de Commits

### 1. Formato de Mensajes
```
feat: agregar campo código ISSFA para tipos militares
fix: corregir visualización de provincias en formulario
docs: actualizar documentación de API
refactor: simplificar lógica de validación de clientes
test: agregar tests para servicio de clientes
```

### 2. Antes de Commit
```powershell
# Verificar que todo compile
cd backend; ./mvnw clean compile
cd ../frontend; npm run build

# Verificar linting
cd frontend; npm run lint

# Verificar tests
cd ../backend; ./mvnw test
```

## 📄 **TEMPLATES DE DOCUMENTOS (CRÍTICO)**

El sistema genera automáticamente documentos legales en PDF usando plantillas Thymeleaf. Esta es una funcionalidad CORE del proyecto.

### **Tipos de Documentos**

#### **1. Contratos de Compra**
Ubicación: `backend/src/main/resources/templates/contratos/`

**Por Tipo de Cliente:**
- **Civiles**: `contratos/civiles/contrato_compra.html`
- **Policía**: `contratos/uniformados/contrato_compra_policia.html` (**USA ISSPOL**)
- **Fuerza Terrestre**: `contratos/uniformados/contrato_compra_fuerza_terrestre.html` (**USA ISSFA**)
- **Fuerza Naval**: `contratos/uniformados/contrato_compra_fuerza_naval.html` (**USA ISSFA**)
- **Fuerza Aérea**: `contratos/uniformados/contrato_compra_fuerza_aerea.html` (**USA ISSFA**)

**Contenido del Contrato:**
- Datos del comerciante importador (licencia con RUC)
- Datos completos del cliente (cédula, ISSFA/ISSPOL, dirección completa)
- ANTECEDENTES: Registro del comerciante + necesidad del cliente
- PRIMERA: Descripción del arma
- SEGUNDA: PRECIO (sin IVA, en USD y texto)
- TERCERA: Tiempo estimado de entrega (~200 días)
- CUARTA: FORMA DE PAGO (mensualizados con letras a), b), c)...)
  - Incluye cláusula de facturación y aceleración de pago
- QUINTA a NOVENA: Cláusulas sobre importancia de pago, cash deposits, intransferibilidad, matriculación, fondos lícitos
- DECIMA: ICE y IVA incrementos
- DECIMA PRIMERA: Rastrillo/bodega + SINCOAR + 10 ANEXOS
- DECIMA SEGUNDA: JURISDICCION CONVENCIONAL (Pichincha, citación por email)
- Firmas: Comerciante (título + nombre + CC) y Cliente (rango + nombre + CC)

**⚠️ CRÍTICO - Diferencias ISSPOL vs ISSFA:**
- **ISSPOL**: Solo para Policía Nacional
- **ISSFA**: Para Fuerza Terrestre, Naval y Aérea
- **ANEXO 4**: "Carnet del ISSPOL" vs "Carnet del ISSFA"
- **ANEXO 10**: "Certificado ISSPOL" vs "Certificado ISSFA"

#### **2. Solicitudes de Compra**
Ubicación: `backend/src/main/resources/templates/contratos/`

**Plantillas específicas por tipo:**
- `contratos/civiles/solicitud_compra.html`
- `contratos/uniformados/solicitud_compra_policia.html`
- `contratos/uniformados/solicitud_compra_fuerza_terrestre.html`
- `contratos/uniformados/solicitud_compra_fuerza_naval.html`
- `contratos/uniformados/solicitud_compra_fuerza_aerea.html`

**Contenido:**
- Fecha y ciudad (cantón de la licencia): "Quito, 27 de enero de 2026"
- Saludo: "Señor/a," (inclusivo)
- Datos del comerciante
- Datos del solicitante (con rango si aplica)
- Tabla con descripción del arma
- Firma del solicitante

#### **3. Cotizaciones**
Ubicación: `backend/src/main/resources/templates/contratos/uniformados/`

**Plantillas específicas:**
- `cotizacion_policia.html`
- `cotizacion_fuerza_terrestre.html`
- `cotizacion_fuerza_naval.html`
- `cotizacion_fuerza_aerea.html`

**Formato Actualizado:**
```
COTIZACIÓN: ML-0001-2026

Fecha: Quito, 27 de enero de 2026
Cliente: CBOP. QUINTERO CABEZA JOSE LUIS - POLICIA EN SERVICIO ACTIVO
Cédula: 0925588196

Por medio de la presente me permito enviar la Cotización para 01 pistola(s)
de las siguientes características:

[TABLA]
TIPO | MARCA | MODELO | CALIBRE | ALIMENTADORA DE FABRICA | PRECIO INCLUIDO IVA

El arma será cancelada en la siguiente manera:
[CUOTAS si aplica]

El depósito deberá realizarlo en la cuenta bancaria:
Banco: Banco Guayaquil
Cuenta: AHORROS
Número: 29282140

Para constancia de aceptación de la cotización firman.
[FIRMAS con formato capitalizado]
```

### **Variables Thymeleaf Disponibles**

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
${estadoMilitarUpper}              <!-- ACTIVO/PASIVO -->
${clienteDireccionCompleta}        <!-- Dirección + Provincia + Cantón -->
```

**Datos de la Licencia:**
```thymeleaf
${licenciaTitulo}                  <!-- MSC, ING, etc. -->
${licenciaNombre}                  <!-- Nombre completo -->
${licenciaCedula}
${licenciaRuc}
${licenciaCiudad}                  <!-- Cantón para fechas -->
${licenciaNombreBanco}             <!-- Banco Guayaquil -->
${licenciaTipoCuenta}              <!-- AHORROS -->
${licenciaCuentaBancaria}          <!-- Número de cuenta -->
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
${numeroCotizacion}                <!-- ML-0001-2026 -->
```

**Utilidades Thymeleaf:**
```thymeleaf
<!-- Fechas -->
${fechaActual}
${fechaCotizacion}                 <!-- "Quito, 27 de enero de 2026" -->
${#temporals.format(fecha, 'dd')}
${T(java.time.format.DateTimeFormatter).ofPattern('MMMM', new java.util.Locale('es', 'ES')).format(fecha)}

<!-- Números -->
${#numbers.formatDecimal(precio, 1, 2)}

<!-- Strings -->
${#strings.toUpperCase(texto)}
${#strings.capitalize(texto)}

<!-- Conversión número a texto -->
${numberToTextService.convertToText(monto)}
```

### **⚠️ REGLAS CRÍTICAS para Templates**

1. **NO GENERALIZAR**: Cada tipo de cliente tiene SU PROPIO template
   - ❌ MAL: "Vamos a hacer un template genérico que se adapte"
   - ✅ BIEN: Un template específico para cada caso (Policía, Naval, Terrestre, Aérea, Civil)

2. **ISSFA vs ISSPOL**: NUNCA confundir
   - Policía = ISSPOL
   - Fuerzas Armadas (Terrestre, Naval, Aérea) = ISSFA

3. **Formato de Firmas**:
   ```thymeleaf
   <!-- Licencia -->
   ${#strings.toUpperCase(licenciaTitulo + ' ' + licenciaNombre)}
   
   <!-- Cliente con rango -->
   <span th:if="${clienteRango != null and clienteRango != ''}">
     ${#strings.capitalize(clienteRango) + '. ' + #strings.capitalize(cliente.nombres) + ' ' + #strings.capitalize(cliente.apellidos)}
   </span>
   ```

4. **Fechas con Ciudad**:
   ```thymeleaf
   ${fechaCotizacion}  <!-- Ya incluye "Quito, 27 de enero de 2026" -->
   ```

5. **Después de modificar templates**: SIEMPRE `restart backend_local`

### **Servicio de Generación**

**Backend:** `GestionDocumentosServiceHelper.java`
```java
public byte[] generarContrato(Long ventaId)
public byte[] generarSolicitudCompra(Long ventaId)
public byte[] generarCotizacion(Long ventaId)
```

**Endpoints:**
```
GET /api/ventas/{ventaId}/documentos/contrato
GET /api/ventas/{ventaId}/documentos/solicitud-compra
GET /api/ventas/{ventaId}/documentos/cotizacion
```

### **Testing de Documentos**

1. Crear venta con todos los datos
2. Generar documento via endpoint
3. Verificar:
   - ✅ Datos del cliente correctos
   - ✅ ISSFA/ISSPOL según corresponda
   - ✅ Formato de firmas correcto
   - ✅ Fecha con ciudad (cantón de licencia)
   - ✅ Cuotas si es crédito
   - ✅ Anexos correctos

---

## 🐛 Debugging

### 1. Logs Importantes
```java
// ✅ BUENO - Logs informativos
log.info("✅ Cliente creado: ID={}, nombres={}", cliente.getId(), cliente.getNombres());
log.error("❌ Error creando cliente: {}", error.getMessage());
log.debug("🔍 DEBUG: Datos recibidos: {}", requestData);
```

### 2. Frontend Debugging
```typescript
// ✅ BUENO - Console logs descriptivos
console.log('🔄 Cargando datos del cliente:', clienteId);
console.log('✅ Datos cargados exitosamente:', data);
console.error('❌ Error cargando datos:', error);
```

## 🔒 Seguridad

### 1. Validaciones
- **SIEMPRE validar datos de entrada**
- **Usar esquemas JSON para validación**
- **Sanitizar inputs del usuario**
- **Validar tipos de datos**

### 2. Base de Datos
- **Usar parámetros preparados**
- **Validar longitud de campos**
- **Usar constraints de base de datos**

## 📚 Recursos Útiles

### 1. Documentación Principal
- **`README.md`** - Documentacion principal del proyecto
- **`CLAUDE.md`** - Guia principal para IAs (punto de entrada)
- **`AGENTS.md`** - Este archivo (convenciones y workflows)
- **`TECH_DEBT_BACKEND.md`** - Deuda tecnica backend
- **`TECH_DEBT_FRONTEND.md`** - Deuda tecnica frontend
- **`.github/README.md`** - Workflows de CI/CD

### 2. Archivos Críticos
- `datos/00_gmarm_completo.sql` - Script maestro de BD (fuente única de verdad)
- `docker-compose.local.yml` - Configuracion LOCAL (localhost)
- `docker-compose.prod.yml` - Configuracion PRODUCCION
- `docker-compose.monitoring.yml` - Stack de monitoreo
- `backend/src/main/resources/templates/contratos/` - Templates de documentos

### 3. Templates de Documentos
- **Contratos**: `contratos/civiles/`, `contratos/uniformados/`
  - `contrato_compra_policia.html` (ISSPOL)
  - `contrato_compra_fuerza_terrestre.html` (ISSFA)
  - `contrato_compra_fuerza_naval.html` (ISSFA)
  - `contrato_compra_fuerza_aerea.html` (ISSFA)
  - `contrato_compra.html` (civiles)
- **Solicitudes**: Mismo directorio que contratos
  - `solicitud_compra_policia.html`
  - `solicitud_compra_fuerza_terrestre.html`
  - `solicitud_compra_fuerza_naval.html`
  - `solicitud_compra_fuerza_aerea.html`
  - `solicitud_compra.html` (civiles)
- **Cotizaciones**: `contratos/uniformados/`
  - `cotizacion_policia.html`
  - `cotizacion_fuerza_terrestre.html`
  - `cotizacion_fuerza_naval.html`
  - `cotizacion_fuerza_aerea.html`

### 4. Patrones Comunes
- **CRUD Services** con Repository pattern
- **DTOs** para transferencia de datos
- **Mappers** para conversión entre entidades y DTOs
- **Validaciones** con esquemas JSON
- **Logging** con SLF4J
- **Generacion de PDFs** con Thymeleaf + Flying Saucer

---

## 🚫 **ANTI-PATRÓN: Valores Hardcodeados**

### ❌ **NUNCA Hardcodear Estos Valores:**

#### **1. IVA (Impuesto)**
```java
// ❌ MAL - Hardcodeado
double iva = 0.15; // 15%
double precioConIva = precio * 1.15;
```

```java
// ✅ BIEN - Desde configuracion_sistema
ConfiguracionSistema configIva = configuracionService.getConfiguracion("IVA");
double iva = Double.parseDouble(configIva.getValor()) / 100;
double precioConIva = precio * (1 + iva);
```

#### **2. Tipos de Cliente**
```java
// ❌ MAL - Comparación hardcodeada
if (tipoCliente.equals("Civil")) { ... }
if (tipoCliente.equals("Militar Expoferia")) { ... }
```

```java
// ✅ BIEN - Usar banderas dinámicas desde BD
if (tipoCliente.esCivil()) { ... }
if (tipoCliente.esMilitar()) { ... }
if (tipoCliente.requiereIssfa()) { ... }
```

#### **3. Estados y Enum Values**
```java
// ❌ MAL - Strings hardcodeados
if (estado.equals("COMPLETADO")) { ... }
```

```java
// ✅ BIEN - Usar ENUMs
if (estado == EstadoPago.COMPLETADO) { ... }
```

### 📊 **Tabla `configuracion_sistema`**

**Valores que DEBEN estar en BD:**
- `IVA`: Porcentaje de impuesto (actualmente 15%)
- `EDAD_MINIMA_COMPRA`: Edad mínima para comprar armas (25 años)
- `TASA_INTERES_CREDITO`: Tasa de interés para créditos
- `MAX_CUOTAS`: Máximo de cuotas permitidas
- `DIAS_VENCIMIENTO_CUOTA`: Días para vencimiento de cuota

**Estructura:**
```sql
CREATE TABLE configuracion_sistema (
    id BIGSERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    editable BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Ejemplo de uso:**
```java
// Backend
@Service
public class ConfiguracionSistemaService {
    public String getValor(String clave) {
        return repository.findByClave(clave)
            .orElseThrow(() -> new NotFoundException("Config: " + clave))
            .getValor();
    }
    
    public double getIVA() {
        return Double.parseDouble(getValor("IVA")) / 100;
    }
}

// En servicios
double iva = configuracionService.getIVA();
double precioFinal = precioBase * (1 + iva);
```

```typescript
// Frontend
const { data: iva } = useQuery('config-iva', () => 
  apiService.getConfiguracion('IVA')
);

const ivaDecimal = parseFloat(iva.valor) / 100;
const precioConIva = precioBase * (1 + ivaDecimal);
```

### 🎯 **Checklist Anti-Hardcodeo:**

Antes de implementar, pregúntate:
- [ ] ¿Este valor puede cambiar en el futuro?
- [ ] ¿Es una configuración del negocio?
- [ ] ¿Depende de regulaciones externas?
- [ ] ¿Varía por contexto o país?

**Si respondiste SÍ a alguna:** ➡️ **Usar `configuracion_sistema`**

### ✅ **IVA Refactorizado (Completado en Sprint 11):**

**El IVA ya NO está hardcodeado.** Se implementó la siguiente arquitectura:

```
BD (configuracion_sistema) → Backend API → useIVA() hook → Componentes
```

**Frontend - Usando `useIVA()` hook:**
- ✅ `ClientSummary.tsx` - Usa `useIVA()`
- ✅ `ClientForm.tsx` - Usa `useIVA()`
- ✅ `PaymentForm.tsx` - Usa `useIVA()`
- ✅ `WeaponReserve.tsx` - Usa `useIVA()`

**Backend - Usando `ConfiguracionSistemaService`:**
- ✅ `GestionPagosServiceHelper.java` - Obtiene IVA desde BD
- ✅ `GestionDocumentosServiceHelper.java` - Obtiene IVA desde BD
- ✅ Templates HTML - Usan variable `${ivaPorcentaje}` de Thymeleaf

**Fallbacks (correcto para resiliencia):**
- `useConfiguracion.ts` - Fallback a 0.15 si API falla
- `GestionPagosServiceHelper.java` - Fallback a 0.15 si BD falla

**Para agregar nuevos valores configurables:**
1. Insertar en tabla `configuracion_sistema` (SQL maestro)
2. Backend: Usar `ConfiguracionSistemaService.getValor(clave)`
3. Frontend: Crear hook similar a `useIVA()` en `useConfiguracion.ts`

## ⚠️ Recordatorios Importantes

1. **🚨 CRÍTICO: SIEMPRE reiniciar Docker después de cambios en Backend (clases Java) o Templates (obligatorio)**
   - **Cualquier cambio en `.java`** → **SIEMPRE REINICIAR BACKEND**
   - **Cualquier cambio en templates** (`.html`, `.ftl`, `.vm`, etc.) → **SIEMPRE REINICIAR BACKEND**
   - **Comando**: `docker-compose -f docker-compose.local.yml restart backend_local` o `restart` completo
   - **⚠️ NUNCA OLVIDAR ESTO**: Los cambios en Java/templates NO se reflejan automáticamente en Docker
2. **NO usar && en PowerShell, usar ; en su lugar**
3. **Máximo 500 líneas por archivo/clase**
4. **Actualizar SQL maestro, NO crear migraciones**
5. **Verificar build antes de commit**
6. **Usar imports específicos, NO wildcards**
7. **Mantener clean code y nombres descriptivos**
8. **Usar el docker-compose correcto para cada ambiente:**
   - **LOCAL**: `docker-compose.local.yml` → localhost
   - **PROD**: `docker-compose.prod.yml` → produccion
9. **TODOS los archivos de configuracion de un ambiente DEBEN coincidir (URLs, IPs, puertos)**
10. **Hibernate DDL debe ser 'validate' en Docker, NO 'create-drop'**
11. **NO hardcodear valores de negocio - usar `configuracion_sistema`**
12. **NO hardcodear comparaciones de tipos - usar banderas dinamicas**
13. **Si cambias el esquema de BD (agregar columna), SIEMPRE usar `down -v` para recrear volumen**

---

*Este documento debe actualizarse cuando se agreguen nuevas convenciones o patrones al proyecto.*

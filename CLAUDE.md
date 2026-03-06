# 🤖 CLAUDE.md - Guía para Claude y Otras IAs

## 🎯 **Propósito de Este Documento**

Este archivo proporciona instrucciones específicas para **Claude**, **GPT-4**, **Gemini** y cualquier otra IA que trabaje en el proyecto GMARM. Si eres una IA leyendo esto, **este es tu punto de entrada principal**.

---

## 📖 **¿Cómo Usar Esta Guía?**

### **Paso 1: Lee PRIMERO Este Documento**
Este archivo te dará el contexto inicial y te indicará qué otros documentos leer.

### **Paso 2: Lee la Documentación Principal**
1. **`README.md`** - Vista general del proyecto, tecnologías, inicio rápido
2. **`AGENTS.md`** - Convenciones específicas, workflows, patrones

### **Paso 3: Familiarízate con la Estructura**
```
gmarm/
├── backend/          # Spring Boot API (Java 21)
│   ├── src/main/java/com/armasimportacion/
│   │   ├── controller/    # REST Controllers
│   │   │   ├── ClienteController.java          # CRUD, búsquedas, estado
│   │   │   ├── ClienteDocumentController.java  # Contratos, documentos
│   │   │   └── GrupoImportacionController.java # Grupos de importación
│   │   ├── service/       # Lógica de negocio (SRP)
│   │   │   ├── ClienteService.java             # CRUD + validaciones
│   │   │   ├── ClienteQueryService.java        # Consultas read-only
│   │   │   ├── ClienteCompletoService.java     # Orquestador creación completa
│   │   │   ├── GrupoImportacionService.java    # CRUD grupos
│   │   │   ├── GrupoImportacionClienteService.java   # Clientes en grupos
│   │   │   ├── GrupoImportacionMatchingService.java   # Matching/disponibilidad
│   │   │   ├── GrupoImportacionProcesoService.java    # Flujo de trabajo
│   │   │   └── helper/documentos/              # Generadores PDF
│   │   │       ├── ContratoPDFGenerator.java
│   │   │       ├── CotizacionPDFGenerator.java
│   │   │       ├── SolicitudCompraPDFGenerator.java
│   │   │       ├── AutorizacionPDFGenerator.java
│   │   │       ├── ReciboPDFGenerator.java
│   │   │       └── DocumentoPDFUtils.java
│   │   ├── repository/    # JPA Repositories
│   │   ├── model/         # Entidades JPA
│   │   ├── dto/           # Data Transfer Objects
│   │   └── mapper/        # Entity ↔ DTO
│   └── src/main/resources/
│       ├── templates/     # Thymeleaf (contratos, solicitudes, cotizaciones)
│       └── application*.properties
│
├── frontend/         # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── pages/         # Páginas principales
│   │   ├── services/      # 17 API modules por dominio
│   │   ├── contexts/      # AuthContext, TiposClienteContext
│   │   ├── hooks/         # Hooks globales
│   │   ├── types/         # TypeScript types
│   │   ├── schemas/       # Validación
│   │   └── config/        # Configuración por entorno
│
├── datos/
│   └── 00_gmarm_completo.sql  # SQL MAESTRO (fuente única de verdad)
│
└── docker-compose.*.yml  # Configuraciones Docker
```

---

## 🚨 **REGLAS CRÍTICAS (NUNCA VIOLAR)**

### **1. REINICIAR DESPUÉS DE CAMBIOS EN JAVA/TEMPLATES**
```bash
# SIEMPRE después de modificar:
# - Clases Java (.java)
# - Templates (.html, .ftl, .vm)
# - Configuración (.properties, .yml)

docker-compose -f docker-compose.local.yml restart backend_local

# O mejor: rebuild completo
docker-compose -f docker-compose.local.yml down
docker-compose -f docker-compose.local.yml up -d --build
```

**⚠️ Los cambios NO se reflejan automáticamente en Docker. SIEMPRE reiniciar.**

### **2. NUNCA PUSHEAR SIN COMPILAR**
```bash
# ANTES de hacer git push:
cd backend
mvn clean install -DskipTests

cd ../frontend
npm run build

# Solo si AMBOS pasan → git push
```

### **3. SQL MAESTRO ES LA FUENTE ÚNICA DE VERDAD**
- ✅ **SIEMPRE** actualizar `datos/00_gmarm_completo.sql`
- ❌ **NUNCA** crear scripts de migración separados
- ✅ Si cambias el esquema, usar `docker-compose down -v` para recrear volumen

### **4. NO HARDCODEAR VALORES DE NEGOCIO**
```java
// ❌ MAL
double iva = 0.15;

// ✅ BIEN - Usar configuracion_sistema
double iva = configuracionService.getIVA();
```

### **5. TEMPLATES: UN TEMPLATE POR TIPO DE CLIENTE**
- ❌ **NUNCA** crear un template "genérico" que se adapte
- ✅ **SIEMPRE** un template específico para cada caso:
  - Policía → `contrato_compra_policia.html` (usa **ISSPOL**)
  - Fuerza Terrestre → `contrato_compra_fuerza_terrestre.html` (usa **ISSFA**)
  - Fuerza Naval → `contrato_compra_fuerza_naval.html` (usa **ISSFA**)
  - Fuerza Aérea → `contrato_compra_fuerza_aerea.html` (usa **ISSFA**)
  - Compañías de seguridad → `contrato_compania_seguridad.html`

### **6. CONFIGURACIÓN DE ENTORNOS**
Cada entorno tiene su propia configuración. **TODOS los archivos de un entorno DEBEN coincidir**:

| Entorno | Docker Compose | Backend Properties | Frontend Env |
|---------|---------------|-------------------|--------------|
| **LOCAL** | `docker-compose.local.yml` | `application-local.properties` | `env.local` |
| **PROD** | `docker-compose.prod.yml` | `application-prod.properties` | `env.prod` |

---

## 🎯 **CONTEXTO DEL PROYECTO**

### **¿Qué es GMARM?**
Sistema de **Gestión de Importación de Armas y Municiones** para un comerciante importador en Ecuador.

### **Funcionalidades Principales**
1. **Gestión de Clientes** (civiles y uniformados: Policía, FF.AA.)
2. **Catálogo de Armas** (inventario, reservas)
3. **Sistema de Ventas** (contado/crédito)
4. **Gestión de Pagos** (cuotas, estados)
5. **Generación Automática de Documentos Legales**:
   - Contratos de compra
   - Solicitudes de compra (para Control de Armas)
   - Cotizaciones

### **Tecnologías**
- **Backend**: Spring Boot 3.4.5, Java 21, PostgreSQL, Thymeleaf, Flying Saucer (PDF)
- **Frontend**: React 19, TypeScript, Vite 7, Tailwind CSS, Context API
- **DevOps**: Docker, Docker Compose, GitHub Actions

---

## 📄 **GENERACIÓN DE DOCUMENTOS (CRÍTICO)**

Esta es una funcionalidad **CORE** del proyecto. Los documentos se generan en PDF usando plantillas Thymeleaf.

### **Tipos de Documentos**

#### **1. Contratos de Compra**
- **Ubicación**: `backend/src/main/resources/templates/contratos/`
- **Plantillas**:
  - `uniformados/contrato_compra_policia.html` (**ISSPOL**)
  - `uniformados/contrato_compra_fuerza_terrestre.html` (**ISSFA**)
  - `uniformados/contrato_compra_fuerza_naval.html` (**ISSFA**)
  - `uniformados/contrato_compra_fuerza_aerea.html` (**ISSFA**)
  - `civiles/contrato_compra.html`

**Contenido Clave:**
- Datos del comerciante (licencia con RUC)
- Datos del cliente (cédula, ISSFA/ISSPOL, dirección)
- ANTECEDENTES (registro comerciante + necesidad cliente)
- Cláusulas legales (PRIMERA a DECIMA SEGUNDA)
- Forma de pago mensualizados: a), b), c), d), e), f)
- 10 ANEXOS (con ISSFA o ISSPOL según corresponda)
- Firmas (comerciante + cliente con rango)

#### **2. Solicitudes de Compra**
- **Ubicación**: `backend/src/main/resources/templates/contratos/`
- **Formato**:
  - Fecha con ciudad (cantón): "Quito, 27 de enero de 2026"
  - Saludo: "Señor/a," (inclusivo)
  - Datos del solicitante (con rango si aplica)
  - Tabla con descripción del arma
  - Firma

#### **3. Cotizaciones**
- **Ubicación**: `backend/src/main/resources/templates/contratos/uniformados/`
- **Formato Actualizado**:
  ```
  COTIZACIÓN: ML-0001-2026
  
  Fecha: Quito, 27 de enero de 2026
  Cliente: RANGO. NOMBRE APELLIDO - TIPO EN SERVICIO ACTIVO
  Cédula: 0000000000
  
  Por medio de la presente me permito enviar la Cotización para 01 pistola(s)...
  
  [TABLA: TIPO | MARCA | MODELO | CALIBRE | ALIMENTADORA DE FABRICA | PRECIO INCLUIDO IVA]
  
  El arma será cancelada en la siguiente manera:
  [CUOTAS]
  
  Datos bancarios...
  
  Firmas (capitalizado)
  ```

### **⚠️ DIFERENCIAS CRÍTICAS: ISSPOL vs ISSFA**

| Aspecto | Policía (ISSPOL) | FF.AA. (ISSFA) |
|---------|------------------|----------------|
| **Instituto** | Instituto de Seguridad Social de la **Policía Nacional** | Instituto de Seguridad Social de las **Fuerzas Armadas** |
| **Quiénes** | Policía Nacional | Fuerza Terrestre, Naval, Aérea |
| **Campo en BD** | `cliente.codigoIssfa` (mismo campo, diferentes nombres) | `cliente.codigoIssfa` |
| **ANEXO 4** | "Copia color del carnet del **ISSPOL**" | "Copia color del carnet del **ISSFA**" |
| **ANEXO 10** | "Certificado **ISSPOL** de encontrarse servicio activo" | "Certificado **ISSFA** de encontrarse servicio activo" |
| **Templates** | `*_policia.html` | `*_fuerza_terrestre.html`, `*_fuerza_naval.html`, `*_fuerza_aerea.html` |

**⚠️ NUNCA confundir ISSPOL con ISSFA. Son instituciones diferentes.**

### **Variables Thymeleaf Comunes**

```thymeleaf
<!-- Cliente -->
${cliente.nombres}
${cliente.apellidos}
${cliente.numeroIdentificacion}
${clienteRango}                    <!-- "CBOP", "CABO SEGUNDO", etc. -->
${cliente.codigoIssfa}             <!-- Código ISSFA o ISSPOL -->
${estadoMilitarLowercase}          <!-- "activo" o "pasivo" -->
${estadoMilitarUpper}              <!-- "ACTIVO" o "PASIVO" -->

<!-- Licencia -->
${licenciaTitulo}                  <!-- "MSC", "ING", etc. -->
${licenciaNombre}                  <!-- "Loyaga Correa Marcia Nathaly" -->
${licenciaCedula}
${licenciaRuc}
${licenciaCiudad}                  <!-- Cantón para fechas -->

<!-- Pago -->
${pago.tipoPago}                   <!-- "CONTADO" o "CREDITO" -->
${pago.montoTotal}
${ivaPorcentaje}                   <!-- 15 -->
${cuotas}                          <!-- Lista de cuotas -->

<!-- Fechas -->
${fechaCotizacion}                 <!-- "Quito, 27 de enero de 2026" -->
${fechaActual}

<!-- Utilidades -->
${#strings.toUpperCase(texto)}
${#strings.capitalize(texto)}
${#numbers.formatDecimal(numero, 1, 2)}
${numberToTextService.convertToText(monto)}  <!-- "UN MIL DOSCIENTOS..." -->
```

---

## 🧠 **PATRONES DE CÓDIGO**

### **Backend - Repository-Service-Controller (SRP)**

```
Controller (REST) → Service (lógica) → Repository (BD)
       ↓                                      ↑
     Mapper (Entity ↔ DTO)
```

**Principio SRP aplicado**: Los servicios grandes se dividen por responsabilidad:
- **`*Service`** — CRUD y operaciones de escritura
- **`*QueryService`** — Consultas read-only (`@Transactional(readOnly = true)`)
- **`*ClienteService / *MatchingService / *ProcesoService`** — Sub-dominios específicos
- **`*Controller` / `*DocumentController`** — Endpoints separados por dominio

**Ejemplo:**
```java
@RestController
@RequestMapping("/api/clientes")
public class ClienteController {
    private final ClienteService clienteService;          // CRUD + validaciones
    private final ClienteQueryService clienteQueryService; // Consultas read-only

    @GetMapping("/{id}")
    public ResponseEntity<ClienteDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(clienteQueryService.findByIdAsDTO(id));
    }
}

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ClienteQueryService {
    private final ClienteRepository repository;
    private final ClienteMapper mapper;

    public ClienteDTO findByIdAsDTO(Long id) {
        Cliente entity = repository.findById(id)
            .orElseThrow(() -> new NotFoundException("Cliente no encontrado"));
        return mapper.toDTO(entity);
    }
}
```

### **Frontend - Component-Hook-Service**

```
Component (UI) → Custom Hook (estado/lógica) → API Service (fetch)
                                                       ↓
                                                  Backend API
```

- Hooks organizados por página/dominio (ej: `pages/Vendedor/hooks/`)
- Estado global con Context API (AuthContext, TiposClienteContext)
- Services en `src/services/` (17 módulos por dominio)

---

## 🔧 **WORKFLOWS COMUNES**

### **Agregar un Nuevo Campo a una Entidad**

1. **Actualizar SQL Maestro** (`datos/00_gmarm_completo.sql`):
   ```sql
   ALTER TABLE cliente ADD COLUMN nuevo_campo VARCHAR(100);
   ```

2. **Actualizar Entidad** (`backend/.../model/Cliente.java`):
   ```java
   @Column(name = "nuevo_campo")
   private String nuevoCampo;
   ```

3. **Actualizar DTO** (`backend/.../dto/ClienteDTO.java`):
   ```java
   private String nuevoCampo;
   ```

4. **Actualizar Mapper** (`backend/.../mapper/ClienteMapper.java`):
   ```java
   .nuevoCampo(entity.getNuevoCampo())
   ```

5. **Recrear contenedor Docker**:
   ```bash
   docker-compose -f docker-compose.local.yml down -v
   docker-compose -f docker-compose.local.yml up -d --build
   ```

6. **Actualizar Frontend** si es necesario

7. **Compilar y verificar**:
   ```bash
   cd backend && mvn clean install -DskipTests
   cd ../frontend && npm run build
   ```

8. **Commit y push**

### **Crear un Nuevo Documento Legal**

1. **Crear plantilla Thymeleaf** en `backend/src/main/resources/templates/contratos/`
2. **Crear generador PDF** en `service/helper/documentos/NuevoDocPDFGenerator.java`:
   ```java
   @Component
   @RequiredArgsConstructor
   public class NuevoDocPDFGenerator {
       private final DocumentoPDFUtils utils;

       public DocumentoGenerado generarYGuardar(Cliente cliente, Pago pago) {
           Map<String, Object> variables = new HashMap<>();
           // Preparar variables para template
           byte[] pdfBytes = utils.generarPdf("template-name", variables);
           // Guardar archivo y documento
       }
   }
   ```
3. **Registrar en orquestador** `GestionDocumentosServiceHelper.java`
4. **Agregar endpoint** en `ClienteDocumentController.java`
5. **Reiniciar backend**:
   ```bash
   docker-compose -f docker-compose.local.yml restart backend_local
   ```
6. **Testing**: Crear venta y generar documento

---

## 🐛 **DEBUGGING**

### **Backend no refleja cambios**
**Causa**: No reiniciaste el contenedor Docker
**Solución**:
```bash
docker-compose -f docker-compose.local.yml restart backend_local
```

### **Base de datos vacía**
**Causa**: Volumen persiste con BD vieja
**Solución**:
```bash
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up -d
```

### **Error de compilación Maven**
**Causa**: Problemas con rutas en Windows
**Solución**: Usar Docker para compilar:
```bash
docker-compose -f docker-compose.local.yml build backend_local --no-cache
```

### **Template no genera correctamente**
1. Verificar variables en el generador PDF correspondiente (`service/helper/documentos/*PDFGenerator.java`)
2. Verificar sintaxis Thymeleaf
3. Reiniciar backend
4. Ver logs: `docker logs gmarm-backend-local`

---

## 📊 **MÉTRICAS DE CALIDAD**

### **Código**
- ✅ Máximo 500 líneas por clase/componente
- ✅ Máximo 20 statements por función
- ✅ Máximo 10 métodos públicos por clase
- ✅ Coverage de tests ≥ 70%

### **Commits**
```
feat: nueva funcionalidad
fix: corrección de bug
docs: documentación
refactor: refactorización
test: tests
chore: tareas de mantenimiento
```

### **Pull Requests**
1. Crear branch desde `dev`
2. Compilar y verificar build
3. Crear PR a `dev`
4. Después de merge a `dev` → merge a `main`

---

## 🎓 **APRENDIENDO EL PROYECTO**

### **Día 1: Contexto General**
- [ ] Leer `README.md` completo
- [ ] Revisar estructura de carpetas
- [ ] Ejecutar proyecto local: `docker-compose -f docker-compose.local.yml up -d`
- [ ] Acceder a frontend: http://localhost:5173
- [ ] Login con usuario de prueba: `vendedor@test.com` / `admin123`

### **Día 2: Backend**
- [ ] Revisar entidades principales en `backend/.../model/`
- [ ] Ver servicios en `backend/.../service/`
- [ ] Probar endpoints con Postman o similar

### **Día 3: Frontend**
- [ ] Revisar componentes principales en `frontend/src/components/`
- [ ] Ver custom hooks en `frontend/src/hooks/`
- [ ] Explorar páginas en `frontend/src/pages/`

### **Día 4: Documentos**
- [ ] Leer esta sección de AGENTS.md sobre templates
- [ ] Revisar templates en `backend/.../templates/contratos/`
- [ ] Entender diferencia ISSPOL vs ISSFA
- [ ] Generar un documento de prueba

### **Día 5: Práctica**
- [ ] Hacer un cambio pequeño (ej: agregar un campo)
- [ ] Compilar, verificar, commit, push
- [ ] Ver CI/CD en GitHub Actions

---

## 🆘 **¿NECESITAS AYUDA?**

### **Documentación**
1. **`README.md`** - Vista general, tecnologías, inicio rápido
2. **`AGENTS.md`** - Convenciones y workflows
3. **Este archivo** - Guía para IAs

### **Preguntas Frecuentes**

**P: ¿Cómo inicio el proyecto localmente?**
```bash
docker-compose -f docker-compose.local.yml up -d --build
```

**P: ¿Cómo reinicio después de cambios en Java?**
```bash
docker-compose -f docker-compose.local.yml restart backend_local
```

**P: ¿Cómo actualizo la base de datos?**
1. Editar `datos/00_gmarm_completo.sql`
2. `docker-compose -f docker-compose.local.yml down -v`
3. `docker-compose -f docker-compose.local.yml up -d`

**P: ¿Dónde están los templates de documentos?**
`backend/src/main/resources/templates/contratos/`

**P: ¿Cómo sé si uso ISSPOL o ISSFA?**
- Policía → ISSPOL
- Fuerza Terrestre, Naval, Aérea → ISSFA

**P: ¿Cómo compilo antes de push?**
```bash
cd backend && mvn clean install -DskipTests
cd ../frontend && npm run build
```

---

## ✅ **CHECKLIST ANTES DE HACER CAMBIOS**

- [ ] Leí la documentación relevante
- [ ] Entiendo el patrón Repository-Service-Controller (backend)
- [ ] Entiendo el patrón Component-Hook-Service (frontend)
- [ ] Sé que debo reiniciar Docker después de cambios en Java/templates
- [ ] Sé que debo compilar antes de hacer push
- [ ] Conozco la diferencia entre ISSPOL y ISSFA
- [ ] No voy a hardcodear valores de negocio
- [ ] Voy a actualizar el SQL maestro si cambio el esquema

---

## 🚀 **¡LISTO PARA EMPEZAR!**

Si eres una IA trabajando en GMARM y has leído este documento:

1. ✅ Ya tienes el contexto necesario
2. ✅ Conoces las reglas críticas
3. ✅ Sabes dónde buscar información adicional
4. ✅ Entiendes los patrones de código
5. ✅ Puedes empezar a hacer cambios siguiendo los workflows

**Recuerda:**
- 🔄 SIEMPRE reiniciar Docker después de cambios en Java/templates
- 📝 SIEMPRE actualizar SQL maestro
- ✅ SIEMPRE compilar antes de push
- 🎯 Un template por tipo de cliente
- 🏛️ ISSPOL (Policía) ≠ ISSFA (FF.AA.)

**¡Buena suerte programando! 🎉**

---

**Última actualización**: Marzo 2026

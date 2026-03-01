# Research: Firma Electrónica Visible (Estampado) para Documentos PDF

**Problem:** Implementar firma digital visible en PDFs generados, usando certificado .p12 por licencia
**Date:** 2026-02-26

## Problem Statement

El sistema GMARM genera documentos PDF (contratos, cotizaciones, solicitudes, autorizaciones, recibos) mediante Flying Saucer + Thymeleaf. Se necesita que cada licencia de importación pueda tener un certificado digital (.p12) asociado, y que al generar documentos se estampe una firma electrónica visible (recuadro con nombre del firmante y fecha) en la última página. El .p12 y su contraseña deben almacenarse cifrados en PostgreSQL.

## Affected Code

| File                                                                     | Role                                                | Key Functions                                                                     |
| ------------------------------------------------------------------------ | --------------------------------------------------- | --------------------------------------------------------------------------------- |
| `backend/.../model/Licencia.java`                                        | Entidad licencia (necesita campos para certificado) | campos actuales: `numero`, `nombre`, `titulo`, `ruc`                              |
| `backend/.../dto/LicenciaDTO.java`                                       | DTO licencia (necesita campos firma)                | `toDTO()` mapping                                                                 |
| `backend/.../mapper/LicenciaMapper.java`                                 | Mapeo Entity↔DTO                                    | `toDTO()`, `toEntity()`                                                           |
| `backend/.../service/LicenciaService.java`                               | CRUD licencias                                      | `crearLicencia()`, `actualizarLicencia()`                                         |
| `backend/.../controller/LicenciaController.java`                         | Endpoints REST licencia                             | `POST/PUT /api/licencia`                                                          |
| `backend/.../service/helper/documentos/DocumentoPDFUtils.java`           | Utilidades PDF compartidas                          | `guardarArchivo()` (L362), `generarPdf()` (L358), `obtenerLicenciaActiva()` (L74) |
| `backend/.../service/FlyingSaucerPdfService.java`                        | Genera byte[] PDF desde template                    | `generarPdfDesdeTemplate()`                                                       |
| `backend/.../service/helper/documentos/ContratoPDFGenerator.java`        | Genera contratos PDF                                | `generarYGuardar()`, `generarPDF()`                                               |
| `backend/.../service/helper/documentos/CotizacionPDFGenerator.java`      | Genera cotizaciones PDF                             | `generarYGuardar()`, `generarPDF()`                                               |
| `backend/.../service/helper/documentos/SolicitudCompraPDFGenerator.java` | Genera solicitudes PDF                              | `generarYGuardar()`, `generarPDF()`                                               |
| `backend/.../service/helper/documentos/AutorizacionPDFGenerator.java`    | Genera autorizaciones PDF                           | `generarYGuardar()`, `generarPDF()`                                               |
| `backend/.../service/helper/documentos/ReciboPDFGenerator.java`          | Genera recibos PDF                                  | `generarYGuardar()`, `generarPDF()`                                               |
| `backend/.../service/helper/GestionDocumentosServiceHelper.java`         | Orquestador de generación                           | `generarYGuardarDocumentos()`                                                     |
| `backend/.../model/DocumentoGenerado.java`                               | Entidad documento generado                          | ya tiene `fechaFirma`, `estado` con FIRMADO                                       |
| `backend/.../enums/EstadoDocumentoGenerado.java`                         | Estados de documento                                | ya incluye `FIRMADO`, `FIRMADO_CLIENTE`                                           |
| `backend/.../service/FileStorageService.java`                            | Almacenamiento de archivos                          | `guardarDocumentoGeneradoCliente()`                                               |
| `datos/00_gmarm_completo.sql`                                            | SQL maestro (fuente única de verdad)                | Tabla `licencia`, `documento_generado`                                            |
| `frontend/src/types/index.ts`                                            | Tipos TypeScript                                    | Interfaz Licencia (necesita campos firma)                                         |

## Data Flow

### Flujo actual de generación de documentos:

1. **Controller** → `ClienteDocumentController.java` endpoint `POST /api/clientes/{id}/generar-contrato`
2. → Valida cliente (email, documentos, estado grupo)
3. → Obtiene `Pago` activo del cliente
4. → **Orquestador** `GestionDocumentosServiceHelper.generarYGuardarDocumentos(cliente, pago)`
5. → Determina tipo cliente (civil/uniformado) y delega a generadores especializados
6. → **Generator** (ej: `ContratoPDFGenerator.generarYGuardar()`)
   - Elimina documentos anteriores del tipo
   - Obtiene armas, IVA, cuotas, licencia activa
   - `Licencia licencia = utils.obtenerLicenciaActiva(cliente)` — traversa Cliente → ClienteGrupoImportacion → GrupoImportacion → Licencia
   - Construye `Map<String, Object> variables` con todos los datos
   - Selecciona template Thymeleaf según tipo cliente
7. → **PDF Service** `FlyingSaucerPdfService.generarPdfDesdeTemplate(template, variables)`
   - Procesa template con Thymeleaf → HTML
   - ITextRenderer (Flying Saucer) renderiza HTML → `byte[] pdfBytes`
8. → **Storage** `DocumentoPDFUtils.guardarArchivo(cedula, pdfBytes, nombreArchivo)`
   - Delega a `FileStorageService.guardarDocumentoGeneradoCliente()`
   - Escribe `byte[]` a disco en `documentos_clientes/{cedula}/documentos_generados/`
9. → **Persistencia** Crea `DocumentoGenerado` entity con estado `GENERADO`
10. → **Email** Envía documentos como adjuntos

### Punto de intercepción para firma digital:

```
byte[] pdfBytes = generarPDF(cliente, pago);    // Paso 7: PDF sin firmar
// >>> AQUÍ: byte[] signedPdfBytes = firmaService.firmarPdf(pdfBytes, licencia); <<<
String rutaArchivo = utils.guardarArchivo(...);  // Paso 8: Guardar firmado
```

**Ubicación recomendada**: `DocumentoPDFUtils.guardarArchivo()` (L362) — centraliza la firma para TODOS los tipos de documento en un solo punto.

## Current Behavior

- **Licencia entity**: Tiene campos de negocio (nombre, titulo, RUC, banco) pero **NO tiene** campos para certificado digital (.p12), contraseña de certificado, ni huella digital del certificado.
- **DocumentoGenerado entity**: Ya tiene `fechaFirma` (LocalDateTime) y estados `FIRMADO`/`FIRMADO_CLIENTE` en el enum, pero **no se usan** — siempre queda en estado `GENERADO`.
- **PDF generation**: Genera `byte[]` sin firmar y los almacena directamente.
- **Templates HTML**: Todos los contratos tienen secciones de firma con espacio para nombre y firma manuscrita, pero **no hay firma digital embebida**.
- **No existe** ningún servicio de firma digital, cifrado de certificados, ni manejo de .p12.

## Constraints

- **Database**: SQL maestro `datos/00_gmarm_completo.sql` es la fuente de contexto, pero los cambios de schema se implementan como migraciones Flyway en `backend/src/main/resources/db/migration/` con la V correspondiente. Última migración existente: `V11__corregir_correos_recibo.sql`. La próxima migración será `V12__*.sql`.
- **Templates**: Un template por tipo de cliente (Policía→ISSPOL, FF.AA.→ISSFA, Civil). La firma visible debe funcionar con todos los templates sin modificarlos.
- **Docker**: Backend en `eclipse-temurin:21-jre`. Volumen `./documentacion:/app/documentacion` montado para archivos. Los .p12 no deben ir al filesystem — mejor en BD cifrados.
- **Java 21 + Spring Boot 3.4.5**: Verificado en `pom.xml` (L12, L23).
- **Flying Saucer 9.1.22**: Genera PDFs desde HTML. No tiene capacidad de firma. Usa OpenPDF (fork de iText 2.x) internamente.
- **Sin dependencias de firma**: No hay iText 7, PDFBox ni BouncyCastle en el `pom.xml` actual.
- **Backward Compatibility**: Los PDFs ya generados y almacenados no necesitan ser re-firmados. Solo nuevos documentos.
- **Memoria**: Producción limitada a 768MB heap. La firma debe ser eficiente en memoria.
- **Licencia**: Relación Cliente → ClienteGrupoImportacion → GrupoImportacion → Licencia. Cada grupo usa una licencia, y la firma debe ser la de ESA licencia.

## Existing Patterns

### Backend

- **SRP**: Servicios separados por responsabilidad (`*Service`, `*QueryService`, `*PDFGenerator`)
- **Generadores PDF**: `@Component` + `@RequiredArgsConstructor` + inyección de `DocumentoPDFUtils`
- **DocumentoPDFUtils**: Centraliza operaciones compartidas (fecha, template selection, storage)
- **Lombok**: `@Data`, `@RequiredArgsConstructor`, `@Slf4j` en todas las clases
- **Auditing**: `@EntityListeners(AuditingEntityListener.class)`, `@CreatedDate`, `@LastModifiedDate`
- **Enums**: `@Enumerated(EnumType.STRING)` — almacenados como texto en BD
- **Mapper manual**: `LicenciaMapper` con métodos estáticos `toDTO()`/`toEntity()`
- **Config desde BD**: `ConfiguracionSistemaService` para valores de negocio (IVA, etc.)

### Frontend

- **React Query**: `useQuery`/`useMutation` para comunicación con API
- **TypeScript interfaces**: En `frontend/src/types/index.ts`
- **API modules por dominio**: `licenseApi.ts`, `documentApi.ts`, etc.

## Test Coverage

- **Covered**: Nada. No existen tests en el proyecto (ni backend ni frontend).
- **Gaps**: 100% del código sin tests. Ni `backend/src/test/` ni tests frontend.
- **Test patterns**: `spring-boot-starter-test` está en `pom.xml` pero sin uso. No hay Vitest/Jest configurado en frontend.
- **Nota**: La dependencia de test existe, se pueden crear tests unitarios para el nuevo servicio de firma.

## Library Comparison

### Option A: Apache PDFBox + BouncyCastle (RECOMENDADO)

| Aspecto                 | Detalle                                                            |
| ----------------------- | ------------------------------------------------------------------ |
| **Licencia**            | Apache 2.0 (libre para uso comercial)                              |
| **Java 21**             | PDFBox 3.0.5 compatible; PDFBox 4.0 tested hasta Java 25           |
| **Spring Boot 3.4**     | Compatible                                                         |
| **Firma visible**       | Sí, con `PDVisibleSignDesigner` + `PDVisibleSigProperties`         |
| **Conflicto classpath** | Ninguno con Flying Saucer/OpenPDF                                  |
| **Maven**               | `pdfbox:3.0.5` + `bcprov-jdk18on:1.78.1` + `bcpkix-jdk18on:1.78.1` |

### Option B: iText 7 Sign

| Aspecto                 | Detalle                                                              |
| ----------------------- | -------------------------------------------------------------------- |
| **Licencia**            | AGPL v3 (requiere código abierto) o Comercial ($2,000-5,000/año)     |
| **Java 21**             | Compatible                                                           |
| **Firma visible**       | Sí, con `PdfSignatureAppearance`                                     |
| **Conflicto classpath** | Potencial confusión con OpenPDF (fork de iText 2.x en Flying Saucer) |
| **Maven**               | `itext-core:9.1.0` + `sign:9.1.0`                                    |

**Veredicto**: PDFBox + BouncyCastle. Licencia Apache 2.0 sin costo, sin conflictos, bien documentado.

## Encryption Strategy for .p12 Storage

- **Spring Security Crypto** (ya en classpath via `spring-boot-starter-security`):
  - `Encryptors.stronger(password, salt)` → AES-256-CBC con PKCS5
  - Sin dependencias adicionales
- **Almacenamiento en BD**: Campo `BYTEA` en PostgreSQL para .p12 cifrado, `VARCHAR(512)` para contraseña cifrada
- **Master key**: Variable de entorno `CERT_ENCRYPTION_KEY` (no en properties ni en BD)

## Posicionamiento Visual de la Firma Digital

### Requisito confirmado por el usuario

La firma digital visible debe estamparse **sobre la línea de firma**, en el espacio vacío que existe **encima del nombre de la licencia (lado izquierdo)**. La firma NO debe sobreponerse a ningún texto existente. El documento debe permanecer plenamente legible.

### Layout actual de firmas en los documentos

Los documentos (contrato, cotización) tienen una estructura de firmas al final con dos columnas:

```
        ____________________________          ____________________________
        |                          |          |                          |
        |   [ESPACIO PARA FIRMA]   |          |   [ESPACIO PARA FIRMA]   |
        |__________________________|          |__________________________|

        GUERRERO MARTINEZ JOSE LUIS           TNT. TEST TEST
        Distribuidor Autorizado               CC 1722829023.
        Ceská Zbrojovka
        CC. 1707815922

        ^^^ LADO LICENCIA ^^^                ^^^ LADO CLIENTE ^^^
```

### Posición exacta de la firma digital

La firma electrónica visible debe ir en el **lado izquierdo (licencia/importador)**, ocupando el espacio rectangular entre la línea horizontal y el nombre:

```
        ____________________________
        |  ┌──────────────────────┐ |
        |  │  FIRMA DIGITAL       │ |
        |  │  Firmado por:        │ |
        |  │  GUERRERO MARTINEZ   │ |
        |  │  JOSE LUIS           │ |
        |  │  Fecha: 26/02/2026   │ |
        |  │  14:30:00            │ |
        |  └──────────────────────┘ |
        |__________________________|

        GUERRERO MARTINEZ JOSE LUIS
        Distribuidor Autorizado
        Ceská Zbrojovka
        CC. 1707815922
```

### Reglas de posicionamiento

1. **Ubicación**: Lado izquierdo, sobre la línea de firma de la licencia/importador
2. **No superponer texto**: La firma debe caber en el espacio vacío sin tapar el nombre, título ni CC debajo
3. **Legibilidad**: El documento completo debe permanecer legible — la firma es un añadido limpio
4. **Consistencia**: Misma posición relativa en todos los tipos de documento (contrato, cotización, solicitud, autorización)

### Implicación técnica

Para posicionar correctamente la firma, el servicio de firma necesita:

- **Detectar la última página** del PDF
- **Calcular coordenadas** del rectángulo de firma basándose en la posición de la línea de firma del importador (lado izquierdo)
- **Dimensionar** el recuadro para que quepa el texto sin salirse del espacio disponible
- Usar coordenadas **relativas al margen izquierdo** y al **pie de la última página**
- La firma se estampa POST-generación sobre el PDF ya renderizado (no en el template HTML)

**Coordenadas estimadas** (página A4 = 595 x 842 puntos):

- **X**: ~50-70 pts desde margen izquierdo (alineado con la columna izquierda de firma)
- **Y**: ~100-150 pts desde el borde inferior (encima del bloque de nombre)
- **Ancho**: ~180-200 pts (ancho de la columna de firma)
- **Alto**: ~60-80 pts (suficiente para 4-5 líneas de texto pequeño)

Nota: Estas coordenadas son estimaciones iniciales. En implementación se deberán ajustar con el PDF real para garantizar que la firma quede en el espacio correcto sin tapar texto.

## Open Questions

1. **Firma por licencia o por usuario?** — El usuario pidió "en la licencia todo lo necesario para firmar". Esto implica que el certificado .p12 se asocia a la **Licencia** (no al usuario). Confirmar: cada licencia tiene su propio certificado .p12?
   Si, cada licencia tiene su propio certificado .p12.

2. **Qué documentos se firman?** — El usuario mencionó "contrato, cotización, luego los templates donde conste la firma de la licencia". Esto sugiere: CONTRATO, COTIZACION, SOLICITUD_COMPRA, AUTORIZACION. Los RECIBOS también? Necesita confirmación.
   Todos los documentos que contengan la firma de la licencia/importador.

3. **Contenido del recuadro de firma** — Solo texto (nombre + fecha + hora) o también una imagen de firma manuscrita/logo? El estilo visual actual muestra solo texto con línea, sugiere que texto es suficiente.
   la firma con el QR correspondiente y los datos del firmante.

4. **Certificado existente o auto-generado?** — El usuario tiene archivos .p12 reales emitidos por una CA (Autoridad Certificadora) ecuatoriana, o necesita que el sistema genere certificados auto-firmados para pruebas?
   Si tengo un archivo p12 para realizar pruebas

5. **Validez legal en Ecuador** — La firma electrónica en Ecuador se rige por la Ley de Comercio Electrónico. Si se requiere validez legal, el .p12 debe provenir de una CA acreditada (ANFAC, Security Data, etc.). Confirmar si es para validez legal o solo para estampado visual.
   Si es para validez legal y estampado visual

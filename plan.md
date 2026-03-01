# Plan: Firma Electrónica Visible para Documentos PDF

**Research:** research.md
**Date:** 2026-02-26
**Scope:** Task (2/6 complexity indicators)
**Estimated Phases:** 4

## Summary

Implementar firma digital visible con validez legal en los PDFs generados por GMARM. Cada licencia almacenará su certificado .p12 cifrado (AES-256) en PostgreSQL. Un endpoint REST independiente recibirá el ID del documento y un PIN de autorización para ejecutar la firma. El servicio de firma (PDFBox + BouncyCastle) operará POST-generación sobre el `byte[]` ya producido por Flying Saucer, estampando un recuadro visual con QR, datos del firmante y fecha en la última página, sobre la línea de firma del importador (lado izquierdo).

---

## Phase 1: Foundation — DB Migration + Maven Dependencies + Entity Changes ✅ COMPLETADO

**Goal:** La tabla `licencia` tiene campos para almacenar el certificado .p12 cifrado y el proyecto compila con PDFBox + BouncyCastle + ZXing.

### File Changes

| File | Action | What Changes |
| --- | --- | --- |
| `backend/src/main/resources/db/migration/V12__agregar_firma_electronica_licencia.sql` | Create | Migración Flyway: agrega columnas `certificado_p12`, `certificado_password_cifrado`, `certificado_huella`, `firma_habilitada` a tabla `licencia` |
| `backend/pom.xml` | Modify | Agregar dependencias: PDFBox 3.0.5, BouncyCastle bcprov-jdk18on 1.78.1, BouncyCastle bcpkix-jdk18on 1.78.1, ZXing core+javase 3.5.3 |
| `backend/.../model/Licencia.java` | Modify | Agregar campos: `certificadoP12` (byte[]), `certificadoPasswordCifrado` (String), `certificadoHuella` (String), `firmaHabilitada` (Boolean) |
| `backend/.../dto/LicenciaDTO.java` | Modify | Agregar campos de solo lectura: `firmaHabilitada` (Boolean), `certificadoHuella` (String), `tieneCertificado` (Boolean, derivado) — NO exponer el .p12 ni password |
| `backend/.../mapper/LicenciaMapper.java` | Modify | Mapear nuevos campos en `toDTO()`. En `toEntity()` NO mapear certificado (se gestiona por endpoint separado) |
| `datos/00_gmarm_completo.sql` | Modify | Agregar columnas de firma a la definición de tabla `licencia` para mantener contexto |
| `backend/src/main/resources/application.properties` | Modify | Agregar property: `app.signature.encryption-key=${CERT_ENCRYPTION_KEY:defaultDevKeyMustChange32Ch}` |

### Implementation Notes

**Migración V12:**
```sql
ALTER TABLE licencia ADD COLUMN certificado_p12 BYTEA;
ALTER TABLE licencia ADD COLUMN certificado_password_cifrado VARCHAR(512);
ALTER TABLE licencia ADD COLUMN certificado_huella VARCHAR(128);
ALTER TABLE licencia ADD COLUMN firma_habilitada BOOLEAN DEFAULT false;
```

**Entity Licencia.java** — agregar después de `fechaActualizacion` (L123):
```java
@Column(name = "certificado_p12", columnDefinition = "BYTEA")
private byte[] certificadoP12;

@Column(name = "certificado_password_cifrado", length = 512)
private String certificadoPasswordCifrado;

@Column(name = "certificado_huella", length = 128)
private String certificadoHuella;

@Column(name = "firma_habilitada")
private Boolean firmaHabilitada = false;
```

**DTO** — NO exponer bytes del certificado. Solo metadata:
```java
@JsonProperty("firma_habilitada")
private Boolean firmaHabilitada;

@JsonProperty("certificado_huella")
private String certificadoHuella;

@JsonProperty("tiene_certificado")
private Boolean tieneCertificado; // derivado: certificadoP12 != null
```

**Mapper `toDTO()`** — agregar:
```java
.firmaHabilitada(licencia.getFirmaHabilitada())
.certificadoHuella(licencia.getCertificadoHuella())
.tieneCertificado(licencia.getCertificadoP12() != null && licencia.getCertificadoP12().length > 0)
```

**pom.xml** — agregar después de flying-saucer-pdf (L78):
```xml
<!-- PDF Digital Signature -->
<dependency>
    <groupId>org.apache.pdfbox</groupId>
    <artifactId>pdfbox</artifactId>
    <version>3.0.5</version>
</dependency>
<dependency>
    <groupId>org.bouncycastle</groupId>
    <artifactId>bcprov-jdk18on</artifactId>
    <version>1.78.1</version>
</dependency>
<dependency>
    <groupId>org.bouncycastle</groupId>
    <artifactId>bcpkix-jdk18on</artifactId>
    <version>1.78.1</version>
</dependency>

<!-- QR Code generation for signature -->
<dependency>
    <groupId>com.google.zxing</groupId>
    <artifactId>core</artifactId>
    <version>3.5.3</version>
</dependency>
<dependency>
    <groupId>com.google.zxing</groupId>
    <artifactId>javase</artifactId>
    <version>3.5.3</version>
</dependency>
```

### Tests to Write

No tests en esta fase (no hay lógica de negocio nueva, solo schema + dependencias).

### Verification

```bash
cd backend && mvn clean compile -DskipTests
```

**Expected result:** Compila sin errores con las nuevas dependencias. Flyway migration queda lista para aplicarse al levantar.

---

## Phase 2: Certificate Encryption Service + Upload Endpoint ✅ COMPLETADO

**Goal:** Existe un servicio para cifrar/descifrar certificados .p12 con AES-256 y un endpoint para subir un certificado a una licencia.

### File Changes

| File | Action | What Changes |
| --- | --- | --- |
| `backend/.../service/CertificateEncryptionService.java` | Create | Servicio para cifrar/descifrar bytes del .p12 y la contraseña del certificado usando AES-256 via Spring Security Crypto |
| `backend/.../controller/LicenciaController.java` | Modify | Agregar endpoint `POST /api/licencia/{id}/certificado` (multipart: archivo .p12 + password). Agregar endpoint `DELETE /api/licencia/{id}/certificado` |
| `backend/.../service/LicenciaService.java` | Modify | Agregar métodos: `guardarCertificado(Long id, byte[] p12, String password)`, `eliminarCertificado(Long id)`, `obtenerCertificadoDescifrado(Long id)` |

### Implementation Notes

**CertificateEncryptionService.java** — seguir patrón de `@Service` + `@RequiredArgsConstructor` + `@Slf4j`:
```java
@Service
@Slf4j
public class CertificateEncryptionService {

    private final BytesEncryptor bytesEncryptor;
    private final TextEncryptor textEncryptor;

    public CertificateEncryptionService(
            @Value("${app.signature.encryption-key}") String encryptionKey) {
        String salt = KeyGenerators.string().generateKey(); // genera salt aleatorio
        // NOTA: salt se debe fijar para poder descifrar después
        // Usar un salt derivado del key para reproducibilidad
        String fixedSalt = Hex.encode(encryptionKey.substring(0, 8).getBytes()).toString();
        this.bytesEncryptor = Encryptors.stronger(encryptionKey, fixedSalt);
        this.textEncryptor = Encryptors.text(encryptionKey, fixedSalt);
    }

    public byte[] encryptBytes(byte[] plainBytes) { ... }
    public byte[] decryptBytes(byte[] encryptedBytes) { ... }
    public String encryptText(String plainText) { ... }
    public String decryptText(String encryptedText) { ... }
    public String calculateFingerprint(byte[] p12Bytes) { ... } // SHA-256 hex
}
```

**Importante — Contexto limpio del PIN**: El password del .p12 llega como `String` al endpoint, se cifra inmediatamente con `encryptText()`, y la referencia original se descarta. No se almacena en caché, sesión, ni log. El servicio debe usar `char[]` internamente donde sea posible y limpiar con `Arrays.fill()`.

**LicenciaController.java** — agregar endpoint después de `getInicialesImportador()` (L82):
```java
@PostMapping(value = "/{id}/certificado", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
@Operation(summary = "Subir certificado digital", description = "Sube un archivo .p12 y su contraseña para firma electrónica")
public ResponseEntity<?> uploadCertificado(
        @PathVariable Long id,
        @RequestParam("archivo") MultipartFile archivo,
        @RequestParam("password") String password) { ... }

@DeleteMapping("/{id}/certificado")
@Operation(summary = "Eliminar certificado digital")
public ResponseEntity<?> deleteCertificado(@PathVariable Long id) { ... }
```

**LicenciaService** — agregar en `LicenciaService.java` siguiendo patrón existente de `crearLicencia()`:
- `guardarCertificado()`: valida que el .p12 es válido (intenta cargarlo con el password), calcula huella SHA-256, cifra bytes + password, guarda en entity, activa `firmaHabilitada = true`
- Validación: intentar `KeyStore.getInstance("PKCS12").load(...)` con el password para verificar que es un .p12 válido antes de guardar
- `eliminarCertificado()`: limpia campos, desactiva `firmaHabilitada = false`
- `obtenerCertificadoDescifrado()`: descifra y retorna bytes + password (uso interno para firmar)

### Tests to Write

| Test File | Test Case | Asserts |
| --- | --- | --- |
| `backend/src/test/java/.../service/CertificateEncryptionServiceTest.java` | `encryptAndDecryptBytes_roundTrip` | Descifrado == original |
| `backend/src/test/java/.../service/CertificateEncryptionServiceTest.java` | `encryptAndDecryptText_roundTrip` | Descifrado == original |
| `backend/src/test/java/.../service/CertificateEncryptionServiceTest.java` | `calculateFingerprint_consistent` | Mismo input → mismo hash |

### Verification

```bash
cd backend && mvn clean compile -DskipTests
```

**Expected result:** Compila sin errores. Endpoint registrado en Swagger.

---

## Phase 3: PDF Signature Service — Firma Digital + Apariencia Visual + QR ✅ COMPLETADO

**Goal:** Existe un servicio que recibe `byte[]` PDF + datos de licencia + PIN, y retorna `byte[]` PDF firmado digitalmente con recuadro visual (QR + datos firmante) en la última página.

### File Changes

| File | Action | What Changes |
| --- | --- | --- |
| `backend/.../service/PDFSignatureService.java` | Create | Servicio core de firma: carga .p12, firma PDF con PDFBox+BouncyCastle, agrega apariencia visible con QR |
| `backend/.../service/helper/documentos/SignatureAppearanceBuilder.java` | Create | Helper que construye la imagen de apariencia visual: recuadro con QR (ZXing) + texto del firmante + fecha |

### Implementation Notes

**PDFSignatureService.java** — servicio principal de firma:
```java
@Service
@RequiredArgsConstructor
@Slf4j
public class PDFSignatureService {

    private final CertificateEncryptionService encryptionService;

    /**
     * Firma un PDF con el certificado de la licencia.
     * @param pdfBytes PDF sin firmar (generado por Flying Saucer)
     * @param licencia Licencia con certificado cifrado en BD
     * @param pin PIN/contraseña para autorizar la firma
     * @return byte[] PDF firmado con estampado visual
     */
    public byte[] firmarPdf(byte[] pdfBytes, Licencia licencia, String pin) {
        // 1. Descifrar .p12 y password de la BD
        byte[] p12Bytes = encryptionService.decryptBytes(licencia.getCertificadoP12());
        char[] certPassword = encryptionService.decryptText(licencia.getCertificadoPasswordCifrado()).toCharArray();

        try {
            // 2. Cargar KeyStore PKCS12
            KeyStore keyStore = KeyStore.getInstance("PKCS12");
            keyStore.load(new ByteArrayInputStream(p12Bytes), certPassword);
            String alias = keyStore.aliases().nextElement();
            PrivateKey privateKey = (PrivateKey) keyStore.getKey(alias, certPassword);
            Certificate[] chain = keyStore.getCertificateChain(alias);

            // 3. Firmar con PDFBox
            // ... (ver notas abajo)

        } finally {
            // 4. CONTEXTO LIMPIO: borrar material sensible de memoria
            Arrays.fill(certPassword, '\0');
            Arrays.fill(p12Bytes, (byte) 0);
        }
    }
}
```

**Flujo de firma con PDFBox 3.0.5:**
1. `PDDocument.load(pdfBytes)` — abrir PDF en memoria
2. Obtener última página: `doc.getPage(doc.getNumberOfPages() - 1)`
3. Crear `PDSignature` con filtro `Adobe.PPKLite` y subfiltro `adbe.pkcs7.detached`
4. Configurar `SignatureOptions` con apariencia visible (imagen generada por `SignatureAppearanceBuilder`)
5. Posicionar rectángulo en coordenadas del lado izquierdo de la firma:
   - **X**: 55, **Y**: 100, **Ancho**: 190, **Alto**: 75 (ajustable)
6. `doc.saveIncrementalForExternalSigning(output)` — firma incremental
7. Firmar contenido con BouncyCastle `CMSSignedDataGenerator`
8. Retornar `byte[]` firmado

**SignatureAppearanceBuilder.java** — construye la imagen del recuadro de firma:
```java
@Component
@Slf4j
public class SignatureAppearanceBuilder {

    /**
     * Genera una imagen PNG del recuadro de firma visible.
     * Contiene: QR + nombre firmante + fecha + datos certificado
     */
    public byte[] buildAppearanceImage(String signerName, String signerTitle,
                                        LocalDateTime signDate, String certificateInfo,
                                        String qrContent, int width, int height) {
        // 1. Crear BufferedImage
        // 2. Dibujar fondo blanco con borde fino
        // 3. Lado izquierdo: QR code (ZXing)
        //    - QR contiene: nombre, fecha, hash documento, serial certificado
        // 4. Lado derecho: texto
        //    - "Firmado electrónicamente por:"
        //    - NOMBRE COMPLETO (negrita)
        //    - Título/Cargo
        //    - Fecha: dd/MM/yyyy HH:mm
        //    - Serial certificado (truncado)
        // 5. Retornar PNG como byte[]
    }
}
```

**Layout del recuadro visual (190x75 pts):**
```
┌──────────────────────────────────────┐
│ ┌─────┐  Firmado electrónicamente    │
│ │ QR  │  por:                        │
│ │CODE │  GUERRERO MARTINEZ JOSE LUIS │
│ │     │  Distribuidor Autorizado     │
│ └─────┘  26/02/2026 14:30           │
│          Cert: A1B2...F9E0           │
└──────────────────────────────────────┘
```

**Sobre el PIN**: El `pin` parámetro sirve como autorización del usuario para ejecutar la firma. El password real del .p12 está cifrado en BD — el servicio lo descifra internamente. El PIN puede verificarse contra el password del usuario logueado o ser un PIN específico de firma (decisión de implementación: comparar con password del usuario autenticado via `PasswordEncoder.matches()`).

**Contexto limpio:**
- `certPassword` (`char[]`) se llena con `\0` en el `finally`
- `p12Bytes` (`byte[]`) se llena con `0` en el `finally`
- El `pin` String se descarta (no almacenado en campo de clase, solo parámetro local)
- No hacer log del PIN ni del password descifrado

### Tests to Write

| Test File | Test Case | Asserts |
| --- | --- | --- |
| `backend/src/test/.../service/PDFSignatureServiceTest.java` | `firmarPdf_withValidCertificate_returnsSignedPdf` | Output != input, output es PDF válido, tiene firma digital |
| `backend/src/test/.../service/PDFSignatureServiceTest.java` | `firmarPdf_withInvalidCertificate_throwsException` | Lanza excepción con mensaje claro |
| `backend/src/test/.../helper/SignatureAppearanceBuilderTest.java` | `buildAppearanceImage_returnsValidPng` | Output es PNG válido, dimensiones correctas |
| `backend/src/test/.../helper/SignatureAppearanceBuilderTest.java` | `buildAppearanceImage_containsQrCode` | QR decodificable, contiene datos esperados |

### Verification

```bash
cd backend && mvn clean compile -DskipTests
```

**Expected result:** Compila sin errores. Servicios de firma listos para integración.

---

## Phase 4: REST Endpoint de Firma + Integración con Pipeline de Documentos ✅ COMPLETADO

**Goal:** Un endpoint `POST /api/documentos/{id}/firmar` permite firmar documentos existentes. Los generadores de documentos invocan la firma automáticamente si la licencia tiene certificado y `firmaHabilitada=true`.

### File Changes

| File | Action | What Changes |
| --- | --- | --- |
| `backend/.../controller/DocumentoFirmaController.java` | Create | Controller REST: `POST /api/documentos/{id}/firmar` (recibe PIN, ejecuta firma), `GET /api/documentos/{id}/verificar-firma` (verifica integridad) |
| `backend/.../dto/FirmaRequestDTO.java` | Create | DTO simple: `pin` (String) |
| `backend/.../dto/FirmaResponseDTO.java` | Create | DTO respuesta: `documentoId`, `firmadoPor`, `fechaFirma`, `certificadoHuella`, `estado` |
| `backend/.../service/helper/documentos/DocumentoPDFUtils.java` | Modify | Modificar `guardarArchivo()` (L362) para aceptar Licencia opcional y firmar si `firmaHabilitada=true` |
| `backend/.../service/helper/documentos/ContratoPDFGenerator.java` | Modify | Pasar licencia a `guardarArchivo()` para firma automática |
| `backend/.../service/helper/documentos/CotizacionPDFGenerator.java` | Modify | Pasar licencia a `guardarArchivo()` para firma automática |
| `backend/.../service/helper/documentos/SolicitudCompraPDFGenerator.java` | Modify | Pasar licencia a `guardarArchivo()` para firma automática |
| `backend/.../service/helper/documentos/AutorizacionPDFGenerator.java` | Modify | Pasar licencia a `guardarArchivo()` para firma automática |
| `backend/.../service/helper/documentos/ReciboPDFGenerator.java` | Modify | Pasar licencia a `guardarArchivo()` para firma automática |
| `backend/.../config/SecurityConfig.java` | Modify | Agregar `/api/documentos/*/firmar` y `/api/documentos/*/verificar-firma` a rutas autenticadas |

### Implementation Notes

**DocumentoFirmaController.java** — seguir patrón de `ClienteDocumentController`:
```java
@RestController
@RequestMapping("/api/documentos")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Firma Digital", description = "Firma electrónica de documentos")
public class DocumentoFirmaController {

    private final DocumentoGeneradoRepository documentoRepo;
    private final FileStorageService fileStorageService;
    private final PDFSignatureService signatureService;
    private final LicenciaService licenciaService;

    @PostMapping("/{id}/firmar")
    @Operation(summary = "Firmar documento digitalmente")
    public ResponseEntity<FirmaResponseDTO> firmarDocumento(
            @PathVariable Long id,
            @RequestBody FirmaRequestDTO request) {
        // 1. Obtener DocumentoGenerado por ID
        // 2. Verificar estado (solo GENERADO puede firmarse)
        // 3. Obtener Licencia del cliente del documento
        //    (via cliente → grupoImportacion → licencia)
        // 4. Verificar que licencia tiene certificado y firmaHabilitada
        // 5. Cargar PDF actual desde filesystem
        // 6. Llamar signatureService.firmarPdf(pdfBytes, licencia, request.getPin())
        // 7. Sobreescribir archivo en disco con PDF firmado
        // 8. Actualizar DocumentoGenerado: estado=FIRMADO, fechaFirma=now(), tamanioBytes=nuevo
        // 9. Retornar FirmaResponseDTO
    }

    @GetMapping("/{id}/verificar-firma")
    @Operation(summary = "Verificar firma digital de un documento")
    public ResponseEntity<?> verificarFirma(@PathVariable Long id) {
        // 1. Cargar PDF desde filesystem
        // 2. Abrir con PDFBox, verificar firmas digitales
        // 3. Retornar: firmado(boolean), firmadoPor, fechaFirma, valida(boolean)
    }
}
```

**Integración automática en DocumentoPDFUtils.guardarArchivo()** (L362):

Cambiar firma del método para aceptar licencia opcional:
```java
// Antes:
public String guardarArchivo(String cedula, byte[] pdfBytes, String nombreArchivo) throws IOException {
    return fileStorageService.guardarDocumentoGeneradoCliente(cedula, pdfBytes, nombreArchivo);
}

// Después:
public String guardarArchivo(String cedula, byte[] pdfBytes, String nombreArchivo) throws IOException {
    return guardarArchivo(cedula, pdfBytes, nombreArchivo, null);
}

public String guardarArchivo(String cedula, byte[] pdfBytes, String nombreArchivo, Licencia licencia) throws IOException {
    byte[] bytesFinales = pdfBytes;
    if (licencia != null && Boolean.TRUE.equals(licencia.getFirmaHabilitada())
            && licencia.getCertificadoP12() != null) {
        try {
            bytesFinales = pdfSignatureService.firmarPdfAutomatico(pdfBytes, licencia);
            log.info("Documento firmado automáticamente con certificado de licencia {}", licencia.getNumero());
        } catch (Exception e) {
            log.warn("No se pudo firmar automáticamente, guardando sin firma: {}", e.getMessage());
            // Guardar sin firma — no bloquear generación
        }
    }
    return fileStorageService.guardarDocumentoGeneradoCliente(cedula, bytesFinales, nombreArchivo);
}
```

**Nota**: `firmarPdfAutomatico()` es un método separado en `PDFSignatureService` que usa el password cifrado en BD directamente (sin PIN del usuario). El endpoint `POST /api/documentos/{id}/firmar` usa `firmarPdf()` que requiere PIN como autorización adicional.

**Modificar cada generador** — ejemplo para `ContratoPDFGenerator.generarYGuardar()`:
```java
// Antes (línea ~50):
String rutaArchivo = utils.guardarArchivo(cliente.getNumeroIdentificacion(), pdfBytes, nombreArchivo);

// Después:
Licencia licencia = utils.obtenerLicenciaActiva(cliente);
String rutaArchivo = utils.guardarArchivo(cliente.getNumeroIdentificacion(), pdfBytes, nombreArchivo, licencia);
```

Aplicar el mismo cambio en los 5 generadores. En la mayoría ya se obtiene la licencia más arriba en el método `generarPDF()`, así que se puede reutilizar pasándola como parámetro.

### Tests to Write

| Test File | Test Case | Asserts |
| --- | --- | --- |
| `backend/src/test/.../controller/DocumentoFirmaControllerTest.java` | `firmarDocumento_withValidPin_returns200` | Estado cambia a FIRMADO, fechaFirma != null |
| `backend/src/test/.../controller/DocumentoFirmaControllerTest.java` | `firmarDocumento_documentoYaFirmado_returns400` | Error "Documento ya está firmado" |
| `backend/src/test/.../controller/DocumentoFirmaControllerTest.java` | `firmarDocumento_sinCertificado_returns400` | Error "Licencia no tiene certificado" |

### Verification

```bash
cd backend && mvn clean compile -DskipTests
```

**Expected result:** Compila sin errores. Endpoints de firma registrados en Swagger.

---

## Final Verification

```bash
# 1. Compilar backend completo
cd backend && mvn clean install -DskipTests

# 2. Compilar frontend (verificar que no rompimos tipos)
cd ../frontend && npm run build

# 3. Rebuild contenedores Docker (aplica migración V12 + nuevas dependencias)
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up -d --build

# 4. Verificar logs del backend
docker logs gmarm-backend-local --tail 50

# 5. Verificar migración aplicada
# En los logs buscar: "Successfully applied 1 migration to schema" (V12)

# 6. Test manual:
# - Subir certificado: POST /api/licencia/{id}/certificado (multipart)
# - Generar contrato de un cliente con licencia que tiene certificado
# - Verificar que el PDF descargado tiene firma digital visible
# - Probar endpoint: POST /api/documentos/{docId}/firmar con PIN
```

## Rollback Plan

1. **Revertir código**: `git checkout main -- backend/`
2. **Revertir migración**: Crear `V13__revertir_firma_electronica.sql`:
   ```sql
   ALTER TABLE licencia DROP COLUMN IF EXISTS certificado_p12;
   ALTER TABLE licencia DROP COLUMN IF EXISTS certificado_password_cifrado;
   ALTER TABLE licencia DROP COLUMN IF EXISTS certificado_huella;
   ALTER TABLE licencia DROP COLUMN IF EXISTS firma_habilitada;
   ```
3. **Rebuild**: `docker-compose -f docker-compose.local.yml down -v && docker-compose -f docker-compose.local.yml up -d --build`

## Out of Scope

- **Frontend UI para gestión de certificados** — se puede hacer después. Por ahora se sube via API/Swagger.
- **Timestamp Authority (TSA)** — sello de tiempo de tercero confiable. Se puede agregar después al `CMSSignedDataGenerator`.
- **OCSP/CRL validation** — verificación de revocación del certificado. Útil para producción, no para MVP.
- **Firma del lado del cliente** — el cliente NO firma digitalmente (firma manuscrita escaneada). Solo la licencia/importador firma electrónicamente.
- **Múltiples firmas por documento** — por ahora un documento se firma una vez por la licencia.
- **Hardware Security Module (HSM)** — almacenamiento de llaves en hardware. Para una fase futura de hardening.

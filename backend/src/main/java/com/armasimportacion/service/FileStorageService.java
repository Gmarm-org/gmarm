package com.armasimportacion.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    @Value("${app.documents.upload-dir:./documentacion/documentos_cliente}")
    private String uploadDir;

    @Value("${app.documents.max-size:10485760}") // 10MB por defecto
    private long maxFileSize;

    private static final String[] ALLOWED_EXTENSIONS = {
        "pdf", "jpg", "jpeg", "png", "doc", "docx"
    };

    public String storeClientDocument(String numeroIdentificacion, Long tipoDocumentoId, MultipartFile file, String nombreTipoDocumento) throws IOException {
        // Validar archivo
        validateFile(file);

        // Crear estructura: documentos_clientes/{cedula}/documentos_cargados/
        String relativePath = String.format("documentos_clientes/%s/documentos_cargados", numeroIdentificacion);
        
        // Generar nombre descriptivo: {nombreTipoDocumento}_{cedula}_{timestamp}.extension
        String fileName = generateDescriptiveFileName(nombreTipoDocumento, numeroIdentificacion, file.getOriginalFilename());
        
        // Ruta completa del archivo
        Path filePath = Paths.get(uploadDir, relativePath, fileName);
        
        // Crear directorios si no existen
        Files.createDirectories(filePath.getParent());
        
        // Guardar archivo
        Files.copy(file.getInputStream(), filePath);
        
        log.info("📄 Archivo de cliente guardado: {} (tipo: {}, cliente: {})", filePath, nombreTipoDocumento, numeroIdentificacion);
        
        // Retornar ruta relativa para almacenar en BD
        return Paths.get(relativePath, fileName).toString().replace("\\", "/");
    }
    
    /**
     * Método de compatibilidad - usa nombre del tipo de documento si está disponible
     */
    public String storeClientDocument(String numeroIdentificacion, Long tipoDocumentoId, MultipartFile file) throws IOException {
        // Si no se proporciona el nombre del tipo, usar el nombre original (compatibilidad hacia atrás)
        String nombreTipo = "documento"; // Fallback
        return storeClientDocument(numeroIdentificacion, tipoDocumentoId, file, nombreTipo);
    }
    
    /**
     * Genera un nombre de archivo descriptivo usando el nombre del tipo de documento
     * Formato: {nombreTipoDocumento}_{cedula}_{timestamp}.extension
     */
    private String generateDescriptiveFileName(String nombreTipoDocumento, String numeroIdentificacion, String originalFilename) {
        // Limpiar el nombre del tipo de documento (remover caracteres especiales, espacios, etc.)
        String nombreLimpio = sanitizeFileName(nombreTipoDocumento);
        
        // Obtener extensión del archivo original
        String extension = getFileExtension(originalFilename);
        
        // Generar timestamp único
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        
        // Generar nombre: {nombreTipoDocumento}_{cedula}_{timestamp}.extension
        return String.format("%s_%s_%s.%s", nombreLimpio, numeroIdentificacion, timestamp, extension);
    }
    
    /**
     * Sanitiza el nombre de archivo removiendo caracteres especiales y espacios
     */
    private String sanitizeFileName(String fileName) {
        if (fileName == null || fileName.trim().isEmpty()) {
            return "documento";
        }
        
        // Reemplazar espacios y caracteres especiales con guiones bajos
        // Mantener solo letras, números, guiones y guiones bajos
        String sanitized = fileName.trim()
            .replaceAll("[^a-zA-Z0-9\\s-]", "") // Remover caracteres especiales excepto espacios y guiones
            .replaceAll("\\s+", "_") // Reemplazar espacios con guiones bajos
            .replaceAll("-+", "-") // Remover guiones múltiples
            .replaceAll("_+", "_"); // Remover guiones bajos múltiples
        
        // Limitar longitud
        if (sanitized.length() > 50) {
            sanitized = sanitized.substring(0, 50);
        }
        
        return sanitized.isEmpty() ? "documento" : sanitized;
    }

    public byte[] loadFile(String filePath) throws IOException {
        Path fullPath = Paths.get(uploadDir, filePath);
        if (!Files.exists(fullPath)) {
            throw new IOException("Archivo no encontrado: " + filePath);
        }
        return Files.readAllBytes(fullPath);
    }

    public void deleteFile(String filePath) {
        try {
            // La ruta en BD es relativa: "documentos_clientes/{cedula}/documentos_cargados/archivo.pdf"
            // uploadDir es "./documentacion/documentos_cliente" (relativo a /app en Docker)
            // Por lo tanto, la ruta completa es: uploadDir + "/" + filePath
            // IMPORTANTE: uploadDir se resuelve a /app/documentacion/documentos_cliente en Docker
            Path fullPath = Paths.get(uploadDir, filePath);
            Path absolutePath = fullPath.toAbsolutePath();
            
            log.info("🗑️ Intentando eliminar archivo - ruta relativa BD: {}", filePath);
            log.info("🗑️ uploadDir: {}", uploadDir);
            log.info("🗑️ Ruta completa construida: {}", absolutePath);
            
            if (Files.exists(absolutePath)) {
                Files.delete(absolutePath);
                log.info("✅ Archivo físico eliminado exitosamente: {}", absolutePath);
            } else {
                log.warn("⚠️ Archivo no existe en la ruta esperada: {}", absolutePath);
                
                // Intentar rutas alternativas para diagnóstico
                String[] rutasAlternativas = {
                    "/app/documentacion/documentos_cliente/" + filePath,
                    "/app/documentacion/" + filePath,
                    filePath
                };
                
                for (String rutaAlt : rutasAlternativas) {
                    Path pathAlt = Paths.get(rutaAlt);
                    if (Files.exists(pathAlt)) {
                        log.info("🔍 Archivo encontrado en ruta alternativa: {}, eliminando...", pathAlt);
                        Files.delete(pathAlt);
                        log.info("✅ Archivo eliminado de ruta alternativa: {}", pathAlt);
                        return;
                    }
                }
                
                log.warn("⚠️ Archivo no encontrado en ninguna ruta alternativa. Puede que ya haya sido eliminado.");
            }
        } catch (IOException e) {
            log.error("❌ Error eliminando archivo {}: {}", filePath, e.getMessage(), e);
            throw new RuntimeException("Error eliminando archivo: " + e.getMessage(), e);
        }
    }

    private void validateFile(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IOException("El archivo está vacío");
        }

        if (file.getSize() > maxFileSize) {
            throw new IOException("El archivo excede el tamaño máximo permitido: " + (maxFileSize / 1024 / 1024) + "MB");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.trim().isEmpty()) {
            throw new IOException("Nombre de archivo inválido");
        }

        String extension = getFileExtension(originalFilename);
        boolean isValidExtension = false;
        for (String allowedExt : ALLOWED_EXTENSIONS) {
            if (allowedExt.equalsIgnoreCase(extension)) {
                isValidExtension = true;
                break;
            }
        }

        if (!isValidExtension) {
            throw new IOException("Tipo de archivo no permitido. Solo se permiten: " + String.join(", ", ALLOWED_EXTENSIONS));
        }
    }

    
    /**
     * Crear estructura de directorios para contratos (deprecated - usar guardarDocumentoGeneradoCliente)
     */
    public String storeContractDocument(String numeroIdentificacion, MultipartFile file) throws IOException {
        validateFile(file);
        
        String relativePath = String.format("documentos_clientes/%s/documentos_generados", numeroIdentificacion);
        String fileName = generateUniqueFileName(file.getOriginalFilename());
        
        Path filePath = Paths.get(uploadDir, relativePath, fileName);
        Files.createDirectories(filePath.getParent());
        Files.copy(file.getInputStream(), filePath);
        
        log.info("Contrato guardado: {}", filePath);
        
        return Paths.get(relativePath, fileName).toString().replace("\\", "/");
    }
    
    /**
     * Crear estructura de directorios para documentos de importación (deprecated - usar storeGrupoImportacionDocument)
     * Estructura: documentos_importacion/generales/documentos_cargados/
     */
    public String storeImportDocument(MultipartFile file) throws IOException {
        validateFile(file);
        
        String relativePath = "documentos_importacion/generales/documentos_cargados";
        
        String fileName = generateUniqueFileName(file.getOriginalFilename());
        
        Path filePath = Paths.get(uploadDir, relativePath, fileName);
        Files.createDirectories(filePath.getParent());
        Files.copy(file.getInputStream(), filePath);
        
        log.info("Documento de importación guardado: {}", filePath);
        
        return Paths.get(relativePath, fileName).toString().replace("\\", "/");
    }

    /**
     * Guarda un documento de grupo de importación
     * Estructura: documentos_importacion/{grupoId}/documentos_cargados/
     */
    public String storeGrupoImportacionDocument(Long grupoId, Long tipoDocumentoId, MultipartFile file) throws IOException {
        validateFile(file);
        
        // Crear estructura: documentos_importacion/{grupoId}/documentos_cargados/
        String relativePath = String.format("documentos_importacion/%d/documentos_cargados", grupoId);
        
        String fileName = generateUniqueFileName(file.getOriginalFilename());
        
        Path filePath = Paths.get(uploadDir, relativePath, fileName);
        Files.createDirectories(filePath.getParent());
        Files.copy(file.getInputStream(), filePath);
        
        log.info("Documento de grupo de importación guardado: {}", filePath);
        
        return Paths.get(relativePath, fileName).toString().replace("\\", "/");
    }

    /**
     * Genera un nombre único basado en el nombre original del archivo del usuario
     */
    private String generateUniqueFileNameFromOriginal(String originalFilename, String identificador) {
        String extension = getFileExtension(originalFilename);
        String baseName = originalFilename.substring(0, originalFilename.lastIndexOf('.'));
        
        // Generar timestamp único para evitar conflictos
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        
        // Generar nombre: nombreOriginal_identificador_timestamp.extension
        return String.format("%s_%s_%s.%s", baseName, identificador, timestamp, extension);
    }
    
    private String generateClientDocumentFileName(Long clienteId, Long tipoDocumentoId, String originalFilename) {
        String extension = getFileExtension(originalFilename);
        
        // Mapear tipos de documento a nombres cortos
        String tipoNombre = getTipoDocumentoShortName(tipoDocumentoId);
        
        // Generar nombre: tipo_clienteId.extension
        return String.format("%s_%d.%s", tipoNombre, clienteId, extension);
    }
    
    private String getTipoDocumentoShortName(Long tipoDocumentoId) {
        // Mapeo de IDs a nombres cortos basado en la base de datos
        switch (tipoDocumentoId.intValue()) {
            case 1: return "cedula";           // Copia de cédula (Cupo Civil)
            case 2: return "formulario";       // Formulario de solicitud (Cupo Civil)
            case 3: return "antecedentes";     // Antecedentes Penales (Cupo Civil)
            case 4: return "consejo";          // Consejo de la Judicatura (Cupo Civil)
            case 5: return "fiscalia";         // Fiscalía (Cupo Civil)
            case 6: return "satje";            // SATJE (Cupo Civil)
            case 7: return "credencial";       // Credencial militar/policial (Extracupo Uniformado)
            case 8: return "servicio_activo";  // Certificado de servicio activo (Extracupo Uniformado)
            case 9: return "cedula";           // Copia de cédula (Extracupo Uniformado)
            case 10: return "formulario";      // Formulario de solicitud (Extracupo Uniformado)
            case 11: return "antecedentes";    // Antecedentes Penales (Extracupo Uniformado)
            case 12: return "consejo";         // Consejo de la Judicatura (Extracupo Uniformado)
            case 13: return "fiscalia";        // Fiscalía (Extracupo Uniformado)
            case 14: return "satje";           // SATJE (Extracupo Uniformado)
            case 15: return "cedula_rep";      // Cédula del representante legal (Extracupo Empresa)
            case 16: return "nombramiento";    // Nombramiento representante legal (Extracupo Empresa)
            case 17: return "permiso";         // Permiso de funcionamiento (Extracupo Empresa)
            case 18: return "ruc";             // RUC de la empresa (Extracupo Empresa)
            case 19: return "formulario";      // Formulario de solicitud (Extracupo Empresa)
            case 20: return "cedula";          // Copia de cédula (Cupo Deportista)
            case 21: return "formulario";      // Formulario de solicitud (Cupo Deportista)
            case 22: return "club_deportivo";  // Credencial de club deportivo (Cupo Deportista)
            case 23: return "tenencia_armas";  // Credencial de tenencia de armas (Cupo Deportista)
            case 24: return "antecedentes";    // Antecedentes Penales (Cupo Deportista)
            case 25: return "consejo";         // Consejo de la Judicatura (Cupo Deportista)
            case 26: return "fiscalia";        // Fiscalía (Cupo Deportista)
            case 27: return "satje";           // SATJE (Cupo Deportista)
            default: return "documento";       // Fallback
        }
    }

    private String generateUniqueFileName(String originalFilename) {
        String extension = getFileExtension(originalFilename);
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String uuid = UUID.randomUUID().toString().substring(0, 8);
        
        return String.format("%s_%s.%s", timestamp, uuid, extension);
    }

    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex > 0) {
            return filename.substring(lastDotIndex + 1).toLowerCase();
        }
        return "";
    }

    /**
     * Guarda un archivo generado (como PDFs de contratos)
     */
    public String guardarArchivo(byte[] contenido, String nombreArchivo, String subdirectorio) throws IOException {
        // Crear estructura de directorios
        String relativePath = createDirectoryStructure(null, null, subdirectorio);
        
        // Ruta completa del archivo
        Path filePath = Paths.get(uploadDir, relativePath, nombreArchivo);
        
        // Crear directorios si no existen
        Files.createDirectories(filePath.getParent());
        
        // Guardar archivo
        Files.write(filePath, contenido);
        
        log.info("Archivo generado guardado: {}", filePath);
        
        return relativePath + "/" + nombreArchivo;
    }

    /**
     * Guarda un documento generado para un grupo de importación
     * Estructura: documentos_importacion/{grupoId}/documentos_generados/{nombreArchivo}
     */
    public String guardarDocumentoGeneradoGrupoImportacion(Long grupoId, byte[] contenido, String nombreArchivo) throws IOException {
        // Crear estructura: documentos_importacion/{grupoId}/documentos_generados/
        String relativePath = String.format("documentos_importacion/%d/documentos_generados", grupoId);
        
        // Ruta completa del archivo
        Path filePath = Paths.get(uploadDir, relativePath, nombreArchivo);
        
        // Crear directorios si no existen
        Files.createDirectories(filePath.getParent());
        
        // Guardar archivo
        Files.write(filePath, contenido);
        
        log.info("Documento generado de grupo de importación guardado: {}", filePath);
        
        return relativePath + "/" + nombreArchivo;
    }

    /**
     * Guarda un documento generado para un cliente
     * Estructura: documentos_clientes/{numeroIdentificacion}/documentos_generados/{nombreArchivo}
     */
    public String guardarDocumentoGeneradoCliente(String numeroIdentificacion, byte[] contenido, String nombreArchivo) throws IOException {
        // Crear estructura: documentos_clientes/{numeroIdentificacion}/documentos_generados/
        String relativePath = String.format("documentos_clientes/%s/documentos_generados", numeroIdentificacion);
        
        // Ruta completa del archivo
        Path filePath = Paths.get(uploadDir, relativePath, nombreArchivo);
        
        // Crear directorios si no existen
        Files.createDirectories(filePath.getParent());
        
        // Guardar archivo
        Files.write(filePath, contenido);
        
        log.info("Documento generado de cliente guardado: {}", filePath);
        
        return relativePath + "/" + nombreArchivo;
    }

    /**
     * Crea estructura de directorios con subdirectorio personalizado
     */
    private String createDirectoryStructure(Long clienteId, Long tipoDocumentoId, String subdirectorio) {
        LocalDateTime now = LocalDateTime.now();
        String year = now.format(DateTimeFormatter.ofPattern("yyyy"));
        String month = now.format(DateTimeFormatter.ofPattern("MM"));
        
        if (subdirectorio != null) {
            return String.format("%s/%s/%s", subdirectorio, year, month);
        } else if (clienteId != null && tipoDocumentoId != null) {
            return String.format("clientes/%d/documentos/%d/%s/%s", clienteId, tipoDocumentoId, year, month);
        } else {
            return String.format("generados/%s/%s", year, month);
        }
    }
}

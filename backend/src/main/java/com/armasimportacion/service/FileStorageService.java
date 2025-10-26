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

    public String storeClientDocument(Long clienteId, Long tipoDocumentoId, MultipartFile file) throws IOException {
        // Validar archivo
        validateFile(file);

        // Crear estructura de directorios para documentos de cliente
        String relativePath = createClientDocumentStructure(clienteId, tipoDocumentoId);
        
        // Generar nombre único basado en el nombre original del usuario
        String fileName = generateUniqueFileNameFromOriginal(file.getOriginalFilename(), clienteId);
        
        // Ruta completa del archivo
        Path filePath = Paths.get(uploadDir, relativePath, fileName);
        
        // Crear directorios si no existen
        Files.createDirectories(filePath.getParent());
        
        // Guardar archivo
        Files.copy(file.getInputStream(), filePath);
        
        log.info("Archivo de cliente guardado: {}", filePath);
        
        // Retornar ruta relativa para almacenar en BD
        return Paths.get(relativePath, fileName).toString().replace("\\", "/");
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
            Path fullPath = Paths.get(uploadDir, filePath);
            if (Files.exists(fullPath)) {
                Files.delete(fullPath);
                log.info("Archivo eliminado: {}", fullPath);
            }
        } catch (IOException e) {
            log.error("Error eliminando archivo: {}", filePath, e);
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
     * Crear estructura de directorios para documentos de cliente
     */
    private String createClientDocumentStructure(Long clienteId, Long tipoDocumentoId) {
        LocalDateTime now = LocalDateTime.now();
        String datePath = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        
        return String.format("cliente_%d/documentos%s", 
            clienteId, datePath);
    }
    
    /**
     * Crear estructura de directorios para contratos
     */
    public String storeContractDocument(Long clienteId, MultipartFile file) throws IOException {
        validateFile(file);
        
        String relativePath = String.format("cliente_%d/contratos", clienteId);
        String fileName = generateUniqueFileName(file.getOriginalFilename());
        
        Path filePath = Paths.get(uploadDir, relativePath, fileName);
        Files.createDirectories(filePath.getParent());
        Files.copy(file.getInputStream(), filePath);
        
        log.info("Contrato guardado: {}", filePath);
        
        return Paths.get(relativePath, fileName).toString().replace("\\", "/");
    }
    
    /**
     * Crear estructura de directorios para documentos de importación
     */
    public String storeImportDocument(MultipartFile file) throws IOException {
        validateFile(file);
        
        LocalDateTime now = LocalDateTime.now();
        String datePath = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String relativePath = String.format("importacion%s", datePath);
        
        String fileName = generateUniqueFileName(file.getOriginalFilename());
        
        Path filePath = Paths.get(uploadDir, relativePath, fileName);
        Files.createDirectories(filePath.getParent());
        Files.copy(file.getInputStream(), filePath);
        
        log.info("Documento de importación guardado: {}", filePath);
        
        return Paths.get(relativePath, fileName).toString().replace("\\", "/");
    }

    /**
     * Genera un nombre único basado en el nombre original del archivo del usuario
     */
    private String generateUniqueFileNameFromOriginal(String originalFilename, Long clienteId) {
        String extension = getFileExtension(originalFilename);
        String baseName = originalFilename.substring(0, originalFilename.lastIndexOf('.'));
        
        // Generar timestamp único para evitar conflictos
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        
        // Generar nombre: nombreOriginal_clienteId_timestamp.extension
        return String.format("%s_%d_%s.%s", baseName, clienteId, timestamp, extension);
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

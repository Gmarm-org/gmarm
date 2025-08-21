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

    @Value("${app.documents.upload-dir:./uploads}")
    private String uploadDir;

    @Value("${app.documents.max-size:10485760}") // 10MB por defecto
    private long maxFileSize;

    private static final String[] ALLOWED_EXTENSIONS = {
        "pdf", "jpg", "jpeg", "png", "doc", "docx"
    };

    public String storeClientDocument(Long clienteId, Long tipoDocumentoId, MultipartFile file) throws IOException {
        // Validar archivo
        validateFile(file);

        // Crear estructura de directorios
        String relativePath = createDirectoryStructure(clienteId, tipoDocumentoId);
        
        // Generar nombre único del archivo
        String fileName = generateUniqueFileName(file.getOriginalFilename());
        
        // Ruta completa del archivo
        Path filePath = Paths.get(uploadDir, relativePath, fileName);
        
        // Crear directorios si no existen
        Files.createDirectories(filePath.getParent());
        
        // Guardar archivo
        Files.copy(file.getInputStream(), filePath);
        
        log.info("Archivo guardado: {}", filePath);
        
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

    private String createDirectoryStructure(Long clienteId, Long tipoDocumentoId) {
        LocalDateTime now = LocalDateTime.now();
        String datePath = now.format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        
        return String.format("clientes/%d/documentos/%d/%s", 
            clienteId, tipoDocumentoId, datePath);
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
}

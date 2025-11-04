package com.armasimportacion.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;

@Service
@Slf4j
public class ArmaImageService {

    @Value("${app.weapons.images-dir:./uploads/images/weapons}")
    private String weaponsImagesDir;

    @Value("${app.weapons.max-image-size:41943040}") // 40MB por defecto (antes 5MB)
    private long maxImageSize;

    private static final List<String> ALLOWED_IMAGE_EXTENSIONS = Arrays.asList(
        "png", "jpg", "jpeg", "webp", "svg"
    );

    /**
     * Guarda una nueva imagen para una arma
     * @param armaId ID de la arma
     * @param imageFile Archivo de imagen
     * @return Ruta relativa de la imagen guardada
     */
    public String saveWeaponImage(Long armaId, MultipartFile imageFile) throws IOException {
        log.info("Guardando imagen para arma ID: {}", armaId);
        
        // Validar archivo
        validateImageFile(imageFile);
        
        // Crear directorio si no existe
        Path weaponsDir = Paths.get(weaponsImagesDir);
        if (!Files.exists(weaponsDir)) {
            Files.createDirectories(weaponsDir);
            log.info("Directorio de imágenes de armas creado: {}", weaponsDir);
        }
        
        // Generar nombre del archivo: weapon_{ID}.{extensión}
        String originalFilename = imageFile.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String newFilename = String.format("weapon_%d.%s", armaId, extension);
        
        // Ruta completa del archivo
        Path imagePath = weaponsDir.resolve(newFilename);
        
        // Si ya existe una imagen con ese nombre, eliminarla primero
        if (Files.exists(imagePath)) {
            Files.delete(imagePath);
            log.info("Imagen anterior eliminada: {}", imagePath);
        }
        
        // Guardar nueva imagen
        Files.copy(imageFile.getInputStream(), imagePath);
        log.info("Nueva imagen guardada: {}", imagePath);
        
        // Retornar ruta relativa para almacenar en BD
        return String.format("/images/weapons/%s", newFilename);
    }

    /**
     * Elimina la imagen de una arma
     * @param imageUrl URL de la imagen a eliminar
     */
    public void deleteWeaponImage(String imageUrl) {
        if (imageUrl == null || imageUrl.trim().isEmpty()) {
            return;
        }
        
        try {
            // Extraer el nombre del archivo de la URL
            String filename = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
            Path imagePath = Paths.get(weaponsImagesDir, filename);
            
            if (Files.exists(imagePath)) {
                Files.delete(imagePath);
                log.info("Imagen de arma eliminada: {}", imagePath);
            }
        } catch (IOException e) {
            log.error("Error eliminando imagen de arma: {}", imageUrl, e);
        }
    }

    /**
     * Valida que el archivo sea una imagen válida
     */
    private void validateImageFile(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IOException("El archivo de imagen está vacío");
        }

        if (file.getSize() > maxImageSize) {
            throw new IOException("La imagen excede el tamaño máximo permitido: " + (maxImageSize / 1024 / 1024) + "MB");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.trim().isEmpty()) {
            throw new IOException("Nombre de archivo de imagen inválido");
        }

        String extension = getFileExtension(originalFilename);
        if (!ALLOWED_IMAGE_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new IOException("Tipo de imagen no permitido. Solo se permiten: " + String.join(", ", ALLOWED_IMAGE_EXTENSIONS));
        }

        // Validar que sea realmente una imagen
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IOException("El archivo no es una imagen válida");
        }
    }

    /**
     * Obtiene la extensión de un archivo
     */
    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex > 0) {
            return filename.substring(lastDotIndex + 1).toLowerCase();
        }
        return "";
    }

    /**
     * Verifica si una imagen existe
     */
    public boolean imageExists(String imageUrl) {
        if (imageUrl == null || imageUrl.trim().isEmpty()) {
            return false;
        }
        
        try {
            String filename = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
            Path imagePath = Paths.get(weaponsImagesDir, filename);
            return Files.exists(imagePath);
        } catch (Exception e) {
            log.error("Error verificando existencia de imagen: {}", imageUrl, e);
            return false;
        }
    }
}

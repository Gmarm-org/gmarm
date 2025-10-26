package com.armasimportacion.controller;

import com.armasimportacion.service.ArmaImageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/images")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://localhost:8080"})
public class ImageController {

    @Value("${app.weapons.images-dir:./uploads/images/weapons}")
    private String weaponsImagesDir;

    private final ArmaImageService armaImageService;

    /**
     * Sirve imágenes de armas
     */
    @GetMapping("/weapons/{filename:.+}")
    public ResponseEntity<Resource> serveWeaponImage(@PathVariable String filename) {
        log.info("Solicitud para servir imagen de arma: {}", filename);
        
        try {
            Path imagePath = Paths.get(weaponsImagesDir, filename);
            Resource resource = new UrlResource(imagePath.toUri());
            
            if (resource.exists() && resource.isReadable()) {
                // Determinar el tipo de contenido basado en la extensión
                String contentType = determineContentType(filename);
                
                log.info("Imagen de arma servida exitosamente: {}", filename);
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                log.warn("Imagen de arma no encontrada o no legible: {}", filename);
                return ResponseEntity.notFound().build();
            }
            
        } catch (MalformedURLException e) {
            log.error("Error formando URL para imagen: {}", filename, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Verifica si una imagen existe
     */
    @GetMapping("/weapons/{filename:.+}/exists")
    public ResponseEntity<Boolean> checkImageExists(@PathVariable String filename) {
        log.info("Verificando existencia de imagen: {}", filename);
        
        try {
            Path imagePath = Paths.get(weaponsImagesDir, filename);
            Resource resource = new UrlResource(imagePath.toUri());
            boolean exists = resource.exists() && resource.isReadable();
            
            log.info("Imagen {} existe: {}", filename, exists);
            return ResponseEntity.ok(exists);
            
        } catch (MalformedURLException e) {
            log.error("Error verificando imagen: {}", filename, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Determina el tipo de contenido basado en la extensión del archivo
     */
    private String determineContentType(String filename) {
        String extension = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        
        return switch (extension) {
            case "png" -> "image/png";
            case "jpg", "jpeg" -> "image/jpeg";
            case "webp" -> "image/webp";
            case "svg" -> "image/svg+xml";
            case "gif" -> "image/gif";
            default -> "application/octet-stream";
        };
    }
}

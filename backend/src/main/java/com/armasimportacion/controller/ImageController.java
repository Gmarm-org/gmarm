package com.armasimportacion.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Controlador para servir imágenes de forma segura
 * 
 * Si la imagen no existe, retorna un placeholder en lugar de error 500.
 * Esto previene que el sistema se caiga por imágenes faltantes.
 */
@RestController
@RequestMapping("/images")
@Slf4j
public class ImageController {

    @Value("${app.upload.dir:./documentacion}")
    private String uploadDir;

    private final ResourceLoader resourceLoader;

    public ImageController(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    @GetMapping("/weapons/{filename:.+}")
    public ResponseEntity<Resource> getWeaponImage(@PathVariable String filename) {
        try {
            // Intentar cargar la imagen solicitada
            Path imagePath = Paths.get(uploadDir).resolve("images/weapons").resolve(filename).normalize();
            Resource resource = new UrlResource(imagePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                // Imagen encontrada - servirla
                log.debug("Imagen encontrada: {}", filename);
                
                // Detectar tipo de contenido
                String contentType = Files.probeContentType(imagePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
                
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CACHE_CONTROL, "max-age=3600")
                        .body(resource);
            } else {
                // Imagen no encontrada - retornar placeholder
                log.warn("Imagen no encontrada: {} - Sirviendo placeholder", filename);
                return getPlaceholderImage();
            }
        } catch (Exception e) {
            // Error inesperado - retornar placeholder (NO error 500)
            log.error("Error cargando imagen {}: {} - Sirviendo placeholder", filename, e.getMessage());
            return getPlaceholderImage();
        }
    }

    /**
     * Retorna imagen placeholder cuando la imagen solicitada no existe
     * Esto previene errores 500 y caídas del sistema
     */
    private ResponseEntity<Resource> getPlaceholderImage() {
        try {
            // Buscar default-weapon.svg en uploads/images/weapons
            Path placeholderPath = Paths.get(uploadDir)
                    .resolve("images/weapons")
                    .resolve("default-weapon.svg")
                    .normalize();
            
            Resource placeholder = new UrlResource(placeholderPath.toUri());
            
            if (placeholder.exists() && placeholder.isReadable()) {
                log.debug("Sirviendo placeholder: default-weapon.svg (uploads)");
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType("image/svg+xml"))
                        .header(HttpHeaders.CACHE_CONTROL, "max-age=3600")
                        .body(placeholder);
            } else {
                Resource classpathPlaceholder = resourceLoader.getResource(
                        "classpath:/static/images/weapons/default-weapon.svg");
                if (classpathPlaceholder.exists()) {
                    log.debug("Sirviendo placeholder: default-weapon.svg (classpath)");
                    return ResponseEntity.ok()
                            .contentType(MediaType.parseMediaType("image/svg+xml"))
                            .header(HttpHeaders.CACHE_CONTROL, "max-age=3600")
                            .body(classpathPlaceholder);
                }
                // Si ni siquiera existe el placeholder, crear respuesta vacía con 404
                // pero NO romper el sistema (error 500)
                log.warn("Placeholder default-weapon.svg no existe - Retornando 404 silencioso");
                return ResponseEntity.notFound()
                        .header(HttpHeaders.CACHE_CONTROL, "no-cache")
                        .build();
            }
        } catch (Exception e) {
            // Último recurso - 404 silencioso sin romper el sistema
            log.error("Error critico sirviendo placeholder: {} - Retornando 404", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
}

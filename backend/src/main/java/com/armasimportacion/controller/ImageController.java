package com.armasimportacion.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
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

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @GetMapping("/weapons/{filename:.+}")
    public ResponseEntity<Resource> getWeaponImage(@PathVariable String filename) {
        try {
            // Intentar cargar la imagen solicitada
            Path imagePath = Paths.get(uploadDir).resolve("images/weapons").resolve(filename).normalize();
            Resource resource = new UrlResource(imagePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                // Imagen encontrada - servirla
                log.debug("✅ Imagen encontrada: {}", filename);
                
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
                log.warn("⚠️ Imagen no encontrada: {} - Sirviendo placeholder", filename);
                return getPlaceholderImage();
            }
        } catch (Exception e) {
            // Error inesperado - retornar placeholder (NO error 500)
            log.error("❌ Error cargando imagen {}: {} - Sirviendo placeholder", filename, e.getMessage());
            return getPlaceholderImage();
        }
    }

    /**
     * Retorna imagen placeholder cuando la imagen solicitada no existe
     * Esto previene errores 500 y caídas del sistema
     */
    private ResponseEntity<Resource> getPlaceholderImage() {
        try {
            // Buscar default-weapon.jpg en uploads/images/weapons
            Path placeholderPath = Paths.get(uploadDir)
                    .resolve("images/weapons")
                    .resolve("default-weapon.jpg")
                    .normalize();
            
            Resource placeholder = new UrlResource(placeholderPath.toUri());
            
            if (placeholder.exists() && placeholder.isReadable()) {
                log.debug("✅ Sirviendo placeholder: default-weapon.jpg");
                return ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG)
                        .header(HttpHeaders.CACHE_CONTROL, "max-age=3600")
                        .body(placeholder);
            } else {
                // Si ni siquiera existe el placeholder, crear respuesta vacía con 404
                // pero NO romper el sistema (error 500)
                log.warn("⚠️ Placeholder default-weapon.jpg no existe - Retornando 404 silencioso");
                return ResponseEntity.notFound()
                        .header(HttpHeaders.CACHE_CONTROL, "no-cache")
                        .build();
            }
        } catch (Exception e) {
            // Último recurso - 404 silencioso sin romper el sistema
            log.error("❌ Error crítico sirviendo placeholder: {} - Retornando 404", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
}

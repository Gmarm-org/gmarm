package com.armasimportacion.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Configuración Web para servir archivos estáticos
 * 
 * Esta configuración permite servir imágenes y documentos desde el directorio de uploads
 * sin necesidad de usar un servidor de archivos separado.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        // Convertir ruta relativa a absoluta
        Path uploadsPath = Paths.get(uploadDir).toAbsolutePath();
        String uploadsLocation = "file:" + uploadsPath.toString() + "/";
        
        // NOTA: /images/weapons/** se maneja en ImageController con fallback a placeholder
        // Esto previene error 500 cuando una imagen no existe
        
        // Servir otras imágenes (si existen otras categorías)
        // registry para /images/weapons/** está desactivado intencionalmente
        
        // Servir documentos desde /uploads/** mapeando a uploads/
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadsLocation)
                .setCachePeriod(3600) // Cache de 1 hora
                .resourceChain(true);
        
        // Log de configuración
        System.out.println("✅ Configuración de recursos estáticos:");
        System.out.println("   📂 Directorio de uploads: " + uploadsPath);
        System.out.println("   🖼️  Imágenes de armas: /images/weapons/** (ImageController con placeholder)");
        System.out.println("   📄 Documentos: /uploads/** (acceso directo)");
    }
}


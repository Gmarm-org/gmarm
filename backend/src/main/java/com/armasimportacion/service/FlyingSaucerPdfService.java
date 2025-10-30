package com.armasimportacion.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class FlyingSaucerPdfService {

    private final TemplateEngine templateEngine;

    /**
     * Genera un PDF desde un template HTML usando Flying Saucer
     */
    public byte[] generarPdfDesdeTemplate(String templateName, Map<String, Object> variables) {
        try {
            log.info("🔧 Generando PDF con Flying Saucer desde template: {}", templateName);
            
            // Crear contexto de Thymeleaf
            Context context = new Context();
            context.setVariables(variables);
            
            // Procesar template HTML
            String htmlContent = templateEngine.process(templateName, context);
            log.info("✅ Template HTML procesado exitosamente, longitud: {} caracteres", htmlContent.length());
            
            // Generar PDF usando Flying Saucer
            ITextRenderer renderer = new ITextRenderer();
            renderer.setDocumentFromString(htmlContent, "classpath:/templates/");
            renderer.layout();
            
            // Convertir a bytes
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            renderer.createPDF(outputStream);
            byte[] pdfBytes = outputStream.toByteArray();
            
            log.info("✅ PDF generado exitosamente con Flying Saucer, tamaño: {} bytes", pdfBytes.length);
            return pdfBytes;
            
        } catch (Exception e) {
            log.error("❌ Error generando PDF con Flying Saucer: {}", e.getMessage(), e);
            throw new RuntimeException("Error generando PDF con Flying Saucer", e);
        }
    }
}

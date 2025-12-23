package com.armasimportacion.controller;

import com.armasimportacion.model.DocumentoCliente;
import com.armasimportacion.model.DocumentoGenerado;
import com.armasimportacion.repository.DocumentoClienteRepository;
import com.armasimportacion.repository.DocumentoGeneradoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.*;

@RestController
@RequestMapping("/api/documentos")
@CrossOrigin(origins = "*")
public class DocumentoController {
    
    private static final Logger log = LoggerFactory.getLogger(DocumentoController.class);
    
    @Autowired
    private DocumentoClienteRepository documentoClienteRepository;
    
    @Autowired
    private DocumentoGeneradoRepository documentoGeneradoRepository;
    
    /**
     * Servir documento del cliente por ID
     */
    @GetMapping("/serve/{documentoId}")
    public ResponseEntity<Resource> serveDocumentoCliente(@PathVariable Long documentoId) {
        try {
            log.info("🔍 DEBUG: Solicitando documento cliente ID: {}", documentoId);
            
            Optional<DocumentoCliente> documentoOpt = documentoClienteRepository.findById(documentoId);
            if (!documentoOpt.isPresent()) {
                log.error("❌ Documento cliente no encontrado: {}", documentoId);
                return ResponseEntity.notFound().build();
            }
            
            DocumentoCliente documento = documentoOpt.get();
            log.info("🔍 DEBUG: Documento encontrado: {} - Ruta BD: {}", documento.getNombreArchivo(), documento.getRutaArchivo());
            
            // Construir la ruta completa del archivo
            String rutaArchivo = construirRutaCompletaDocumentoCliente(documento.getRutaArchivo());
            log.info("🔍 DEBUG: Ruta original en BD: {}", documento.getRutaArchivo());
            log.info("🔍 DEBUG: Ruta completa construida: {}", rutaArchivo);
            
            File archivo = new File(rutaArchivo);
            if (!archivo.exists()) {
                log.error("❌ Archivo físico no existe: {}", rutaArchivo);
                log.error("❌ Ruta original en BD: {}", documento.getRutaArchivo());
                return ResponseEntity.notFound().build();
            }
            
            Resource resource = new FileSystemResource(archivo);
            
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + documento.getNombreArchivo() + "\"");
            headers.add(HttpHeaders.CONTENT_TYPE, "application/pdf");
            
            log.info("✅ Sirviendo archivo: {} ({} bytes)", documento.getNombreArchivo(), archivo.length());
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .contentLength(archivo.length())
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(resource);
                    
        } catch (Exception e) {
            log.error("❌ Error sirviendo documento cliente {}: {}", documentoId, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Servir documento generado por ID
     */
    @GetMapping("/serve-generated/{documentoId}")
    public ResponseEntity<Resource> serveDocumentoGenerado(@PathVariable Long documentoId) {
        try {
            log.info("🔍 DEBUG: Solicitando documento generado ID: {}", documentoId);
            
            Optional<DocumentoGenerado> documentoOpt = documentoGeneradoRepository.findById(documentoId);
            if (!documentoOpt.isPresent()) {
                log.error("❌ Documento generado no encontrado: {}", documentoId);
                return ResponseEntity.notFound().build();
            }
            
            DocumentoGenerado documento = documentoOpt.get();
            log.info("🔍 DEBUG: Documento encontrado: {} - Ruta BD: {}", documento.getNombreArchivo(), documento.getRutaArchivo());
            
            // Construir la ruta completa del archivo
            String rutaArchivo = construirRutaCompletaDocumentoGenerado(
                documento.getRutaArchivo(), 
                documento.getNombreArchivo()
            );
            log.info("🔍 DEBUG: Ruta completa construida: {}", rutaArchivo);
            
            File archivo = new File(rutaArchivo);
            if (!archivo.exists()) {
                log.error("❌ Archivo físico no existe: {}", rutaArchivo);
                log.error("❌ Ruta original en BD: {}", documento.getRutaArchivo());
                log.error("❌ Nombre archivo: {}", documento.getNombreArchivo());
                return ResponseEntity.notFound().build();
            }
            
            Resource resource = new FileSystemResource(archivo);
            
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + documento.getNombreArchivo() + "\"");
            headers.add(HttpHeaders.CONTENT_TYPE, "application/pdf");
            
            log.info("✅ Sirviendo archivo: {} ({} bytes)", documento.getNombreArchivo(), archivo.length());
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .contentLength(archivo.length())
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(resource);
                    
        } catch (Exception e) {
            log.error("❌ Error sirviendo documento generado {}: {}", documentoId, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Construye la ruta completa física para un documento de cliente
     * Ruta en BD: "documentos_clientes/{cedula}/documentos_cargados/archivo.pdf" o "documentos_clientes/{cedula}/documentos_generados/archivo.pdf"
     * Ruta física: "/app/documentacion/documentos_clientes/{cedula}/documentos_cargados/archivo.pdf"
     */
    private String construirRutaCompletaDocumentoCliente(String rutaBD) {
        // Si ya tiene el prefijo completo, devolverla tal cual
        if (rutaBD.startsWith("/app/documentacion/")) {
            return rutaBD;
        }
        
        // Si tiene /app/ pero no el path completo
        if (rutaBD.startsWith("/app/")) {
            return rutaBD;
        }
        
        // Si la ruta ya incluye "documentos_clientes", solo agregar /app/documentacion/
        if (rutaBD.startsWith("documentos_clientes/")) {
            return "/app/documentacion/" + rutaBD;
        }
        
        // Agregar el prefijo base para documentos de cliente
        return "/app/documentacion/" + rutaBD;
    }
    
    /**
     * Construye la ruta completa física para un documento generado
     * Ruta en BD puede ser:
     * - "documentos_clientes/{cedula}/documentos_generados/archivo.pdf" (clientes)
     * - "documentos_importacion/{grupoId}/documentos_generados/archivo.pdf" (grupos)
     * 
     * IMPORTANTE: La ruta BD ya incluye el nombre del archivo.
     * Usa el mismo patrón que FileStorageService: Paths.get(uploadDir, rutaBD)
     * Esto funciona tanto en Windows (Docker) como en Ubuntu (Docker) porque el contenedor siempre es Linux
     */
    private String construirRutaCompletaDocumentoGenerado(String rutaBD, String nombreArchivo) {
        // Si la ruta ya es absoluta con /app/, usarla tal cual
        if (rutaBD.startsWith("/app/")) {
            return rutaBD;
        }
        
        // uploadDir por defecto es "./documentacion/documentos_cliente"
        // El directorio de trabajo en Docker es /app
        // Construir directamente: /app/documentacion/documentos_cliente/ + rutaBD
        String uploadDirBase = "/app/documentacion/documentos_cliente/";
        String rutaCompleta = uploadDirBase + rutaBD;
        
        log.info("🔍 DEBUG: rutaBD={}, nombreArchivo={}, uploadDirBase={}, rutaCompleta={}", 
            rutaBD, nombreArchivo, uploadDirBase, rutaCompleta);
        
        return rutaCompleta;
    }
    
    /**
     * Endpoint de diagnóstico para verificar rutas de documentos
     */
    @GetMapping("/debug/{documentoId}")
    public ResponseEntity<Map<String, Object>> debugDocumento(@PathVariable Long documentoId) {
        try {
            log.info("🔍 DEBUG: Diagnóstico para documento ID: {}", documentoId);
            
            Optional<DocumentoCliente> documentoOpt = documentoClienteRepository.findById(documentoId);
            if (!documentoOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            DocumentoCliente documento = documentoOpt.get();
            String rutaOriginal = documento.getRutaArchivo();
            String rutaCompleta = construirRutaCompletaDocumentoCliente(rutaOriginal);
            File archivo = new File(rutaCompleta);
            
            Map<String, Object> debugInfo = new HashMap<>();
            debugInfo.put("documentoId", documentoId);
            debugInfo.put("nombreArchivo", documento.getNombreArchivo());
            debugInfo.put("rutaOriginalBD", rutaOriginal);
            debugInfo.put("rutaCompleta", rutaCompleta);
            debugInfo.put("archivoExiste", archivo.exists());
            debugInfo.put("archivoTamanio", archivo.exists() ? archivo.length() : 0);
            debugInfo.put("archivoPermisos", archivo.exists() ? archivo.canRead() : false);
            debugInfo.put("directorioPadre", archivo.getParent());
            debugInfo.put("directorioPadreExiste", archivo.getParentFile() != null && archivo.getParentFile().exists());
            
            // Verificar rutas alternativas
            List<String> rutasAlternativas = new ArrayList<>();
            rutasAlternativas.add("/app/documentacion/documentos_cliente/" + rutaOriginal);
            rutasAlternativas.add("./documentacion/documentos_cliente/" + rutaOriginal);
            rutasAlternativas.add("documentacion/documentos_cliente/" + rutaOriginal);
            
            Map<String, Boolean> rutasAlternativasExisten = new HashMap<>();
            for (String rutaAlt : rutasAlternativas) {
                rutasAlternativasExisten.put(rutaAlt, new File(rutaAlt).exists());
            }
            debugInfo.put("rutasAlternativas", rutasAlternativasExisten);
            
            log.info("🔍 DEBUG: Información de diagnóstico: {}", debugInfo);
            
            return ResponseEntity.ok(debugInfo);
            
        } catch (Exception e) {
            log.error("❌ Error en diagnóstico de documento {}: {}", documentoId, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}

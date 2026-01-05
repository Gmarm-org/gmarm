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
            log.info("🔍 DEBUG: Documento encontrado: {} - Ruta BD: {} - Estado: {}", 
                    documento.getNombreArchivo(), documento.getRutaArchivo(), documento.getEstado());
            
            // Validar que el documento no esté reemplazado o sin ruta
            if (documento.getEstado() == DocumentoCliente.EstadoDocumento.REEMPLAZADO) {
                log.warn("⚠️ Intento de acceder a documento REEMPLAZADO (ID: {})", documentoId);
                return ResponseEntity.notFound().build();
            }
            
            if (documento.getRutaArchivo() == null || documento.getRutaArchivo().trim().isEmpty()) {
                log.error("❌ Documento no tiene ruta de archivo: ID={}", documentoId);
                return ResponseEntity.notFound().build();
            }
            
            // Construir la ruta completa del archivo
            String rutaArchivo = construirRutaCompletaDocumentoCliente(documento.getRutaArchivo());
            log.info("🔍 DEBUG: Ruta original en BD: {}", documento.getRutaArchivo());
            log.info("🔍 DEBUG: Ruta completa construida: {}", rutaArchivo);
            
            File archivo = new File(rutaArchivo);
            String rutaAbsoluta = archivo.getAbsolutePath();
            log.info("🔍 DEBUG: Verificando existencia del archivo: {}", rutaAbsoluta);
            
            if (!archivo.exists() || !archivo.isFile()) {
                log.error("❌ Archivo físico no existe o no es un archivo: {}", rutaAbsoluta);
                log.error("❌ Ruta original en BD: {}", documento.getRutaArchivo());
                
                // Intentar rutas alternativas para diagnóstico
                String[] rutasAlternativas = {
                    "/app/documentacion/documentos_cliente/" + documento.getRutaArchivo(),
                    "/app/documentacion/" + documento.getRutaArchivo(),
                    documento.getRutaArchivo(),
                    // También intentar si la ruta ya incluye documentos_cliente
                    rutaArchivo.replace("/documentos_cliente/documentos_cliente/", "/documentos_cliente/")
                };
                
                boolean encontrado = false;
                String rutaEncontrada = null;
                for (String rutaAlt : rutasAlternativas) {
                    File archivoAlt = new File(rutaAlt);
                    boolean existe = archivoAlt.exists() && archivoAlt.isFile();
                    log.info("🔍 Verificando ruta alternativa: {} - Existe: {}", rutaAlt, existe);
                    if (existe && !encontrado) {
                        encontrado = true;
                        rutaEncontrada = rutaAlt;
                    }
                }
                
                if (encontrado && rutaEncontrada != null) {
                    log.warn("⚠️ Archivo encontrado en ruta alternativa, usando: {}", rutaEncontrada);
                    archivo = new File(rutaEncontrada);
                } else {
                    log.error("❌ No se encontró el archivo en ninguna ruta alternativa");
                    return ResponseEntity.notFound().build();
                }
            }
            
            Resource resource = new FileSystemResource(archivo);
            
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + documento.getNombreArchivo() + "\"");
            headers.add(HttpHeaders.CONTENT_TYPE, "application/pdf");
            // Permitir que se muestre en iframes del mismo origen
            headers.add("X-Frame-Options", "SAMEORIGIN");
            headers.add("Content-Security-Policy", "frame-ancestors 'self'");
            
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
            // Permitir que se muestre en iframes del mismo origen
            headers.add("X-Frame-Options", "SAMEORIGIN");
            headers.add("Content-Security-Policy", "frame-ancestors 'self'");
            
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
     * Ruta física: "/app/documentacion/documentos_cliente/documentos_clientes/{cedula}/documentos_cargados/archivo.pdf"
     */
    private String construirRutaCompletaDocumentoCliente(String rutaBD) {
        log.info("🔍 DEBUG construirRutaCompletaDocumentoCliente - rutaBD recibida: {}", rutaBD);
        
        if (rutaBD == null || rutaBD.trim().isEmpty()) {
            log.error("❌ Ruta BD vacía o nula");
            throw new IllegalArgumentException("La ruta del documento no puede estar vacía");
        }
        
        // Si ya tiene el prefijo completo absoluto, devolverla tal cual
        if (rutaBD.startsWith("/app/documentacion/")) {
            log.info("✅ Ruta ya completa: {}", rutaBD);
            return rutaBD;
        }
        
        // Si tiene /app/ pero no el path completo
        if (rutaBD.startsWith("/app/")) {
            log.info("✅ Ruta con /app/: {}", rutaBD);
            return rutaBD;
        }
        
        // IMPORTANTE: El FileStorageService guarda los archivos en:
        // uploadDir + "/" + relativePath + "/" + fileName
        // Donde:
        // - uploadDir = "./documentacion/documentos_cliente" (relativo a /app en Docker, resuelve a /app/documentacion/documentos_cliente)
        // - relativePath = "documentos_clientes/{cedula}/documentos_cargados"
        // - fileName = "nombre_archivo.pdf"
        // Resultado físico: /app/documentacion/documentos_cliente/documentos_clientes/{cedula}/documentos_cargados/archivo.pdf
        // 
        // Pero en BD se guarda: "documentos_clientes/{cedula}/documentos_cargados/archivo.pdf"
        // Por lo tanto, para reconstruir la ruta física completa necesitamos:
        // /app/documentacion/documentos_cliente/ + rutaBD
        
        // Normalizar la ruta (remover barras dobles, espacios al inicio/fin)
        String rutaNormalizada = rutaBD.trim().replaceAll("/+", "/");
        
        // Construir ruta completa
        String rutaCompleta = "/app/documentacion/documentos_cliente/" + rutaNormalizada;
        
        log.info("✅ Ruta completa construida: {}", rutaCompleta);
        return rutaCompleta;
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

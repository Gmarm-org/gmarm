package com.armasimportacion.controller;

import com.armasimportacion.model.ConfiguracionDocumentoExterno;
import com.armasimportacion.service.DocumentoExternoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documentos-externos")
@CrossOrigin(origins = "*")
public class DocumentoExternoController {
    
    @Autowired
    private DocumentoExternoService documentoExternoService;
    
    /**
     * Obtiene todos los documentos externos activos
     */
    @GetMapping
    public ResponseEntity<List<ConfiguracionDocumentoExterno>> getAllDocumentosExternos() {
        List<ConfiguracionDocumentoExterno> documentos = documentoExternoService.getAllDocumentosExternos();
        return ResponseEntity.ok(documentos);
    }
    
    /**
     * Obtiene documentos externos por tipo de cliente
     */
    @GetMapping("/por-tipo-cliente/{tipoCliente}")
    public ResponseEntity<List<ConfiguracionDocumentoExterno>> getDocumentosExternosPorTipoCliente(
            @PathVariable String tipoCliente,
            @RequestParam(required = false) String estadoMilitar) {
        
        List<ConfiguracionDocumentoExterno> documentos;
        if (estadoMilitar != null) {
            documentos = documentoExternoService.getDocumentosExternosPorTipoCliente(tipoCliente, estadoMilitar);
        } else {
            documentos = documentoExternoService.getDocumentosExternosPorTipoCliente(tipoCliente);
        }
        
        return ResponseEntity.ok(documentos);
    }
    
    /**
     * Obtiene un documento externo por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ConfiguracionDocumentoExterno> getDocumentoExternoById(@PathVariable Long id) {
        ConfiguracionDocumentoExterno documento = documentoExternoService.getDocumentoExternoById(id);
        return ResponseEntity.ok(documento);
    }
    
    /**
     * Crea un nuevo documento externo
     */
    @PostMapping
    public ResponseEntity<ConfiguracionDocumentoExterno> createDocumentoExterno(
            @RequestBody ConfiguracionDocumentoExterno documentoExterno) {
        
        // Validar link externo
        if (!documentoExternoService.validarLinkExterno(documentoExterno.getLinkExterno())) {
            return ResponseEntity.badRequest().build();
        }
        
        ConfiguracionDocumentoExterno created = documentoExternoService.createDocumentoExterno(documentoExterno);
        return ResponseEntity.ok(created);
    }
    
    /**
     * Actualiza un documento externo existente
     */
    @PutMapping("/{id}")
    public ResponseEntity<ConfiguracionDocumentoExterno> updateDocumentoExterno(
            @PathVariable Long id,
            @RequestBody ConfiguracionDocumentoExterno documentoExterno) {
        
        // Validar link externo
        if (!documentoExternoService.validarLinkExterno(documentoExterno.getLinkExterno())) {
            return ResponseEntity.badRequest().build();
        }
        
        ConfiguracionDocumentoExterno updated = documentoExternoService.updateDocumentoExterno(id, documentoExterno);
        return ResponseEntity.ok(updated);
    }
    
    /**
     * Elimina un documento externo (marca como inactivo)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocumentoExterno(@PathVariable Long id) {
        documentoExternoService.deleteDocumentoExterno(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Busca documentos externos por nombre
     */
    @GetMapping("/buscar")
    public ResponseEntity<List<ConfiguracionDocumentoExterno>> searchDocumentosExternos(
            @RequestParam String nombre) {
        List<ConfiguracionDocumentoExterno> documentos = documentoExternoService.searchDocumentosExternos(nombre);
        return ResponseEntity.ok(documentos);
    }
    
    /**
     * Obtiene estadísticas de documentos externos
     */
    @GetMapping("/estadisticas")
    public ResponseEntity<Map<String, Object>> getEstadisticasDocumentosExternos() {
        Map<String, Object> estadisticas = documentoExternoService.getEstadisticasDocumentosExternos();
        return ResponseEntity.ok(estadisticas);
    }
    
    /**
     * Valida un link externo
     */
    @PostMapping("/validar-link")
    public ResponseEntity<Map<String, Boolean>> validarLinkExterno(@RequestBody Map<String, String> request) {
        String link = request.get("link");
        boolean esValido = documentoExternoService.validarLinkExterno(link);
        
        Map<String, Boolean> response = Map.of("esValido", esValido);
        return ResponseEntity.ok(response);
    }
} 

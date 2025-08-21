package com.armasimportacion.controller;

import com.armasimportacion.dto.DocumentoClienteDTO;
import com.armasimportacion.model.DocumentoCliente;
import com.armasimportacion.service.DocumentoClienteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/documentos-cliente")
@RequiredArgsConstructor
@Slf4j
public class DocumentoClienteController {

    private final DocumentoClienteService service;

    @PostMapping(value = "/cargar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentoClienteDTO> cargarDocumento(
            @RequestParam("clienteId") Long clienteId,
            @RequestParam("tipoDocumentoId") Long tipoDocumentoId,
            @RequestParam("archivo") MultipartFile archivo,
            @RequestParam(value = "descripcion", required = false) String descripcion,
            @RequestParam("usuarioId") Long usuarioId) {
        
        try {
            log.info("Cargando documento para cliente: {}, tipo: {}, archivo: {}", 
                clienteId, tipoDocumentoId, archivo.getOriginalFilename());
            
            DocumentoClienteDTO documento = service.cargarDocumento(clienteId, tipoDocumentoId, archivo, descripcion, usuarioId);
            
            log.info("Documento cargado exitosamente: {}", documento.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(documento);
            
        } catch (IOException e) {
            log.error("Error al cargar archivo: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (RuntimeException e) {
            log.error("Error de validación: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PutMapping(value = "/{documentoId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentoClienteDTO> actualizarDocumento(
            @PathVariable Long documentoId,
            @RequestParam("archivo") MultipartFile archivo,
            @RequestParam(value = "descripcion", required = false) String descripcion,
            @RequestParam("usuarioId") Long usuarioId) {
        
        try {
            log.info("Actualizando documento: {}, archivo: {}", documentoId, archivo.getOriginalFilename());
            
            DocumentoClienteDTO documento = service.actualizarDocumento(documentoId, archivo, descripcion, usuarioId);
            
            log.info("Documento actualizado exitosamente: {}", documento.getId());
            return ResponseEntity.ok(documento);
            
        } catch (IOException e) {
            log.error("Error al actualizar archivo: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (RuntimeException e) {
            log.error("Error de validación: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<DocumentoClienteDTO>> getDocumentosByCliente(@PathVariable Long clienteId) {
        try {
            log.info("Obteniendo documentos para cliente: {}", clienteId);
            
            List<DocumentoClienteDTO> documentos = service.getDocumentosByCliente(clienteId);
            
            log.info("Documentos obtenidos: {}", documentos.size());
            return ResponseEntity.ok(documentos);
            
        } catch (RuntimeException e) {
            log.error("Error al obtener documentos: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/{documentoId}")
    public ResponseEntity<DocumentoClienteDTO> getDocumentoById(@PathVariable Long documentoId) {
        try {
            log.info("Obteniendo documento: {}", documentoId);
            
            DocumentoClienteDTO documento = service.getDocumentoById(documentoId);
            
            log.info("Documento obtenido: {}", documento.getId());
            return ResponseEntity.ok(documento);
            
        } catch (RuntimeException e) {
            log.error("Error al obtener documento: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @DeleteMapping("/{documentoId}")
    public ResponseEntity<Void> deleteDocumento(@PathVariable Long documentoId) {
        try {
            log.info("Eliminando documento: {}", documentoId);
            
            service.deleteDocumento(documentoId);
            
            log.info("Documento eliminado exitosamente: {}", documentoId);
            return ResponseEntity.noContent().build();
            
        } catch (RuntimeException e) {
            log.error("Error al eliminar documento: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PutMapping("/{documentoId}/estado")
    public ResponseEntity<DocumentoClienteDTO> cambiarEstado(
            @PathVariable Long documentoId,
            @RequestParam("estado") String estado) {
        
        try {
            log.info("Cambiando estado del documento: {} a {}", documentoId, estado);
            
            DocumentoCliente.EstadoDocumento nuevoEstado = DocumentoCliente.EstadoDocumento.valueOf(estado.toUpperCase());
            DocumentoClienteDTO documento = service.cambiarEstado(documentoId, nuevoEstado);
            
            log.info("Estado cambiado exitosamente: {}", documento.getId());
            return ResponseEntity.ok(documento);
            
        } catch (IllegalArgumentException e) {
            log.error("Estado inválido: {}", estado, e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (RuntimeException e) {
            log.error("Error al cambiar estado: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/cliente/{clienteId}/verificar-completos")
    public ResponseEntity<Boolean> verificarDocumentosCompletos(@PathVariable Long clienteId) {
        try {
            log.info("Verificando documentos completos para cliente: {}", clienteId);
            
            boolean completo = service.verificarDocumentosCompletos(clienteId);
            
            log.info("Verificación completada: {}", completo);
            return ResponseEntity.ok(completo);
            
        } catch (RuntimeException e) {
            log.error("Error al verificar documentos: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/cliente/{clienteId}/resumen")
    public ResponseEntity<DocumentoClienteService.DocumentoResumenDTO> getResumenDocumentos(@PathVariable Long clienteId) {
        try {
            log.info("Obteniendo resumen de documentos para cliente: {}", clienteId);
            
            DocumentoClienteService.DocumentoResumenDTO resumen = service.getResumenDocumentos(clienteId);
            
            log.info("Resumen obtenido para cliente: {}", clienteId);
            return ResponseEntity.ok(resumen);
            
        } catch (RuntimeException e) {
            log.error("Error al obtener resumen: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
}

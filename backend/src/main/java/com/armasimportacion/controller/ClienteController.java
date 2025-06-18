package com.armasimportacion.controller;

import com.armasimportacion.dto.request.ClienteRequest;
import com.armasimportacion.dto.response.ClienteResponse;
import com.armasimportacion.dto.response.PreguntaRespuestaResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {
    private final ClienteService clienteService;
    private final DocumentoService documentoService;
    private final AsignacionService asignacionService;

    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
        this.documentoService = documentoService;
        this.asignacionService = asignacionService;
    }

    // CREATE
    @PostMapping
    @PreAuthorize("hasRole('VENDEDOR')")
    public ResponseEntity<ClienteResponse> createCliente(
            @Valid @RequestBody ClienteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(clienteService.createCliente(request));
    }

    // READ (ONE)
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('VENDEDOR') or hasRole('ADMIN')")
    public ResponseEntity<ClienteResponse> getClienteById(@PathVariable Long id) {
        return ResponseEntity.ok(clienteService.getClienteById(id));
    }

    // READ (ALL)
    @GetMapping
    @PreAuthorize("hasRole('VENDEDOR') or hasRole('ADMIN')")
    public ResponseEntity<List<ClienteResponse>> getAllClientes() {
        return ResponseEntity.ok(clienteService.getAllClientes());
    }

    // UPDATE
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('VENDEDOR')")
    public ResponseEntity<ClienteResponse> updateCliente(
            @PathVariable Long id,
            @Valid @RequestBody ClienteRequest request) {
        return ResponseEntity.ok(clienteService.updateCliente(id, request));
    }

    // DELETE (O desactivar)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCliente(@PathVariable Long id) {
        clienteService.deleteCliente(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/documentos")
    @PreAuthorize("hasRole('VENDEDOR')")
    public ResponseEntity<DocumentoResponse> uploadDocumento(
            @RequestParam Long clienteId,
            @RequestParam Long tipoDocumentoId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(documentoService.guardarDocumento(clienteId, tipoDocumentoId, file));
    }

    @PostMapping("/{clienteId}/asignar-arma")
    @PreAuthorize("hasRole('VENDEDOR')")
    public ResponseEntity<AsignacionResponse> asignarArma(
            @PathVariable Long clienteId,
            @RequestBody AsignacionArmaRequest request) {
        return ResponseEntity.ok(asignacionService.crearAsignacion(clienteId, request));
    }

    @PostMapping("/{clienteId}/activar-proceso")
    @PreAuthorize("hasRole('VENDEDOR')")
    public ResponseEntity<ProcesoResponse> activarProcesoImportacion(@PathVariable Long clienteId) {
        return ResponseEntity.ok(clienteService.activarProceso(clienteId));
    }
}

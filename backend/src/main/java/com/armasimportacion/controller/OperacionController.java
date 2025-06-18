package com.armasimportacion.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/operaciones")
public class OperacionController {

    private final OperacionService operacionService;
    private final DocumentoService documentoService;

    @PostMapping("/proformas")
    @PreAuthorize("hasRole('OPERACIONES')")
    public ResponseEntity<DocumentoResponse> uploadProforma(
            @RequestParam Long grupoId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(documentoService.guardarProforma(grupoId, file));
    }

    @PostMapping("/generar-oficio")
    @PreAuthorize("hasRole('OPERACIONES')")
    public ResponseEntity<DocumentoResponse> generarOficio(
            @RequestParam Long clienteId,
            @RequestParam String numeroFactura) {
        return ResponseEntity.ok(operacionService.generarOficio(clienteId, numeroFactura));
    }
}

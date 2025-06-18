package com.armasimportacion.controller;

import com.armasimportacion.dto.request.ContratoRequest;
import com.armasimportacion.dto.request.FacturaRequest;
import com.armasimportacion.dto.request.PagoRequest;
import com.armasimportacion.dto.response.ContratoResponse;
import com.armasimportacion.dto.response.FacturaResponse;
import com.armasimportacion.dto.response.PagoResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/finanzas")
public class FinanzaController {
    private final FacturaService facturaService;

    @PostMapping("/facturas")
    @PreAuthorize("hasRole('FINANZAS')")
    public ResponseEntity<FacturaResponse> generarFactura(
            @RequestBody FacturaRequest request) {
        return ResponseEntity.ok(facturaService.generarFactura(request));
    }

    @PostMapping("/pagos")
    @PreAuthorize("hasRole('FINANZAS')")
    public ResponseEntity<PagoResponse> registrarPago(
            @RequestBody PagoRequest request) {
        return ResponseEntity.ok(facturaService.registrarPago(request));
    }
}

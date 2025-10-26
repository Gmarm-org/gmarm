package com.armasimportacion.controller;

import com.armasimportacion.service.ClienteProcesoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/cliente-proceso")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ClienteProcesoController {
    
    private final ClienteProcesoService clienteProcesoService;
    
    @GetMapping("/{clienteId}/verificar")
    public ResponseEntity<Map<String, Object>> verificarProceso(@PathVariable Long clienteId) {
        try {
            boolean procesoCompleto = clienteProcesoService.verificarProcesoCompleto(clienteId);
            Map<String, Object> resultado = Map.of(
                "clienteId", clienteId,
                "procesoCompleto", procesoCompleto,
                "mensaje", procesoCompleto ? "Proceso completo" : "Proceso incompleto"
            );
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            log.error("Error al verificar proceso del cliente: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/{clienteId}/completar")
    public ResponseEntity<Map<String, Object>> completarProceso(@PathVariable Long clienteId) {
        try {
            // TODO: Implementar lógica de completar proceso
            Map<String, Object> resultado = Map.of(
                "clienteId", clienteId,
                "mensaje", "Proceso completado exitosamente"
            );
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            log.error("Error al completar proceso del cliente: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/{clienteId}/confirmar-inicio")
    public ResponseEntity<Map<String, Object>> confirmarInicio(@PathVariable Long clienteId) {
        try {
            // TODO: Implementar lógica de confirmar inicio
            Map<String, Object> resultado = Map.of(
                "clienteId", clienteId,
                "mensaje", "Inicio del proceso confirmado"
            );
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            log.error("Error al confirmar inicio del proceso: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}

package com.armasimportacion.controller;

import com.armasimportacion.model.ClienteArma;
import com.armasimportacion.service.ClienteArmaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cliente-arma")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Cliente-Arma", description = "API para gestionar asignaciones de armas a clientes")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://localhost:8080"})
public class ClienteArmaController {

    private final ClienteArmaService clienteArmaService;

    @GetMapping("/cliente/{clienteId}")
    @Operation(summary = "Obtener armas asignadas a un cliente", description = "Retorna todas las armas asignadas a un cliente específico")
    public ResponseEntity<List<ClienteArma>> getArmasByCliente(@PathVariable Long clienteId) {
        log.info("Solicitud para obtener armas del cliente ID: {}", clienteId);
        List<ClienteArma> asignaciones = clienteArmaService.findByClienteId(clienteId);
        return ResponseEntity.ok(asignaciones);
    }

    @GetMapping("/cliente/{clienteId}/resumen")
    @Operation(summary = "Obtener resumen de armas por cliente", description = "Retorna un resumen con totales y detalles de armas por cliente")
    public ResponseEntity<Map<String, Object>> getResumenArmasByCliente(@PathVariable Long clienteId) {
        log.info("Solicitud para obtener resumen de armas del cliente ID: {}", clienteId);
        Map<String, Object> resumen = clienteArmaService.getResumenArmasByCliente(clienteId);
        return ResponseEntity.ok(resumen);
    }

    @PostMapping("/asignar")
    @Operation(summary = "Asignar arma a cliente", description = "Asigna una arma específica a un cliente con cantidad y precio")
    public ResponseEntity<ClienteArma> asignarArma(
            @RequestParam Long clienteId,
            @RequestParam Long armaId,
            @RequestParam Integer cantidad,
            @RequestParam BigDecimal precioUnitario) {
        
        log.info("Solicitud para asignar arma ID: {} al cliente ID: {} - Cantidad: {}, Precio: {}", 
                armaId, clienteId, cantidad, precioUnitario);
        
        ClienteArma asignacion = clienteArmaService.asignarArma(clienteId, armaId, cantidad, precioUnitario);
        return ResponseEntity.ok(asignacion);
    }

    @PostMapping("/asignar-multiples")
    @Operation(summary = "Asignar múltiples armas a cliente", description = "Asigna varias armas a un cliente en una sola operación")
    public ResponseEntity<List<ClienteArma>> asignarMultiplesArmas(
            @RequestParam Long clienteId,
            @RequestBody List<Map<String, Object>> armasData) {
        
        log.info("Solicitud para asignar {} armas al cliente ID: {}", armasData.size(), clienteId);
        
        List<ClienteArma> asignaciones = clienteArmaService.asignarMultiplesArmas(clienteId, armasData);
        return ResponseEntity.ok(asignaciones);
    }

    @PutMapping("/cliente/{clienteId}/arma/{armaId}/cantidad")
    @Operation(summary = "Actualizar cantidad de arma", description = "Actualiza la cantidad de una arma asignada a un cliente")
    public ResponseEntity<ClienteArma> updateCantidad(
            @PathVariable Long clienteId,
            @PathVariable Long armaId,
            @RequestParam Integer nuevaCantidad) {
        
        log.info("Solicitud para actualizar cantidad de arma ID: {} para cliente ID: {} a: {}", 
                armaId, clienteId, nuevaCantidad);
        
        ClienteArma asignacion = clienteArmaService.updateCantidad(armaId, nuevaCantidad);
        return ResponseEntity.ok(asignacion);
    }

    @PutMapping("/cliente/{clienteId}/arma/{armaId}/precio")
    @Operation(summary = "Actualizar precio de arma", description = "Actualiza el precio de una arma específica para un cliente")
    public ResponseEntity<ClienteArma> updatePrecio(
            @PathVariable Long clienteId,
            @PathVariable Long armaId,
            @RequestParam BigDecimal nuevoPrecio) {
        
        log.info("Solicitud para actualizar precio de arma ID: {} para cliente ID: {} a: {}", 
                armaId, clienteId, nuevoPrecio);
        
        ClienteArma asignacion = clienteArmaService.updatePrecioArma(clienteId, armaId, nuevoPrecio);
        return ResponseEntity.ok(asignacion);
    }

    @PatchMapping("/{id}/estado")
    @Operation(summary = "Cambiar estado de asignación", description = "Cambia el estado de una asignación cliente-arma")
    public ResponseEntity<ClienteArma> changeEstado(
            @PathVariable Long id,
            @RequestParam String nuevoEstado) {
        
        log.info("Solicitud para cambiar estado de asignación ID: {} a: {}", id, nuevoEstado);
        
        ClienteArma asignacion = clienteArmaService.changeEstado(id, nuevoEstado);
        return ResponseEntity.ok(asignacion);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar asignación", description = "Elimina una asignación cliente-arma")
    public ResponseEntity<Void> deleteAsignacion(@PathVariable Long id) {
        log.info("Solicitud para eliminar asignación ID: {}", id);
        clienteArmaService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/cliente/{clienteId}/count")
    @Operation(summary = "Contar armas por cliente", description = "Retorna el total de armas asignadas a un cliente")
    public ResponseEntity<Long> countArmasByCliente(@PathVariable Long clienteId) {
        log.info("Solicitud para contar armas del cliente ID: {}", clienteId);
        Long count = clienteArmaService.countByClienteId(clienteId);
        return ResponseEntity.ok(count);
    }
}

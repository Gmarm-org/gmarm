package com.armasimportacion.controller;

import com.armasimportacion.dto.ClienteArmaDTO;
import com.armasimportacion.service.ClienteArmaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Controlador para la gestión de relaciones cliente-arma
 * Reemplaza a AsignacionArmaController para mantener consistencia
 */
@RestController
@RequestMapping("/api/cliente-arma")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ClienteArmaController {

    private final ClienteArmaService clienteArmaService;

    /**
     * Crear una nueva reserva de arma
     */
    @PostMapping
    public ResponseEntity<ClienteArmaDTO> crearReserva(
            @RequestParam Long clienteId,
            @RequestParam Long armaId,
            @RequestParam(required = false, defaultValue = "1") Integer cantidad,
            @RequestParam(required = false) BigDecimal precioUnitario) {
        
        log.info("POST /api/cliente-arma - Creando reserva para cliente {} y arma {}", clienteId, armaId);
        
        ClienteArmaDTO reserva = clienteArmaService.crearReserva(clienteId, armaId, cantidad, precioUnitario);
        return ResponseEntity.ok(reserva);
    }

    /**
     * Obtener todas las reservas de un cliente
     */
    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<ClienteArmaDTO>> obtenerReservasPorCliente(@PathVariable Long clienteId) {
        log.info("GET /api/cliente-arma/cliente/{} - Obteniendo reservas del cliente", clienteId);
        
        List<ClienteArmaDTO> reservas = clienteArmaService.obtenerReservasPorCliente(clienteId);
        return ResponseEntity.ok(reservas);
    }

    /**
     * Obtener todas las reservas de una arma
     */
    @GetMapping("/arma/{armaId}")
    public ResponseEntity<List<ClienteArmaDTO>> obtenerReservasPorArma(@PathVariable Long armaId) {
        log.info("GET /api/cliente-arma/arma/{} - Obteniendo reservas de la arma", armaId);
        
        List<ClienteArmaDTO> reservas = clienteArmaService.obtenerReservasPorArma(armaId);
        return ResponseEntity.ok(reservas);
    }

    /**
     * Confirmar una reserva
     */
    @PutMapping("/{id}/confirmar")
    public ResponseEntity<ClienteArmaDTO> confirmarReserva(@PathVariable Long id) {
        log.info("PUT /api/cliente-arma/{}/confirmar - Confirmando reserva", id);
        
        ClienteArmaDTO reserva = clienteArmaService.confirmarReserva(id);
        return ResponseEntity.ok(reserva);
    }

    /**
     * Cancelar una reserva
     */
    @PutMapping("/{id}/cancelar")
    public ResponseEntity<ClienteArmaDTO> cancelarReserva(@PathVariable Long id) {
        log.info("PUT /api/cliente-arma/{}/cancelar - Cancelando reserva", id);
        
        ClienteArmaDTO reserva = clienteArmaService.cancelarReserva(id);
        return ResponseEntity.ok(reserva);
    }

    /**
     * Completar una reserva
     */
    @PutMapping("/{id}/completar")
    public ResponseEntity<ClienteArmaDTO> completarReserva(@PathVariable Long id) {
        log.info("PUT /api/cliente-arma/{}/completar - Completando reserva", id);
        
        ClienteArmaDTO reserva = clienteArmaService.completarReserva(id);
        return ResponseEntity.ok(reserva);
    }

    /**
     * Eliminar una reserva
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarReserva(@PathVariable Long id) {
        log.info("DELETE /api/cliente-arma/{} - Eliminando reserva", id);
        
        clienteArmaService.eliminarReserva(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Obtener estadísticas de reservas
     */
    @GetMapping("/estadisticas")
    public ResponseEntity<ClienteArmaService.ClienteArmaStatsDTO> obtenerEstadisticas() {
        log.info("GET /api/cliente-arma/estadisticas - Obteniendo estadísticas");
        
        ClienteArmaService.ClienteArmaStatsDTO estadisticas = clienteArmaService.obtenerEstadisticas();
        return ResponseEntity.ok(estadisticas);
    }
}

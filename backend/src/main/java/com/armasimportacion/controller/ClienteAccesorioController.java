package com.armasimportacion.controller;

import com.armasimportacion.dto.ClienteAccesorioDTO;
import com.armasimportacion.service.ClienteAccesorioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Controlador para la gestión de relaciones cliente-accesorio
 * Reemplaza a AsignacionAccesorioController para mantener consistencia
 */
@RestController
@RequestMapping("/api/cliente-accesorio")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ClienteAccesorioController {

    private final ClienteAccesorioService clienteAccesorioService;

    /**
     * Crear una nueva reserva de accesorio
     */
    @PostMapping
    public ResponseEntity<ClienteAccesorioDTO> crearReserva(
            @RequestParam Long clienteId,
            @RequestParam Long accesorioId,
            @RequestParam(required = false, defaultValue = "1") Integer cantidad,
            @RequestParam(required = false) BigDecimal precioUnitario) {
        
        log.info("POST /api/cliente-accesorio - Creando reserva para cliente {} y accesorio {}", clienteId, accesorioId);
        
        ClienteAccesorioDTO reserva = clienteAccesorioService.crearReserva(clienteId, accesorioId, cantidad, precioUnitario);
        return ResponseEntity.ok(reserva);
    }

    /**
     * Obtener todas las reservas de un cliente
     */
    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<ClienteAccesorioDTO>> obtenerReservasPorCliente(@PathVariable Long clienteId) {
        log.info("GET /api/cliente-accesorio/cliente/{} - Obteniendo reservas del cliente", clienteId);
        
        List<ClienteAccesorioDTO> reservas = clienteAccesorioService.obtenerReservasPorCliente(clienteId);
        return ResponseEntity.ok(reservas);
    }

    /**
     * Obtener todas las reservas de un accesorio
     */
    @GetMapping("/accesorio/{accesorioId}")
    public ResponseEntity<List<ClienteAccesorioDTO>> obtenerReservasPorAccesorio(@PathVariable Long accesorioId) {
        log.info("GET /api/cliente-accesorio/accesorio/{} - Obteniendo reservas del accesorio", accesorioId);
        
        List<ClienteAccesorioDTO> reservas = clienteAccesorioService.obtenerReservasPorAccesorio(accesorioId);
        return ResponseEntity.ok(reservas);
    }

    /**
     * Confirmar una reserva
     */
    @PutMapping("/{id}/confirmar")
    public ResponseEntity<ClienteAccesorioDTO> confirmarReserva(@PathVariable Long id) {
        log.info("PUT /api/cliente-accesorio/{}/confirmar - Confirmando reserva", id);
        
        ClienteAccesorioDTO reserva = clienteAccesorioService.confirmarReserva(id);
        return ResponseEntity.ok(reserva);
    }

    /**
     * Cancelar una reserva
     */
    @PutMapping("/{id}/cancelar")
    public ResponseEntity<ClienteAccesorioDTO> cancelarReserva(@PathVariable Long id) {
        log.info("PUT /api/cliente-accesorio/{}/cancelar - Cancelando reserva", id);
        
        ClienteAccesorioDTO reserva = clienteAccesorioService.cancelarReserva(id);
        return ResponseEntity.ok(reserva);
    }

    /**
     * Completar una reserva
     */
    @PutMapping("/{id}/completar")
    public ResponseEntity<ClienteAccesorioDTO> completarReserva(@PathVariable Long id) {
        log.info("PUT /api/cliente-accesorio/{}/completar - Completando reserva", id);
        
        ClienteAccesorioDTO reserva = clienteAccesorioService.completarReserva(id);
        return ResponseEntity.ok(reserva);
    }

    /**
     * Eliminar una reserva
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarReserva(@PathVariable Long id) {
        log.info("DELETE /api/cliente-accesorio/{} - Eliminando reserva", id);
        
        clienteAccesorioService.eliminarReserva(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Obtener estadísticas de reservas
     */
    @GetMapping("/estadisticas")
    public ResponseEntity<ClienteAccesorioService.ClienteAccesorioStatsDTO> obtenerEstadisticas() {
        log.info("GET /api/cliente-accesorio/estadisticas - Obteniendo estadísticas");
        
        ClienteAccesorioService.ClienteAccesorioStatsDTO estadisticas = clienteAccesorioService.obtenerEstadisticas();
        return ResponseEntity.ok(estadisticas);
    }
}

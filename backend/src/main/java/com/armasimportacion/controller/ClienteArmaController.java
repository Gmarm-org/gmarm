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
        
        log.info("CONTROLADOR ClienteArmaController.crearReserva INICIADO - Cliente: {}, Arma: {}", clienteId, armaId);
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
     * Asignar número de serie a una reserva
     */
    @PutMapping("/{id}/asignar-serie")
    public ResponseEntity<ClienteArmaDTO> asignarNumeroSerie(
            @PathVariable Long id,
            @RequestParam String numeroSerie) {
        
        log.info("PUT /api/cliente-arma/{}/asignar-serie - Asignando número de serie: {}", id, numeroSerie);
        
        ClienteArmaDTO reserva = clienteArmaService.asignarNumeroSerie(id, numeroSerie);
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
     * Obtener reservas pendientes para asignación de números de serie
     */
    @GetMapping("/pendientes")
    public ResponseEntity<List<ClienteArmaDTO>> obtenerReservasPendientes() {
        log.info("GET /api/cliente-arma/pendientes - Obteniendo reservas pendientes");
        
        List<ClienteArmaDTO> reservas = clienteArmaService.obtenerReservasPendientes();
        return ResponseEntity.ok(reservas);
    }

    /**
     * Obtener reservas pendientes de asignación de número de serie (estado RESERVADA)
     * Para uso del módulo de finanzas
     */
    @GetMapping("/pendientes-asignacion")
    public ResponseEntity<List<ClienteArmaDTO>> obtenerReservasPendientesAsignacion() {
        log.info("GET /api/cliente-arma/pendientes-asignacion - Obteniendo reservas pendientes de asignación");
        
        List<ClienteArmaDTO> reservas = clienteArmaService.obtenerReservasPendientesAsignacion();
        return ResponseEntity.ok(reservas);
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
    
    /**
     * Obtener armas en stock del vendedor (armas asignadas a clientes fantasma)
     * Estas son armas que el vendedor solicitó sin cliente y que pueden ser reasignadas
     */
    @GetMapping("/stock-vendedor/{usuarioId}")
    public ResponseEntity<List<ClienteArmaDTO>> obtenerArmasEnStockVendedor(@PathVariable Long usuarioId) {
        log.info("GET /api/cliente-arma/stock-vendedor/{} - Obteniendo armas en stock del vendedor", usuarioId);
        
        List<ClienteArmaDTO> armasEnStock = clienteArmaService.obtenerArmasEnStockVendedor(usuarioId);
        return ResponseEntity.ok(armasEnStock);
    }
    
    /**
     * Reasignar un arma de un cliente a otro
     * Útil para transferir armas del stock del vendedor a un cliente real
     */
    @PutMapping("/{clienteArmaId}/reasignar/{nuevoClienteId}")
    public ResponseEntity<ClienteArmaDTO> reasignarArmaACliente(
            @PathVariable Long clienteArmaId,
            @PathVariable Long nuevoClienteId) {
        log.info("PUT /api/cliente-arma/{}/reasignar/{} - Reasignando arma a nuevo cliente", 
            clienteArmaId, nuevoClienteId);
        
        ClienteArmaDTO clienteArma = clienteArmaService.reasignarArmaACliente(clienteArmaId, nuevoClienteId);
        return ResponseEntity.ok(clienteArma);
    }

    /**
     * Obtener todas las armas con estado REASIGNADO
     */
    @GetMapping("/reasignadas")
    public ResponseEntity<List<ClienteArmaDTO>> obtenerArmasReasignadas() {
        log.info("GET /api/cliente-arma/reasignadas - Obteniendo armas reasignadas");
        
        List<ClienteArmaDTO> armasReasignadas = clienteArmaService.obtenerArmasReasignadas();
        return ResponseEntity.ok(armasReasignadas);
    }
    
    /**
     * Actualizar el arma asignada en una reserva existente
     * Permite al Jefe de Ventas cambiar el arma que un cliente tiene reservada
     */
    @PutMapping("/{id}/actualizar-arma")
    public ResponseEntity<ClienteArmaDTO> actualizarArmaReserva(
            @PathVariable Long id,
            @RequestParam Long nuevaArmaId,
            @RequestParam(required = false) BigDecimal nuevoPrecioUnitario) {
        
        log.info("PUT /api/cliente-arma/{}/actualizar-arma - Actualizando arma a ID: {}", id, nuevaArmaId);
        
        ClienteArmaDTO reserva = clienteArmaService.actualizarArmaReserva(id, nuevaArmaId, nuevoPrecioUnitario);
        return ResponseEntity.ok(reserva);
    }
}

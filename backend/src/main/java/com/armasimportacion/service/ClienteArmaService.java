package com.armasimportacion.service;

import com.armasimportacion.dto.ClienteArmaDTO;
import com.armasimportacion.model.ClienteArma;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.Arma;
import com.armasimportacion.repository.ClienteArmaRepository;
import com.armasimportacion.repository.ClienteRepository;
import com.armasimportacion.repository.ArmaRepository;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.exception.BadRequestException;
import com.armasimportacion.service.helper.GestionDocumentosServiceHelper;
import com.armasimportacion.service.InventarioService;
import com.armasimportacion.model.Pago;
import com.armasimportacion.enums.EstadoPago;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio para la gestión de relaciones cliente-arma
 * Reemplaza a AsignacionArmaService para mantener consistencia
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ClienteArmaService {

    private final ClienteArmaRepository clienteArmaRepository;
    private final ClienteRepository clienteRepository;
    private final ArmaRepository armaRepository;
    private final GestionDocumentosServiceHelper documentosHelper;
    private final InventarioService inventarioService;

    /**
     * Crear una nueva reserva de arma para un cliente
     */
    public ClienteArmaDTO crearReserva(Long clienteId, Long armaId, Integer cantidad, BigDecimal precioUnitario) {
        log.info("🎯 MÉTODO crearReserva INICIADO - Cliente: {}, Arma: {}", clienteId, armaId);
        log.info("Creando reserva de arma {} para cliente {}", armaId, clienteId);
        
        // Validar que el cliente existe
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + clienteId));
        
        // Validar que el arma existe
        Arma arma = armaRepository.findById(armaId)
                .orElseThrow(() -> new ResourceNotFoundException("Arma no encontrada con ID: " + armaId));
        
        // Validar que no existe ya una reserva activa
        if (clienteArmaRepository.existsByClienteIdAndArmaId(clienteId, armaId)) {
            throw new BadRequestException("Ya existe una reserva de esta arma para este cliente");
        }
        
        // Validar cantidad
        if (cantidad == null || cantidad <= 0) {
            cantidad = 1;
        }
        
        // Validar stock disponible
        if (!inventarioService.tieneStockSuficiente(armaId, cantidad)) {
            Integer stockDisponible = inventarioService.getStockDisponible(armaId);
            throw new BadRequestException("Stock insuficiente. Disponible: " + stockDisponible + ", Solicitado: " + cantidad);
        }
        
        // Reducir stock del inventario
        inventarioService.reducirStock(armaId, cantidad);
        
        // Crear la reserva
        ClienteArma clienteArma = new ClienteArma();
        clienteArma.setCliente(cliente);
        clienteArma.setArma(arma);
        clienteArma.setCantidad(cantidad);
        clienteArma.setPrecioUnitario(precioUnitario);
        clienteArma.reservar(); // Usa el nuevo método que establece RESERVADA
        
        ClienteArma saved = clienteArmaRepository.save(clienteArma);
        log.info("Reserva creada exitosamente con ID: {}", saved.getId());
        
        // NOTA: El contrato se genera en ClienteCompletoService, no aquí
        log.info("✅ Reserva creada. El contrato será generado por ClienteCompletoService");
        
        return convertirADTO(saved);
    }

    /**
     * Obtener todas las reservas de un cliente
     */
    @Transactional(readOnly = true)
    public List<ClienteArmaDTO> obtenerReservasPorCliente(Long clienteId) {
        log.info("Obteniendo reservas para cliente: {}", clienteId);
        
        List<ClienteArma> reservas = clienteArmaRepository.findByClienteId(clienteId);
        return reservas.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener todas las reservas de una arma
     */
    @Transactional(readOnly = true)
    public List<ClienteArmaDTO> obtenerReservasPorArma(Long armaId) {
        log.info("Obteniendo reservas para arma: {}", armaId);
        
        List<ClienteArma> reservas = clienteArmaRepository.findByArmaId(armaId);
        return reservas.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    /**
     * Confirmar una reserva
     */
    public ClienteArmaDTO confirmarReserva(Long id) {
        log.info("Confirmando reserva: {}", id);
        
        ClienteArma clienteArma = clienteArmaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada con ID: " + id));
        
        if (!clienteArma.estaReservada()) {
            throw new BadRequestException("Solo se pueden confirmar reservas en estado RESERVADA");
        }
        
        clienteArma.completar();
        ClienteArma saved = clienteArmaRepository.save(clienteArma);
        log.info("Reserva confirmada exitosamente: {}", id);
        
        return convertirADTO(saved);
    }

    /**
     * Cancelar una reserva
     */
    public ClienteArmaDTO cancelarReserva(Long id) {
        log.info("Cancelando reserva: {}", id);
        
        ClienteArma clienteArma = clienteArmaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada con ID: " + id));
        
        if (clienteArma.estaCancelada() || clienteArma.estaCompletada()) {
            throw new BadRequestException("No se puede cancelar una reserva en estado: " + clienteArma.getEstado());
        }
        
        clienteArma.cancelar();
        ClienteArma saved = clienteArmaRepository.save(clienteArma);
        
        // Devolver stock al inventario
        inventarioService.aumentarStock(clienteArma.getArma().getId(), clienteArma.getCantidad());
        
        log.info("Reserva cancelada exitosamente: {} - Stock devuelto: {}", id, clienteArma.getCantidad());
        
        return convertirADTO(saved);
    }

    /**
     * Completar una reserva
     */
    public ClienteArmaDTO completarReserva(Long id) {
        log.info("Completando reserva: {}", id);
        
        ClienteArma clienteArma = clienteArmaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada con ID: " + id));
        
        if (!clienteArma.estaAsignada()) {
            throw new BadRequestException("Solo se pueden completar reservas asignadas");
        }
        
        clienteArma.completar();
        ClienteArma saved = clienteArmaRepository.save(clienteArma);
        log.info("Reserva completada exitosamente: {}", id);
        
        return convertirADTO(saved);
    }

    /**
     * Asignar número de serie a una reserva (pasa a ASIGNADA)
     */
    public ClienteArmaDTO asignarNumeroSerie(Long id, String numeroSerie) {
        log.info("Asignando número de serie {} a reserva: {}", numeroSerie, id);
        
        ClienteArma clienteArma = clienteArmaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada con ID: " + id));
        
        if (!clienteArma.estaReservada()) {
            throw new BadRequestException("Solo se pueden asignar números de serie a reservas en estado RESERVADA");
        }
        
        // Validar que el número de serie no esté ya asignado
        if (clienteArmaRepository.existsByNumeroSerie(numeroSerie)) {
            throw new BadRequestException("El número de serie ya está asignado a otra arma");
        }
        
        clienteArma.asignar(numeroSerie);
        ClienteArma saved = clienteArmaRepository.save(clienteArma);
        
        log.info("Número de serie asignado exitosamente: {} - Reserva: {}", numeroSerie, id);
        
        return convertirADTO(saved);
    }

    /**
     * Obtener reservas pendientes para asignación de números de serie
     */
    @Transactional(readOnly = true)
    public List<ClienteArmaDTO> obtenerReservasPendientes() {
        log.info("Obteniendo reservas pendientes para asignación de series");
        
        List<ClienteArma> reservas = clienteArmaRepository.findByEstado(ClienteArma.EstadoClienteArma.RESERVADA);
        return reservas.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener reservas pendientes de asignación de número de serie (estado RESERVADA)
     * Con información completa del cliente y arma para el módulo de finanzas
     */
    public List<ClienteArmaDTO> obtenerReservasPendientesAsignacion() {
        log.info("Obteniendo reservas pendientes de asignación de número de serie");
        
        List<ClienteArma> reservas = clienteArmaRepository.findByEstado(ClienteArma.EstadoClienteArma.RESERVADA);
        return reservas.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    /**
     * Eliminar una reserva
     */
    public void eliminarReserva(Long id) {
        log.info("Eliminando reserva: {}", id);
        
        ClienteArma clienteArma = clienteArmaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada con ID: " + id));
        
        // Devolver stock al inventario si la reserva no está cancelada
        if (!clienteArma.estaCancelada()) {
            inventarioService.aumentarStock(clienteArma.getArma().getId(), clienteArma.getCantidad());
            log.info("Stock devuelto al eliminar reserva: {}", clienteArma.getCantidad());
        }
        
        clienteArmaRepository.deleteById(id);
        log.info("Reserva eliminada exitosamente: {}", id);
    }

    /**
     * Obtener estadísticas de reservas
     */
    @Transactional(readOnly = true)
    public ClienteArmaStatsDTO obtenerEstadisticas() {
        long totalReservas = clienteArmaRepository.count();
        long reservasPendientes = clienteArmaRepository.countByEstado(ClienteArma.EstadoClienteArma.RESERVADA);
        long reservasAsignadas = clienteArmaRepository.countByEstado(ClienteArma.EstadoClienteArma.ASIGNADA);
        long reservasCanceladas = clienteArmaRepository.countByEstado(ClienteArma.EstadoClienteArma.CANCELADA);
        long reservasCompletadas = clienteArmaRepository.countByEstado(ClienteArma.EstadoClienteArma.COMPLETADA);
        
        return new ClienteArmaStatsDTO(totalReservas, reservasPendientes, reservasAsignadas, reservasCanceladas, reservasCompletadas);
    }

    /**
     * Convertir entidad a DTO
     */
    private ClienteArmaDTO convertirADTO(ClienteArma clienteArma) {
        ClienteArmaDTO dto = new ClienteArmaDTO();
        dto.setId(clienteArma.getId());
        dto.setClienteId(clienteArma.getCliente().getId());
        dto.setClienteNombre(clienteArma.getCliente().getNombreCompleto());
        dto.setArmaId(clienteArma.getArma().getId());
        dto.setArmaNombre(clienteArma.getArma().getNombre());
        dto.setArmaCodigo(clienteArma.getArma().getCodigo());
        dto.setArmaModelo(clienteArma.getArma().getCalibre());
        dto.setArmaImagen(clienteArma.getArma().getUrlImagen());
        dto.setCantidad(clienteArma.getCantidad());
        dto.setPrecioUnitario(clienteArma.getPrecioUnitario());
        dto.setEstado(clienteArma.getEstado().name());
        dto.setNumeroSerie(clienteArma.getNumeroSerie());
        dto.setFechaAsignacion(clienteArma.getFechaAsignacion());
        dto.setFechaCreacion(clienteArma.getFechaCreacion());
        dto.setFechaActualizacion(clienteArma.getFechaActualizacion());
        return dto;
    }


    /**
     * DTO para estadísticas
     */
    public static class ClienteArmaStatsDTO {
        private final long totalReservas;
        private final long reservasPendientes;
        private final long reservasConfirmadas;
        private final long reservasCanceladas;
        private final long reservasCompletadas;

        public ClienteArmaStatsDTO(long totalReservas, long reservasPendientes, long reservasConfirmadas, 
                                 long reservasCanceladas, long reservasCompletadas) {
            this.totalReservas = totalReservas;
            this.reservasPendientes = reservasPendientes;
            this.reservasConfirmadas = reservasConfirmadas;
            this.reservasCanceladas = reservasCanceladas;
            this.reservasCompletadas = reservasCompletadas;
        }

        // Getters
        public long getTotalReservas() { return totalReservas; }
        public long getReservasPendientes() { return reservasPendientes; }
        public long getReservasConfirmadas() { return reservasConfirmadas; }
        public long getReservasCanceladas() { return reservasCanceladas; }
        public long getReservasCompletadas() { return reservasCompletadas; }
    }
}

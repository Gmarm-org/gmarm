package com.armasimportacion.service;

import com.armasimportacion.dto.ClienteAccesorioDTO;
import com.armasimportacion.model.ClienteAccesorio;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.Accesorio;
import com.armasimportacion.repository.ClienteAccesorioRepository;
import com.armasimportacion.repository.ClienteRepository;
import com.armasimportacion.repository.AccesorioRepository;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio para la gestión de relaciones cliente-accesorio
 * Reemplaza a AsignacionAccesorioService para mantener consistencia
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ClienteAccesorioService {

    private final ClienteAccesorioRepository clienteAccesorioRepository;
    private final ClienteRepository clienteRepository;
    private final AccesorioRepository accesorioRepository;

    /**
     * Crear una nueva reserva de accesorio para un cliente
     */
    public ClienteAccesorioDTO crearReserva(Long clienteId, Long accesorioId, Integer cantidad, BigDecimal precioUnitario) {
        log.info("Creando reserva de accesorio {} para cliente {}", accesorioId, clienteId);
        
        // Validar que el cliente existe
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + clienteId));
        
        // Validar que el accesorio existe
        Accesorio accesorio = accesorioRepository.findById(accesorioId)
                .orElseThrow(() -> new ResourceNotFoundException("Accesorio no encontrado con ID: " + accesorioId));
        
        // Validar que no existe ya una reserva activa
        if (clienteAccesorioRepository.existsByClienteIdAndAccesorioId(clienteId, accesorioId)) {
            throw new BadRequestException("Ya existe una reserva de este accesorio para este cliente");
        }
        
        // Validar cantidad
        if (cantidad == null || cantidad <= 0) {
            cantidad = 1;
        }
        
        // Crear la reserva
        ClienteAccesorio clienteAccesorio = new ClienteAccesorio();
        clienteAccesorio.setCliente(cliente);
        clienteAccesorio.setAccesorio(accesorio);
        clienteAccesorio.setCantidad(cantidad);
        clienteAccesorio.setPrecioUnitario(precioUnitario);
        clienteAccesorio.setEstado(ClienteAccesorio.EstadoClienteAccesorio.RESERVADO);
        clienteAccesorio.setFechaAsignacion(LocalDateTime.now());
        
        ClienteAccesorio saved = clienteAccesorioRepository.save(clienteAccesorio);
        log.info("Reserva creada exitosamente con ID: {}", saved.getId());
        
        return convertirADTO(saved);
    }

    /**
     * Obtener todas las reservas de un cliente
     */
    @Transactional(readOnly = true)
    public List<ClienteAccesorioDTO> obtenerReservasPorCliente(Long clienteId) {
        log.info("Obteniendo reservas de accesorios para cliente: {}", clienteId);
        
        List<ClienteAccesorio> reservas = clienteAccesorioRepository.findByClienteId(clienteId);
        return reservas.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener todas las reservas de un accesorio
     */
    @Transactional(readOnly = true)
    public List<ClienteAccesorioDTO> obtenerReservasPorAccesorio(Long accesorioId) {
        log.info("Obteniendo reservas para accesorio: {}", accesorioId);
        
        List<ClienteAccesorio> reservas = clienteAccesorioRepository.findByAccesorioId(accesorioId);
        return reservas.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    /**
     * Confirmar una reserva
     */
    public ClienteAccesorioDTO confirmarReserva(Long id) {
        log.info("Confirmando reserva de accesorio: {}", id);
        
        ClienteAccesorio clienteAccesorio = clienteAccesorioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada con ID: " + id));
        
        if (!clienteAccesorio.estaReservado()) {
            throw new BadRequestException("Solo se pueden confirmar reservas en estado RESERVADO");
        }
        
        clienteAccesorio.confirmar();
        ClienteAccesorio saved = clienteAccesorioRepository.save(clienteAccesorio);
        log.info("Reserva de accesorio confirmada exitosamente: {}", id);
        
        return convertirADTO(saved);
    }

    /**
     * Cancelar una reserva
     */
    public ClienteAccesorioDTO cancelarReserva(Long id) {
        log.info("Cancelando reserva de accesorio: {}", id);
        
        ClienteAccesorio clienteAccesorio = clienteAccesorioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada con ID: " + id));
        
        if (clienteAccesorio.estaCancelado() || clienteAccesorio.estaCompletado()) {
            throw new BadRequestException("No se puede cancelar una reserva en estado: " + clienteAccesorio.getEstado());
        }
        
        clienteAccesorio.cancelar();
        ClienteAccesorio saved = clienteAccesorioRepository.save(clienteAccesorio);
        log.info("Reserva de accesorio cancelada exitosamente: {}", id);
        
        return convertirADTO(saved);
    }

    /**
     * Completar una reserva
     */
    public ClienteAccesorioDTO completarReserva(Long id) {
        log.info("Completando reserva de accesorio: {}", id);
        
        ClienteAccesorio clienteAccesorio = clienteAccesorioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada con ID: " + id));
        
        if (!clienteAccesorio.estaConfirmado()) {
            throw new BadRequestException("Solo se pueden completar reservas confirmadas");
        }
        
        clienteAccesorio.completar();
        ClienteAccesorio saved = clienteAccesorioRepository.save(clienteAccesorio);
        log.info("Reserva de accesorio completada exitosamente: {}", id);
        
        return convertirADTO(saved);
    }

    /**
     * Eliminar una reserva
     */
    public void eliminarReserva(Long id) {
        log.info("Eliminando reserva de accesorio: {}", id);
        
        if (!clienteAccesorioRepository.existsById(id)) {
            throw new ResourceNotFoundException("Reserva no encontrada con ID: " + id);
        }
        
        clienteAccesorioRepository.deleteById(id);
        log.info("Reserva de accesorio eliminada exitosamente: {}", id);
    }

    /**
     * Obtener estadísticas de reservas
     */
    @Transactional(readOnly = true)
    public ClienteAccesorioStatsDTO obtenerEstadisticas() {
        long totalReservas = clienteAccesorioRepository.count();
        long reservasPendientes = clienteAccesorioRepository.countByEstado(ClienteAccesorio.EstadoClienteAccesorio.RESERVADO);
        long reservasConfirmadas = clienteAccesorioRepository.countByEstado(ClienteAccesorio.EstadoClienteAccesorio.CONFIRMADO);
        long reservasCanceladas = clienteAccesorioRepository.countByEstado(ClienteAccesorio.EstadoClienteAccesorio.CANCELADO);
        long reservasCompletadas = clienteAccesorioRepository.countByEstado(ClienteAccesorio.EstadoClienteAccesorio.COMPLETADO);
        
        return new ClienteAccesorioStatsDTO(totalReservas, reservasPendientes, reservasConfirmadas, reservasCanceladas, reservasCompletadas);
    }

    /**
     * Convertir entidad a DTO
     */
    private ClienteAccesorioDTO convertirADTO(ClienteAccesorio clienteAccesorio) {
        ClienteAccesorioDTO dto = new ClienteAccesorioDTO();
        dto.setId(clienteAccesorio.getId());
        dto.setClienteId(clienteAccesorio.getCliente().getId());
        dto.setClienteNombre(clienteAccesorio.getCliente().getNombreCompleto());
        dto.setAccesorioId(clienteAccesorio.getAccesorio().getId());
        dto.setAccesorioNombre(clienteAccesorio.getAccesorio().getNombre());
        dto.setAccesorioCodigo(clienteAccesorio.getAccesorio().getCodigo());
        dto.setCantidad(clienteAccesorio.getCantidad());
        dto.setPrecioUnitario(clienteAccesorio.getPrecioUnitario());
        dto.setEstado(clienteAccesorio.getEstado().name());
        dto.setFechaAsignacion(clienteAccesorio.getFechaAsignacion());
        dto.setFechaCreacion(clienteAccesorio.getFechaCreacion());
        dto.setFechaActualizacion(clienteAccesorio.getFechaActualizacion());
        return dto;
    }

    /**
     * DTO para estadísticas
     */
    public static class ClienteAccesorioStatsDTO {
        private final long totalReservas;
        private final long reservasPendientes;
        private final long reservasConfirmadas;
        private final long reservasCanceladas;
        private final long reservasCompletadas;

        public ClienteAccesorioStatsDTO(long totalReservas, long reservasPendientes, long reservasConfirmadas, 
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

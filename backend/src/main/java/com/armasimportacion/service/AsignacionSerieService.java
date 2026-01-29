package com.armasimportacion.service;

import com.armasimportacion.dto.ArmaSerieDTO;
import com.armasimportacion.dto.ReservaPendienteDTO;
import com.armasimportacion.model.ArmaSerie;
import com.armasimportacion.model.ClienteArma;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.repository.ArmaSerieRepository;
import com.armasimportacion.repository.ClienteArmaRepository;
import com.armasimportacion.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio para la asignación de series de armas a clientes
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AsignacionSerieService {

    private final ClienteArmaRepository clienteArmaRepository;
    private final ArmaSerieRepository armaSerieRepository;
    private final UsuarioRepository usuarioRepository;

    /**
     * Obtener todas las reservas pendientes de asignar serie
     * (estado = RESERVADA y sin numero_serie)
     */
    public List<ReservaPendienteDTO> obtenerReservasPendientes() {
        log.info("📋 Obteniendo reservas pendientes de asignar serie");
        
        List<ClienteArma> reservas = clienteArmaRepository
            .findByEstadoAndNumeroSerieIsNull(ClienteArma.EstadoClienteArma.RESERVADA);
        
        log.info("✅ Se encontraron {} reservas pendientes", reservas.size());
        
        // Convertir a DTO para evitar recursión infinita en JSON
        return reservas.stream()
            .map(reserva -> ReservaPendienteDTO.builder()
                .id(reserva.getId())
                .clienteId(reserva.getCliente().getId())
                .clienteNombres(reserva.getCliente().getNombres())
                .clienteApellidos(reserva.getCliente().getApellidos())
                .clienteNumeroIdentificacion(reserva.getCliente().getNumeroIdentificacion())
                .armaId(reserva.getArma().getId())
                .armaCodigo(reserva.getArma().getCodigo())
                .armaNombre(reserva.getArma().getModelo()) // Cambiado de nombre a modelo
                .armaCalibre(reserva.getArma().getCalibre())
                .armaCapacidad(reserva.getArma().getCapacidad())
                .cantidad(reserva.getCantidad())
                .precioUnitario(reserva.getPrecioUnitario())
                .estado(reserva.getEstado().name())
                .fechaAsignacion(reserva.getFechaAsignacion())
                .fechaCreacion(reserva.getFechaCreacion())
                .build())
            .collect(Collectors.toList());
    }

    /**
     * Obtener series disponibles para un arma específica
     */
    public List<ArmaSerieDTO> obtenerSeriesDisponibles(Long armaId) {
        log.info("🔍 Obteniendo series disponibles para arma ID: {}", armaId);
        
        List<ArmaSerie> series = armaSerieRepository
            .findByArmaIdAndEstado(armaId, ArmaSerie.EstadoSerie.DISPONIBLE);
        
        log.info("✅ Se encontraron {} series disponibles", series.size());
        
        // Convertir a DTO para evitar referencias circulares
        return series.stream()
            .map(ArmaSerieDTO::fromEntity)
            .collect(Collectors.toList());
    }

    /**
     * Asignar una serie a un cliente_arma
     */
    @Transactional
    public ClienteArma asignarSerie(
        Long clienteArmaId, 
        String numeroSerie, 
        Long usuarioAsignadorId
    ) {
        log.info("🎯 Asignando serie {} a cliente_arma {}", numeroSerie, clienteArmaId);

        // 1. Validar que existe la reserva del cliente
        ClienteArma clienteArma = clienteArmaRepository.findById(clienteArmaId)
            .orElseThrow(() -> new IllegalArgumentException(
                "❌ No se encontró la reserva del cliente con ID: " + clienteArmaId
            ));

        // 2. Validar que la reserva esté en estado RESERVADA
        if (clienteArma.getEstado() != ClienteArma.EstadoClienteArma.RESERVADA) {
            throw new IllegalStateException(
                "❌ La reserva debe estar en estado RESERVADA. Estado actual: " + clienteArma.getEstado()
            );
        }

        // 3. Validar que no tenga serie asignada
        if (clienteArma.getNumeroSerie() != null) {
            throw new IllegalStateException(
                "❌ Esta reserva ya tiene una serie asignada: " + clienteArma.getNumeroSerie()
            );
        }

        // 4. Validar que existe la serie
        ArmaSerie armaSerie = armaSerieRepository.findByNumeroSerie(numeroSerie)
            .orElseThrow(() -> new IllegalArgumentException(
                "❌ No se encontró la serie con número: " + numeroSerie
            ));

        // 5. Validar que la serie esté disponible
        if (armaSerie.getEstado() != ArmaSerie.EstadoSerie.DISPONIBLE) {
            throw new IllegalStateException(
                "❌ La serie no está disponible. Estado actual: " + armaSerie.getEstado()
            );
        }

        // 6. Validar que la serie corresponda al arma que el cliente eligió
        if (!clienteArma.getArma().getId().equals(armaSerie.getArma().getId())) {
            throw new IllegalStateException(
                "❌ La serie no corresponde al arma que el cliente eligió"
            );
        }

        // 7. Obtener usuario asignador
        Usuario usuarioAsignador = usuarioRepository.findById(usuarioAsignadorId)
            .orElseThrow(() -> new IllegalArgumentException(
                "❌ No se encontró el usuario asignador con ID: " + usuarioAsignadorId
            ));

        // 8. Actualizar cliente_arma
        clienteArma.setNumeroSerie(armaSerie.getNumeroSerie());
        clienteArma.setEstado(ClienteArma.EstadoClienteArma.ASIGNADA);
        clienteArma.setFechaAsignacion(LocalDateTime.now());
        clienteArma.setFechaActualizacion(LocalDateTime.now());
        
        ClienteArma clienteArmaActualizado = clienteArmaRepository.save(clienteArma);
        log.info("✅ Cliente_arma actualizado con serie: {}", armaSerie.getNumeroSerie());

        // 9. Actualizar arma_serie usando el método asignar()
        armaSerie.asignar(clienteArma, usuarioAsignador);
        
        armaSerieRepository.save(armaSerie);
        log.info("✅ Arma_serie actualizada a estado ASIGNADO");

        log.info("🎉 Serie asignada exitosamente: {} → Cliente: {} {}", 
            armaSerie.getNumeroSerie(),
            clienteArma.getCliente().getNombres(),
            clienteArma.getCliente().getApellidos()
        );

        return clienteArmaActualizado;
    }
}


package com.armasimportacion.service;

import com.armasimportacion.model.ClienteArma;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.Arma;
import com.armasimportacion.repository.ClienteArmaRepository;
import com.armasimportacion.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ClienteArmaService {
    
    private final ClienteArmaRepository clienteArmaRepository;
    
    /**
     * Obtener todas las asignaciones de armas por cliente
     */
    public List<ClienteArma> findByClienteId(Long clienteId) {
        log.info("Obteniendo armas asignadas al cliente ID: {}", clienteId);
        return clienteArmaRepository.findByClienteId(clienteId);
    }
    
    /**
     * Obtener asignación por ID
     */
    public ClienteArma findById(Long id) {
        log.info("Buscando asignación cliente-arma con ID: {}", id);
        return clienteArmaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asignación cliente-arma no encontrada con ID: " + id));
    }
    
    /**
     * Buscar asignación existente por cliente y arma
     */
    public Optional<ClienteArma> findByClienteIdAndArmaId(Long clienteId, Long armaId) {
        log.info("Buscando asignación existente para cliente ID: {} y arma ID: {}", clienteId, armaId);
        return clienteArmaRepository.findByClienteIdAndArmaId(clienteId, armaId);
    }
    
    /**
     * Asignar arma a cliente
     */
    public ClienteArma asignarArma(Long clienteId, Long armaId, Integer cantidad, BigDecimal precioUnitario) {
        log.info("Asignando arma ID: {} al cliente ID: {} con cantidad: {} y precio: {}", armaId, clienteId, cantidad, precioUnitario);
        
        // Verificar si ya existe una asignación
        Optional<ClienteArma> existingAsignacion = findByClienteIdAndArmaId(clienteId, armaId);
        
        if (existingAsignacion.isPresent()) {
            // Actualizar cantidad existente y precio (el precio puede cambiar)
            ClienteArma asignacion = existingAsignacion.get();
            asignacion.setCantidad(asignacion.getCantidad() + cantidad);
            asignacion.setPrecioUnitario(precioUnitario); // Precio actualizado
            asignacion.setFechaActualizacion(LocalDateTime.now());
            log.info("Actualizada asignación existente - Nueva cantidad total: {}, Precio unitario: {}", 
                    asignacion.getCantidad(), asignacion.getPrecioUnitario());
            return clienteArmaRepository.save(asignacion);
        } else {
            // Crear nueva asignación
            ClienteArma nuevaAsignacion = ClienteArma.builder()
                    .cliente(Cliente.builder().id(clienteId).build())
                    .arma(Arma.builder().id(armaId).build())
                    .cantidad(cantidad)
                    .precioUnitario(precioUnitario)
                    .estado("RESERVADO")
                    .fechaAsignacion(LocalDateTime.now())
                    .fechaCreacion(LocalDateTime.now())
                    .fechaActualizacion(LocalDateTime.now())
                    .build();
            
            log.info("Creada nueva asignación - Cantidad: {}, Precio unitario: {}", 
                    cantidad, precioUnitario);
            return clienteArmaRepository.save(nuevaAsignacion);
        }
    }
    
    /**
     * Actualizar cantidad de arma asignada
     */
    public ClienteArma updateCantidad(Long id, Integer nuevaCantidad) {
        log.info("Actualizando cantidad de asignación ID: {} a: {}", id, nuevaCantidad);
        ClienteArma asignacion = findById(id);
        asignacion.setCantidad(nuevaCantidad);
        asignacion.setFechaActualizacion(LocalDateTime.now());
        return clienteArmaRepository.save(asignacion);
    }
    
    /**
     * Cambiar estado de asignación
     */
    public ClienteArma changeEstado(Long id, String nuevoEstado) {
        log.info("Cambiando estado de asignación ID: {} a: {}", id, nuevoEstado);
        ClienteArma asignacion = findById(id);
        asignacion.setEstado(nuevoEstado);
        asignacion.setFechaActualizacion(LocalDateTime.now());
        return clienteArmaRepository.save(asignacion);
    }
    
    /**
     * Eliminar asignación
     */
    public void delete(Long id) {
        log.info("Eliminando asignación cliente-arma con ID: {}", id);
        clienteArmaRepository.deleteById(id);
    }
    
    /**
     * Contar armas asignadas por cliente
     */
    public Long countByClienteId(Long clienteId) {
        log.info("Contando armas asignadas al cliente ID: {}", clienteId);
        return clienteArmaRepository.countByClienteId(clienteId);
    }
    
    /**
     * Obtener resumen de armas por cliente con totales
     */
    public Map<String, Object> getResumenArmasByCliente(Long clienteId) {
        log.info("Obteniendo resumen de armas para cliente ID: {}", clienteId);
        List<ClienteArma> asignaciones = findByClienteId(clienteId);
        
        BigDecimal totalGeneral = BigDecimal.ZERO;
        int totalArmas = 0;
        List<Map<String, Object>> detalleArmas = new ArrayList<>();
        
        for (ClienteArma asignacion : asignaciones) {
            BigDecimal subtotal = asignacion.getPrecioUnitario()
                    .multiply(BigDecimal.valueOf(asignacion.getCantidad()));
            
            totalGeneral = totalGeneral.add(subtotal);
            totalArmas += asignacion.getCantidad();
            
            Map<String, Object> detalle = new HashMap<>();
            detalle.put("armaId", asignacion.getArma().getId());
            detalle.put("armaNombre", asignacion.getArma().getNombre());
            detalle.put("cantidad", asignacion.getCantidad());
            detalle.put("precioUnitario", asignacion.getPrecioUnitario());
            detalle.put("subtotal", subtotal);
            detalle.put("estado", asignacion.getEstado());
            
            detalleArmas.add(detalle);
        }
        
        Map<String, Object> resumen = new HashMap<>();
        resumen.put("clienteId", clienteId);
        resumen.put("totalArmas", totalArmas);
        resumen.put("totalGeneral", totalGeneral);
        resumen.put("detalleArmas", detalleArmas);
        
        log.info("Resumen generado - Total armas: {}, Total general: {}", totalArmas, totalGeneral);
        return resumen;
    }
    
    /**
     * Asignar múltiples armas a un cliente en una sola operación
     */
    public List<ClienteArma> asignarMultiplesArmas(Long clienteId, List<Map<String, Object>> armasData) {
        log.info("Asignando múltiples armas al cliente ID: {}", clienteId);
        List<ClienteArma> asignaciones = new ArrayList<>();
        
        for (Map<String, Object> armaData : armasData) {
            Long armaId = Long.valueOf(armaData.get("armaId").toString());
            Integer cantidad = Integer.valueOf(armaData.get("cantidad").toString());
            BigDecimal precioUnitario = new BigDecimal(armaData.get("precioUnitario").toString());
            
            ClienteArma asignacion = asignarArma(clienteId, armaId, cantidad, precioUnitario);
            asignaciones.add(asignacion);
        }
        
        log.info("Asignadas {} armas al cliente ID: {}", asignaciones.size(), clienteId);
        return asignaciones;
    }
    
    /**
     * Actualizar precio de arma específica para un cliente
     */
    public ClienteArma updatePrecioArma(Long clienteId, Long armaId, BigDecimal nuevoPrecio) {
        log.info("Actualizando precio de arma ID: {} para cliente ID: {} a: {}", armaId, clienteId, nuevoPrecio);
        
        Optional<ClienteArma> asignacion = findByClienteIdAndArmaId(clienteId, armaId);
        if (asignacion.isPresent()) {
            ClienteArma ca = asignacion.get();
            ca.setPrecioUnitario(nuevoPrecio);
            ca.setFechaActualizacion(LocalDateTime.now());
            return clienteArmaRepository.save(ca);
        } else {
            throw new ResourceNotFoundException("No existe asignación de arma ID: " + armaId + " para cliente ID: " + clienteId);
        }
    }
}

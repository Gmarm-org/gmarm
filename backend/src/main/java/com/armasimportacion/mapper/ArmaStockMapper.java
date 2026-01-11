package com.armasimportacion.mapper;

import com.armasimportacion.dto.ArmaStockDTO;
import com.armasimportacion.model.ArmaStock;
import com.armasimportacion.model.ClienteArma;
import com.armasimportacion.repository.ClienteArmaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper para convertir entre ArmaStock y ArmaStockDTO
 */
@Component
@RequiredArgsConstructor
public class ArmaStockMapper {
    
    private final ClienteArmaRepository clienteArmaRepository;
    
    public ArmaStockDTO toDTO(ArmaStock armaStock) {
        if (armaStock == null || armaStock.getArma() == null) {
            return null;
        }
        
        // Contar armas asignadas (con pago completado - estado ASIGNADA)
        Long armaId = armaStock.getArma().getId();
        int cantidadAsignada = clienteArmaRepository.findByArmaId(armaId).stream()
            .filter(ca -> ca.getEstado() == ClienteArma.EstadoClienteArma.ASIGNADA)
            .mapToInt(ClienteArma::getCantidad)
            .sum();
        
        return ArmaStockDTO.builder()
            .armaId(armaStock.getArma().getId())
            .armaNombre(armaStock.getModelo() != null ? armaStock.getModelo() : armaStock.getArma().getModelo()) // Usar campo denormalizado si existe
            .armaModelo(armaStock.getModelo() != null ? armaStock.getModelo() : armaStock.getArma().getModelo()) // Nuevo campo
            .armaMarca(armaStock.getMarca() != null ? armaStock.getMarca() : armaStock.getArma().getMarca()) // Nuevo campo
            .armaAlimentadora(armaStock.getAlimentadora() != null ? armaStock.getAlimentadora() : armaStock.getArma().getAlimentadora()) // Nuevo campo
            .armaCodigo(armaStock.getArma().getCodigo())
            .armaCalibre(armaStock.getArma().getCalibre())
            .cantidadTotal(armaStock.getCantidadTotal())
            .cantidadDisponible(armaStock.getCantidadDisponible())
            .cantidadAsignada(cantidadAsignada)
            .precioVenta(armaStock.getPrecioVenta())
            .activo(armaStock.getActivo())
            .build();
    }
    
    public List<ArmaStockDTO> toDTOList(List<ArmaStock> armaStockList) {
        if (armaStockList == null) {
            return List.of();
        }
        
        return armaStockList.stream()
            .map(this::toDTO)
            .filter(dto -> dto != null)
            .collect(Collectors.toList());
    }
}

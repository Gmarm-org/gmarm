package com.armasimportacion.mapper;

import com.armasimportacion.dto.ArmaStockDTO;
import com.armasimportacion.model.ArmaStock;
import com.armasimportacion.model.ClienteArma;
import com.armasimportacion.repository.ClienteArmaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Mapper para convertir entre ArmaStock y ArmaStockDTO
 */
@Component
@RequiredArgsConstructor
public class ArmaStockMapper {

    private final ClienteArmaRepository clienteArmaRepository;

    public ArmaStockDTO toDTO(ArmaStock armaStock, int cantidadAsignada) {
        if (armaStock == null || armaStock.getArma() == null) {
            return null;
        }

        return ArmaStockDTO.builder()
            .armaId(armaStock.getArma().getId())
            .armaNombre(armaStock.getModelo() != null ? armaStock.getModelo() : armaStock.getArma().getModelo())
            .armaModelo(armaStock.getModelo() != null ? armaStock.getModelo() : armaStock.getArma().getModelo())
            .armaMarca(armaStock.getMarca() != null ? armaStock.getMarca() : armaStock.getArma().getMarca())
            .armaAlimentadora(armaStock.getAlimentadora() != null ? armaStock.getAlimentadora() : armaStock.getArma().getAlimentadora())
            .armaCodigo(armaStock.getArma().getCodigo())
            .armaCalibre(armaStock.getArma().getCalibre())
            .cantidadTotal(armaStock.getCantidadTotal())
            .cantidadDisponible(armaStock.getCantidadDisponible())
            .cantidadAsignada(cantidadAsignada)
            .precioVenta(armaStock.getPrecioVenta())
            .activo(armaStock.getActivo())
            .build();
    }

    /**
     * Convierte lista de ArmaStock a DTOs usando una sola query batch para cantidades asignadas.
     * Antes: N+1 queries (1 query por cada arma para obtener cantidadAsignada).
     * Ahora: 1 query batch para todas las cantidades.
     */
    public List<ArmaStockDTO> toDTOList(List<ArmaStock> armaStockList) {
        if (armaStockList == null || armaStockList.isEmpty()) {
            return List.of();
        }

        // Obtener todos los armaIds
        List<Long> armaIds = armaStockList.stream()
            .filter(as -> as.getArma() != null)
            .map(as -> as.getArma().getId())
            .collect(Collectors.toList());

        // Una sola query para obtener todas las cantidades asignadas
        Map<Long, Integer> cantidadesAsignadas = new HashMap<>();
        if (!armaIds.isEmpty()) {
            List<Object[]> resultados = clienteArmaRepository.sumCantidadByArmaIdInAndEstado(
                armaIds, ClienteArma.EstadoClienteArma.ASIGNADA);
            for (Object[] row : resultados) {
                Long armaId = (Long) row[0];
                int cantidad = ((Number) row[1]).intValue();
                cantidadesAsignadas.put(armaId, cantidad);
            }
        }

        return armaStockList.stream()
            .filter(as -> as != null && as.getArma() != null)
            .map(as -> {
                int cantidadAsignada = cantidadesAsignadas.getOrDefault(as.getArma().getId(), 0);
                return toDTO(as, cantidadAsignada);
            })
            .collect(Collectors.toList());
    }
}

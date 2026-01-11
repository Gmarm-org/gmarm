package com.armasimportacion.mapper;

import com.armasimportacion.dto.ArmaDTO;
import com.armasimportacion.model.Arma;
import com.armasimportacion.model.ArmaStock;
import com.armasimportacion.service.InventarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ArmaMapper {
    
    private final ArmaImagenMapper armaImagenMapper;
    private final InventarioService inventarioService;

    public ArmaDTO toDTO(Arma arma) {
        if (arma == null) {
            return null;
        }

        // Obtener información de stock
        Optional<ArmaStock> stockOpt = inventarioService.getArmaStock(arma.getId());
        Integer cantidadTotal = 0;
        Integer cantidadDisponible = 0;
        Boolean tieneStock = false;
        
        if (stockOpt.isPresent()) {
            ArmaStock stock = stockOpt.get();
            cantidadTotal = stock.getCantidadTotal();
            cantidadDisponible = stock.getCantidadDisponible();
            tieneStock = stock.tieneStockDisponible();
        }

        return ArmaDTO.builder()
                .id(arma.getId())
                .codigo(arma.getCodigo())
                .modelo(arma.getModelo()) // Cambiado de nombre a modelo
                .marca(arma.getMarca()) // Nuevo campo
                .alimentadora(arma.getAlimentadora()) // Nuevo campo
                .calibre(arma.getCalibre())
                .capacidad(arma.getCapacidad())
                .precioReferencia(arma.getPrecioReferencia())
                .categoriaId(arma.getCategoria() != null ? arma.getCategoria().getId() : null)
                .categoriaNombre(arma.getCategoria() != null ? arma.getCategoria().getNombre() : null)
                .categoriaCodigo(arma.getCategoria() != null ? arma.getCategoria().getCodigo() : null)
                .urlImagen(arma.getUrlImagen())
                .urlProducto(arma.getUrlProducto())
                .estado(arma.getEstado())
                .fechaCreacion(arma.getFechaCreacion())
                .fechaActualizacion(arma.getFechaActualizacion())
                // Mapear imágenes
                .imagenes(armaImagenMapper.toDTOList(arma.getImagenes()))
                .imagenPrincipal(arma.getImagenPrincipal())
                // Información de stock
                .cantidadTotal(cantidadTotal)
                .cantidadDisponible(cantidadDisponible)
                .tieneStock(tieneStock)
                .build();
    }

    public List<ArmaDTO> toDTOList(List<Arma> armas) {
        if (armas == null) {
            return null;
        }

        return armas.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}

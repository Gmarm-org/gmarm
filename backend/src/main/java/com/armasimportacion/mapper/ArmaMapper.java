package com.armasimportacion.mapper;

import com.armasimportacion.dto.ArmaDTO;
import com.armasimportacion.model.Arma;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class ArmaMapper {

    public ArmaDTO toDTO(Arma arma) {
        if (arma == null) {
            return null;
        }

        return ArmaDTO.builder()
                .id(arma.getId())
                .codigo(arma.getCodigo())
                .nombre(arma.getNombre())
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

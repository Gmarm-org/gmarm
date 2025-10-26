package com.armasimportacion.mapper;

import com.armasimportacion.dto.ArmaImagenDTO;
import com.armasimportacion.model.ArmaImagen;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper para convertir entre ArmaImagen y ArmaImagenDTO.
 */
@Component
public class ArmaImagenMapper {
    
    public ArmaImagenDTO toDTO(ArmaImagen armaImagen) {
        if (armaImagen == null) {
            return null;
        }
        
        return ArmaImagenDTO.builder()
            .id(armaImagen.getId())
            .armaId(armaImagen.getArma() != null ? armaImagen.getArma().getId() : null)
            .urlImagen(armaImagen.getUrlImagen())
            .orden(armaImagen.getOrden())
            .esPrincipal(armaImagen.getEsPrincipal())
            .descripcion(armaImagen.getDescripcion())
            .fechaCreacion(armaImagen.getFechaCreacion())
            .fechaActualizacion(armaImagen.getFechaActualizacion())
            .build();
    }
    
    public List<ArmaImagenDTO> toDTOList(List<ArmaImagen> imagenes) {
        if (imagenes == null) {
            return List.of();
        }
        
        return imagenes.stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }
    
    public ArmaImagen toEntity(ArmaImagenDTO dto) {
        if (dto == null) {
            return null;
        }
        
        return ArmaImagen.builder()
            .id(dto.getId())
            .urlImagen(dto.getUrlImagen())
            .orden(dto.getOrden())
            .esPrincipal(dto.getEsPrincipal())
            .descripcion(dto.getDescripcion())
            .fechaCreacion(dto.getFechaCreacion())
            .fechaActualizacion(dto.getFechaActualizacion())
            .build();
    }
}


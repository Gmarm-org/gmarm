package com.armasimportacion.mapper;

import com.armasimportacion.dto.TipoImportacionDTO;
import com.armasimportacion.model.TipoImportacion;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class TipoImportacionMapper {
    
    public TipoImportacionDTO toDTO(TipoImportacion entity) {
        if (entity == null) return null;
        
        return TipoImportacionDTO.builder()
                .id(entity.getId())
                .codigo(entity.getCodigo())
                .nombre(entity.getNombre())
                .cupoMaximo(entity.getCupoMaximo())
                .descripcion(entity.getDescripcion())
                .estado(entity.getEstado())
                .fechaCreacion(entity.getFechaCreacion())
                .fechaActualizacion(entity.getFechaActualizacion())
                .build();
    }
    
    public TipoImportacion toEntity(TipoImportacionDTO dto) {
        if (dto == null) return null;
        
        TipoImportacion entity = new TipoImportacion();
        entity.setId(dto.getId());
        entity.setCodigo(dto.getCodigo());
        entity.setNombre(dto.getNombre());
        entity.setCupoMaximo(dto.getCupoMaximo());
        entity.setDescripcion(dto.getDescripcion());
        entity.setEstado(dto.getEstado());
        
        return entity;
    }
    
    public List<TipoImportacionDTO> toDTOList(List<TipoImportacion> entities) {
        if (entities == null) return null;
        return entities.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}


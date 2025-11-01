package com.armasimportacion.mapper;

import com.armasimportacion.dto.TipoIdentificacionDTO;
import com.armasimportacion.model.TipoIdentificacion;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class TipoIdentificacionMapper {

    public TipoIdentificacionDTO toDTO(TipoIdentificacion entity) {
        if (entity == null) {
            return null;
        }

        return TipoIdentificacionDTO.builder()
                .id(entity.getId())
                .nombre(entity.getNombre())
                .codigo(entity.getCodigo())
                .descripcion(entity.getDescripcion())
                .estado(entity.getEstado())
                .fechaCreacion(entity.getFechaCreacion())
                .build();
    }

    public TipoIdentificacion toEntity(TipoIdentificacionDTO dto) {
        if (dto == null) {
            return null;
        }

        TipoIdentificacion entity = new TipoIdentificacion();
        entity.setId(dto.getId());
        entity.setNombre(dto.getNombre());
        entity.setCodigo(dto.getCodigo());
        entity.setDescripcion(dto.getDescripcion());
        entity.setEstado(dto.getEstado());
        
        return entity;
    }

    public List<TipoIdentificacionDTO> toDTOList(List<TipoIdentificacion> entities) {
        if (entities == null) {
            return null;
        }

        return entities.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}

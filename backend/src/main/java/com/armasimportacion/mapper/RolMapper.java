package com.armasimportacion.mapper;

import com.armasimportacion.dto.RolDTO;
import com.armasimportacion.model.Rol;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class RolMapper {

    public RolDTO toDTO(Rol rol) {
        if (rol == null) {
            return null;
        }

        return RolDTO.builder()
                .id(rol.getId())
                .nombre(rol.getNombre())
                .codigo(rol.getCodigo())
                .descripcion(rol.getDescripcion())
                .estado(rol.getEstado())
                .build();
    }

    public List<RolDTO> toDTOList(List<Rol> roles) {
        if (roles == null) {
            return null;
        }

        return roles.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Rol toEntity(RolDTO dto) {
        if (dto == null) {
            return null;
        }

        return Rol.builder()
                .id(dto.getId())
                .nombre(dto.getNombre())
                .codigo(dto.getCodigo())
                .descripcion(dto.getDescripcion())
                .estado(dto.getEstado())
                .build();
    }
}

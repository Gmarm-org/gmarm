package com.armasimportacion.mapper;

import com.armasimportacion.dto.GrupoImportacionDTO;
import com.armasimportacion.model.GrupoImportacion;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class GrupoImportacionMapper {

    public GrupoImportacionDTO toDTO(GrupoImportacion grupoImportacion) {
        if (grupoImportacion == null) {
            return null;
        }

        return GrupoImportacionDTO.builder()
                .id(grupoImportacion.getId())
                .nombre(grupoImportacion.getNombre())
                .descripcion(grupoImportacion.getDescripcion())
                .estado(grupoImportacion.getEstado())
                .fechaCreacion(grupoImportacion.getFechaCreacion())
                .fechaActualizacion(grupoImportacion.getFechaActualizacion())
                .usuarioCreadorId(grupoImportacion.getUsuarioCreador() != null ? grupoImportacion.getUsuarioCreador().getId() : null)
                .usuarioCreadorNombre(grupoImportacion.getUsuarioCreador() != null ? 
                    grupoImportacion.getUsuarioCreador().getNombres() + " " + grupoImportacion.getUsuarioCreador().getApellidos() : null)
                .build();
    }

    public List<GrupoImportacionDTO> toDTOList(List<GrupoImportacion> gruposImportacion) {
        if (gruposImportacion == null) {
            return null;
        }

        return gruposImportacion.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public GrupoImportacion toEntity(GrupoImportacionDTO dto) {
        if (dto == null) {
            return null;
        }

        GrupoImportacion grupoImportacion = new GrupoImportacion();
        grupoImportacion.setId(dto.getId());
        grupoImportacion.setNombre(dto.getNombre());
        grupoImportacion.setDescripcion(dto.getDescripcion());
        grupoImportacion.setEstado(dto.getEstado());
        return grupoImportacion;
    }
}

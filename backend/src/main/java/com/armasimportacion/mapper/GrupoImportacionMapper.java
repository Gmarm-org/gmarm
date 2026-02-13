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

        GrupoImportacionDTO.GrupoImportacionDTOBuilder builder = GrupoImportacionDTO.builder()
                .id(grupoImportacion.getId())
                .nombre(grupoImportacion.getNombre())
                .descripcion(grupoImportacion.getDescripcion())
                .estado(grupoImportacion.getEstado())
                .fechaCreacion(grupoImportacion.getFechaCreacion())
                .fechaActualizacion(grupoImportacion.getFechaActualizacion())
                .usuarioCreadorId(grupoImportacion.getUsuarioCreador() != null ? grupoImportacion.getUsuarioCreador().getId() : null)
                .usuarioCreadorNombre(grupoImportacion.getUsuarioCreador() != null ? 
                    grupoImportacion.getUsuarioCreador().getNombres() + " " + grupoImportacion.getUsuarioCreador().getApellidos() : null)
                .codigo(grupoImportacion.getCodigo())
                .fechaInicio(grupoImportacion.getFechaInicio())
                .fechaFin(grupoImportacion.getFechaFin())
                .cupoTotal(grupoImportacion.getCupoTotal())
                .cupoDisponible(grupoImportacion.getCupoDisponible())
                .observaciones(grupoImportacion.getObservaciones())
                .tipoGrupo(grupoImportacion.getTipoGrupo() != null ? grupoImportacion.getTipoGrupo().name() : null)
                .tra(grupoImportacion.getTra());
        
        // Mapear vendedores
        if (grupoImportacion.getVendedores() != null && !grupoImportacion.getVendedores().isEmpty()) {
            List<GrupoImportacionDTO.VendedorDTO> vendedoresDTO = grupoImportacion.getVendedores().stream()
                .map(gv -> new GrupoImportacionDTO.VendedorDTO(
                    gv.getVendedor().getId(),
                    gv.getVendedor().getNombres(),
                    gv.getVendedor().getApellidos(),
                    gv.getVendedor().getEmail(),
                    gv.getLimiteArmas() != null ? gv.getLimiteArmas() : 0
                ))
                .collect(Collectors.toList());
            builder.vendedores(vendedoresDTO);
        }
        
        // Mapear límites por categoría
        if (grupoImportacion.getLimitesCategoria() != null && !grupoImportacion.getLimitesCategoria().isEmpty()) {
            List<GrupoImportacionDTO.LimiteCategoriaDTO> limitesDTO = grupoImportacion.getLimitesCategoria().stream()
                .map(gl -> new GrupoImportacionDTO.LimiteCategoriaDTO(
                    gl.getCategoriaArma().getId(),
                    gl.getCategoriaArma().getNombre(),
                    gl.getCategoriaArma().getCodigo(),
                    gl.getLimiteMaximo()
                ))
                .collect(Collectors.toList());
            builder.limitesCategoria(limitesDTO);
        }
        
        return builder.build();
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

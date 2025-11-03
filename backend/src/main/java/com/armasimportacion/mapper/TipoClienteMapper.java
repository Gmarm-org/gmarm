package com.armasimportacion.mapper;

import com.armasimportacion.dto.TipoClienteDTO;
import com.armasimportacion.model.TipoCliente;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class TipoClienteMapper {

    public TipoClienteDTO toDTO(TipoCliente entity) {
        if (entity == null) {
            return null;
        }

        return TipoClienteDTO.builder()
                .id(entity.getId())
                .nombre(entity.getNombre())
                .codigo(entity.getCodigo())
                .descripcion(entity.getDescripcion())
                .estado(entity.getEstado())
                // Banderas dinámicas
                .esMilitar(entity.getEsMilitar())
                .esPolicia(entity.getEsPolicia())
                .esEmpresa(entity.getEsEmpresa())
                .esDeportista(entity.getEsDeportista())
                .esCivil(entity.getEsCivil())
                .requiereIssfa(entity.getRequiereIssfa())
                .tipoProcesoId(entity.getTipoProcesoId())
                .fechaCreacion(entity.getFechaCreacion())
                .build();
    }

    public List<TipoClienteDTO> toDTOList(List<TipoCliente> entities) {
        if (entities == null) {
            return null;
        }

        return entities.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    public TipoCliente toEntity(TipoClienteDTO dto) {
        if (dto == null) {
            return null;
        }

        TipoCliente entity = new TipoCliente();
        entity.setId(dto.getId());
        entity.setNombre(dto.getNombre());
        entity.setEstado(dto.getEstado() != null ? dto.getEstado() : true);
        entity.setCodigo(dto.getCodigo());
        entity.setDescripcion(dto.getDescripcion());
        entity.setEsMilitar(dto.getEsMilitar());
        entity.setEsPolicia(dto.getEsPolicia());
        entity.setEsEmpresa(dto.getEsEmpresa());
        entity.setEsDeportista(dto.getEsDeportista());
        entity.setEsCivil(dto.getEsCivil());
        entity.setRequiereIssfa(dto.getRequiereIssfa());
        entity.setTipoProcesoId(dto.getTipoProcesoId());
        
        return entity;
    }
}

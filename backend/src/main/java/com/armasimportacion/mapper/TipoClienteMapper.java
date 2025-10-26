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
}

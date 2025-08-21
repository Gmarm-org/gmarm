package com.armasimportacion.mapper;

import com.armasimportacion.dto.TipoDocumentoDTO;
import com.armasimportacion.model.TipoDocumento;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class TipoDocumentoMapper {

    public TipoDocumentoDTO toDTO(TipoDocumento entity) {
        if (entity == null) {
            return null;
        }

        return TipoDocumentoDTO.builder()
                .id(entity.getId())
                .nombre(entity.getNombre())
                .descripcion(entity.getDescripcion())
                .obligatorio(entity.getObligatorio())
                .tipoProcesoId(entity.getTipoProceso().getId())
                .tipoProcesoNombre(entity.getTipoProceso().getNombre())
                .estado(entity.getEstado())
                .urlDocumento(entity.getUrlDocumento())
                .build();
    }

    public List<TipoDocumentoDTO> toDTOList(List<TipoDocumento> entities) {
        if (entities == null) {
            return null;
        }

        return entities.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}

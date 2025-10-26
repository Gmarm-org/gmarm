package com.armasimportacion.mapper;

import com.armasimportacion.dto.PreguntaClienteDTO;
import com.armasimportacion.model.PreguntaCliente;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class PreguntaClienteMapper {

    public PreguntaClienteDTO toDTO(PreguntaCliente entity) {
        if (entity == null) {
            return null;
        }

        return PreguntaClienteDTO.builder()
                .id(entity.getId())
                .pregunta(entity.getPregunta())
                .obligatoria(entity.getObligatoria())
                .orden(entity.getOrden())
                .estado(entity.getEstado())
                .tipoProcesoId(entity.getTipoProceso().getId())
                .tipoProcesoNombre(entity.getTipoProceso().getNombre())
                .tipoRespuesta(entity.getTipoRespuesta())
                .build();
    }

    public List<PreguntaClienteDTO> toDTOList(List<PreguntaCliente> entities) {
        if (entities == null) {
            return null;
        }

        return entities.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}

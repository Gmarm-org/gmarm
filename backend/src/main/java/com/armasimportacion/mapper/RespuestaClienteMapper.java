package com.armasimportacion.mapper;

import com.armasimportacion.dto.RespuestaClienteDTO;
import com.armasimportacion.model.RespuestaCliente;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class RespuestaClienteMapper {

    public RespuestaClienteDTO toDTO(RespuestaCliente entity) {
        if (entity == null) {
            return null;
        }

        return RespuestaClienteDTO.builder()
                .id(entity.getId())
                .preguntaId(entity.getPregunta() != null ? entity.getPregunta().getId() : null)
                .preguntaTexto(entity.getPregunta() != null ? entity.getPregunta().getPregunta() : null)
                .respuesta(entity.getRespuesta())
                .fechaRespuesta(entity.getFechaRespuesta())
                .obligatoria(entity.getPregunta() != null ? entity.getPregunta().getObligatoria() : null)
                .orden(entity.getPregunta() != null ? entity.getPregunta().getOrden() : null)
                .build();
    }

    public RespuestaCliente toEntity(RespuestaClienteDTO dto) {
        if (dto == null) {
            return null;
        }

        return RespuestaCliente.builder()
                .id(dto.getId())
                .respuesta(dto.getRespuesta())
                .fechaRespuesta(dto.getFechaRespuesta())
                .build();
    }

    public List<RespuestaClienteDTO> toDTOList(List<RespuestaCliente> entities) {
        if (entities == null) {
            return null;
        }

        return entities.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<RespuestaCliente> toEntityList(List<RespuestaClienteDTO> dtos) {
        if (dtos == null) {
            return null;
        }

        return dtos.stream()
                .map(this::toEntity)
                .collect(Collectors.toList());
    }
}

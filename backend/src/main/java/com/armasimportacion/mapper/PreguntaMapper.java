package com.armasimportacion.mapper;

import com.armasimportacion.dto.PreguntaDTO;
import com.armasimportacion.model.PreguntaCliente;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class PreguntaMapper {

    public PreguntaDTO toDTO(PreguntaCliente pregunta) {
        if (pregunta == null) {
            return null;
        }

        return PreguntaDTO.builder()
                .id(pregunta.getId())
                .texto(pregunta.getPregunta())
                .obligatoria(pregunta.getObligatoria())
                .orden(pregunta.getOrden())
                .opciones(null) // PreguntaCliente no tiene opciones
                .activo(pregunta.getEstado())
                .build();
    }

    public List<PreguntaDTO> toDTOList(List<PreguntaCliente> preguntas) {
        if (preguntas == null) {
            return null;
        }

        return preguntas.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public PreguntaCliente toEntity(PreguntaDTO dto) {
        if (dto == null) {
            return null;
        }

        return PreguntaCliente.builder()
                .id(dto.getId())
                .pregunta(dto.getTexto())
                .obligatoria(dto.getObligatoria())
                .orden(dto.getOrden())
                .estado(dto.getActivo())
                .build();
    }
}

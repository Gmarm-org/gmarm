package com.armasimportacion.mapper;

import com.armasimportacion.dto.TipoProcesoDTO;
import com.armasimportacion.dto.PreguntaDTO;
import com.armasimportacion.model.TipoProceso;
import com.armasimportacion.model.PreguntaCliente;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class TipoProcesoMapper {

    private final PreguntaMapper preguntaMapper;

    public TipoProcesoMapper(PreguntaMapper preguntaMapper) {
        this.preguntaMapper = preguntaMapper;
    }

    public TipoProcesoDTO toDTO(TipoProceso tipoProceso) {
        if (tipoProceso == null) {
            return null;
        }

        List<PreguntaDTO> preguntasDTO = null;
        if (tipoProceso.getPreguntas() != null) {
            preguntasDTO = tipoProceso.getPreguntas().stream()
                    .map(preguntaMapper::toDTO)
                    .collect(Collectors.toList());
        }

        return TipoProcesoDTO.builder()
                .id(tipoProceso.getId())
                .nombre(tipoProceso.getNombre())
                .codigo(tipoProceso.getCodigo())
                .descripcion(tipoProceso.getDescripcion())
                .activo(tipoProceso.getEstado())
                .preguntas(preguntasDTO)
                .build();
    }

    public List<TipoProcesoDTO> toDTOList(List<TipoProceso> tiposProceso) {
        if (tiposProceso == null) {
            return null;
        }

        return tiposProceso.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public TipoProceso toEntity(TipoProcesoDTO dto) {
        if (dto == null) {
            return null;
        }

        return TipoProceso.builder()
                .id(dto.getId())
                .nombre(dto.getNombre())
                .codigo(dto.getCodigo())
                .descripcion(dto.getDescripcion())
                .estado(dto.getActivo())
                .build();
    }
}

package com.armasimportacion.mapper;

import com.armasimportacion.dto.PreguntaClienteDTO;
import com.armasimportacion.model.PreguntaCliente;
import com.armasimportacion.model.TipoProceso;
import com.armasimportacion.repository.TipoProcesoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class PreguntaClienteMapper {

    private final TipoProcesoRepository tipoProcesoRepository;

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

    public PreguntaCliente toEntity(PreguntaClienteDTO dto) {
        if (dto == null) {
            return null;
        }

        PreguntaCliente entity = new PreguntaCliente();
        entity.setId(dto.getId());
        entity.setPregunta(dto.getPregunta());
        entity.setObligatoria(dto.getObligatoria());
        entity.setOrden(dto.getOrden());
        entity.setEstado(dto.getEstado());
        entity.setTipoRespuesta(dto.getTipoRespuesta());
        
        // Cargar TipoProceso si está presente
        if (dto.getTipoProcesoId() != null) {
            TipoProceso tipoProceso = tipoProcesoRepository.findById(dto.getTipoProcesoId())
                    .orElseThrow(() -> new RuntimeException("TipoProceso no encontrado con ID: " + dto.getTipoProcesoId()));
            entity.setTipoProceso(tipoProceso);
        }
        
        return entity;
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

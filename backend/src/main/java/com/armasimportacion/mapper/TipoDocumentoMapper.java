package com.armasimportacion.mapper;

import com.armasimportacion.dto.TipoDocumentoDTO;
import com.armasimportacion.model.TipoDocumento;
import com.armasimportacion.model.TipoProceso;
import com.armasimportacion.repository.TipoProcesoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class TipoDocumentoMapper {

    private final TipoProcesoRepository tipoProcesoRepository;

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

    public TipoDocumento toEntity(TipoDocumentoDTO dto) {
        if (dto == null) {
            return null;
        }

        TipoDocumento entity = new TipoDocumento();
        entity.setId(dto.getId());
        entity.setNombre(dto.getNombre());
        entity.setDescripcion(dto.getDescripcion());
        entity.setObligatorio(dto.getObligatorio());
        entity.setEstado(dto.getEstado());
        entity.setUrlDocumento(dto.getUrlDocumento());
        
        // Cargar TipoProceso si está presente
        if (dto.getTipoProcesoId() != null) {
            TipoProceso tipoProceso = tipoProcesoRepository.findById(dto.getTipoProcesoId())
                    .orElseThrow(() -> new RuntimeException("TipoProceso no encontrado con ID: " + dto.getTipoProcesoId()));
            entity.setTipoProceso(tipoProceso);
        }
        
        return entity;
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

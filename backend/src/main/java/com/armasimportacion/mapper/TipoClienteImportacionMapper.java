package com.armasimportacion.mapper;

import com.armasimportacion.dto.TipoClienteImportacionDTO;
import com.armasimportacion.model.TipoClienteImportacion;
import com.armasimportacion.model.TipoCliente;
import com.armasimportacion.model.TipoImportacion;
import com.armasimportacion.repository.TipoClienteRepository;
import com.armasimportacion.repository.TipoImportacionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class TipoClienteImportacionMapper {

    private final TipoClienteRepository tipoClienteRepository;
    private final TipoImportacionRepository tipoImportacionRepository;

    public TipoClienteImportacionDTO toDTO(TipoClienteImportacion entity) {
        if (entity == null) return null;

        return TipoClienteImportacionDTO.builder()
                .id(entity.getId())
                .tipoClienteId(entity.getTipoCliente().getId())
                .tipoClienteNombre(entity.getTipoCliente().getNombre())
                .tipoImportacionId(entity.getTipoImportacion().getId())
                .tipoImportacionNombre(entity.getTipoImportacion().getNombre())
                .cupoMaximo(entity.getTipoImportacion().getCupoMaximo())
                .build();
    }

    public TipoClienteImportacion toEntity(TipoClienteImportacionDTO dto) {
        if (dto == null) return null;

        TipoClienteImportacion entity = new TipoClienteImportacion();
        entity.setId(dto.getId());

        if (dto.getTipoClienteId() != null) {
            TipoCliente tipoCliente = tipoClienteRepository.findById(dto.getTipoClienteId())
                    .orElseThrow(() -> new RuntimeException("TipoCliente no encontrado con ID: " + dto.getTipoClienteId()));
            entity.setTipoCliente(tipoCliente);
        }

        if (dto.getTipoImportacionId() != null) {
            TipoImportacion tipoImportacion = tipoImportacionRepository.findById(dto.getTipoImportacionId())
                    .orElseThrow(() -> new RuntimeException("TipoImportacion no encontrado con ID: " + dto.getTipoImportacionId()));
            entity.setTipoImportacion(tipoImportacion);
        }

        return entity;
    }

    public List<TipoClienteImportacionDTO> toDTOList(List<TipoClienteImportacion> entities) {
        if (entities == null) return null;
        return entities.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}


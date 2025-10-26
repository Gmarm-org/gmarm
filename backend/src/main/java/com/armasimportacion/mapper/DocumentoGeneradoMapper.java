package com.armasimportacion.mapper;

import com.armasimportacion.dto.DocumentoGeneradoDTO;
import com.armasimportacion.model.DocumentoGenerado;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class DocumentoGeneradoMapper {

    public DocumentoGeneradoDTO toDTO(DocumentoGenerado entity) {
        if (entity == null) {
            return null;
        }

        return DocumentoGeneradoDTO.builder()
                .id(entity.getId())
                .tipoDocumento(entity.getTipoDocumento())
                .nombreArchivo(entity.getNombreArchivo())
                .rutaArchivo(entity.getRutaArchivo())
                .tamanioBytes(entity.getTamanioBytes())
                .descripcion(entity.getDescripcion())
                .nombre(entity.getNombre())
                .urlArchivo(entity.getUrlArchivo())
                .fechaGeneracion(entity.getFechaGeneracion())
                .fechaFirma(entity.getFechaFirma())
                .estado(entity.getEstado())
                .clienteId(entity.getCliente() != null ? entity.getCliente().getId() : null)
                .clienteNombre(entity.getCliente() != null ? entity.getCliente().getNombreCompleto() : null)
                .grupoImportacionId(entity.getGrupoImportacion() != null ? entity.getGrupoImportacion().getId() : null)
                .usuarioGeneradorId(entity.getUsuarioGenerador() != null ? entity.getUsuarioGenerador().getId() : null)
                .usuarioGeneradorNombre(entity.getUsuarioGenerador() != null ? entity.getUsuarioGenerador().getUsername() : null)
                .fechaCreacion(entity.getFechaCreacion())
                .fechaActualizacion(entity.getFechaActualizacion())
                .build();
    }

    public DocumentoGenerado toEntity(DocumentoGeneradoDTO dto) {
        if (dto == null) {
            return null;
        }

        DocumentoGenerado entity = new DocumentoGenerado();
        entity.setId(dto.getId());
        entity.setTipoDocumento(dto.getTipoDocumento());
        entity.setNombreArchivo(dto.getNombreArchivo());
        entity.setRutaArchivo(dto.getRutaArchivo());
        entity.setTamanioBytes(dto.getTamanioBytes());
        entity.setDescripcion(dto.getDescripcion());
        entity.setNombre(dto.getNombre());
        entity.setUrlArchivo(dto.getUrlArchivo());
        entity.setFechaGeneracion(dto.getFechaGeneracion());
        entity.setFechaFirma(dto.getFechaFirma());
        entity.setEstado(dto.getEstado());
        entity.setFechaCreacion(dto.getFechaCreacion());
        entity.setFechaActualizacion(dto.getFechaActualizacion());
        
        return entity;
    }

    public List<DocumentoGeneradoDTO> toDTOList(List<DocumentoGenerado> entities) {
        if (entities == null) {
            return null;
        }

        return entities.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<DocumentoGenerado> toEntityList(List<DocumentoGeneradoDTO> dtos) {
        if (dtos == null) {
            return null;
        }

        return dtos.stream()
                .map(this::toEntity)
                .collect(Collectors.toList());
    }
}

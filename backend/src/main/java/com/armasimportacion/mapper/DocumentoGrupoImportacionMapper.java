package com.armasimportacion.mapper;

import com.armasimportacion.dto.DocumentoGrupoImportacionDTO;
import com.armasimportacion.model.DocumentoGrupoImportacion;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class DocumentoGrupoImportacionMapper {

    public DocumentoGrupoImportacionDTO toDTO(DocumentoGrupoImportacion entity) {
        if (entity == null) {
            return null;
        }

        return DocumentoGrupoImportacionDTO.builder()
                .id(entity.getId())
                .grupoImportacionId(entity.getGrupoImportacion() != null ? entity.getGrupoImportacion().getId() : null)
                .grupoImportacionNombre(entity.getGrupoImportacion() != null ? entity.getGrupoImportacion().getNombre() : null)
                .tipoDocumentoId(entity.getTipoDocumento() != null ? entity.getTipoDocumento().getId() : null)
                .tipoDocumentoNombre(entity.getTipoDocumento() != null ? entity.getTipoDocumento().getNombre() : null)
                .rutaArchivo(entity.getRutaArchivo())
                .nombreArchivo(entity.getNombreArchivo())
                .tamanioBytes(entity.getTamanioBytes())
                .descripcion(entity.getDescripcion())
                .nombre(entity.getNombre())
                .urlArchivo(entity.getUrlArchivo())
                .estado(entity.getEstado())
                .observaciones(entity.getObservaciones())
                .usuarioCargaId(entity.getUsuarioCarga() != null ? entity.getUsuarioCarga().getId() : null)
                .usuarioCargaNombre(entity.getUsuarioCarga() != null ? entity.getUsuarioCarga().getNombreCompleto() : null)
                .fechaCarga(entity.getFechaCarga())
                .fechaCreacion(entity.getFechaCreacion())
                .fechaActualizacion(entity.getFechaActualizacion())
                .build();
    }

    public List<DocumentoGrupoImportacionDTO> toDTOList(List<DocumentoGrupoImportacion> entities) {
        if (entities == null) {
            return null;
        }
        return entities.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}


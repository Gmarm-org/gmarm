package com.armasimportacion.mapper;

import com.armasimportacion.dto.DocumentoClienteDTO;
import com.armasimportacion.model.DocumentoCliente;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class DocumentoClienteMapper {

    public DocumentoClienteDTO toDTO(DocumentoCliente entity) {
        if (entity == null) {
            return null;
        }

        return DocumentoClienteDTO.builder()
                .id(entity.getId())
                .clienteId(entity.getCliente() != null ? entity.getCliente().getId() : null)
                .clienteNombre(entity.getCliente() != null ? entity.getCliente().getNombreCompleto() : null)
                .tipoDocumentoId(entity.getTipoDocumento() != null ? entity.getTipoDocumento().getId() : null)
                .tipoDocumentoNombre(entity.getTipoDocumento() != null ? entity.getTipoDocumento().getNombre() : null)
                .rutaArchivo(entity.getRutaArchivo())
                .nombreArchivo(entity.getNombreArchivo())
                .tipoArchivo(entity.getTipoArchivo())
                .tamanioArchivo(entity.getTamanioArchivo())
                .estado(entity.getEstado())
                .descripcion(entity.getDescripcion())
                .observaciones(entity.getObservaciones())
                .usuarioCargaId(entity.getUsuarioCarga() != null ? entity.getUsuarioCarga().getId() : null)
                .usuarioCargaNombre(entity.getUsuarioCarga() != null ? entity.getUsuarioCarga().getNombreCompleto() : null)
                .usuarioRevisionId(entity.getUsuarioRevision() != null ? entity.getUsuarioRevision().getId() : null)
                .usuarioRevisionNombre(entity.getUsuarioRevision() != null ? entity.getUsuarioRevision().getNombreCompleto() : null)
                .fechaCarga(entity.getFechaCarga())
                .fechaActualizacion(entity.getFechaActualizacion())
                .fechaRevision(entity.getFechaRevision())
                .build();
    }

    public List<DocumentoClienteDTO> toDTOList(List<DocumentoCliente> entities) {
        if (entities == null) {
            return null;
        }
        return entities.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}

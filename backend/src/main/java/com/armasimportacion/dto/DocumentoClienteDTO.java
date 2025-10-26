package com.armasimportacion.dto;

import com.armasimportacion.model.DocumentoCliente;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentoClienteDTO {
    private Long id;
    private Long clienteId;
    private String clienteNombre;
    private Long tipoDocumentoId;
    private String tipoDocumentoNombre;
    private String rutaArchivo;
    private String nombreArchivo;
    private String tipoArchivo;
    private Long tamanioArchivo;
    private DocumentoCliente.EstadoDocumento estado;
    private String descripcion;
    private String observaciones;
    private Long usuarioCargaId;
    private String usuarioCargaNombre;
    private Long usuarioRevisionId;
    private String usuarioRevisionNombre;
    private LocalDateTime fechaCarga;
    private LocalDateTime fechaActualizacion;
    private LocalDateTime fechaRevision;
}

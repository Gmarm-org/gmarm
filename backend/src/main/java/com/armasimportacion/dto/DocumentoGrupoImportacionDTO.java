package com.armasimportacion.dto;

import com.armasimportacion.enums.EstadoDocumentoGrupo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentoGrupoImportacionDTO {
    private Long id;
    private Long grupoImportacionId;
    private String grupoImportacionNombre;
    private Long tipoDocumentoId;
    private String tipoDocumentoNombre;
    private String rutaArchivo;
    private String nombreArchivo;
    private Long tamanioBytes;
    private String descripcion;
    private String nombre;
    private String urlArchivo;
    private EstadoDocumentoGrupo estado;
    private String observaciones;
    private Long usuarioCargaId;
    private String usuarioCargaNombre;
    private LocalDateTime fechaCarga;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
}


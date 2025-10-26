package com.armasimportacion.dto;

import com.armasimportacion.enums.EstadoDocumentoGenerado;
import com.armasimportacion.enums.TipoDocumentoGenerado;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentoGeneradoDTO {
    
    private Long id;
    private TipoDocumentoGenerado tipoDocumento;
    private String nombreArchivo;
    private String rutaArchivo;
    private Long tamanioBytes;
    private String descripcion;
    private String nombre;
    private String urlArchivo;
    private LocalDateTime fechaGeneracion;
    private LocalDateTime fechaFirma;
    private EstadoDocumentoGenerado estado;
    private Long clienteId;
    private String clienteNombre;
    private Long grupoImportacionId;
    private Long usuarioGeneradorId;
    private String usuarioGeneradorNombre;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
}

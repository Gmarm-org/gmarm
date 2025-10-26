package com.armasimportacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TipoDocumentoDTO {
    private Long id;
    private String nombre;
    private String descripcion;
    private Boolean obligatorio;
    private Long tipoProcesoId;
    private String tipoProcesoNombre;
    private Boolean estado;
    private String urlDocumento;
}

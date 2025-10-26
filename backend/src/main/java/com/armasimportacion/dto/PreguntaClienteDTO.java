package com.armasimportacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PreguntaClienteDTO {
    private Long id;
    private String pregunta;
    private Boolean obligatoria;
    private Integer orden;
    private Boolean estado;
    private Long tipoProcesoId;
    private String tipoProcesoNombre;
    private String tipoRespuesta;
}

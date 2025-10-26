package com.armasimportacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreguntaDTO {
    private Long id;
    private String texto;
    private String tipoRespuesta;
    private Boolean obligatoria;
    private Integer orden;
    private String opciones;
    private Boolean activo;
}

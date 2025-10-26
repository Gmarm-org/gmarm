package com.armasimportacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RespuestaClienteDTO {
    
    private Long id;
    private Long preguntaId;
    private String preguntaTexto;
    private String respuesta;
    private LocalDateTime fechaRespuesta;
    private String tipoRespuesta;
    private Boolean obligatoria;
    private Integer orden;
}

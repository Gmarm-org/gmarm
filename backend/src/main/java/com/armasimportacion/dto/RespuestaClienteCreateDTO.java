package com.armasimportacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RespuestaClienteCreateDTO {
    
    private Long clienteId;
    private Long preguntaId;
    private String respuesta;
    private Long usuarioId;
}

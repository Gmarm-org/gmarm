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
public class TipoIdentificacionDTO {
    private Long id;
    private String nombre;
    private String codigo;
    private String descripcion;
    private Boolean estado;
    private LocalDateTime fechaCreacion;
}

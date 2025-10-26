package com.armasimportacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TipoNotificacionDTO {
    private Long id;
    private String nombre;
    private String codigo;
    private String descripcion;
    private String plantilla;
    private Boolean activo;
}

package com.armasimportacion.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConfiguracionSistemaDTO {
    private Long id;
    private String clave;
    private String valor;
    private String descripcion;
    private Boolean editable;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
}

package com.armasimportacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfiguracionSistemaDTO {
    private Long id;
    private String clave;
    private String valor;
    private String descripcion;
    private String tipo;
    private Boolean activo;
}

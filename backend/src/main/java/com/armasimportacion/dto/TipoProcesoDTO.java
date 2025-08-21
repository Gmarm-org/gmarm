package com.armasimportacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TipoProcesoDTO {
    private Long id;
    private String nombre;
    private String codigo;
    private String descripcion;
    private Boolean activo;
    private List<PreguntaDTO> preguntas;
}

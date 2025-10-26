package com.armasimportacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoriaArmaDTO {
    
    private Long id;
    private String nombre;
    private String descripcion;
    private String codigo;
    private Boolean estado;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
    
    // Solo IDs de modelos, no entidades completas
    private List<Long> modelosIds;
    private Integer totalModelos;
}

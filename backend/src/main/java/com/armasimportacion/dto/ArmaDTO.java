package com.armasimportacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArmaDTO {

    private Long id;
    private String codigo;
    private String nombre;
    private String calibre;
    private Integer capacidad;
    private BigDecimal precioReferencia;
    
    // Categoría como DTO simple
    private Long categoriaId;
    private String categoriaNombre;
    private String categoriaCodigo;
    
    private String urlImagen;
    private String urlProducto;
    private Boolean estado;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
}

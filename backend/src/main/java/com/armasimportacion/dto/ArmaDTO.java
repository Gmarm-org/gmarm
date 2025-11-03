package com.armasimportacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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
    private Boolean expoferia; // true = es de expoferia, false/null = no es de expoferia
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
    
    // Múltiples imágenes del arma (ordenadas)
    @Builder.Default
    private List<ArmaImagenDTO> imagenes = new ArrayList<>();
    
    // Imagen principal (primera o marcada como principal)
    private String imagenPrincipal;
    
    // Información de stock
    private Integer cantidadTotal;
    private Integer cantidadDisponible;
    private Boolean tieneStock; // true si cantidadDisponible > 0
}

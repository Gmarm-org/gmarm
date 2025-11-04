package com.armasimportacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArmaUpdateDTO {
    
    private String nombre;
    private String calibre;
    private Integer capacidad;
    private BigDecimal precioReferencia;
    private Long categoriaId;
    private Boolean estado;
    private Boolean expoferia;  // Indica si el arma es para Expoferia
    private String urlImagen;
    
    // Campo para la nueva imagen (opcional)
    private MultipartFile imagen;
    
    // Campos adicionales para validación
    private String codigo;
    private String urlProducto;
}

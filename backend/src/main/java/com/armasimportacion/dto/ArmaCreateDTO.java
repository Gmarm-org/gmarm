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
public class ArmaCreateDTO {

    private String nombre;
    private String calibre;
    private Integer capacidad;
    private BigDecimal precioReferencia;
    private Long categoriaId;
    private Boolean estado;
    private String codigo;
    private String urlProducto;

    // Campo para la imagen (opcional)
    private MultipartFile imagen;
}

package com.armasimportacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO para transferir información de imágenes de armas.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArmaImagenDTO {
    
    private Long id;
    private Long armaId;
    private String urlImagen;
    private Integer orden;
    private Boolean esPrincipal;
    private String descripcion;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
}


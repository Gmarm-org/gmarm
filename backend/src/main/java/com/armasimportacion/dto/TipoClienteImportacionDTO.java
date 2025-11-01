package com.armasimportacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TipoClienteImportacionDTO {
    
    private Long id;
    private Long tipoClienteId;
    private String tipoClienteNombre;
    private Long tipoImportacionId;
    private String tipoImportacionNombre;
    private Integer cupoMaximo;
}


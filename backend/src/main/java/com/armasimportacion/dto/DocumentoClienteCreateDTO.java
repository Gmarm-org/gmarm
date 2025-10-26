package com.armasimportacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentoClienteCreateDTO {
    
    private String tipoDocumento;
    private String contenido;
    private String nombreArchivo;
}

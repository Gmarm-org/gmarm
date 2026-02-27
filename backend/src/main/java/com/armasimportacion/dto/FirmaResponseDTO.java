package com.armasimportacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FirmaResponseDTO {
    private Long documentoId;
    private String firmadoPor;
    private LocalDateTime fechaFirma;
    private String certificadoHuella;
    private String estado;
}

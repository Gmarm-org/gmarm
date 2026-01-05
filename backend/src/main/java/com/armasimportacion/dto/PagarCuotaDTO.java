package com.armasimportacion.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PagarCuotaDTO {
    private String referenciaPago;
    private Long usuarioConfirmadorId;
    private BigDecimal monto; // Monto editable
    private String numeroRecibo;
    private String comprobanteArchivo; // Ruta del archivo
    private String observaciones;
}


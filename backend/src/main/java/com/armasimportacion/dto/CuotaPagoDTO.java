package com.armasimportacion.dto;

import com.armasimportacion.enums.EstadoCuotaPago;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CuotaPagoDTO {

    private Long id;
    private Long pagoId;
    private Integer numeroCuota;
    private BigDecimal monto;
    private LocalDate fechaVencimiento;
    private EstadoCuotaPago estado;
    private LocalDateTime fechaPago;
    private String referenciaPago;
    private Long usuarioConfirmadorId;
    private String usuarioConfirmadorNombre;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
}

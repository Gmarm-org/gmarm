package com.armasimportacion.dto;

import com.armasimportacion.enums.EstadoPago;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PagoDTO {

    private Long id;
    private Long clienteId;
    private String clienteNombre;
    private String clienteIdentificacion;
    private BigDecimal montoTotal;
    private String tipoPago;
    private Integer numeroCuotas;
    private BigDecimal montoCuota;
    private EstadoPago estado;
    private BigDecimal montoPagado;
    private BigDecimal montoPendiente;
    private Integer cuotaActual;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
}

package com.armasimportacion.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PagoCreateDTO {

    @NotNull(message = "El ID del cliente es obligatorio")
    private Long clienteId;

    @NotNull(message = "El monto total es obligatorio")
    @DecimalMin(value = "0.01", message = "El monto total debe ser mayor a 0")
    private BigDecimal montoTotal;

    @NotBlank(message = "El tipo de pago es obligatorio")
    private String tipoPago;

    @Min(value = 1, message = "El número de cuotas debe ser al menos 1")
    private Integer numeroCuotas = 1;

    private BigDecimal montoCuota;

    private BigDecimal montoPagado = BigDecimal.ZERO;

    private BigDecimal montoPendiente;
}

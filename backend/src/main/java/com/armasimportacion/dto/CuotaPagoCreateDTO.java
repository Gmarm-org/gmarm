package com.armasimportacion.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CuotaPagoCreateDTO {

    @NotNull(message = "El ID del pago es obligatorio")
    private Long pagoId;

    @NotNull(message = "El número de cuota es obligatorio")
    @Min(value = 1, message = "El número de cuota debe ser al menos 1")
    private Integer numeroCuota;

    @NotNull(message = "El monto es obligatorio")
    @DecimalMin(value = "0.01", message = "El monto debe ser mayor a 0")
    private BigDecimal monto;

    @NotNull(message = "La fecha de vencimiento es obligatoria")
    private LocalDate fechaVencimiento;

    private String referenciaPago;

    private Long usuarioConfirmadorId;
}

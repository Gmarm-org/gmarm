package com.armasimportacion.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContratoGenerarDTO {

    @NotNull(message = "El ID del cliente es obligatorio")
    private Long clienteId;

    @NotNull(message = "El ID del pago es obligatorio")
    private Long pagoId;

    @NotNull(message = "El ID del vendedor es obligatorio")
    private Long vendedorId;
}

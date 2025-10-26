package com.armasimportacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO para el stock de armas con información completa
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArmaStockDTO {
    
    private Long armaId;
    private String armaNombre;
    private String armaCodigo;
    private String armaCalibre;
    private Integer cantidadTotal;
    private Integer cantidadDisponible;
    private Integer cantidadAsignada; // Armas con pago completado
    private BigDecimal precioVenta;
    private Boolean activo;
}

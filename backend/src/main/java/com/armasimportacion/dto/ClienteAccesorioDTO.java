package com.armasimportacion.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO para la relación cliente-accesorio
 * Reemplaza a AsignacionAccesorioDTO para mantener consistencia
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClienteAccesorioDTO {

    private Long id;
    private Long clienteId;
    private String clienteNombre;
    private Long accesorioId;
    private String accesorioNombre;
    private String accesorioCodigo;
    private Integer cantidad;
    private BigDecimal precioUnitario;
    private String estado;
    private LocalDateTime fechaAsignacion;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;

    // Métodos de utilidad
    public boolean estaReservado() {
        return "RESERVADO".equals(this.estado);
    }

    public boolean estaConfirmado() {
        return "CONFIRMADO".equals(this.estado);
    }

    public boolean estaCancelado() {
        return "CANCELADO".equals(this.estado);
    }

    public boolean estaCompletado() {
        return "COMPLETADO".equals(this.estado);
    }

    public BigDecimal getPrecioTotal() {
        if (this.precioUnitario != null && this.cantidad != null) {
            return this.precioUnitario.multiply(BigDecimal.valueOf(this.cantidad));
        }
        return BigDecimal.ZERO;
    }
}

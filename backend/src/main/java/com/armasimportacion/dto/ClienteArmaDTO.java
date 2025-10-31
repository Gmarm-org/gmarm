package com.armasimportacion.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO para la relación cliente-arma
 * Reemplaza a AsignacionArmaDTO para mantener consistencia
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClienteArmaDTO {

    private Long id;
    private Long clienteId;
    private String clienteNombre;
    private Long armaId;
    private String armaNombre;
    private String armaCodigo;
    private String armaModelo;
    private String armaCalibre;
    private String armaCategoriaNombre;
    private String armaImagen;
    private Integer cantidad;
    private BigDecimal precioUnitario;
    private String estado;
    private String numeroSerie;
    private LocalDateTime fechaAsignacion;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;

    // Métodos de utilidad
    public boolean estaDisponible() {
        return "DISPONIBLE".equals(this.estado);
    }

    public boolean estaReservada() {
        return "RESERVADA".equals(this.estado);
    }

    public boolean estaAsignada() {
        return "ASIGNADA".equals(this.estado);
    }

    public boolean estaCancelada() {
        return "CANCELADA".equals(this.estado);
    }

    public boolean estaCompletada() {
        return "COMPLETADA".equals(this.estado);
    }

    public BigDecimal getPrecioTotal() {
        if (this.precioUnitario != null && this.cantidad != null) {
            return this.precioUnitario.multiply(BigDecimal.valueOf(this.cantidad));
        }
        return BigDecimal.ZERO;
    }
}

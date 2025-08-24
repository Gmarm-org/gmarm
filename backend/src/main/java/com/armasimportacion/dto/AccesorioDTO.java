package com.armasimportacion.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO para los accesorios disponibles
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccesorioDTO {

    private Long id;
    private String nombre;
    private String codigo;
    private String descripcion;
    private String categoria;
    private BigDecimal precioReferencia;
    private Boolean estado;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;

    // Métodos de utilidad
    public boolean estaActivo() {
        return Boolean.TRUE.equals(this.estado);
    }

    public boolean tienePrecio() {
        return this.precioReferencia != null && this.precioReferencia.compareTo(BigDecimal.ZERO) > 0;
    }

    public String getNombreCompleto() {
        return String.format("%s (%s)", this.nombre, this.codigo);
    }

    public String getPrecioFormateado() {
        if (this.tienePrecio()) {
            return "$" + this.precioReferencia.toString();
        }
        return "Precio no disponible";
    }
}

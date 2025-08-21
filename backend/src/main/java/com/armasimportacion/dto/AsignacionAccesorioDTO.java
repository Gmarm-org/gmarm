package com.armasimportacion.dto;

import com.armasimportacion.enums.EstadoAsignacion;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AsignacionAccesorioDTO {
    
    private Long id;
    private Long accesorioId;
    private Integer cantidad;
    private BigDecimal precioUnitario;
    private EstadoAsignacion estado;
    private LocalDateTime fechaAsignacion;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
    
    // Información de cliente (solo datos básicos)
    private Long clienteId;
    private String clienteNombreCompleto;
    private String clienteNumeroIdentificacion;
    private String clienteEmail;
    
    // Información de grupo de importación
    private Long grupoImportacionId;
    private String grupoImportacionNombre;
    
    // Información de usuario asignador
    private Long usuarioAsignadorId;
    private String usuarioAsignadorNombre;
    
    // Métodos de utilidad
    public BigDecimal getPrecioTotal() {
        if (precioUnitario != null && cantidad != null) {
            return precioUnitario.multiply(BigDecimal.valueOf(cantidad));
        }
        return BigDecimal.ZERO;
    }
    
    public boolean estaConfirmada() {
        return estado == EstadoAsignacion.CONFIRMADO;
    }
    
    public boolean estaReservada() {
        return estado == EstadoAsignacion.RESERVADO;
    }
}

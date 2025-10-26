package com.armasimportacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO para mostrar reservas pendientes de asignación de serie
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservaPendienteDTO {
    
    private Long id;
    
    // Datos del cliente
    private Long clienteId;
    private String clienteNombres;
    private String clienteApellidos;
    private String clienteNumeroIdentificacion;
    
    // Datos del arma
    private Long armaId;
    private String armaCodigo;
    private String armaNombre;
    private String armaCalibre;
    private Integer armaCapacidad;
    
    // Datos de la reserva
    private Integer cantidad;
    private BigDecimal precioUnitario;
    private String estado;
    private LocalDateTime fechaAsignacion;
    private LocalDateTime fechaCreacion;
}


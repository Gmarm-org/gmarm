package com.armasimportacion.dto;

import com.armasimportacion.enums.TipoPago;
import com.armasimportacion.enums.EstadoPago;
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
public class PagoDTO {
    
    private Long id;
    private BigDecimal monto;
    private TipoPago tipoPago;
    private EstadoPago estado;
    private String referencia;
    private String observaciones;
    private LocalDateTime fechaPago;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
    
    // Información de cliente (solo datos básicos)
    private Long clienteId;
    private String clienteNombreCompleto;
    private String clienteNumeroIdentificacion;
    
    // Información de usuario que registró
    private Long usuarioRegistroId;
    private String usuarioRegistroNombre;
    
    // Información de plan de pago (si aplica)
    private Long planPagoId;
    private String planPagoNombre;
    
    // Métodos de utilidad
    public boolean estaConfirmado() {
        return estado == EstadoPago.COMPLETADO;
    }
    
    public boolean estaPendiente() {
        return estado == EstadoPago.PENDIENTE;
    }
    
    public boolean estaRechazado() {
        return estado == EstadoPago.RECHAZADO;
    }
    
    public boolean esEfectivo() {
        return tipoPago == TipoPago.EFECTIVO;
    }
    
    public boolean esTransferencia() {
        return tipoPago == TipoPago.TRANSFERENCIA;
    }
    
    public boolean esTarjeta() {
        return tipoPago == TipoPago.TARJETA_CREDITO || tipoPago == TipoPago.TARJETA_DEBITO;
    }
}

package com.armasimportacion.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pago")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = false)
@EntityListeners(AuditingEntityListener.class)
public class Pago {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "numero_comprobante", nullable = false, unique = true)
    private String numeroComprobante;
    
    @Column(name = "valor_pago", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorPago;
    
    @Column(name = "fecha_pago", nullable = false)
    private LocalDateTime fechaPago;
    
    @Column(name = "saldo_fecha", precision = 10, scale = 2)
    private BigDecimal saldoFecha;
    
    @Column(name = "tipo_pago", nullable = false)
    @Enumerated(EnumType.STRING)
    private TipoPago tipoPago;
    
    @Column(name = "estado", nullable = false)
    @Enumerated(EnumType.STRING)
    private EstadoPago estado;
    
    @Column(name = "observaciones")
    private String observaciones;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_pago_id")
    private PlanPago planPago;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_registro_id")
    private Usuario usuarioRegistro;
    
    @CreatedDate
    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;
    
    @LastModifiedDate
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;
    
    // Relaciones
    @OneToMany(mappedBy = "pago", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<CuotaPago> cuotas = new ArrayList<>();
    
    // Métodos de utilidad
    public boolean esAnticipo() {
        return tipoPago == TipoPago.ANTICIPO;
    }
    
    public boolean esPagoCompleto() {
        return tipoPago == TipoPago.COMPLETO;
    }
    
    public boolean estaConfirmado() {
        return estado == EstadoPago.CONFIRMADO;
    }
} 
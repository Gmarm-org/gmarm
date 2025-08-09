package com.armasimportacion.model;

import com.armasimportacion.enums.EstadoPago;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_pago_id")
    private PlanPago planPago;

    @Column(name = "numero_comprobante", nullable = false, length = 50, unique = true)
    private String numeroComprobante;

    @Column(name = "monto_total", nullable = false, columnDefinition = "DECIMAL(10,2)")
    private BigDecimal montoTotal;

    @Column(name = "saldo_pendiente", nullable = false, columnDefinition = "DECIMAL(10,2)")
    private BigDecimal saldoPendiente;

    @Column(name = "metodo_pago", nullable = false, length = 50)
    private String metodoPago;

    @Column(name = "fecha_pago")
    private LocalDateTime fechaPago;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstadoPago estado = EstadoPago.PENDIENTE;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @CreatedDate
    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @LastModifiedDate
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;
} 
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

    @Column(name = "cliente_id", nullable = false)
    private Long clienteId;

    // Desglose de montos
    @Column(name = "subtotal", columnDefinition = "DECIMAL(10,2)")
    private BigDecimal subtotal;  // Precio sin IVA

    @Column(name = "monto_iva", columnDefinition = "DECIMAL(10,2)")
    private BigDecimal montoIva;  // Monto del IVA

    @Column(name = "monto_total", nullable = false, columnDefinition = "DECIMAL(10,2)")
    private BigDecimal montoTotal;  // Total con IVA (subtotal + montoIva)

    @Column(name = "tipo_pago", nullable = false, length = 20)
    private String tipoPago;

    @Column(name = "numero_cuotas", nullable = false)
    private Integer numeroCuotas = 1;

    @Column(name = "monto_cuota", columnDefinition = "DECIMAL(10,2)")
    private BigDecimal montoCuota;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstadoPago estado = EstadoPago.PENDIENTE;

    @Column(name = "monto_pagado", nullable = false, columnDefinition = "DECIMAL(10,2)")
    private BigDecimal montoPagado = BigDecimal.ZERO;

    @Column(name = "monto_pendiente", columnDefinition = "DECIMAL(10,2)")
    private BigDecimal montoPendiente;

    @Column(name = "cuota_actual", nullable = false)
    private Integer cuotaActual = 1;

    @CreatedDate
    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @LastModifiedDate
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;
} 

package com.armasimportacion.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * ClienteArma - Representa la relación entre un cliente y un arma
 * Reemplaza a AsignacionArma para mantener consistencia con la base de datos
 */
@Entity
@Table(name = "cliente_arma")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClienteArma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "arma_id", nullable = false)
    private Arma arma;

    @Column(name = "cantidad", nullable = false)
    private Integer cantidad = 1;

    @Column(name = "precio_unitario", precision = 10, scale = 2)
    private BigDecimal precioUnitario;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", length = 20)
    private EstadoClienteArma estado = EstadoClienteArma.RESERVADO;

    @Column(name = "fecha_asignacion")
    private LocalDateTime fechaAsignacion;

    @CreationTimestamp
    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @UpdateTimestamp
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    // Enums para el estado
    public enum EstadoClienteArma {
        RESERVADO,
        CONFIRMADO,
        CANCELADO,
        COMPLETADO
    }

    // Métodos de negocio
    public void confirmar() {
        this.estado = EstadoClienteArma.CONFIRMADO;
        this.fechaAsignacion = LocalDateTime.now();
    }

    public void cancelar() {
        this.estado = EstadoClienteArma.CANCELADO;
    }

    public void completar() {
        this.estado = EstadoClienteArma.COMPLETADO;
    }

    public boolean estaReservado() {
        return EstadoClienteArma.RESERVADO.equals(this.estado);
    }

    public boolean estaConfirmado() {
        return EstadoClienteArma.CONFIRMADO.equals(this.estado);
    }

    public boolean estaCancelado() {
        return EstadoClienteArma.CANCELADO.equals(this.estado);
    }

    public boolean estaCompletado() {
        return EstadoClienteArma.COMPLETADO.equals(this.estado);
    }
}

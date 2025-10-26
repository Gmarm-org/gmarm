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
 * ClienteAccesorio - Representa la relación entre un cliente y un accesorio
 * Reemplaza a AsignacionAccesorio para mantener consistencia con la base de datos
 */
@Entity
@Table(name = "cliente_accesorio")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClienteAccesorio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accesorio_id", nullable = false)
    private Accesorio accesorio;

    @Column(name = "cantidad", nullable = false)
    private Integer cantidad = 1;

    @Column(name = "precio_unitario", precision = 10, scale = 2)
    private BigDecimal precioUnitario;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", length = 20)
    private EstadoClienteAccesorio estado = EstadoClienteAccesorio.RESERVADO;

    @Column(name = "fecha_asignacion")
    private LocalDateTime fechaAsignacion;

    @CreationTimestamp
    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @UpdateTimestamp
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    // Enums para el estado
    public enum EstadoClienteAccesorio {
        RESERVADO,
        CONFIRMADO,
        CANCELADO,
        COMPLETADO
    }

    // Métodos de negocio
    public void confirmar() {
        this.estado = EstadoClienteAccesorio.CONFIRMADO;
        this.fechaAsignacion = LocalDateTime.now();
    }

    public void cancelar() {
        this.estado = EstadoClienteAccesorio.CANCELADO;
    }

    public void completar() {
        this.estado = EstadoClienteAccesorio.COMPLETADO;
    }

    public boolean estaReservado() {
        return EstadoClienteAccesorio.RESERVADO.equals(this.estado);
    }

    public boolean estaConfirmado() {
        return EstadoClienteAccesorio.CONFIRMADO.equals(this.estado);
    }

    public boolean estaCancelado() {
        return EstadoClienteAccesorio.CANCELADO.equals(this.estado);
    }

    public boolean estaCompletado() {
        return EstadoClienteAccesorio.COMPLETADO.equals(this.estado);
    }
}

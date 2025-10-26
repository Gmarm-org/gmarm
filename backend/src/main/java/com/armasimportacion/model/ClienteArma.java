package com.armasimportacion.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
    @JsonIgnoreProperties({"tipoIdentificacion", "tipoCliente", "usuarioCreador", "usuarioActualizador", "usuarioAprobador", "hibernateLazyInitializer", "handler"})
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "arma_id", nullable = false)
    @JsonIgnoreProperties({"imagenes", "categoria", "hibernateLazyInitializer", "handler"})
    private Arma arma;

    @Column(name = "cantidad", nullable = false)
    private Integer cantidad = 1;

    @Column(name = "precio_unitario", precision = 10, scale = 2)
    private BigDecimal precioUnitario;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", length = 20)
    private EstadoClienteArma estado = EstadoClienteArma.RESERVADA;

    @Column(name = "numero_serie", length = 100)
    private String numeroSerie;

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
        DISPONIBLE,
        RESERVADA,
        ASIGNADA,
        CANCELADA,
        COMPLETADA
    }

    // Métodos de negocio
    public void reservar() {
        this.estado = EstadoClienteArma.RESERVADA;
        this.fechaAsignacion = LocalDateTime.now();
    }

    public void asignar(String numeroSerie) {
        this.estado = EstadoClienteArma.ASIGNADA;
        this.numeroSerie = numeroSerie;
        this.fechaAsignacion = LocalDateTime.now();
    }

    public void cancelar() {
        this.estado = EstadoClienteArma.CANCELADA;
    }

    public void completar() {
        this.estado = EstadoClienteArma.COMPLETADA;
    }

    public boolean estaDisponible() {
        return EstadoClienteArma.DISPONIBLE.equals(this.estado);
    }

    public boolean estaReservada() {
        return EstadoClienteArma.RESERVADA.equals(this.estado);
    }

    public boolean estaAsignada() {
        return EstadoClienteArma.ASIGNADA.equals(this.estado);
    }

    public boolean estaCancelada() {
        return EstadoClienteArma.CANCELADA.equals(this.estado);
    }

    public boolean estaCompletada() {
        return EstadoClienteArma.COMPLETADA.equals(this.estado);
    }
}

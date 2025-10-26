package com.armasimportacion.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entidad que representa un número de serie único de un arma física
 * Se carga desde Excel y se asigna a clientes a través de cliente_arma
 */
@Entity
@Table(name = "arma_serie")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArmaSerie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_serie", unique = true, nullable = false, length = 100)
    private String numeroSerie;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "arma_id", nullable = false)
    @JsonIgnoreProperties({"imagenes", "hibernateLazyInitializer", "handler"})
    private Arma arma;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", length = 20, nullable = false)
    @Builder.Default
    private EstadoSerie estado = EstadoSerie.DISPONIBLE;

    @Column(name = "fecha_carga")
    private LocalDateTime fechaCarga;

    @Column(name = "fecha_asignacion")
    private LocalDateTime fechaAsignacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_arma_id")
    @JsonIgnoreProperties({"arma", "cliente", "hibernateLazyInitializer", "handler"})
    private ClienteArma clienteArma;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_asignador_id")
    @JsonIgnoreProperties({"password", "hibernateLazyInitializer", "handler"})
    private Usuario usuarioAsignador;

    @Column(name = "lote", length = 50)
    private String lote;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @PrePersist
    protected void onCreate() {
        fechaCreacion = LocalDateTime.now();
        fechaActualizacion = LocalDateTime.now();
        if (fechaCarga == null) {
            fechaCarga = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        fechaActualizacion = LocalDateTime.now();
    }

    /**
     * Enum para los estados de la serie
     */
    public enum EstadoSerie {
        DISPONIBLE("Disponible para asignación"),
        ASIGNADO("Asignado a un cliente"),
        VENDIDO("Vendido y entregado"),
        BAJA("Dado de baja");

        private final String descripcion;

        EstadoSerie(String descripcion) {
            this.descripcion = descripcion;
        }

        public String getDescripcion() {
            return descripcion;
        }
    }

    /**
     * Métodos de utilidad
     */
    public boolean estaDisponible() {
        return EstadoSerie.DISPONIBLE.equals(this.estado);
    }

    public boolean estaAsignado() {
        return EstadoSerie.ASIGNADO.equals(this.estado);
    }

    public void asignar(ClienteArma clienteArma, Usuario usuarioAsignador) {
        this.estado = EstadoSerie.ASIGNADO;
        this.clienteArma = clienteArma;
        this.usuarioAsignador = usuarioAsignador;
        this.fechaAsignacion = LocalDateTime.now();
    }

    public void liberar() {
        this.estado = EstadoSerie.DISPONIBLE;
        this.clienteArma = null;
        this.usuarioAsignador = null;
        this.fechaAsignacion = null;
    }

    public void marcarComoVendido() {
        this.estado = EstadoSerie.VENDIDO;
    }

    public void darDeBaja(String motivo) {
        this.estado = EstadoSerie.BAJA;
        this.observaciones = (this.observaciones != null ? this.observaciones + " | " : "") + "BAJA: " + motivo;
    }
}


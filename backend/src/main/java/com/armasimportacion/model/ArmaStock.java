package com.armasimportacion.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entidad para el inventario de armas
 * Representa el stock físico de cada arma en el sistema
 */
@Entity
@Table(name = "arma_stock")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArmaStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "arma_id", nullable = false)
    private Arma arma;

    // Campos denormalizados para facilitar consultas (sincronizados con arma)
    @Column(name = "modelo", length = 100)
    private String modelo; // Sincronizado con arma.modelo

    @Column(name = "marca", length = 100)
    private String marca; // Sincronizado con arma.marca

    @Column(name = "alimentadora", length = 50)
    private String alimentadora; // Sincronizado con arma.alimentadora

    @Column(name = "cantidad_total", nullable = false)
    private Integer cantidadTotal = 0;

    @Column(name = "cantidad_disponible", nullable = false)
    private Integer cantidadDisponible = 0;

    @Column(name = "precio_venta", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioVenta;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    @UpdateTimestamp
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    /**
     * Verifica si hay stock disponible
     */
    public boolean tieneStockDisponible() {
        return cantidadDisponible > 0 && activo;
    }

    /**
     * Verifica si hay suficiente stock para la cantidad solicitada
     */
    public boolean tieneStockSuficiente(Integer cantidadSolicitada) {
        return cantidadDisponible >= cantidadSolicitada && activo;
    }

    /**
     * Reduce el stock disponible
     */
    public void reducirStock(Integer cantidad) {
        if (cantidadDisponible >= cantidad) {
            cantidadDisponible -= cantidad;
        } else {
            throw new IllegalArgumentException("Stock insuficiente");
        }
    }

    /**
     * Aumenta el stock disponible
     */
    public void aumentarStock(Integer cantidad) {
        cantidadDisponible += cantidad;
        cantidadTotal += cantidad;
    }
}

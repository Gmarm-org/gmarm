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
 * Accesorio - Representa los accesorios disponibles para los clientes
 * Ejemplos: cargadores, miras, fundas, etc.
 */
@Entity
@Table(name = "accesorio")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Accesorio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "codigo", nullable = false, unique = true, length = 50)
    private String codigo;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "categoria", length = 50)
    private String categoria;

    @Column(name = "precio_referencia", precision = 10, scale = 2)
    private BigDecimal precioReferencia;

    @Column(name = "estado")
    private Boolean estado = true;

    @CreationTimestamp
    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @UpdateTimestamp
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    // Métodos de negocio
    public boolean estaActivo() {
        return Boolean.TRUE.equals(this.estado);
    }

    public void activar() {
        this.estado = true;
    }

    public void desactivar() {
        this.estado = false;
    }

    public boolean tienePrecio() {
        return this.precioReferencia != null && this.precioReferencia.compareTo(BigDecimal.ZERO) > 0;
    }

    public String getNombreCompleto() {
        return String.format("%s (%s)", this.nombre, this.codigo);
    }
} 

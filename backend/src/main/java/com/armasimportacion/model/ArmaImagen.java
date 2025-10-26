package com.armasimportacion.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entidad que representa una imagen de un arma.
 * Permite tener múltiples imágenes por arma con orden y marcador de principal.
 */
@Entity
@Table(name = "arma_imagen")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArmaImagen {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "arma_id", nullable = false)
    @JsonIgnoreProperties({"imagenes", "hibernateLazyInitializer", "handler"})
    private Arma arma;
    
    @Column(name = "url_imagen", length = 500, nullable = false)
    private String urlImagen;
    
    @Column(name = "orden")
    @Builder.Default
    private Integer orden = 1;
    
    @Column(name = "es_principal")
    @Builder.Default
    private Boolean esPrincipal = false;
    
    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;
    
    @Column(name = "fecha_creacion")
    @Builder.Default
    private LocalDateTime fechaCreacion = LocalDateTime.now();
    
    @Column(name = "fecha_actualizacion")
    @Builder.Default
    private LocalDateTime fechaActualizacion = LocalDateTime.now();
    
    @PreUpdate
    public void preUpdate() {
        this.fechaActualizacion = LocalDateTime.now();
    }
}


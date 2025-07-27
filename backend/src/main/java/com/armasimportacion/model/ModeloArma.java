package com.armasimportacion.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "modelo_arma")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class ModeloArma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "codigo", unique = true, nullable = false, length = 50)
    private String codigo;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "calibre", nullable = false, length = 50)
    private String calibre;

    @Column(name = "capacidad", length = 50)
    private String capacidad;

    @Column(name = "precio_referencia", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioReferencia;

    @Column(name = "estado", nullable = false, length = 50)
    private String estado = "DISPONIBLE";
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id")
    private CategoriaArma categoria;

    @CreatedDate
    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @LastModifiedDate
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;
    
    // Relaciones
    @OneToMany(mappedBy = "modeloArma", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<AsignacionArma> asignaciones = new ArrayList<>();
    
    @OneToMany(mappedBy = "modeloArma", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ArmaFisica> armasFisicas = new ArrayList<>();
} 
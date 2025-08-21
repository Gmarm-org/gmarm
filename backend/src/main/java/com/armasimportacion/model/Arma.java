package com.armasimportacion.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "arma")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Arma {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "codigo", length = 50, unique = true, nullable = false)
    private String codigo;
    
    @Column(name = "nombre", length = 100, nullable = false)
    private String nombre;
    
    @Column(name = "calibre", length = 20)
    private String calibre;
    
    @Column(name = "capacidad")
    private Integer capacidad;
    
    @Column(name = "precio_referencia", columnDefinition = "DECIMAL(10,2)")
    private BigDecimal precioReferencia;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id")
    private CategoriaArma categoria;
    
    @Column(name = "url_imagen", length = 500)
    private String urlImagen;
    
    @Column(name = "url_producto", length = 500)
    private String urlProducto;
    
    @Column(name = "estado", nullable = false)
    private Boolean estado;
    
    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;
    
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;
}

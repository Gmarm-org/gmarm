package com.armasimportacion.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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
    
    @Column(name = "modelo", length = 100, nullable = false)
    private String modelo; // Cambiado de nombre a modelo
    
    @Column(name = "marca", length = 100)
    private String marca; // Nuevo campo
    
    @Column(name = "alimentadora", length = 50)
    private String alimentadora; // Nuevo campo
    
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
    
    // Relación con imágenes - múltiples imágenes por arma
    @OneToMany(mappedBy = "arma", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("orden ASC")
    @Builder.Default
    private List<ArmaImagen> imagenes = new ArrayList<>();
    
    /**
     * Obtiene la imagen principal del arma.
     * Prioridad: 1) imagen marcada como principal en arma_imagen, 2) primera imagen en arma_imagen
     * Nota: url_imagen es deprecated - todas las imágenes deben estar en arma_imagen
     */
    public String getImagenPrincipal() {
        if (imagenes != null && !imagenes.isEmpty()) {
            // Buscar imagen marcada como principal
            return imagenes.stream()
                .filter(ArmaImagen::getEsPrincipal)
                .findFirst()
                .map(ArmaImagen::getUrlImagen)
                .orElse(imagenes.get(0).getUrlImagen());
        }
        // Si no hay imágenes en arma_imagen, retornar placeholder
        // NOTA: Esto no debería pasar si la migración se ejecutó correctamente
        return "/images/weapons/default-weapon.svg";
    }
}

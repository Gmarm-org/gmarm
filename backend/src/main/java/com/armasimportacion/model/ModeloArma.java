package com.armasimportacion.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "modelo_arma", uniqueConstraints = {
        @UniqueConstraint(columnNames = "codigo")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModeloArma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 50, nullable = false, unique = true)
    private String codigo;

    @Column(length = 100, nullable = false)
    private String nombre;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id")
    private CategoriaArma categoria;

    @Column(length = 50, nullable = false)
    private String calibre;

    @Column(length = 50)
    private String capacidad;

    @Column(name = "precio_referencia", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioReferencia;

    @Column(name = "imagen_url", length = 255)
    private String imagenUrl;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(length = 50, nullable = false)
    private String estado = "DISPONIBLE";
}

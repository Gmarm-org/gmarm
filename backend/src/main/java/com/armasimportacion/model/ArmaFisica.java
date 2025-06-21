package com.armasimportacion.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "arma_fisica", uniqueConstraints = {
        @UniqueConstraint(columnNames = "numero_serie")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArmaFisica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relación con modelo_arma
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modelo_arma_id", nullable = false)
    private ModeloArma modeloArma;

    @Column(name = "numero_serie", length = 50, unique = true)
    private String numeroSerie;

    // Relación con grupo_importacion
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grupo_importacion_id", nullable = false)
    private GrupoImportacion grupoImportacion;

    @Column(length = 20, nullable = false)
    private String estado = "EN_BODEGA";

    @Column(name = "fecha_ingreso", nullable = false)
    private LocalDateTime fechaIngreso;

    @Column(name = "fecha_salida")
    private LocalDateTime fechaSalida;

    // Relación con cliente asignado, puede ser null
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_asignado_id")
    private Cliente clienteAsignado;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @PrePersist
    public void prePersist() {
        if (fechaIngreso == null) {
            fechaIngreso = LocalDateTime.now();
        }
    }
}

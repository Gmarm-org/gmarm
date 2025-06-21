package com.armasimportacion.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "accesorio_fisico")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccesorioFisico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relación con tipo_accesorio
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_accesorio_id", nullable = false)
    private TipoAccesorio tipoAccesorio;

    // Relación opcional con modelo_arma
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modelo_arma_id")
    private ModeloArma modeloArma;

    @Column(name = "numero_serie", length = 50)
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

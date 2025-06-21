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

@Entity
@Table(name = "grupo_importacion_cupo", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"grupo_importacion_id", "tipo_importacion_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GrupoImportacionCupo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grupo_importacion_id", nullable = false)
    private GrupoImportacion grupoImportacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_importacion_id", nullable = false)
    private TipoImportacion tipoImportacion;

    @Column(length = 20)
    private String codigo;

    @Column(name = "cupo_asignado", nullable = false)
    private Integer cupoAsignado;

    @Column(name = "cupo_utilizado", nullable = false)
    private Integer cupoUtilizado = 0;
}

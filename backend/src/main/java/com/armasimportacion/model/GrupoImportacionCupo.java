package com.armasimportacion.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "grupo_importacion_cupo")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = false)
@EntityListeners(AuditingEntityListener.class)
public class GrupoImportacionCupo {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grupo_importacion_id", nullable = false)
    private GrupoImportacion grupoImportacion;
    
    @Column(name = "tipo_cliente", nullable = false)
    private String tipoCliente; // CIVIL, MILITAR, EMPRESA, DEPORTISTA
    
    @Column(name = "cupo_asignado", nullable = false)
    private Integer cupoAsignado;
    
    @Column(name = "cupo_utilizado", nullable = false)
    private Integer cupoUtilizado = 0;
    
    @Column(name = "cupo_disponible", nullable = false)
    private Integer cupoDisponible;
    
    @CreatedDate
    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;
    
    @LastModifiedDate
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;
    
    // Métodos de utilidad
    public boolean tieneCupoDisponible() {
        return cupoDisponible > 0;
    }
    
    public void incrementarCupoUtilizado() {
        this.cupoUtilizado++;
        this.cupoDisponible = this.cupoAsignado - this.cupoUtilizado;
    }
    
    public void decrementarCupoUtilizado() {
        if (this.cupoUtilizado > 0) {
            this.cupoUtilizado--;
            this.cupoDisponible = this.cupoAsignado - this.cupoUtilizado;
        }
    }
} 
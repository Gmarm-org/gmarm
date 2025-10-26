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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "licencia_id", nullable = false)
    private Licencia licencia;
    
    @Column(name = "tipo_cliente", nullable = false)
    private String tipoCliente; // CIVIL, MILITAR, EMPRESA, DEPORTISTA
    
    @Column(name = "cupo_consumido", nullable = false)
    private Integer cupoConsumido; // Cuánto consume este grupo
    
    @Column(name = "cupo_disponible_licencia", nullable = false)
    private Integer cupoDisponibleLicencia; // Cuánto queda disponible en la licencia
    
    @CreatedDate
    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;
    
    @LastModifiedDate
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;
    
    // Métodos de utilidad
    public boolean tieneCupoDisponible() {
        return cupoDisponibleLicencia > 0;
    }
    
    public void incrementarCupoConsumido() {
        this.cupoConsumido++;
        this.cupoDisponibleLicencia = this.cupoDisponibleLicencia - 1;
    }
    
    public void decrementarCupoConsumido() {
        if (this.cupoConsumido > 0) {
            this.cupoConsumido--;
            this.cupoDisponibleLicencia = this.cupoDisponibleLicencia + 1;
        }
    }
} 

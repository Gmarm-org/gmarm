package com.armasimportacion.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "licencia")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = false)
@EntityListeners(AuditingEntityListener.class)
public class Licencia {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "numero_licencia", nullable = false, unique = true)
    private String numeroLicencia;
    
    @Column(name = "tipo_licencia", nullable = false)
    private String tipoLicencia; // CP, EXCU, EXCS
    
    @Column(name = "fecha_emision")
    private LocalDateTime fechaEmision;
    
    @Column(name = "fecha_vencimiento")
    private LocalDateTime fechaVencimiento;
    
    @Column(name = "estado", nullable = false)
    @Enumerated(EnumType.STRING)
    private EstadoLicencia estado;
    
    @Column(name = "cupo_civil", nullable = false)
    private Integer cupoCivil = 25;
    
    @Column(name = "cupo_empresa")
    private Integer cupoEmpresa;
    
    @Column(name = "cupo_militar")
    private Integer cupoMilitar;
    
    @Column(name = "cupo_deportista")
    private Integer cupoDeportista;
    
    @Column(name = "observaciones")
    private String observaciones;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_creador_id")
    private Usuario usuarioCreador;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_actualizador_id")
    private Usuario usuarioActualizador;
    
    @CreatedDate
    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;
    
    @LastModifiedDate
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;
    
    // Relaciones
    @OneToMany(mappedBy = "licencia", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<GrupoImportacion> gruposImportacion = new ArrayList<>();
    
    // Métodos de utilidad
    public boolean tieneCupoDisponible(String tipoCliente) {
        switch (tipoCliente.toUpperCase()) {
            case "CIVIL":
                return cupoCivil > 0;
            case "EMPRESA":
                return cupoEmpresa != null && cupoEmpresa > 0;
            case "MILITAR":
            case "UNIFORMADO":
                return cupoMilitar != null && cupoMilitar > 0;
            case "DEPORTISTA":
                return cupoDeportista != null && cupoDeportista > 0;
            default:
                return false;
        }
    }
    
    public void decrementarCupo(String tipoCliente) {
        switch (tipoCliente.toUpperCase()) {
            case "CIVIL":
                if (cupoCivil > 0) cupoCivil--;
                break;
            case "EMPRESA":
                if (cupoEmpresa != null && cupoEmpresa > 0) cupoEmpresa--;
                break;
            case "MILITAR":
            case "UNIFORMADO":
                if (cupoMilitar != null && cupoMilitar > 0) cupoMilitar--;
                break;
            case "DEPORTISTA":
                if (cupoDeportista != null && cupoDeportista > 0) cupoDeportista--;
                break;
        }
    }
    
    public boolean esActiva() {
        return estado == EstadoLicencia.ACTIVA && 
               (fechaVencimiento == null || fechaVencimiento.isAfter(LocalDateTime.now()));
    }
    
    public String getCupoDisponible(String tipoCliente) {
        switch (tipoCliente.toUpperCase()) {
            case "CIVIL":
                return String.valueOf(cupoCivil);
            case "EMPRESA":
                return cupoEmpresa != null ? String.valueOf(cupoEmpresa) : "0";
            case "MILITAR":
            case "UNIFORMADO":
                return cupoMilitar != null ? String.valueOf(cupoMilitar) : "0";
            case "DEPORTISTA":
                return cupoDeportista != null ? String.valueOf(cupoDeportista) : "0";
            default:
                return "0";
        }
    }
} 
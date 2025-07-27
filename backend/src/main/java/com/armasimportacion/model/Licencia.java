package com.armasimportacion.model;

import com.armasimportacion.enums.EstadoLicencia;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
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

    @Column(name = "numero_licencia", nullable = false, unique = true, length = 50)
    private String numeroLicencia;

    @Column(name = "tipo_licencia", nullable = false, length = 50)
    private String tipoLicencia;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "fecha_emision", nullable = false)
    private LocalDate fechaEmision;

    @Column(name = "fecha_vencimiento", nullable = false)
    private LocalDate fechaVencimiento;

    @Column(name = "cupo_total", nullable = false)
    private Integer cupoTotal;

    @Column(name = "cupo_disponible", nullable = false)
    private Integer cupoDisponible;

    @Column(name = "cupo_civil", nullable = false)
    private Integer cupoCivil;

    @Column(name = "cupo_militar", nullable = false)
    private Integer cupoMilitar;

    @Column(name = "cupo_empresa", nullable = false)
    private Integer cupoEmpresa;

    @Column(name = "cupo_deportista", nullable = false)
    private Integer cupoDeportista;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_actualizador_id")
    private Usuario usuarioActualizador;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstadoLicencia estado = EstadoLicencia.ACTIVA;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_creador_id", nullable = false)
    private Usuario usuarioCreador;

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
    public Integer getCupoDisponible(String tipoCliente) {
        switch (tipoCliente.toLowerCase()) {
            case "civil":
                return cupoCivil;
            case "militar":
                return cupoMilitar;
            case "empresa":
                return cupoEmpresa;
            case "deportista":
                return cupoDeportista;
            default:
                return cupoDisponible;
        }
    }

    public boolean tieneCupoDisponible(String tipoCliente) {
        return getCupoDisponible(tipoCliente) > 0;
    }

    public void decrementarCupo(String tipoCliente) {
        switch (tipoCliente.toLowerCase()) {
            case "civil":
                if (cupoCivil > 0) cupoCivil--;
                break;
            case "militar":
                if (cupoMilitar > 0) cupoMilitar--;
                break;
            case "empresa":
                if (cupoEmpresa > 0) cupoEmpresa--;
                break;
            case "deportista":
                if (cupoDeportista > 0) cupoDeportista--;
                break;
            default:
                if (cupoDisponible > 0) cupoDisponible--;
                break;
        }
    }
} 
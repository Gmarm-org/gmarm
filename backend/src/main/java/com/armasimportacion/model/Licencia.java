package com.armasimportacion.model;

import com.armasimportacion.enums.EstadoLicencia;
import com.armasimportacion.enums.EstadoOcupacionLicencia;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
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

    @Column(name = "numero", nullable = false, unique = true, length = 50)
    private String numero;

    @Column(name = "nombre", nullable = false, length = 255)
    private String nombre;

    @Column(name = "ruc", length = 20)
    private String ruc;

    @Column(name = "cuenta_bancaria", length = 50)
    private String cuentaBancaria;

    @Column(name = "nombre_banco", length = 100)
    private String nombreBanco;

    @Column(name = "tipo_cuenta", length = 20)
    private String tipoCuenta;

    @Column(name = "cedula_cuenta", length = 20)
    private String cedulaCuenta;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "telefono", length = 20)
    private String telefono;

    @Column(name = "fecha_vencimiento", nullable = false)
    private LocalDate fechaVencimiento;

    // Campos adicionales para el sistema de gestión
    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "fecha_emision")
    private LocalDate fechaEmision;

    @Column(name = "cupo_total")
    private Integer cupoTotal;

    @Column(name = "cupo_disponible")
    private Integer cupoDisponible;

    @Column(name = "cupo_civil")
    private Integer cupoCivil;

    @Column(name = "cupo_militar")
    private Integer cupoMilitar;

    @Column(name = "cupo_empresa")
    private Integer cupoEmpresa;

    @Column(name = "cupo_deportista")
    private Integer cupoDeportista;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_actualizador_id")
    private Usuario usuarioActualizador;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", length = 20)
    private EstadoLicencia estado = EstadoLicencia.ACTIVA;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_ocupacion", length = 20)
    private EstadoOcupacionLicencia estadoOcupacion = EstadoOcupacionLicencia.DISPONIBLE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_creador_id")
    private Usuario usuarioCreador;

    @CreatedDate
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    @LastModifiedDate
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    // Relaciones
    @OneToMany(mappedBy = "licencia", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<GrupoImportacion> gruposImportacion = new ArrayList<>();

    // Métodos de utilidad
    public Integer getCupoDisponible(String tipoCliente) {
        if (tipoCliente == null) return cupoDisponible;
        
        switch (tipoCliente.toLowerCase()) {
            case "civil":
                return cupoCivil != null ? cupoCivil : 0;
            case "militar":
                return cupoMilitar != null ? cupoMilitar : 0;
            case "empresa":
                return cupoEmpresa != null ? cupoEmpresa : 0;
            case "deportista":
                return cupoDeportista != null ? cupoDeportista : 0;
            default:
                return cupoDisponible != null ? cupoDisponible : 0;
        }
    }

    public boolean tieneCupoDisponible(String tipoCliente) {
        return getCupoDisponible(tipoCliente) > 0;
    }

    public void decrementarCupo(String tipoCliente) {
        switch (tipoCliente.toLowerCase()) {
            case "civil":
                if (cupoCivil != null && cupoCivil > 0) cupoCivil--;
                break;
            case "militar":
                if (cupoMilitar != null && cupoMilitar > 0) cupoMilitar--;
                break;
            case "empresa":
                if (cupoEmpresa != null && cupoEmpresa > 0) cupoEmpresa--;
                break;
            case "deportista":
                if (cupoDeportista != null && cupoDeportista > 0) cupoDeportista--;
                break;
            default:
                if (cupoDisponible != null && cupoDisponible > 0) cupoDisponible--;
                break;
        }
    }

    // Método para determinar si la licencia está vencida
    public boolean isVencida() {
        return fechaVencimiento != null && fechaVencimiento.isBefore(LocalDate.now());
    }

    // Método para obtener días restantes hasta el vencimiento
    public long getDiasRestantes() {
        if (fechaVencimiento == null) return 0;
        return LocalDate.now().until(fechaVencimiento).getDays();
    }

    // Método para obtener el tipo de licencia (siempre es IMPORTACION_ARMAS)
    public String getTipoLicencia() {
        return "IMPORTACION_ARMAS";
    }

    // Métodos para el estado de ocupación
    public boolean isDisponible() {
        return EstadoOcupacionLicencia.DISPONIBLE.equals(estadoOcupacion);
    }

    public boolean isBloqueada() {
        return EstadoOcupacionLicencia.BLOQUEADA.equals(estadoOcupacion);
    }

    public void bloquear() {
        this.estadoOcupacion = EstadoOcupacionLicencia.BLOQUEADA;
    }

    public void liberar() {
        this.estadoOcupacion = EstadoOcupacionLicencia.DISPONIBLE;
    }

    // Método para verificar si la licencia puede ser asignada a un nuevo grupo
    public boolean puedeSerAsignada() {
        return isDisponible() && !isVencida() && estado == EstadoLicencia.ACTIVA;
    }
} 

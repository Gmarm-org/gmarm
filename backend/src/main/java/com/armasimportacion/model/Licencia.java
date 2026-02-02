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

/**
 * Entidad que representa una Licencia de Importación.
 * NOTA: Los cupos se manejan a nivel de Grupo de Importación (tipo CUPO o JUSTIFICATIVO),
 * no a nivel de licencia.
 */
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

    @Column(name = "titulo", length = 200)
    private String titulo;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provincia_id")
    private Provincia provincia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "canton_id")
    private Canton canton;

    @Column(name = "fecha_vencimiento", nullable = false)
    private LocalDate fechaVencimiento;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "fecha_emision")
    private LocalDate fechaEmision;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_actualizador_id")
    private Usuario usuarioActualizador;

    @Column(name = "estado")
    private Boolean estado = true; // true = ACTIVA, false = INACTIVA

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
        return isDisponible() && !isVencida() && Boolean.TRUE.equals(estado);
    }
}

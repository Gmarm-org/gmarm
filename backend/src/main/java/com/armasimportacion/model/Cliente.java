package com.armasimportacion.model;

import com.armasimportacion.enums.EstadoCliente;
import com.armasimportacion.enums.EstadoMilitar;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cliente")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_identificacion", nullable = false, length = 20)
    private String numeroIdentificacion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tipo_identificacion_id", nullable = false)
    private TipoIdentificacion tipoIdentificacion;

    @Column(name = "nombres", nullable = false, length = 100)
    private String nombres;

    @Column(name = "apellidos", nullable = false, length = 100)
    private String apellidos;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "email_verificado", nullable = true)
    private Boolean emailVerificado; // null = Pendiente, true = Validado, false = Datos incorrectos

    @Column(name = "telefono_principal", length = 20)
    private String telefonoPrincipal;

    @Column(name = "telefono_secundario", length = 20)
    private String telefonoSecundario;

    @Column(name = "direccion", columnDefinition = "TEXT")
    private String direccion;

    @Column(name = "fecha_nacimiento")
    private LocalDate fechaNacimiento;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", length = 20)
    private EstadoCliente estado = EstadoCliente.EN_PROCESO;

    @Column(name = "aprobado")
    private Boolean aprobado = false;

    @Column(name = "fecha_aprobacion")
    private LocalDateTime fechaAprobacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_aprobador_id")
    private Usuario usuarioAprobador;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tipo_cliente_id", nullable = false)
    private TipoCliente tipoCliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_creador_id", nullable = false)
    private Usuario usuarioCreador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_actualizador_id")
    private Usuario usuarioActualizador;

    @Column(name = "proceso_completado")
    private Boolean procesoCompletado = false;

    @Column(name = "aprobado_por_jefe_ventas")
    private Boolean aprobadoPorJefeVentas;

    @Column(name = "motivo_rechazo", length = 500)
    private String motivoRechazo;

    @Column(name = "fecha_rechazo")
    private LocalDateTime fechaRechazo;

    @Column(name = "provincia", length = 100)
    private String provincia;

    @Column(name = "canton", length = 100)
    private String canton;

    @Column(name = "representante_legal", length = 100)
    private String representanteLegal;

    @Column(name = "ruc", length = 13)
    private String ruc;

    @Column(name = "nombre_empresa", length = 255)
    private String nombreEmpresa;

    @Column(name = "direccion_fiscal", length = 255)
    private String direccionFiscal;

    @Column(name = "telefono_referencia", length = 15)
    private String telefonoReferencia;

    @Column(name = "correo_empresa", length = 100)
    private String correoEmpresa;

    @Column(name = "provincia_empresa", length = 100)
    private String provinciaEmpresa;

    @Column(name = "canton_empresa", length = 100)
    private String cantonEmpresa;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_militar", length = 20)
    private EstadoMilitar estadoMilitar;

    @Column(name = "codigo_issfa", length = 50)
    private String codigoIssfa;

    @Column(name = "rango", length = 100)
    private String rango;

    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    @UpdateTimestamp
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    // Relaciones
    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<RespuestaCliente> respuestas = new ArrayList<>();

    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<DocumentoCliente> documentos = new ArrayList<>();

    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<ClienteGrupoImportacion> gruposImportacion = new ArrayList<>();

    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<ClienteArma> armas = new ArrayList<>();



    // Métodos de conveniencia
    public String getNombreCompleto() {
        return nombres + " " + apellidos;
    }

    public boolean esEmpresa() {
        return tipoCliente != null && tipoCliente.esEmpresa();
    }

    public boolean esMilitar() {
        // Solo es militar si el tipo es militar Y está ACTIVO, los PASIVOS se tratan como civiles
        return tipoCliente != null && tipoCliente.esMilitar() && estadoMilitar == EstadoMilitar.ACTIVO;
    }
    
    public boolean esMilitarPasivo() {
        return tipoCliente != null && tipoCliente.esMilitar() && estadoMilitar == EstadoMilitar.PASIVO;
    }

    public boolean esPolicia() {
        return tipoCliente != null && tipoCliente.esPolicia();
    }

    public boolean esCivil() {
        return tipoCliente != null && tipoCliente.esCivil();
    }

    public boolean esDeportista() {
        return tipoCliente != null && tipoCliente.esDeportista();
    }

    // Métodos que necesitan los servicios
    public List<ClienteArma> getAsignacionesArma() {
        return armas;
    }

    public List<ClienteAccesorio> getAsignacionesAccesorio() {
        // Por ahora retornamos una lista vacía, se puede implementar después
        return new ArrayList<>();
    }

    public String getMensajeErrorEdad() {
        if (fechaNacimiento != null) {
            LocalDate hoy = LocalDate.now();
            int edad = hoy.getYear() - fechaNacimiento.getYear();
            if (hoy.getDayOfYear() < fechaNacimiento.getDayOfYear()) {
                edad--;
            }
            if (edad < 25) {
                return "El cliente debe tener al menos 25 años. Edad actual: " + edad;
            }
        }
        return null;
    }

    public Long getTipoProcesoId() {
        // Obtener tipoProcesoId desde tipoCliente
        if (tipoCliente != null) {
            return tipoCliente.getTipoProcesoId();
        }
        return null;
    }
}

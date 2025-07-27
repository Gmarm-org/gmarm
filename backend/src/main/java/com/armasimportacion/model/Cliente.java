package com.armasimportacion.model;

import com.armasimportacion.enums.EstadoCliente;
import com.armasimportacion.enums.EstadoMilitar;
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
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cliente")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relaciones con catálogos
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_identificacion_id", nullable = false)
    private TipoIdentificacion tipoIdentificacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_cliente_id", nullable = false)
    private TipoCliente tipoCliente;

    // Información básica
    @Column(name = "numero_identificacion", nullable = false, length = 20)
    private String numeroIdentificacion;

    @Column(name = "nombres", nullable = false, length = 100)
    private String nombres;

    @Column(name = "apellidos", length = 100)
    private String apellidos;

    @Column(name = "fecha_nacimiento")
    private LocalDate fechaNacimiento;

    @Column(name = "direccion", nullable = false, length = 255)
    private String direccion;

    @Column(name = "provincia", length = 100)
    private String provincia;

    @Column(name = "canton", length = 100)
    private String canton;

    @Column(name = "email", nullable = false, length = 100)
    private String email;

    @Column(name = "telefono_principal", nullable = false, length = 15)
    private String telefonoPrincipal;

    @Column(name = "telefono_secundario", length = 15)
    private String telefonoSecundario;

    // Información de representante legal (para empresas)
    @Column(name = "representante_legal", length = 100)
    private String representanteLegal;

    // Información de empresa (solo para tipo empresa)
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

    // Información militar (solo para uniformados)
    @Enumerated(EnumType.STRING)
    @Column(name = "estado_militar", length = 20)
    @Builder.Default
    private EstadoMilitar estadoMilitar = EstadoMilitar.ACTIVO;

    // Auditoría
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_creador_id", nullable = false)
    private Usuario usuarioCreador;

    @CreatedDate
    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_actualizador_id")
    private Usuario usuarioActualizador;

    @LastModifiedDate
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    @Builder.Default
    private EstadoCliente estado = EstadoCliente.ACTIVO;

    // Relaciones
    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<RespuestaCliente> respuestas = new ArrayList<>();

    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<DocumentoCliente> documentos = new ArrayList<>();

    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<AsignacionArma> asignacionesArma = new ArrayList<>();

    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<AsignacionAccesorio> asignacionesAccesorio = new ArrayList<>();

    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ArmaFisica> armasFisicas = new ArrayList<>();

    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Pago> pagos = new ArrayList<>();

    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<DocumentoGenerado> documentosGenerados = new ArrayList<>();

    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ClienteGrupoImportacion> gruposImportacion = new ArrayList<>();

    // Métodos de utilidad
    public String getNombreCompleto() {
        return nombres + " " + apellidos;
    }

    public boolean esEmpresa() {
        return tipoCliente != null && "EMPRESA".equals(tipoCliente.getCodigo());
    }

    public boolean esUniformado() {
        return tipoCliente != null && "MILITAR".equals(tipoCliente.getCodigo());
    }

    public boolean esCivil() {
        return tipoCliente != null && "CIVIL".equals(tipoCliente.getCodigo());
    }

    public boolean esDeportista() {
        return tipoCliente != null && "DEPORTISTA".equals(tipoCliente.getCodigo());
    }

    public boolean tieneEdadMinima() {
        if (fechaNacimiento == null) return false;
        LocalDate fechaMinima = LocalDate.now().minusYears(25);
        return fechaNacimiento.isBefore(fechaMinima);
    }

    public int getEdad() {
        if (fechaNacimiento == null) return 0;
        LocalDate fechaActual = LocalDate.now();
        int edad = fechaActual.getYear() - fechaNacimiento.getYear();
        if (fechaActual.getMonthValue() < fechaNacimiento.getMonthValue() || 
            (fechaActual.getMonthValue() == fechaNacimiento.getMonthValue() && 
             fechaActual.getDayOfMonth() < fechaNacimiento.getDayOfMonth())) {
            edad--;
        }
        return edad;
    }

    public String getMensajeErrorEdad() {
        if (fechaNacimiento == null) return "Fecha de nacimiento no especificada";
        
        int edad = getEdad();
        if (edad >= 25) return null;
        
        int añosFaltantes = 25 - edad;
        if (añosFaltantes == 1) {
            return "El cliente debe tener al menos 25 años para comprar armas. Le falta 1 año.";
        } else {
            return "El cliente debe tener al menos 25 años para comprar armas. Le faltan " + añosFaltantes + " años.";
        }
    }

    public String getIdentificacionCompleta() {
        return tipoIdentificacion.getNombre() + ": " + numeroIdentificacion;
    }

    public boolean esActivo() {
        return estado == EstadoCliente.ACTIVO;
    }
} 
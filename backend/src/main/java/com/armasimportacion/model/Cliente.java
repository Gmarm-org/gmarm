package com.armasimportacion.model;

import jakarta.persistence.*;
import lombok.*;
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
    private EstadoCliente estado = EstadoCliente.ACTIVO;

    // Relaciones
    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<RespuestaCliente> respuestas = new ArrayList<>();
    
    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<DocumentoCliente> documentos = new ArrayList<>();
    
    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<AsignacionArma> asignacionesArma = new ArrayList<>();
    
    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<AsignacionAccesorio> asignacionesAccesorio = new ArrayList<>();
    
    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ArmaFisica> armasFisicas = new ArrayList<>();
    
    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Pago> pagos = new ArrayList<>();
    
    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<DocumentoGenerado> documentosGenerados = new ArrayList<>();
    
    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ClienteGrupoImportacion> gruposImportacion = new ArrayList<>();

    // Métodos de utilidad
    public String getNombreCompleto() {
        if (apellidos != null && !apellidos.trim().isEmpty()) {
            return nombres + " " + apellidos;
        }
        return nombres;
    }

    public boolean esEmpresa() {
        return tipoCliente != null && "Empresa Seguridad".equals(tipoCliente.getNombre());
    }

    public boolean esUniformado() {
        return tipoCliente != null && (
            tipoCliente.getNombre().contains("Militar") || 
            tipoCliente.getNombre().contains("Uniformado")
        );
    }

    public boolean esCivil() {
        return tipoCliente != null && "Civil".equals(tipoCliente.getNombre());
    }

    public boolean esDeportista() {
        return tipoCliente != null && "Deportista".equals(tipoCliente.getNombre());
    }

    public boolean tieneEdadMinima() {
        if (fechaNacimiento == null) return false;
        return fechaNacimiento.plusYears(25).isBefore(LocalDate.now()) || 
               fechaNacimiento.plusYears(25).isEqual(LocalDate.now());
    }

    public String getIdentificacionCompleta() {
        return tipoIdentificacion.getCodigo() + ": " + numeroIdentificacion;
    }

    public boolean esActivo() {
        return EstadoCliente.ACTIVO.equals(estado);
    }
} 
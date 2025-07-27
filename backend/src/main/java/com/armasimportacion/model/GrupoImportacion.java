package com.armasimportacion.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "grupo_importacion")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = false)
@EntityListeners(AuditingEntityListener.class)
public class GrupoImportacion {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "codigo", nullable = false, unique = true)
    private String codigo;
    
    @Column(name = "descripcion")
    private String descripcion;
    
    @Column(name = "fecha_estimada_llegada")
    private LocalDateTime fechaEstimadaLlegada;
    
    @Column(name = "fecha_real_llegada")
    private LocalDateTime fechaRealLlegada;
    
    @Column(name = "costo_total", precision = 12, scale = 2)
    private BigDecimal costoTotal;
    
    @Column(name = "estado", nullable = false)
    @Enumerated(EnumType.STRING)
    private EstadoGrupoImportacion estado;
    
    @Column(name = "observaciones")
    private String observaciones;
    
    // Relaciones principales
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "licencia_id")
    private Licencia licencia;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_proceso_id")
    private TipoProceso tipoProceso;
    
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
    
    // Relaciones uno a muchos
    @OneToMany(mappedBy = "grupoImportacion", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ClienteGrupoImportacion> clientesGrupo = new ArrayList<>();
    
    @OneToMany(mappedBy = "grupoImportacion", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<GrupoImportacionCupo> cupos = new ArrayList<>();
    
    @OneToMany(mappedBy = "grupoImportacion", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ArmaFisica> armasFisicas = new ArrayList<>();
    
    @OneToMany(mappedBy = "grupoImportacion", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<AccesorioFisico> accesoriosFisicos = new ArrayList<>();
    
    @OneToMany(mappedBy = "grupoImportacion", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<AsignacionArma> asignacionesArma = new ArrayList<>();
    
    @OneToMany(mappedBy = "grupoImportacion", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<AsignacionAccesorio> asignacionesAccesorio = new ArrayList<>();
    
    @OneToMany(mappedBy = "grupoImportacion", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<DocumentoGrupoImportacion> documentos = new ArrayList<>();
    
    @OneToMany(mappedBy = "grupoImportacion", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<DocumentoGenerado> documentosGenerados = new ArrayList<>();
    
    // Métodos de utilidad
    public boolean estaActivo() {
        return estado == EstadoGrupoImportacion.ACTIVO;
    }
    
    public boolean estaCompleto() {
        return estado == EstadoGrupoImportacion.COMPLETO;
    }
    
    public boolean estaEnProceso() {
        return estado == EstadoGrupoImportacion.EN_PROCESO;
    }
    
    public int getTotalArmas() {
        return armasFisicas.size();
    }
    
    public int getTotalAccesorios() {
        return accesoriosFisicos.size();
    }
    
    public int getTotalClientes() {
        return clientesGrupo.size();
    }
} 
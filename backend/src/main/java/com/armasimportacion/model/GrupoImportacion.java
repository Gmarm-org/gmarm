package com.armasimportacion.model;

import com.armasimportacion.enums.EstadoGrupoImportacion;
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

import java.math.BigDecimal;
import java.time.LocalDate;
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

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "licencia_id", nullable = false)
    private Licencia licencia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_proceso_id", nullable = false)
    private TipoProceso tipoProceso;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDate fechaFin;

    @Column(name = "cupo_total", nullable = false)
    private Integer cupoTotal;

    @Column(name = "cupo_disponible", nullable = false)
    private Integer cupoDisponible;

    @Column(name = "codigo", unique = true, length = 20)
    private String codigo;

    @Column(name = "fecha_estimada_llegada")
    private LocalDate fechaEstimadaLlegada;

    @Column(name = "costo_total", columnDefinition = "DECIMAL(10,2)")
    private BigDecimal costoTotal;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_actualizador_id")
    private Usuario usuarioActualizador;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 30)
    private EstadoGrupoImportacion estado = EstadoGrupoImportacion.EN_PREPARACION;

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
    @OneToMany(mappedBy = "grupoImportacion", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ClienteGrupoImportacion> clientes = new ArrayList<>();

    @OneToMany(mappedBy = "grupoImportacion", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<GrupoImportacionCupo> cupos = new ArrayList<>();

    @OneToMany(mappedBy = "grupoImportacion", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ArmaFisica> armasFisicas = new ArrayList<>();

    @OneToMany(mappedBy = "grupoImportacion", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<AccesorioFisico> accesoriosFisicos = new ArrayList<>();

    // Relaciones corregidas - solo mantener las que tienen mapeo correcto
    @OneToMany(mappedBy = "grupoImportacion", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<DocumentoGrupoImportacion> documentos = new ArrayList<>();

    @OneToMany(mappedBy = "grupoImportacion", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<DocumentoGenerado> documentosGenerados = new ArrayList<>();
} 

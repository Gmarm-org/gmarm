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

@Entity
@Table(name = "documento_grupo_importacion")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = false)
@EntityListeners(AuditingEntityListener.class)
public class DocumentoGrupoImportacion {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "nombre", nullable = false)
    private String nombre;
    
    @Column(name = "url_archivo", nullable = false)
    private String urlArchivo;
    
    @Column(name = "tipo_documento", nullable = false)
    private String tipoDocumento; // PROFORMA, RESOLUCION, PACKING_LIST, etc.
    
    @Column(name = "estado", nullable = false)
    @Enumerated(EnumType.STRING)
    private EstadoDocumentoGrupo estado;
    
    @Column(name = "observaciones")
    private String observaciones;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grupo_importacion_id", nullable = false)
    private GrupoImportacion grupoImportacion;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_carga_id")
    private Usuario usuarioCarga;
    
    @Column(name = "fecha_carga", nullable = false)
    private LocalDateTime fechaCarga;
    
    @CreatedDate
    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;
    
    @LastModifiedDate
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;
    
    // Métodos de utilidad
    public boolean estaCompleto() {
        return estado == EstadoDocumentoGrupo.COMPLETO;
    }
    
    public boolean estaPendiente() {
        return estado == EstadoDocumentoGrupo.PENDIENTE;
    }
} 
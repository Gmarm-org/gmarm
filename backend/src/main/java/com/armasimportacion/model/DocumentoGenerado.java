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
@Table(name = "documento_generado")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = false)
@EntityListeners(AuditingEntityListener.class)
public class DocumentoGenerado {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "nombre", nullable = false)
    private String nombre;
    
    @Column(name = "tipo", nullable = false)
    @Enumerated(EnumType.STRING)
    private TipoDocumentoGenerado tipo;
    
    @Column(name = "url_archivo", nullable = false)
    private String urlArchivo;
    
    @Column(name = "numero_documento")
    private String numeroDocumento;
    
    @Column(name = "estado", nullable = false)
    @Enumerated(EnumType.STRING)
    private EstadoDocumentoGenerado estado;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grupo_importacion_id")
    private GrupoImportacion grupoImportacion;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_generador_id")
    private Usuario usuarioGenerador;
    
    @Column(name = "fecha_generacion", nullable = false)
    private LocalDateTime fechaGeneracion;
    
    @Column(name = "fecha_firma")
    private LocalDateTime fechaFirma;
    
    @CreatedDate
    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;
    
    @LastModifiedDate
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;
    
    // Métodos de utilidad
    public boolean esContrato() {
        return tipo == TipoDocumentoGenerado.CONTRATO;
    }
    
    public boolean esCartaIntencion() {
        return tipo == TipoDocumentoGenerado.CARTA_INTENCION;
    }
    
    public boolean esFactura() {
        return tipo == TipoDocumentoGenerado.FACTURA;
    }
    
    public boolean estaFirmado() {
        return fechaFirma != null;
    }
} 
package com.armasimportacion.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tipo_documento")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class TipoDocumento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "obligatorio", nullable = false)
    private Boolean obligatorio = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_proceso_id")
    private TipoProceso tipoProceso;

    @Column(name = "estado", nullable = false)
    private Boolean estado = true;

    @CreatedDate
    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @LastModifiedDate
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    // Relaciones
    @OneToMany(mappedBy = "tipoDocumento", fetch = FetchType.LAZY)
    private List<DocumentoCliente> documentos = new ArrayList<>();

    // Métodos de utilidad
    public boolean esActivo() {
        return estado != null && estado;
    }

    public boolean esObligatorio() {
        return obligatorio != null && obligatorio;
    }
} 
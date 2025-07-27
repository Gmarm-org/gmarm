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
@Table(name = "pregunta_cliente")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class PreguntaCliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_proceso_id", nullable = false)
    private TipoProceso tipoProceso;

    @Column(name = "pregunta", nullable = false, columnDefinition = "TEXT")
    private String pregunta;

    @Column(name = "obligatoria", nullable = false)
    private Boolean obligatoria = true;

    @Column(name = "orden", nullable = false)
    private Integer orden;

    @Column(name = "estado", nullable = false)
    private Boolean estado = true;

    @CreatedDate
    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @LastModifiedDate
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    // Relaciones
    @OneToMany(mappedBy = "pregunta", fetch = FetchType.LAZY)
    private List<RespuestaCliente> respuestas = new ArrayList<>();

    // Métodos de utilidad
    public boolean esActiva() {
        return estado != null && estado;
    }

    public boolean esObligatoria() {
        return obligatoria != null && obligatoria;
    }
} 
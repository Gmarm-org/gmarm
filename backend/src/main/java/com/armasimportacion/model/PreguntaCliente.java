package com.armasimportacion.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
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

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "preguntas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties({"tipoProceso"})
public class PreguntaCliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pregunta", nullable = false, columnDefinition = "TEXT")
    private String pregunta;

    @Column(name = "obligatoria", nullable = false)
    @Builder.Default
    private Boolean obligatoria = false;

    @Column(name = "orden", nullable = false)
    @Builder.Default
    private Integer orden = 1;

    @Column(name = "estado", nullable = false)
    @Builder.Default
    private Boolean estado = true;

    @Column(name = "tipo_respuesta", nullable = false, length = 20)
    @Builder.Default
    @Getter
    @Setter
    private String tipoRespuesta = "TEXTO"; // TEXTO, SI_NO, NUMERICO, etc.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_proceso_id", nullable = false)
    @JsonIgnoreProperties({"preguntas"})
    private TipoProceso tipoProceso;

    @CreatedDate
    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    // Relaciones
    @OneToMany(mappedBy = "pregunta", fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"pregunta", "cliente"})
    @Builder.Default
    private List<RespuestaCliente> respuestas = new ArrayList<>();
} 

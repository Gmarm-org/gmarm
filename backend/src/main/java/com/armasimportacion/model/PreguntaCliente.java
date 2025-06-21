package com.armasimportacion.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "pregunta_cliente")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PreguntaCliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_cliente_id", nullable = false)
    private TipoCliente tipoCliente;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String pregunta;

    @Column(nullable = false)
    private Boolean obligatoria = true;

    @Column(nullable = false)
    private Integer orden;

    @Column(nullable = false)
    private Boolean estado = true;
}

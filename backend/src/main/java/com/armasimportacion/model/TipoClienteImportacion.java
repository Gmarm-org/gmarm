package com.armasimportacion.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tipo_cliente_importacion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TipoClienteImportacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_cliente_id", nullable = false)
    private TipoCliente tipoCliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_importacion_id", nullable = false)
    private TipoImportacion tipoImportacion;
}


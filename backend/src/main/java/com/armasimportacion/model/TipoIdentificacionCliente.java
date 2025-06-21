package com.armasimportacion.model;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tipo_identificacion_cliente")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TipoIdentificacionCliente {

    @EmbeddedId
    private TipoIdentificacionClienteId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("tipoClienteId")
    @JoinColumn(name = "tipo_cliente_id")
    private TipoCliente tipoCliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("tipoImportacionId")
    @JoinColumn(name = "tipo_importacion_id")
    private TipoImportacion tipoImportacion;
}

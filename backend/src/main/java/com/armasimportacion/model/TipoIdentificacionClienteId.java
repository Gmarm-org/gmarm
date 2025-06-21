package com.armasimportacion.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
public class TipoIdentificacionClienteId implements Serializable {

    @Column(name = "tipo_cliente_id")
    private Integer tipoClienteId;

    @Column(name = "tipo_importacion_id")
    private Integer tipoImportacionId;
}

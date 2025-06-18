package com.armasimportacion.model.auth;

import jakarta.persistence.Embeddable;
import lombok.Data;

import java.io.Serializable;
import java.util.Objects;

@Data
@Embeddable
public class UsuarioRolId implements Serializable {
    private Long usuarioId;
    private Long rolId;
}
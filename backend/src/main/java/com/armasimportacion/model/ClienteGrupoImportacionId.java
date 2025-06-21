package com.armasimportacion.model;

import java.io.Serializable;
import java.util.Objects;

public class ClienteGrupoImportacionId implements Serializable {

    private Long cliente;
    private Long grupoImportacion;

    public ClienteGrupoImportacionId() {
    }

    public ClienteGrupoImportacionId(Long cliente, Long grupoImportacion) {
        this.cliente = cliente;
        this.grupoImportacion = grupoImportacion;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ClienteGrupoImportacionId)) return false;
        ClienteGrupoImportacionId that = (ClienteGrupoImportacionId) o;
        return Objects.equals(cliente, that.cliente) && Objects.equals(grupoImportacion, that.grupoImportacion);
    }

    @Override
    public int hashCode() {
        return Objects.hash(cliente, grupoImportacion);
    }
}

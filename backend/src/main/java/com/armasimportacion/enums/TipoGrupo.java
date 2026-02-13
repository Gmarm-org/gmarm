package com.armasimportacion.enums;

public enum TipoGrupo {
    CUPO("Cupo"),
    JUSTIFICATIVO("Justificativo");

    private final String descripcion;

    TipoGrupo(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }
}

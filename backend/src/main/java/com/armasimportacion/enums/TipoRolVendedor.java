package com.armasimportacion.enums;

public enum TipoRolVendedor {
    FIJO("Fijo"),
    LIBRE("Libre");

    private final String descripcion;

    TipoRolVendedor(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }
} 

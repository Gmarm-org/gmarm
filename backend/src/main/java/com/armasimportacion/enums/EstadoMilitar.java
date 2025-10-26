package com.armasimportacion.enums;

public enum EstadoMilitar {
    ACTIVO("Activo"),
    PASIVO("Pasivo");

    private final String descripcion;

    EstadoMilitar(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }
} 

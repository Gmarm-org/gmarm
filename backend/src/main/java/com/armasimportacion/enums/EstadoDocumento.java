package com.armasimportacion.enums;

public enum EstadoDocumento {
    PENDIENTE("Pendiente"),
    APROBADO("Aprobado"),
    RECHAZADO("Rechazado"),
    OBSERVADO("Observado");

    private final String descripcion;

    EstadoDocumento(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }
} 
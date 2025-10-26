package com.armasimportacion.enums;

public enum EstadoAsignacion {
    RESERVADO("Reservado"),
    CONFIRMADO("Confirmado"),
    CANCELADO("Cancelado"),
    ENTREGADO("Entregado");

    private final String descripcion;

    EstadoAsignacion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }
} 

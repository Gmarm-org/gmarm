package com.armasimportacion.enums;

/**
 * Enum de estados de cliente para uso interno del código
 * NOTA: Los estados de negocio están en la tabla 'estado_cliente' de la BD
 * Este enum es solo para compatibilidad con código existente
 */
public enum EstadoCliente {
    EN_PROCESO("En proceso"),
    ACTIVO("Activo"),
    BLOQUEADO("Bloqueado por violencia"),
    INHABILITADO_COMPRA("Inhabilitado para compra de armas"),
    APROBADO("Aprobado"),
    RECHAZADO("Rechazado"),
    PENDIENTE_DOCUMENTOS("Pendiente de documentos"),
    PENDIENTE_ASIGNACION_CLIENTE("Pendiente asignación cliente"),
    LISTO_IMPORTACION("Listo para importación"),
    EN_CURSO_IMPORTACION("En curso de importación"),
    SERIE_ASIGNADA("Serie asignada"),
    CONTRATO_ENVIADO("Contrato enviado"),
    CONTRATO_FIRMADO("Contrato firmado recibido"),
    PROCESO_COMPLETADO("Proceso completado"),
    CANCELADO("Cancelado"),
    DESISTIMIENTO("Desistimiento");
    
    private final String descripcion;
    
    EstadoCliente(String descripcion) {
        this.descripcion = descripcion;
    }
    
    public String getDescripcion() {
        return descripcion;
    }
    
    /**
     * Obtiene el código del estado (nombre del enum)
     */
    public String getCodigo() {
        return this.name();
    }
    
    /**
     * Crea un EstadoCliente desde un código (nombre del enum)
     */
    public static EstadoCliente fromCodigo(String codigo) {
        try {
            return EstadoCliente.valueOf(codigo);
        } catch (IllegalArgumentException e) {
            return EN_PROCESO; // Default fallback
        }
    }
}


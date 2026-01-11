package com.armasimportacion.enums;

/**
 * @deprecated Este enum ya no se usa. La configuración de tipos de cliente
 * ahora es completamente dinámica y se gestiona desde la base de datos
 * a través de la entidad com.armasimportacion.model.TipoCliente.
 * 
 * Este enum se mantiene temporalmente para compatibilidad, pero debe eliminarse
 * en futuras versiones.
 */
@Deprecated
public enum TipoCliente {
    
    CIVIL("Civil", "CIV", 1L, false),
    MILITAR_FUERZA_TERRESTRE("Militar Fuerza Terrestre", "MIL", 2L, true),
    MILITAR_FUERZA_NAVAL("Militar Fuerza Naval", "NAV", 2L, true),
    MILITAR_FUERZA_AEREA("Militar Fuerza Aérea", "AER", 2L, true),
    UNIFORMADO_POLICIAL("Uniformado Policial", "POL", 2L, false),
    COMPANIA_SEGURIDAD("Compañía de Seguridad", "EMP", 3L, false),
    DEPORTISTA("Deportista", "DEP", 4L, false);
    
    private final String nombre;
    private final String codigo;
    private final Long tipoProcesoId;
    private final boolean requiereIssfa;
    
    TipoCliente(String nombre, String codigo, Long tipoProcesoId, boolean requiereIssfa) {
        this.nombre = nombre;
        this.codigo = codigo;
        this.tipoProcesoId = tipoProcesoId;
        this.requiereIssfa = requiereIssfa;
    }
    
    public String getNombre() {
        return nombre;
    }
    
    public String getCodigo() {
        return codigo;
    }
    
    public Long getTipoProcesoId() {
        return tipoProcesoId;
    }
    
    public boolean isRequiereIssfa() {
        return requiereIssfa;
    }
    
    /**
     * Busca el enum por nombre (case insensitive)
     */
    public static TipoCliente fromNombre(String nombre) {
        if (nombre == null) {
            return CIVIL; // Por defecto
        }
        
        for (TipoCliente tipo : values()) {
            if (tipo.nombre.equalsIgnoreCase(nombre)) {
                return tipo;
            }
        }
        
        return CIVIL; // Por defecto si no se encuentra
    }
    
    /**
     * Verifica si un tipo de cliente es militar
     */
    public boolean isMilitar() {
        return nombre.contains("Militar");
    }
    
    /**
     * Verifica si un tipo de cliente debe tratarse como civil cuando está pasivo
     */
    public boolean debeTratarseComoCivilCuandoPasivo() {
        return isMilitar();
    }
}

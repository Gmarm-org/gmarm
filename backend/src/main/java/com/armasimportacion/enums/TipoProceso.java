package com.armasimportacion.enums;

/**
 * Enum para tipos de proceso
 */
public enum TipoProceso {
    
    CUPO_CIVIL(1L, "Cupo Civil"),
    EXTRACUPO_UNIFORMADO(2L, "Extracupo Uniformado"),
    EXTRACUPO_EMPRESA(3L, "Extracupo Empresa"),
    CUPO_DEPORTISTA(4L, "Cupo Deportista");
    
    private final Long id;
    private final String nombre;
    
    TipoProceso(Long id, String nombre) {
        this.id = id;
        this.nombre = nombre;
    }
    
    public Long getId() {
        return id;
    }
    
    public String getNombre() {
        return nombre;
    }
    
    /**
     * Busca el enum por ID
     */
    public static TipoProceso fromId(Long id) {
        if (id == null) {
            return CUPO_CIVIL; // Por defecto
        }
        
        for (TipoProceso tipo : values()) {
            if (tipo.id.equals(id)) {
                return tipo;
            }
        }
        
        return CUPO_CIVIL; // Por defecto si no se encuentra
    }
}

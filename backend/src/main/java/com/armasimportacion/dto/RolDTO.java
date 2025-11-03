package com.armasimportacion.dto;

import com.armasimportacion.enums.TipoRolVendedor;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RolDTO {
    
    private Long id;
    private String codigo;
    private String nombre;
    private String descripcion;
    
    @JsonProperty("tipo_rol_vendedor")
    private TipoRolVendedor tipoRolVendedor;
    
    private Boolean estado;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
    
    // Solo contador de usuarios, no entidades completas
    private Integer totalUsuarios;
    
    // Métodos de utilidad
    public boolean esVendedor() {
        return "VENDEDOR".equals(codigo);
    }
    
    public boolean esAdmin() {
        return "ADMIN".equals(codigo);
    }
    
    public boolean esJefeVentas() {
        return "JEFE_VENTAS".equals(codigo);
    }
    
    public boolean esOperaciones() {
        return "OPERACIONES".equals(codigo);
    }
    
    public boolean esFinanzas() {
        return "FINANZAS".equals(codigo);
    }
    
    public boolean esActivo() {
        return estado != null && estado;
    }
}

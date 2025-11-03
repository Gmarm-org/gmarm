package com.armasimportacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioDTO {
    
    private Long id;
    private String username;
    private String email;
    private String nombre;
    private String apellido;
    private Boolean estado; // true = ACTIVO, false = INACTIVO
    private LocalDateTime ultimoAcceso;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
    
    // Información de roles (solo nombres, no entidades completas)
    private List<String> rolesNombres;
    private List<String> rolesCodigos;
    private Integer totalRoles;
    
    // Información de vendedor (si aplica)
    private Long vendedorId;
    private String vendedorCodigo;
    private String vendedorTipo; // FIJO, LIBRE
    
    // Métodos de utilidad
    public String getNombreCompleto() {
        return nombre + " " + apellido;
    }
    
    public boolean esActivo() {
        return Boolean.TRUE.equals(estado); // estado es Boolean ahora
    }
    
    public boolean esVendedor() {
        return rolesCodigos != null && rolesCodigos.contains("VENDEDOR");
    }
    
    public boolean esAdmin() {
        return rolesCodigos != null && rolesCodigos.contains("ADMIN");
    }
    
    public boolean esJefeVentas() {
        return rolesCodigos != null && rolesCodigos.contains("JEFE_VENTAS");
    }
    
    public boolean tieneRol(String rolCodigo) {
        return rolesCodigos != null && rolesCodigos.contains(rolCodigo);
    }
}

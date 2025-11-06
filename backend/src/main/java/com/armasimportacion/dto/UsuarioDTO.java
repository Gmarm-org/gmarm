package com.armasimportacion.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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
    private String nombres;  // Cambiado de 'nombre' a 'nombres' para consistencia
    private String apellidos; // Cambiado de 'apellido' a 'apellidos' para consistencia
    
    @JsonProperty("telefono_principal")
    private String telefonoPrincipal;
    
    @JsonProperty("telefono_secundario")
    private String telefonoSecundario;
    
    private String direccion;
    private String foto;
    private Boolean estado; // true = ACTIVO, false = INACTIVO
    private Boolean bloqueado;
    
    @JsonProperty("ultimo_login")
    private LocalDateTime ultimoLogin;
    
    @JsonProperty("intentos_login")
    private Integer intentosLogin;
    
    @JsonProperty("fecha_creacion")
    private LocalDateTime fechaCreacion;
    
    @JsonProperty("fecha_actualizacion")
    private LocalDateTime fechaActualizacion;
    
    // Información de roles
    private List<Object> roles; // Array de objetos {id, nombre, codigo}
    private List<String> rolesNombres;
    private List<String> rolesCodigos;
    private Integer totalRoles;
    
    // Información de vendedor (si aplica)
    private Long vendedorId;
    private String vendedorCodigo;
    private String vendedorTipo; // FIJO, LIBRE
    
    // Métodos de utilidad
    public String getNombreCompleto() {
        return (nombres != null ? nombres : "") + " " + (apellidos != null ? apellidos : "");
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

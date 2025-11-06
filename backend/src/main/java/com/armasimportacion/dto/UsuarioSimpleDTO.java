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
public class UsuarioSimpleDTO {
    private Long id;
    private String nombres;
    private String apellidos;
    private String username;
    private String email;
    
    @JsonProperty("telefono_principal")
    private String telefonoPrincipal;
    
    @JsonProperty("telefono_secundario")
    private String telefonoSecundario;
    
    private String direccion;
    private String foto;
    private Boolean estado; // true = ACTIVO, false = INACTIVO
    private Boolean bloqueado;
    
    @JsonProperty("fecha_creacion")
    private LocalDateTime fechaCreacion;
    
    @JsonProperty("ultimo_login")
    private LocalDateTime ultimoLogin;
    
    @JsonProperty("intentos_login")
    private Integer intentosLogin;
    
    private List<RolDTO> roles;
}

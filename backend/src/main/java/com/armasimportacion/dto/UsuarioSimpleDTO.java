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
public class UsuarioSimpleDTO {
    private Long id;
    private String nombres;
    private String apellidos;
    private String username;
    private String email;
    private String telefonoPrincipal;
    private String telefonoSecundario;
    private String direccion;
    private Boolean estado; // true = ACTIVO, false = INACTIVO
    private Boolean bloqueado;
    private LocalDateTime fechaCreacion;
    private LocalDateTime ultimoLogin;
    private List<RolDTO> roles;
}

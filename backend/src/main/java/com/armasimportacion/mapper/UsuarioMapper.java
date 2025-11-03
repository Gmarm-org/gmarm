package com.armasimportacion.mapper;

import com.armasimportacion.dto.UsuarioSimpleDTO;
import com.armasimportacion.dto.RolDTO;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.model.Rol;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class UsuarioMapper {

    private final RolMapper rolMapper;

    public UsuarioMapper(RolMapper rolMapper) {
        this.rolMapper = rolMapper;
    }

    public UsuarioSimpleDTO toDTO(Usuario usuario) {
        if (usuario == null) {
            return null;
        }

        List<RolDTO> rolesDTO = null;
        if (usuario.getRoles() != null) {
            rolesDTO = usuario.getRoles().stream()
                    .map(rolMapper::toDTO)
                    .collect(Collectors.toList());
        }

        return UsuarioSimpleDTO.builder()
                .id(usuario.getId())
                .nombres(usuario.getNombres())
                .apellidos(usuario.getApellidos())
                .username(usuario.getUsername())
                .email(usuario.getEmail())
                .telefonoPrincipal(usuario.getTelefonoPrincipal())
                .telefonoSecundario(usuario.getTelefonoSecundario())
                .direccion(usuario.getDireccion())
                .activo(usuario.getEstado()) // estado ya es Boolean
                .bloqueado(usuario.getBloqueado())
                .fechaCreacion(usuario.getFechaCreacion())
                .ultimoLogin(usuario.getUltimoLogin())
                .roles(rolesDTO)
                .build();
    }

    public List<UsuarioSimpleDTO> toDTOList(List<Usuario> usuarios) {
        if (usuarios == null) {
            return null;
        }

        return usuarios.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Usuario toEntity(UsuarioSimpleDTO dto) {
        if (dto == null) {
            return null;
        }

        Usuario usuario = new Usuario();
        usuario.setId(dto.getId());
        usuario.setNombres(dto.getNombres());
        usuario.setApellidos(dto.getApellidos());
        usuario.setUsername(dto.getUsername());
        usuario.setEmail(dto.getEmail());
        usuario.setTelefonoPrincipal(dto.getTelefonoPrincipal());
        usuario.setTelefonoSecundario(dto.getTelefonoSecundario());
        usuario.setDireccion(dto.getDireccion());
        usuario.setEstado(dto.getActivo()); // activo ya es Boolean
        usuario.setBloqueado(dto.getBloqueado());
        return usuario;
    }
}

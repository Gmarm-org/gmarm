package com.armasimportacion.controller;

import com.armasimportacion.dto.UsuarioSimpleDTO;
import com.armasimportacion.enums.EstadoUsuario;
import com.armasimportacion.mapper.UsuarioMapper;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.service.UsuarioService;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PatchMapping;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final UsuarioMapper usuarioMapper;

    // ===== OPERACIONES CRUD =====

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllUsuarios(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("📋 GET /api/usuarios?page={}&size={}", page, size);
        
        Pageable pageable = PageRequest.of(page, size);
        Page<Usuario> usuariosPage = usuarioService.findAllPaginated(pageable);
        
        List<UsuarioSimpleDTO> usuariosDTO = usuarioMapper.toDTOList(usuariosPage.getContent());
        
        Map<String, Object> response = new HashMap<>();
        response.put("content", usuariosDTO);
        response.put("totalElements", usuariosPage.getTotalElements());
        response.put("totalPages", usuariosPage.getTotalPages());
        response.put("currentPage", usuariosPage.getNumber());
        response.put("pageSize", usuariosPage.getSize());
        
        log.info("✅ Usuarios obtenidos: {} de {} total", usuariosDTO.size(), usuariosPage.getTotalElements());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Usuario> getUsuarioById(@PathVariable Long id) {
        log.info("Obteniendo usuario con ID: {}", id);
        try {
            Usuario usuario = usuarioService.findById(id);
            return ResponseEntity.ok(usuario);
        } catch (ResourceNotFoundException e) {
            log.error("Usuario no encontrado con ID: {}", id);
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<Usuario> createUsuario(@Valid @RequestBody Usuario usuario) {
        log.info("Creando nuevo usuario: {}", usuario.getUsername());
        try {
            Usuario nuevoUsuario = usuarioService.create(usuario);
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevoUsuario);
        } catch (BadRequestException e) {
            log.error("Error al crear usuario: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Usuario> updateUsuario(@PathVariable Long id, @Valid @RequestBody Usuario usuario) {
        log.info("Actualizando usuario con ID: {}", id);
        try {
            Usuario usuarioActualizado = usuarioService.update(id, usuario);
            return ResponseEntity.ok(usuarioActualizado);
        } catch (ResourceNotFoundException e) {
            log.error("Usuario no encontrado con ID: {}", id);
            return ResponseEntity.notFound().build();
        } catch (BadRequestException e) {
            log.error("Error al actualizar usuario: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUsuario(@PathVariable Long id) {
        log.info("Eliminando usuario con ID: {}", id);
        try {
            usuarioService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            log.error("Usuario no encontrado con ID: {}", id);
            return ResponseEntity.notFound().build();
        }
    }

    // ===== GESTIÓN DE ROLES =====

    @GetMapping("/{id}/roles")
    public ResponseEntity<Set<com.armasimportacion.model.Rol>> getUserRoles(@PathVariable Long id) {
        log.info("📋 GET /api/usuarios/{}/roles - Obteniendo roles del usuario", id);
        try {
            Usuario usuario = usuarioService.findById(id);
            log.info("✅ Usuario encontrado: {}, roles: {}", usuario.getUsername(), usuario.getRoles().size());
            return ResponseEntity.ok(usuario.getRoles());
        } catch (ResourceNotFoundException e) {
            log.error("Usuario no encontrado con ID: {}", id);
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/roles")
    public ResponseEntity<Usuario> assignRoles(@PathVariable Long id, @RequestBody Set<Long> roleIds) {
        log.info("Asignando roles al usuario con ID: {}", id);
        try {
            Usuario usuario = usuarioService.assignRoles(id, roleIds);
            return ResponseEntity.ok(usuario);
        } catch (ResourceNotFoundException e) {
            log.error("Usuario no encontrado con ID: {}", id);
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{usuarioId}/roles/{roleId}")
    public ResponseEntity<Usuario> removeRole(@PathVariable Long usuarioId, @PathVariable Long roleId) {
        log.info("Removiendo rol {} del usuario {}", roleId, usuarioId);
        try {
            Usuario usuario = usuarioService.removeRole(usuarioId, roleId);
            return ResponseEntity.ok(usuario);
        } catch (ResourceNotFoundException e) {
            log.error("Usuario no encontrado con ID: {}", usuarioId);
            return ResponseEntity.notFound().build();
        }
    }

    // ===== GESTIÓN DE ESTADO =====

    @PatchMapping("/{id}/status")
    public ResponseEntity<Usuario> changeStatus(@PathVariable Long id, @RequestParam EstadoUsuario estado) {
        log.info("Cambiando estado del usuario {} a {}", id, estado);
        try {
            Usuario usuario = usuarioService.changeStatus(id, estado);
            return ResponseEntity.ok(usuario);
        } catch (ResourceNotFoundException e) {
            log.error("Usuario no encontrado con ID: {}", id);
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/unlock")
    public ResponseEntity<Usuario> unlockUsuario(@PathVariable Long id) {
        log.info("Desbloqueando usuario con ID: {}", id);
        try {
            Usuario usuario = usuarioService.unlock(id);
            return ResponseEntity.ok(usuario);
        } catch (ResourceNotFoundException e) {
            log.error("Usuario no encontrado con ID: {}", id);
            return ResponseEntity.notFound().build();
        }
    }

    // ===== BÚSQUEDAS ESPECÍFICAS =====

    @GetMapping("/vendedores")
    public ResponseEntity<List<Usuario>> getVendedoresActivos() {
        log.info("Obteniendo vendedores activos");
        List<Usuario> vendedores = usuarioService.findVendedoresActivos();
        return ResponseEntity.ok(vendedores);
    }

    @GetMapping("/estado/{estado}")
    public ResponseEntity<List<Usuario>> getUsuariosByEstado(@PathVariable EstadoUsuario estado) {
        log.info("Obteniendo usuarios con estado: {}", estado);
        List<Usuario> usuarios = usuarioService.findByEstado(estado);
        return ResponseEntity.ok(usuarios);
    }

    @GetMapping("/rol/{rolNombre}")
    public ResponseEntity<List<Usuario>> getUsuariosByRol(@PathVariable String rolNombre) {
        log.info("Obteniendo usuarios con rol: {}", rolNombre);
        List<Usuario> usuarios = usuarioService.findByRol(rolNombre);
        return ResponseEntity.ok(usuarios);
    }

    // ===== ESTADÍSTICAS =====

    @GetMapping("/stats/estado/{estado}")
    public ResponseEntity<Long> countByEstado(@PathVariable EstadoUsuario estado) {
        log.info("Contando usuarios con estado: {}", estado);
        Long count = usuarioService.countByEstado(estado);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/stats/bloqueados")
    public ResponseEntity<Long> countBloqueados() {
        log.info("Contando usuarios bloqueados");
        Long count = usuarioService.countBloqueados();
        return ResponseEntity.ok(count);
    }

    @GetMapping("/stats/activos")
    public ResponseEntity<Long> countActivos() {
        log.info("Contando usuarios activos");
        Long count = usuarioService.countActivos();
        return ResponseEntity.ok(count);
    }

    // ===== MANEJO DE EXCEPCIONES =====

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<String> handleResourceNotFoundException(ResourceNotFoundException e) {
        log.error("Recurso no encontrado: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<String> handleBadRequestException(BadRequestException e) {
        log.error("Solicitud incorrecta: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleGenericException(Exception e) {
        log.error("Error interno del servidor: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error interno del servidor");
    }
} 

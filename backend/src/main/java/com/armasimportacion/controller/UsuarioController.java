package com.armasimportacion.controller;

import com.armasimportacion.enums.EstadoUsuario;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.service.UsuarioService;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class UsuarioController {

    private final UsuarioService usuarioService;

    // ===== OPERACIONES CRUD =====

    @GetMapping
    public ResponseEntity<List<Usuario>> getAllUsuarios() {
        log.info("Obteniendo todos los usuarios");
        List<Usuario> usuarios = usuarioService.findAll();
        return ResponseEntity.ok(usuarios);
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
package com.armasimportacion.controller;

import com.armasimportacion.model.Rol;
import com.armasimportacion.repository.RolRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Roles", description = "Gestión de roles del sistema")
public class RolController {

    private final RolRepository rolRepository;

    @GetMapping
    // TODO: Descomentar en producción: @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Obtener todos los roles", description = "Devuelve la lista completa de roles del sistema")
    public ResponseEntity<List<Rol>> getAllRoles() {
        log.info("📋 GET /api/roles - Obteniendo todos los roles");
        List<Rol> roles = rolRepository.findAll();
        log.info("✅ Roles encontrados: {}", roles.size());
        return ResponseEntity.ok(roles);
    }

    @GetMapping("/{id}")
    // TODO: Descomentar en producción: @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Obtener rol por ID", description = "Devuelve un rol específico por su ID")
    public ResponseEntity<Rol> getRolById(@PathVariable Long id) {
        log.info("📋 GET /api/roles/{} - Obteniendo rol", id);
        return rolRepository.findById(id)
                .map(rol -> {
                    log.info("✅ Rol encontrado: {}", rol.getNombre());
                    return ResponseEntity.ok(rol);
                })
                .orElseGet(() -> {
                    log.warn("⚠️ Rol no encontrado con ID: {}", id);
                    return ResponseEntity.notFound().build();
                });
    }

    @PostMapping
    // TODO: Descomentar en producción: @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Crear nuevo rol", description = "Crea un nuevo rol en el sistema")
    public ResponseEntity<Rol> createRol(@RequestBody Rol rol) {
        log.info("📝 POST /api/roles - Creando nuevo rol: {}", rol.getNombre());
        Rol savedRol = rolRepository.save(rol);
        log.info("✅ Rol creado con ID: {}", savedRol.getId());
        return ResponseEntity.ok(savedRol);
    }

    @PutMapping("/{id}")
    // TODO: Descomentar en producción: @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Actualizar rol", description = "Actualiza un rol existente")
    public ResponseEntity<Rol> updateRol(@PathVariable Long id, @RequestBody Rol rol) {
        log.info("📝 PUT /api/roles/{} - Actualizando rol", id);
        return rolRepository.findById(id)
                .map(existingRol -> {
                    existingRol.setNombre(rol.getNombre());
                    existingRol.setCodigo(rol.getCodigo());
                    existingRol.setDescripcion(rol.getDescripcion());
                    Rol updated = rolRepository.save(existingRol);
                    log.info("✅ Rol actualizado: {}", updated.getNombre());
                    return ResponseEntity.ok(updated);
                })
                .orElseGet(() -> {
                    log.warn("⚠️ Rol no encontrado con ID: {}", id);
                    return ResponseEntity.notFound().build();
                });
    }

    @DeleteMapping("/{id}")
    // TODO: Descomentar en producción: @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Eliminar rol", description = "Elimina un rol del sistema")
    public ResponseEntity<Void> deleteRol(@PathVariable Long id) {
        log.info("🗑️ DELETE /api/roles/{} - Eliminando rol", id);
        return rolRepository.findById(id)
                .map(rol -> {
                    rolRepository.delete(rol);
                    log.info("✅ Rol eliminado: {}", rol.getNombre());
                    return ResponseEntity.ok().<Void>build();
                })
                .orElseGet(() -> {
                    log.warn("⚠️ Rol no encontrado con ID: {}", id);
                    return ResponseEntity.notFound().build();
                });
    }
}


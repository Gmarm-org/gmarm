package com.armasimportacion.service;

import com.armasimportacion.model.Rol;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.repository.UsuarioRepository;
import com.armasimportacion.repository.RolRepository;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;

    // ===== OPERACIONES CRUD =====

    public List<Usuario> findAll() {
        return usuarioRepository.findAll();
    }

    public Page<Usuario> findAllPaginated(Pageable pageable) {
        return usuarioRepository.findAll(pageable);
    }

    public Usuario findById(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + id));
    }

    public Usuario findByUsername(String username) {
        return usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con username: " + username));
    }

    public Usuario findByEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con email: " + email));
    }

    public boolean existsByEmail(String email) {
        return usuarioRepository.findByEmail(email).isPresent();
    }

    public Usuario create(Usuario usuario) {
        // Validaciones
        validateUsuarioForCreate(usuario);

        // Para desarrollo, la contraseña ya viene hasheada o en texto plano
        // No se requiere encriptación adicional

        // Configurar valores por defecto
        usuario.setEstado(true); // true = ACTIVO
        usuario.setIntentosLogin(0);
        usuario.setBloqueado(false);
        usuario.setFechaCreacion(LocalDateTime.now());

        return usuarioRepository.save(usuario);
    }

    public Usuario update(Long id, Usuario usuarioUpdate) {
        Usuario usuario = findById(id);
        
        // Validaciones
        validateUsuarioForUpdate(usuarioUpdate, id);

        // Actualizar campos
        usuario.setNombres(usuarioUpdate.getNombres());
        usuario.setApellidos(usuarioUpdate.getApellidos());
        usuario.setEmail(usuarioUpdate.getEmail());
        usuario.setTelefonoPrincipal(usuarioUpdate.getTelefonoPrincipal());
        usuario.setTelefonoSecundario(usuarioUpdate.getTelefonoSecundario());
        usuario.setDireccion(usuarioUpdate.getDireccion());
        usuario.setFoto(usuarioUpdate.getFoto());
        if (usuarioUpdate.getEstado() != null) {
            usuario.setEstado(usuarioUpdate.getEstado());
        }
        if (usuarioUpdate.getPasswordHash() != null && !usuarioUpdate.getPasswordHash().isBlank()) {
            usuario.setPasswordHash(usuarioUpdate.getPasswordHash());
        }

        return usuarioRepository.save(usuario);
    }

    public void delete(Long id) {
        Usuario usuario = findById(id);
        usuario.setEstado(false);
        usuario.setBloqueado(false);
        usuario.setIntentosLogin(0);
        usuarioRepository.save(usuario);
    }

    // ===== GESTIÓN DE ROLES =====

    public Usuario assignRoles(Long usuarioId, Set<Long> roleIds) {
        Usuario usuario = findById(usuarioId);
        Set<Rol> roles = rolRepository.findAllById(roleIds).stream().collect(java.util.stream.Collectors.toSet());
        
        usuario.setRoles(roles);
        return usuarioRepository.save(usuario);
    }

    public Usuario removeRole(Long usuarioId, Long roleId) {
        Usuario usuario = findById(usuarioId);
        usuario.getRoles().removeIf(rol -> rol.getId().equals(roleId));
        return usuarioRepository.save(usuario);
    }

    // ===== GESTIÓN DE ESTADO =====

    public Usuario changeStatus(Long id, Boolean estado) {
        Usuario usuario = findById(id);
        usuario.setEstado(estado);
        
        if (!estado) { // Si se desactiva, también desbloquear
            usuario.setBloqueado(false);
            usuario.setIntentosLogin(0);
        }
        
        return usuarioRepository.save(usuario);
    }

    public Usuario unlock(Long id) {
        Usuario usuario = findById(id);
        usuario.setBloqueado(false);
        usuario.setIntentosLogin(0);
        usuario.setEstado(true); // Activar cuando se desbloquea
        return usuarioRepository.save(usuario);
    }

    // ===== GESTIÓN DE LOGIN =====

    public void incrementLoginAttempts(String username) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByUsername(username);
        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();
            usuario.incrementarIntentosLogin();
            
            // Bloquear si excede intentos
            if (usuario.getIntentosLogin() >= 3) {
                usuario.setBloqueado(true);
                usuario.setEstado(false); // false = INACTIVO cuando se bloquea
            }
            
            usuarioRepository.save(usuario);
        }
    }

    public void resetLoginAttempts(String username) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByUsername(username);
        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();
            usuario.resetearIntentosLogin();
            usuarioRepository.save(usuario);
        }
    }

    public void updateLastLogin(Long id) {
        Usuario usuario = findById(id);
        usuario.setUltimoLogin(LocalDateTime.now());
        usuarioRepository.save(usuario);
    }

    // ===== BÚSQUEDAS ESPECÍFICAS =====

    public List<Usuario> findVendedoresActivos() {
        return usuarioRepository.findVendedoresActivos();
    }

    public List<Usuario> findByEstado(Boolean estado) {
        return usuarioRepository.findByEstado(estado);
    }

    public List<Usuario> findByRol(String rolNombre) {
        return usuarioRepository.findByRolNombre(rolNombre);
    }

    // ===== VALIDACIONES =====

    private void validateUsuarioForCreate(Usuario usuario) {
        // Validar username único
        if (usuarioRepository.existsByUsername(usuario.getUsername())) {
            throw new BadRequestException("El username ya existe: " + usuario.getUsername());
        }

        // Validar email único
        if (usuarioRepository.existsByEmail(usuario.getEmail())) {
            throw new BadRequestException("El email ya existe: " + usuario.getEmail());
        }

        // Validar campos obligatorios
        if (usuario.getPasswordHash() == null || usuario.getPasswordHash().isBlank()) {
            throw new BadRequestException("La contraseña es obligatoria");
        }

        if (usuario.getPasswordHash().length() < 6) {
            throw new BadRequestException("La contraseña debe tener al menos 6 caracteres");
        }
    }

    private void validateUsuarioForUpdate(Usuario usuarioUpdate, Long id) {
        // Validar email único (excluyendo el usuario actual)
        if (usuarioRepository.existsByEmailAndIdNot(usuarioUpdate.getEmail(), id)) {
            throw new BadRequestException("El email ya existe: " + usuarioUpdate.getEmail());
        }

        // Validar campos obligatorios
        if (usuarioUpdate.getNombres() == null || usuarioUpdate.getNombres().isBlank()) {
            throw new BadRequestException("Los nombres son obligatorios");
        }

        if (usuarioUpdate.getEmail() == null || usuarioUpdate.getEmail().isBlank()) {
            throw new BadRequestException("El email es obligatorio");
        }
    }

    // ===== ESTADÍSTICAS =====

    public Long countByEstado(Boolean estado) {
        return usuarioRepository.countByEstado(estado);
    }

    public Long countBloqueados() {
        return usuarioRepository.countByBloqueado(true);
    }

    public Long countActivos() {
        return usuarioRepository.countByEstado(true); // true = ACTIVO
    }
} 

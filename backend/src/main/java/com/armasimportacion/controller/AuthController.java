package com.armasimportacion.controller;

import com.armasimportacion.model.Usuario;
import com.armasimportacion.security.JwtTokenProvider;
import com.armasimportacion.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Autenticación", description = "API para autenticación de usuarios")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UsuarioService usuarioService;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;

        @PostMapping("/login")
    @Operation(summary = "Iniciar sesión", description = "Autentica un usuario y devuelve un token JWT")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> loginRequest) {
        try {
            String email = loginRequest.get("email");
            String password = loginRequest.get("password");

            log.info("🔐 Intento de login para el usuario: {}", email);

            if (email == null || password == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Email y password son requeridos");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            // Buscar usuario por email
            Usuario usuario;
            try {
                usuario = usuarioService.findByEmail(email);
            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Credenciales inválidas");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            // Verificar password
            // Por ahora comparación directa, después se puede implementar BCrypt
            boolean passwordMatches;
            if (usuario.getPasswordHash().startsWith("$2a$") || usuario.getPasswordHash().startsWith("$2b$")) {
                // Password hasheado con BCrypt
                passwordMatches = passwordEncoder.matches(password, usuario.getPasswordHash());
            } else {
                // Password en texto plano (para compatibilidad temporal)
                passwordMatches = password.equals(usuario.getPasswordHash());
            }

            if (!passwordMatches) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Credenciales inválidas");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            // Actualizar último login
            usuarioService.updateLastLogin(usuario.getId());
            
            // Generar token JWT
            String token = tokenProvider.generateToken(email);

            // Obtener roles del usuario
            List<Map<String, Object>> roles = usuario.getRoles().stream()
                .map(rol -> {
                    Map<String, Object> rolMap = new HashMap<>();
                    rolMap.put("id", rol.getId());
                    rolMap.put("nombre", rol.getNombre());
                    rolMap.put("codigo", rol.getCodigo());
                    rolMap.put("descripcion", rol.getDescripcion());
                    return rolMap;
                })
                .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("type", "Bearer");
            response.put("user", Map.of(
                "id", usuario.getId(),
                "email", usuario.getEmail(),
                "nombres", usuario.getNombres(),
                "apellidos", usuario.getApellidos(),
                "roles", roles
            ));

            log.info("🔐 Login exitoso para el usuario: {} con token JWT generado", email);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("🔐 Error en login: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error interno del servidor");
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/me")
    @Operation(summary = "Obtener usuario actual", description = "Obtiene la información del usuario autenticado")
    public ResponseEntity<Map<String, Object>> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Token JWT requerido");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            String token = authHeader.substring(7);
            String email = tokenProvider.getUsernameFromToken(token);

            if (email == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Token JWT inválido");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            Usuario usuario = usuarioService.findByEmail(email);

            // Obtener roles del usuario
            List<Map<String, Object>> roles = usuario.getRoles().stream()
                .map(rol -> {
                    Map<String, Object> rolMap = new HashMap<>();
                    rolMap.put("id", rol.getId());
                    rolMap.put("nombre", rol.getNombre());
                    rolMap.put("codigo", rol.getCodigo());
                    rolMap.put("descripcion", rol.getDescripcion());
                    return rolMap;
                })
                .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("id", usuario.getId());
            response.put("email", usuario.getEmail());
            response.put("nombres", usuario.getNombres());
            response.put("apellidos", usuario.getApellidos());
            response.put("roles", roles);

            log.info("🔐 Usuario actual obtenido: {}", email);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("🔐 Error obteniendo usuario actual: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error interno del servidor");
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @PostMapping("/logout")
    @Operation(summary = "Cerrar sesión", description = "Cierra la sesión del usuario (el token JWT se invalida en el cliente)")
    public ResponseEntity<Map<String, Object>> logout() {
        try {
            // Con JWT stateless, el logout se maneja en el cliente eliminando el token
            // Este endpoint solo confirma que la solicitud fue procesada
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Sesión cerrada exitosamente");
            response.put("success", true);
            
            log.info("🔐 Logout exitoso");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("🔐 Error en logout: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error interno del servidor");
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
}

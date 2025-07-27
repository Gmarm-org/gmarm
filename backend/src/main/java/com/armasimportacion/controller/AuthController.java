package com.armasimportacion.controller;

import com.armasimportacion.exception.BadRequestException;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.security.JwtTokenProvider;
import com.armasimportacion.security.UserPrincipal;
import com.armasimportacion.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Autenticación", description = "API para autenticación y autorización")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UsuarioService usuarioService;

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesión", description = "Autentica un usuario y devuelve un token JWT")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    loginRequest.getEmail(),
                    loginRequest.getPassword()
                )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = tokenProvider.generateToken(authentication);
            
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            Usuario usuario = usuarioService.obtenerUsuario(userPrincipal.getId());
            
            // Actualizar último login
            usuarioService.actualizarUltimoLogin(usuario.getId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("token", jwt);
            response.put("tokenType", "Bearer");
            response.put("expiresIn", 86400000); // 24 horas
            response.put("user", Map.of(
                "id", usuario.getId(),
                "username", usuario.getUsername(),
                "email", usuario.getEmail(),
                "nombres", usuario.getNombres(),
                "apellidos", usuario.getApellidos(),
                "roles", usuario.getRoles().stream().map(rol -> rol.getNombre()).toList()
            ));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error en login: {}", e.getMessage());
            throw new BadRequestException("Credenciales inválidas");
        }
    }

    @PostMapping("/refresh")
    @Operation(summary = "Renovar token", description = "Renueva un token JWT válido")
    public ResponseEntity<Map<String, Object>> refreshToken(@RequestHeader("Authorization") String token) {
        try {
            String jwt = token.replace("Bearer ", "");
            
            if (!tokenProvider.validateToken(jwt)) {
                throw new BadRequestException("Token inválido");
            }
            
            String username = tokenProvider.getUsernameFromToken(jwt);
            Usuario usuario = usuarioService.obtenerUsuarioPorUsername(username);
            
            // Crear nueva autenticación
            UserPrincipal userPrincipal = UserPrincipal.create(usuario);
            Authentication authentication = new UsernamePasswordAuthenticationToken(
                userPrincipal, null, userPrincipal.getAuthorities());
            
            String newJwt = tokenProvider.generateToken(authentication);
            
            Map<String, Object> response = new HashMap<>();
            response.put("token", newJwt);
            response.put("tokenType", "Bearer");
            response.put("expiresIn", 86400000);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al renovar token: {}", e.getMessage());
            throw new BadRequestException("Error al renovar token");
        }
    }

    @PostMapping("/logout")
    @Operation(summary = "Cerrar sesión", description = "Cierra la sesión del usuario")
    public ResponseEntity<Map<String, String>> logout() {
        SecurityContextHolder.clearContext();
        Map<String, String> response = Map.of("message", "Sesión cerrada exitosamente");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @Operation(summary = "Obtener usuario actual", description = "Obtiene la información del usuario autenticado")
    public ResponseEntity<Map<String, Object>> getCurrentUser() {
        try {
            UserPrincipal userPrincipal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
            
            Usuario usuario = usuarioService.obtenerUsuario(userPrincipal.getId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", usuario.getId());
            response.put("username", usuario.getUsername());
            response.put("email", usuario.getEmail());
            response.put("nombres", usuario.getNombres());
            response.put("apellidos", usuario.getApellidos());
            response.put("roles", usuario.getRoles().stream().map(rol -> rol.getNombre()).toList());
            response.put("estado", usuario.getEstado());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al obtener usuario actual: {}", e.getMessage());
            throw new BadRequestException("Error al obtener usuario actual");
        }
    }

    // Clase interna para el request de login
    public static class LoginRequest {
        private String email;
        private String password;

        // Getters y setters
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
} 
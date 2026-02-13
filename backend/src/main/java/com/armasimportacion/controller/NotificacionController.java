package com.armasimportacion.controller;

import com.armasimportacion.enums.TipoNotificacion;
import com.armasimportacion.model.Notificacion;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.repository.UsuarioRepository;
import com.armasimportacion.service.NotificacionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notificaciones")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Notificaciones", description = "Gestión de notificaciones del usuario autenticado")
public class NotificacionController {

    private final NotificacionService notificacionService;
    private final UsuarioRepository usuarioRepository;

    @GetMapping
    @Operation(summary = "Obtener notificaciones del usuario autenticado")
    public ResponseEntity<List<Notificacion>> getMisNotificaciones() {
        Usuario usuario = getUsuarioAutenticado();
        List<Notificacion> notificaciones = notificacionService.obtenerNotificacionesPorUsuario(usuario.getId());
        return ResponseEntity.ok(notificaciones);
    }

    @GetMapping("/no-leidas")
    @Operation(summary = "Obtener notificaciones no leídas del usuario autenticado")
    public ResponseEntity<List<Notificacion>> getMisNotificacionesNoLeidas() {
        Usuario usuario = getUsuarioAutenticado();
        List<Notificacion> notificaciones = notificacionService.obtenerNotificacionesNoLeidas(usuario.getId());
        return ResponseEntity.ok(notificaciones);
    }

    @GetMapping("/no-leidas/count")
    @Operation(summary = "Contar notificaciones no leídas del usuario autenticado")
    public ResponseEntity<Map<String, Integer>> contarNoLeidas() {
        Usuario usuario = getUsuarioAutenticado();
        int count = notificacionService.contarNotificacionesNoLeidas(usuario.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/tipo/{tipo}")
    @Operation(summary = "Obtener notificaciones por tipo del usuario autenticado")
    public ResponseEntity<List<Notificacion>> getMisNotificacionesPorTipo(@PathVariable TipoNotificacion tipo) {
        Usuario usuario = getUsuarioAutenticado();
        List<Notificacion> notificaciones = notificacionService.obtenerNotificacionesPorTipo(usuario.getId(), tipo);
        return ResponseEntity.ok(notificaciones);
    }

    @PutMapping("/{id}/leer")
    @Operation(summary = "Marcar notificación como leída")
    public ResponseEntity<Void> marcarComoLeida(@PathVariable Long id) {
        Usuario usuario = getUsuarioAutenticado();
        Notificacion notificacion = notificacionService.obtenerNotificacion(id);
        if (!notificacion.getUsuarioDestinatario().getId().equals(usuario.getId())) {
            return ResponseEntity.status(403).build();
        }
        notificacionService.marcarComoLeida(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/leer-todas")
    @Operation(summary = "Marcar todas las notificaciones como leídas")
    public ResponseEntity<Void> marcarTodasComoLeidas() {
        Usuario usuario = getUsuarioAutenticado();
        notificacionService.marcarTodasComoLeidas(usuario.getId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar una notificación")
    public ResponseEntity<Void> eliminarNotificacion(@PathVariable Long id) {
        Usuario usuario = getUsuarioAutenticado();
        Notificacion notificacion = notificacionService.obtenerNotificacion(id);
        if (!notificacion.getUsuarioDestinatario().getId().equals(usuario.getId())) {
            return ResponseEntity.status(403).build();
        }
        notificacionService.eliminarNotificacion(id);
        return ResponseEntity.ok().build();
    }

    private Usuario getUsuarioAutenticado() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + email));
    }
}

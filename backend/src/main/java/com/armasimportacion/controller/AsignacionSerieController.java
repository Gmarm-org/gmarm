package com.armasimportacion.controller;

import com.armasimportacion.dto.ArmaSerieDTO;
import com.armasimportacion.dto.ReservaPendienteDTO;
import com.armasimportacion.model.ArmaSerie;
import com.armasimportacion.model.ClienteArma;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.repository.UsuarioRepository;
import com.armasimportacion.service.AsignacionSerieService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller para la asignación de series de armas a clientes
 * Endpoint público
 */
@RestController
@RequestMapping("/api/asignacion-series")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class AsignacionSerieController {

    private final AsignacionSerieService asignacionSerieService;
    private final UsuarioRepository usuarioRepository;

    /**
     * Obtener todas las reservas pendientes de asignar serie
     * GET /api/asignacion-series/pendientes
     */
    @GetMapping("/pendientes")
    public ResponseEntity<List<ReservaPendienteDTO>> obtenerReservasPendientes() {
        log.info("🔍 GET /api/asignacion-series/pendientes - Obteniendo reservas pendientes");
        
        try {
            List<ReservaPendienteDTO> reservas = asignacionSerieService.obtenerReservasPendientes();
            log.info("✅ Se encontraron {} reservas pendientes", reservas.size());
            return ResponseEntity.ok(reservas);
        } catch (Exception e) {
            log.error("❌ Error obteniendo reservas pendientes", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obtener series disponibles para un arma específica
     * GET /api/asignacion-series/series-disponibles/{armaId}
     */
    @GetMapping("/series-disponibles/{armaId}")
    public ResponseEntity<List<ArmaSerieDTO>> obtenerSeriesDisponibles(
        @PathVariable Long armaId
    ) {
        log.info("🔍 GET /api/asignacion-series/series-disponibles/{} - Obteniendo series disponibles", armaId);
        
        try {
            List<ArmaSerieDTO> series = asignacionSerieService.obtenerSeriesDisponibles(armaId);
            log.info("✅ Se encontraron {} series disponibles para arma ID: {}", series.size(), armaId);
            return ResponseEntity.ok(series);
        } catch (Exception e) {
            log.error("❌ Error obteniendo series disponibles para arma ID: {}", armaId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Asignar una serie a un cliente_arma
     * POST /api/asignacion-series/asignar
     * Request body: { "clienteArmaId": 123, "numeroSerie": "XYZ12345" }
     */
    @PostMapping("/asignar")
    public ResponseEntity<?> asignarSerie(@RequestBody Map<String, Object> request) {
        Long clienteArmaId = Long.valueOf(request.get("clienteArmaId").toString());
        String numeroSerie = request.get("numeroSerie").toString();
        
        log.info("🎯 POST /api/asignacion-series/asignar - Cliente Arma: {}, Numero Serie: {}", 
            clienteArmaId, numeroSerie);
        
        try {
            // Obtener usuario actual desde SecurityContext
            String currentUsername = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

            // Si es usuario anónimo (endpoint permitAll), usar usuario admin por defecto
            Usuario usuario;
            if ("anonymousUser".equals(currentUsername) || currentUsername == null) {
                log.info("👤 Usuario anónimo detectado, usando usuario admin por defecto");
                usuario = usuarioRepository.findByEmail("admin@armasimportacion.com")
                    .orElseThrow(() -> new RuntimeException("Usuario admin no encontrado en el sistema"));
            } else {
                usuario = usuarioRepository.findByEmail(currentUsername)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + currentUsername));
            }

            log.info("👤 Usuario asignador: {} (ID: {})", usuario.getUsername(), usuario.getId());
            
            // Asignar serie
            ClienteArma clienteArmaActualizado = asignacionSerieService.asignarSerie(
                clienteArmaId, 
                numeroSerie, 
                usuario.getId()
            );
            
            // Respuesta exitosa
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Serie asignada exitosamente");
            response.put("clienteArma", clienteArmaActualizado);
            
            log.info("✅ Serie asignada exitosamente");
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.error("❌ Error de validación: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
            
        } catch (IllegalStateException e) {
            log.error("❌ Error de estado: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
            
        } catch (Exception e) {
            log.error("❌ Error asignando serie", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Error interno del servidor: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}


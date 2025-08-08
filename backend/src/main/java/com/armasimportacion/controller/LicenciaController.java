package com.armasimportacion.controller;

import com.armasimportacion.exception.BadRequestException;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.model.Licencia;
import com.armasimportacion.service.LicenciaService;
import com.armasimportacion.enums.EstadoLicencia;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/licencias")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Licencias", description = "API para gestión de licencias de importación")
public class LicenciaController {
    
    private final LicenciaService licenciaService;
    
    @PostMapping
    @Operation(summary = "Crear nueva licencia", description = "Crea una nueva licencia de importación")
    @PreAuthorize("hasRole('JEFE_VENTAS') or hasRole('ADMIN')")
    public ResponseEntity<Licencia> crearLicencia(
            @Valid @RequestBody Licencia licencia,
            @RequestParam Long usuarioId) {
        try {
            Licencia nuevaLicencia = licenciaService.crearLicencia(licencia, usuarioId);
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevaLicencia);
        } catch (BadRequestException e) {
            log.error("Error al crear licencia: {}", e.getMessage());
            throw e;
        }
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Actualizar licencia", description = "Actualiza una licencia existente")
    @PreAuthorize("hasRole('JEFE_VENTAS') or hasRole('ADMIN')")
    public ResponseEntity<Licencia> actualizarLicencia(
            @PathVariable Long id,
            @Valid @RequestBody Licencia licencia,
            @RequestParam Long usuarioId) {
        try {
            Licencia licenciaActualizada = licenciaService.actualizarLicencia(id, licencia, usuarioId);
            return ResponseEntity.ok(licenciaActualizada);
        } catch (ResourceNotFoundException e) {
            log.error("Licencia no encontrada: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Obtener licencia por ID", description = "Obtiene una licencia específica por su ID")
    public ResponseEntity<Licencia> obtenerLicencia(@PathVariable Long id) {
        try {
            Licencia licencia = licenciaService.obtenerLicencia(id);
            return ResponseEntity.ok(licencia);
        } catch (ResourceNotFoundException e) {
            log.error("Licencia no encontrada: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping
    @Operation(summary = "Listar licencias", description = "Obtiene una lista paginada de licencias")
    public ResponseEntity<Page<Licencia>> obtenerLicencias(Pageable pageable) {
        Page<Licencia> licencias = licenciaService.obtenerLicencias(pageable);
        return ResponseEntity.ok(licencias);
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar licencia", description = "Elimina una licencia por su ID")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminarLicencia(@PathVariable Long id) {
        try {
            licenciaService.eliminarLicencia(id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            log.error("Licencia no encontrada: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/activas")
    @Operation(summary = "Obtener licencias activas", description = "Obtiene todas las licencias activas")
    public ResponseEntity<List<Licencia>> obtenerLicenciasActivas() {
        List<Licencia> licencias = licenciaService.obtenerLicenciasActivas();
        return ResponseEntity.ok(licencias);
    }
    
    @GetMapping("/cupo-civil-disponible")
    @Operation(summary = "Obtener licencias con cupo civil disponible", description = "Obtiene licencias que tienen cupo civil disponible")
    public ResponseEntity<List<Licencia>> obtenerLicenciasConCupoCivilDisponible() {
        List<Licencia> licencias = licenciaService.obtenerLicenciasConCupoCivilDisponible();
        return ResponseEntity.ok(licencias);
    }
    
    @GetMapping("/{id}/tiene-cupo")
    @Operation(summary = "Verificar cupo disponible", description = "Verifica si una licencia tiene cupo disponible para un tipo de cliente")
    public ResponseEntity<Map<String, Object>> verificarCupoDisponible(
            @PathVariable Long id,
            @RequestParam String tipoCliente) {
        try {
            boolean tieneCupo = licenciaService.tieneCupoDisponible(id, tipoCliente);
            Licencia licencia = licenciaService.obtenerLicencia(id);
            Integer cupoDisponible = licencia.getCupoDisponible(tipoCliente);
            
            Map<String, Object> response = Map.of(
                "tieneCupo", tieneCupo,
                "cupoDisponible", cupoDisponible,
                "tipoCliente", tipoCliente
            );
            
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            log.error("Licencia no encontrada: {}", e.getMessage());
            throw e;
        }
    }
    
    @PostMapping("/{id}/decrementar-cupo")
    @Operation(summary = "Decrementar cupo", description = "Decrementa el cupo de una licencia para un tipo de cliente")
    @PreAuthorize("hasRole('JEFE_VENTAS') or hasRole('ADMIN')")
    public ResponseEntity<Void> decrementarCupo(
            @PathVariable Long id,
            @RequestParam String tipoCliente) {
        try {
            licenciaService.decrementarCupo(id, tipoCliente);
            return ResponseEntity.ok().build();
        } catch (ResourceNotFoundException e) {
            log.error("Licencia no encontrada: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/proximas-vencer")
    @Operation(summary = "Obtener licencias próximas a vencer", description = "Obtiene licencias que vencen en los próximos días")
    public ResponseEntity<List<Licencia>> obtenerLicenciasProximasAVencer(
            @RequestParam(defaultValue = "30") int dias) {
        List<Licencia> licencias = licenciaService.obtenerLicenciasProximasAVencer(dias);
        return ResponseEntity.ok(licencias);
    }
    
    @GetMapping("/buscar")
    @Operation(summary = "Buscar licencias", description = "Busca licencias con filtros específicos")
    public ResponseEntity<Page<Licencia>> buscarLicencias(
            @RequestParam(required = false) String numeroLicencia,
            @RequestParam(required = false) String nombre,
            @RequestParam(required = false) String tipoLicencia,
            @RequestParam(required = false) EstadoLicencia estado,
            @RequestParam(required = false) String ruc,
            Pageable pageable) {
        Page<Licencia> licencias = licenciaService.buscarLicencias(numeroLicencia, nombre, tipoLicencia, estado, ruc, pageable);
        return ResponseEntity.ok(licencias);
    }
    
    @GetMapping("/estadisticas")
    @Operation(summary = "Obtener estadísticas", description = "Obtiene estadísticas de licencias por estado")
    public ResponseEntity<List<Object[]>> obtenerEstadisticas() {
        List<Object[]> estadisticas = licenciaService.obtenerEstadisticasPorEstado();
        return ResponseEntity.ok(estadisticas);
    }
    
    @PutMapping("/{id}/estado")
    @Operation(summary = "Cambiar estado de licencia", description = "Cambia el estado de una licencia")
    @PreAuthorize("hasRole('JEFE_VENTAS') or hasRole('ADMIN')")
    public ResponseEntity<Void> cambiarEstado(
            @PathVariable Long id,
            @RequestParam EstadoLicencia nuevoEstado) {
        try {
            licenciaService.cambiarEstado(id, nuevoEstado);
            return ResponseEntity.ok().build();
        } catch (ResourceNotFoundException e) {
            log.error("Licencia no encontrada: {}", e.getMessage());
            throw e;
        }
    }
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleResourceNotFoundException(ResourceNotFoundException e) {
        Map<String, String> error = Map.of("error", e.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
    
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Map<String, String>> handleBadRequestException(BadRequestException e) {
        Map<String, String> error = Map.of("error", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGenericException(Exception e) {
        log.error("Error inesperado: ", e);
        Map<String, String> error = Map.of("error", "Error interno del servidor");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
} 
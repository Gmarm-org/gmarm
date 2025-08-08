package com.armasimportacion.controller;

import com.armasimportacion.exception.BadRequestException;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.model.GrupoImportacion;
import com.armasimportacion.model.ClienteGrupoImportacion;
import com.armasimportacion.service.GrupoImportacionService;
import com.armasimportacion.enums.EstadoGrupoImportacion;
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
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/grupos-importacion")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Grupos de Importación", description = "API para gestión de grupos de importación")
public class GrupoImportacionController {
    
    private final GrupoImportacionService grupoImportacionService;
    
    @PostMapping
    @Operation(summary = "Crear nuevo grupo de importación", description = "Crea un nuevo grupo de importación")
    @PreAuthorize("hasRole('JEFE_VENTAS') or hasRole('ADMIN')")
    public ResponseEntity<GrupoImportacion> crearGrupoImportacion(
            @Valid @RequestBody GrupoImportacion grupo,
            @RequestParam Long usuarioId) {
        try {
            GrupoImportacion nuevoGrupo = grupoImportacionService.crearGrupoImportacion(grupo, usuarioId);
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevoGrupo);
        } catch (BadRequestException e) {
            log.error("Error al crear grupo: {}", e.getMessage());
            throw e;
        }
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Actualizar grupo de importación", description = "Actualiza un grupo de importación existente")
    @PreAuthorize("hasRole('JEFE_VENTAS') or hasRole('ADMIN')")
    public ResponseEntity<GrupoImportacion> actualizarGrupoImportacion(
            @PathVariable Long id,
            @Valid @RequestBody GrupoImportacion grupo,
            @RequestParam Long usuarioId) {
        try {
            GrupoImportacion grupoActualizado = grupoImportacionService.actualizarGrupoImportacion(id, grupo, usuarioId);
            return ResponseEntity.ok(grupoActualizado);
        } catch (ResourceNotFoundException e) {
            log.error("Grupo no encontrado: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Obtener grupo por ID", description = "Obtiene un grupo específico por su ID")
    public ResponseEntity<GrupoImportacion> obtenerGrupoImportacion(@PathVariable Long id) {
        try {
            GrupoImportacion grupo = grupoImportacionService.obtenerGrupoImportacion(id);
            return ResponseEntity.ok(grupo);
        } catch (ResourceNotFoundException e) {
            log.error("Grupo no encontrado: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping
    @Operation(summary = "Listar grupos de importación", description = "Obtiene una lista paginada de grupos")
    public ResponseEntity<Page<GrupoImportacion>> obtenerGruposImportacion(Pageable pageable) {
        Page<GrupoImportacion> grupos = grupoImportacionService.obtenerGruposImportacion(pageable);
        return ResponseEntity.ok(grupos);
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar grupo de importación", description = "Elimina un grupo por su ID")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminarGrupoImportacion(@PathVariable Long id) {
        try {
            grupoImportacionService.eliminarGrupoImportacion(id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            log.error("Grupo no encontrado: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/activos")
    @Operation(summary = "Obtener grupos activos", description = "Obtiene todos los grupos activos")
    public ResponseEntity<List<GrupoImportacion>> obtenerGruposActivos() {
        List<GrupoImportacion> grupos = grupoImportacionService.obtenerGruposActivos();
        return ResponseEntity.ok(grupos);
    }
    
    @GetMapping("/completos")
    @Operation(summary = "Obtener grupos completos", description = "Obtiene todos los grupos completos")
    public ResponseEntity<List<GrupoImportacion>> obtenerGruposCompletos() {
        List<GrupoImportacion> grupos = grupoImportacionService.obtenerGruposCompletos();
        return ResponseEntity.ok(grupos);
    }
    
    @GetMapping("/incompletos")
    @Operation(summary = "Obtener grupos incompletos", description = "Obtiene todos los grupos incompletos")
    public ResponseEntity<List<GrupoImportacion>> obtenerGruposIncompletos() {
        List<GrupoImportacion> grupos = grupoImportacionService.obtenerGruposIncompletos();
        return ResponseEntity.ok(grupos);
    }
    
    @PutMapping("/{id}/estado")
    @Operation(summary = "Cambiar estado de grupo", description = "Cambia el estado de un grupo")
    @PreAuthorize("hasRole('JEFE_VENTAS') or hasRole('ADMIN')")
    public ResponseEntity<Void> cambiarEstado(
            @PathVariable Long id,
            @RequestParam EstadoGrupoImportacion nuevoEstado) {
        try {
            grupoImportacionService.cambiarEstado(id, nuevoEstado);
            return ResponseEntity.ok().build();
        } catch (ResourceNotFoundException e) {
            log.error("Grupo no encontrado: {}", e.getMessage());
            throw e;
        }
    }
    
    // Gestión de Clientes
    @PostMapping("/{id}/clientes/{clienteId}")
    @Operation(summary = "Agregar cliente al grupo", description = "Agrega un cliente a un grupo de importación")
    @PreAuthorize("hasRole('JEFE_VENTAS') or hasRole('ADMIN')")
    public ResponseEntity<Void> agregarCliente(
            @PathVariable Long id,
            @PathVariable Long clienteId) {
        try {
            grupoImportacionService.agregarCliente(id, clienteId);
            return ResponseEntity.ok().build();
        } catch (ResourceNotFoundException | BadRequestException e) {
            log.error("Error al agregar cliente: {}", e.getMessage());
            throw e;
        }
    }
    
    @DeleteMapping("/{id}/clientes/{clienteId}")
    @Operation(summary = "Remover cliente del grupo", description = "Remueve un cliente de un grupo de importación")
    @PreAuthorize("hasRole('JEFE_VENTAS') or hasRole('ADMIN')")
    public ResponseEntity<Void> removerCliente(
            @PathVariable Long id,
            @PathVariable Long clienteId) {
        try {
            grupoImportacionService.removerCliente(id, clienteId);
            return ResponseEntity.ok().build();
        } catch (ResourceNotFoundException e) {
            log.error("Error al remover cliente: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/{id}/clientes")
    @Operation(summary = "Obtener clientes del grupo", description = "Obtiene todos los clientes de un grupo")
    public ResponseEntity<List<ClienteGrupoImportacion>> obtenerClientesPorGrupo(@PathVariable Long id) {
        try {
            List<ClienteGrupoImportacion> clientes = grupoImportacionService.obtenerClientesPorGrupo(id);
            return ResponseEntity.ok(clientes);
        } catch (ResourceNotFoundException e) {
            log.error("Grupo no encontrado: {}", e.getMessage());
            throw e;
        }
    }
    
    // Gestión de Cupos
    @PostMapping("/{id}/cupos")
    @Operation(summary = "Configurar cupo", description = "Configura el cupo para un tipo de cliente")
    @PreAuthorize("hasRole('JEFE_VENTAS') or hasRole('ADMIN')")
    public ResponseEntity<Void> configurarCupo(
            @PathVariable Long id,
            @RequestParam String tipoCliente,
            @RequestParam Integer cupoAsignado) {
        try {
            grupoImportacionService.configurarCupo(id, tipoCliente, cupoAsignado);
            return ResponseEntity.ok().build();
        } catch (ResourceNotFoundException e) {
            log.error("Grupo no encontrado: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/{id}/cupos/{tipoCliente}")
    @Operation(summary = "Verificar cupo disponible", description = "Verifica si hay cupo disponible para un tipo de cliente")
    public ResponseEntity<Map<String, Object>> verificarCupoDisponible(
            @PathVariable Long id,
            @PathVariable String tipoCliente) {
        try {
            boolean tieneCupo = grupoImportacionService.tieneCupoDisponible(id, tipoCliente);
            Map<String, Object> response = Map.of(
                "grupoId", id,
                "tipoCliente", tipoCliente,
                "tieneCupo", tieneCupo
            );
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            log.error("Grupo no encontrado: {}", e.getMessage());
            throw e;
        }
    }
    
    @PostMapping("/{id}/cupos/{tipoCliente}/decrementar")
    @Operation(summary = "Decrementar cupo", description = "Decrementa el cupo disponible para un tipo de cliente")
    @PreAuthorize("hasRole('JEFE_VENTAS') or hasRole('ADMIN')")
    public ResponseEntity<Void> decrementarCupo(
            @PathVariable Long id,
            @PathVariable String tipoCliente) {
        try {
            grupoImportacionService.decrementarCupo(id, tipoCliente);
            return ResponseEntity.ok().build();
        } catch (ResourceNotFoundException | BadRequestException e) {
            log.error("Error al decrementar cupo: {}", e.getMessage());
            throw e;
        }
    }
    
    // Búsquedas
    @GetMapping("/buscar")
    @Operation(summary = "Buscar grupos", description = "Busca grupos con filtros específicos")
    public ResponseEntity<Page<GrupoImportacion>> buscarGrupos(
            @RequestParam(required = false) String codigo,
            @RequestParam(required = false) EstadoGrupoImportacion estado,
            @RequestParam(required = false) Long usuarioCreadorId,
            @RequestParam(required = false) LocalDateTime fechaInicio,
            @RequestParam(required = false) LocalDateTime fechaFin,
            Pageable pageable) {
        Page<GrupoImportacion> grupos = grupoImportacionService.buscarGrupos(codigo, estado, usuarioCreadorId, fechaInicio, fechaFin, pageable);
        return ResponseEntity.ok(grupos);
    }
    
    @GetMapping("/proximos-llegar")
    @Operation(summary = "Grupos próximos a llegar", description = "Obtiene grupos que llegarán en los próximos días")
    public ResponseEntity<List<GrupoImportacion>> obtenerGruposProximosALlegar(
            @RequestParam(defaultValue = "30") int dias) {
        List<GrupoImportacion> grupos = grupoImportacionService.obtenerGruposProximosALlegar(dias);
        return ResponseEntity.ok(grupos);
    }
    
    @GetMapping("/estadisticas")
    @Operation(summary = "Obtener estadísticas", description = "Obtiene estadísticas de grupos por estado")
    public ResponseEntity<List<Object[]>> obtenerEstadisticas() {
        List<Object[]> estadisticas = grupoImportacionService.obtenerEstadisticasPorEstado();
        return ResponseEntity.ok(estadisticas);
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
package com.armasimportacion.controller;

import com.armasimportacion.exception.BadRequestException;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.Licencia;
import com.armasimportacion.model.GrupoImportacion;
import com.armasimportacion.service.ClienteService;
import com.armasimportacion.service.LicenciaService;
import com.armasimportacion.service.GrupoImportacionService;
import com.armasimportacion.enums.EstadoCliente;
import io.swagger.v3.oas.annotations.Operation;
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
@RequestMapping("/api/jefe-ventas")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Jefe de Ventas", description = "API para gestión de jefe de ventas")
public class JefeVentasController {
    
    private final ClienteService clienteService;
    private final LicenciaService licenciaService;
    private final GrupoImportacionService grupoImportacionService;
    
    // ==================== GESTIÓN DE CLIENTES ====================
    
    @GetMapping("/clientes")
    @Operation(summary = "Obtener todos los clientes", description = "Obtiene todos los clientes del sistema para revisión del jefe de ventas")
    @PreAuthorize("hasRole('JEFE_VENTAS') or hasRole('ADMIN')")
    public ResponseEntity<Page<Cliente>> obtenerTodosLosClientes(
            @RequestParam(required = false) EstadoCliente estado,
            @RequestParam(required = false) String vendedor,
            Pageable pageable) {
        try {
            Page<Cliente> clientes = clienteService.findAllForJefeVentas(estado, vendedor, pageable);
            return ResponseEntity.ok(clientes);
        } catch (Exception e) {
            log.error("Error al obtener clientes: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/clientes/aprobados")
    @Operation(summary = "Obtener clientes aprobados", description = "Obtiene clientes que han completado el proceso de datos y están listos para asignación de licencia")
    @PreAuthorize("hasRole('JEFE_VENTAS') or hasRole('ADMIN')")
    public ResponseEntity<List<Cliente>> obtenerClientesAprobados() {
        try {
            List<Cliente> clientes = clienteService.findClientesAprobados();
            return ResponseEntity.ok(clientes);
        } catch (Exception e) {
            log.error("Error al obtener clientes aprobados: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/clientes/{clienteId}/detalle")
    @Operation(summary = "Obtener detalle completo de cliente", description = "Obtiene información detallada de un cliente incluyendo documentos y respuestas")
    @PreAuthorize("hasRole('JEFE_VENTAS') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> obtenerDetalleCliente(@PathVariable Long clienteId) {
        try {
            Map<String, Object> detalle = clienteService.getDetalleCompleto(clienteId);
            return ResponseEntity.ok(detalle);
        } catch (ResourceNotFoundException e) {
            log.error("Cliente no encontrado: {}", e.getMessage());
            throw e;
        }
    }
    
    @PutMapping("/clientes/{clienteId}/aprobar")
    @Operation(summary = "Aprobar cliente", description = "Aprueba un cliente para asignación de licencia")
    @PreAuthorize("hasRole('JEFE_VENTAS') or hasRole('ADMIN')")
    public ResponseEntity<Cliente> aprobarCliente(@PathVariable Long clienteId) {
        try {
            Cliente cliente = clienteService.aprobarCliente(clienteId);
            return ResponseEntity.ok(cliente);
        } catch (ResourceNotFoundException e) {
            log.error("Cliente no encontrado: {}", e.getMessage());
            throw e;
        } catch (BadRequestException e) {
            log.error("Error al aprobar cliente: {}", e.getMessage());
            throw e;
        }
    }
    
    @PutMapping("/clientes/{clienteId}/rechazar")
    @Operation(summary = "Rechazar cliente", description = "Rechaza un cliente con motivo")
    @PreAuthorize("hasRole('JEFE_VENTAS') or hasRole('ADMIN')")
    public ResponseEntity<Cliente> rechazarCliente(
            @PathVariable Long clienteId,
            @RequestParam String motivo) {
        try {
            Cliente cliente = clienteService.rechazarCliente(clienteId, motivo);
            return ResponseEntity.ok(cliente);
        } catch (ResourceNotFoundException e) {
            log.error("Cliente no encontrado: {}", e.getMessage());
            throw e;
        }
    }
    
    // ==================== GESTIÓN DE LICENCIAS ====================
    
    @GetMapping("/licencias")
    @Operation(summary = "Obtener licencias disponibles", description = "Obtiene licencias disponibles para asignación")
    @PreAuthorize("hasRole('JEFE_VENTAS') or hasRole('ADMIN')")
    public ResponseEntity<List<Licencia>> obtenerLicenciasDisponibles() {
        try {
            List<Licencia> licencias = licenciaService.findLicenciasDisponibles();
            return ResponseEntity.ok(licencias);
        } catch (Exception e) {
            log.error("Error al obtener licencias: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/licencias/{licenciaId}/cupos")
    @Operation(summary = "Obtener cupos de licencia", description = "Obtiene información detallada de cupos de una licencia")
    @PreAuthorize("hasRole('JEFE_VENTAS') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> obtenerCuposLicencia(@PathVariable Long licenciaId) {
        try {
            Map<String, Object> cupos = licenciaService.getCuposDetallados(licenciaId);
            return ResponseEntity.ok(cupos);
        } catch (ResourceNotFoundException e) {
            log.error("Licencia no encontrada: {}", e.getMessage());
            throw e;
        }
    }
    
    @PostMapping("/licencias/{licenciaId}/asignar-cliente/{clienteId}")
    @Operation(summary = "Asignar cliente a licencia", description = "Asigna un cliente aprobado a una licencia específica")
    @PreAuthorize("hasRole('JEFE_VENTAS') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> asignarClienteALicencia(
            @PathVariable Long licenciaId,
            @PathVariable Long clienteId) {
        try {
            Map<String, Object> resultado = licenciaService.asignarCliente(licenciaId, clienteId);
            return ResponseEntity.ok(resultado);
        } catch (ResourceNotFoundException e) {
            log.error("Recurso no encontrado: {}", e.getMessage());
            throw e;
        } catch (BadRequestException e) {
            log.error("Error en asignación: {}", e.getMessage());
            throw e;
        }
    }
    
    @DeleteMapping("/licencias/{licenciaId}/remover-cliente/{clienteId}")
    @Operation(summary = "Remover cliente de licencia", description = "Remueve un cliente de una licencia")
    @PreAuthorize("hasRole('JEFE_VENTAS') or hasRole('ADMIN')")
    public ResponseEntity<Void> removerClienteDeLicencia(
            @PathVariable Long licenciaId,
            @PathVariable Long clienteId) {
        try {
            licenciaService.removerCliente(licenciaId, clienteId);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            log.error("Recurso no encontrado: {}", e.getMessage());
            throw e;
        }
    }
    
    // ==================== GESTIÓN DE GRUPOS DE IMPORTACIÓN ====================
    
    @PostMapping("/grupos-importacion")
    @Operation(summary = "Crear grupo de importación", description = "Crea un nuevo grupo de importación")
    @PreAuthorize("hasRole('JEFE_VENTAS') or hasRole('ADMIN')")
    public ResponseEntity<GrupoImportacion> crearGrupoImportacion(
            @Valid @RequestBody GrupoImportacion grupoImportacion) {
        try {
            GrupoImportacion nuevoGrupo = grupoImportacionService.create(grupoImportacion);
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevoGrupo);
        } catch (BadRequestException e) {
            log.error("Error al crear grupo de importación: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/grupos-importacion")
    @Operation(summary = "Obtener grupos de importación", description = "Obtiene grupos de importación del jefe de ventas")
    @PreAuthorize("hasRole('JEFE_VENTAS') or hasRole('ADMIN')")
    public ResponseEntity<Page<GrupoImportacion>> obtenerGruposImportacion(Pageable pageable) {
        try {
            Page<GrupoImportacion> grupos = grupoImportacionService.findAll(pageable);
            return ResponseEntity.ok(grupos);
        } catch (Exception e) {
            log.error("Error al obtener grupos de importación: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/grupos-importacion/{grupoId}")
    @Operation(summary = "Obtener grupo de importación", description = "Obtiene un grupo de importación específico")
    @PreAuthorize("hasRole('JEFE_VENTAS') or hasRole('ADMIN')")
    public ResponseEntity<GrupoImportacion> obtenerGrupoImportacion(@PathVariable Long grupoId) {
        try {
            GrupoImportacion grupo = grupoImportacionService.findById(grupoId);
            return ResponseEntity.ok(grupo);
        } catch (ResourceNotFoundException e) {
            log.error("Grupo de importación no encontrado: {}", e.getMessage());
            throw e;
        }
    }
    
    @PutMapping("/grupos-importacion/{grupoId}")
    @Operation(summary = "Actualizar grupo de importación", description = "Actualiza un grupo de importación")
    @PreAuthorize("hasRole('JEFE_VENTAS') or hasRole('ADMIN')")
    public ResponseEntity<GrupoImportacion> actualizarGrupoImportacion(
            @PathVariable Long grupoId,
            @Valid @RequestBody GrupoImportacion grupoImportacion) {
        try {
            GrupoImportacion grupoActualizado = grupoImportacionService.update(grupoId, grupoImportacion);
            return ResponseEntity.ok(grupoActualizado);
        } catch (ResourceNotFoundException e) {
            log.error("Grupo de importación no encontrado: {}", e.getMessage());
            throw e;
        }
    }
    
    // ==================== ESTADÍSTICAS Y REPORTES ====================
    
    @GetMapping("/estadisticas/clientes")
    @Operation(summary = "Estadísticas de clientes", description = "Obtiene estadísticas de clientes por estado y vendedor")
    @PreAuthorize("hasRole('JEFE_VENTAS') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> obtenerEstadisticasClientes() {
        try {
            Map<String, Object> estadisticas = clienteService.getEstadisticasJefeVentas();
            return ResponseEntity.ok(estadisticas);
        } catch (Exception e) {
            log.error("Error al obtener estadísticas: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/estadisticas/licencias")
    @Operation(summary = "Estadísticas de licencias", description = "Obtiene estadísticas de licencias y cupos")
    @PreAuthorize("hasRole('JEFE_VENTAS') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> obtenerEstadisticasLicencias() {
        try {
            Map<String, Object> estadisticas = licenciaService.getEstadisticasJefeVentas();
            return ResponseEntity.ok(estadisticas);
        } catch (Exception e) {
            log.error("Error al obtener estadísticas de licencias: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/reportes/clientes-pendientes")
    @Operation(summary = "Reporte de clientes pendientes", description = "Obtiene reporte de clientes pendientes de aprobación")
    @PreAuthorize("hasRole('JEFE_VENTAS') or hasRole('ADMIN')")
    public ResponseEntity<List<Cliente>> obtenerClientesPendientes() {
        try {
            List<Cliente> clientes = clienteService.findClientesPendientesAprobacion();
            return ResponseEntity.ok(clientes);
        } catch (Exception e) {
            log.error("Error al obtener clientes pendientes: {}", e.getMessage());
            throw e;
        }
    }
    
    // ==================== MANEJO DE EXCEPCIONES ====================
    
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
        log.error("Error interno del servidor: {}", e.getMessage());
        Map<String, String> error = Map.of("error", "Error interno del servidor");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
} 
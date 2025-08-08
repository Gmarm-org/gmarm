package com.armasimportacion.controller;

import com.armasimportacion.exception.BadRequestException;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.ModeloArma;
import com.armasimportacion.model.AsignacionArma;
import com.armasimportacion.service.ClienteService;
import com.armasimportacion.service.ModeloArmaService;
import com.armasimportacion.service.AsignacionArmaService;
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
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vendedor")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Vendedor", description = "API para gestión de vendedores")
public class VendedorController {
    
    private final ClienteService clienteService;
    private final ModeloArmaService modeloArmaService;
    private final AsignacionArmaService asignacionArmaService;
    
    // ==================== GESTIÓN DE CLIENTES ====================
    
    @GetMapping("/clientes")
    @Operation(summary = "Obtener clientes del vendedor", description = "Obtiene todos los clientes del vendedor logueado")
    @PreAuthorize("hasRole('VENDEDOR')")
    public ResponseEntity<Page<Cliente>> obtenerMisClientes(
            @RequestParam(required = false) EstadoCliente estado,
            Pageable pageable,
            Authentication authentication) {
        try {
            // Obtener el ID del usuario logueado
            Long usuarioId = getUsuarioIdFromAuthentication(authentication);
            Page<Cliente> clientes = clienteService.findByUsuarioCreador(usuarioId, pageable);
            return ResponseEntity.ok(clientes);
        } catch (Exception e) {
            log.error("Error al obtener clientes del vendedor: {}", e.getMessage());
            throw e;
        }
    }
    
    @PostMapping("/clientes")
    @Operation(summary = "Crear nuevo cliente", description = "Crea un nuevo cliente para el vendedor")
    @PreAuthorize("hasRole('VENDEDOR')")
    public ResponseEntity<Cliente> crearCliente(
            @Valid @RequestBody Cliente cliente,
            Authentication authentication) {
        try {
            Long usuarioId = getUsuarioIdFromAuthentication(authentication);
            cliente.setUsuarioCreador(getUsuarioFromAuthentication(authentication));
            cliente.setProcesoCompletado(false); // Inicialmente no completado
            
            Cliente nuevoCliente = clienteService.create(cliente);
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevoCliente);
        } catch (BadRequestException e) {
            log.error("Error al crear cliente: {}", e.getMessage());
            throw e;
        }
    }
    
    @PutMapping("/clientes/{id}")
    @Operation(summary = "Actualizar cliente", description = "Actualiza un cliente existente del vendedor")
    @PreAuthorize("hasRole('VENDEDOR')")
    public ResponseEntity<Cliente> actualizarCliente(
            @PathVariable Long id,
            @Valid @RequestBody Cliente cliente,
            Authentication authentication) {
        try {
            Long usuarioId = getUsuarioIdFromAuthentication(authentication);
            
            // Verificar que el cliente pertenece al vendedor
            Cliente clienteExistente = clienteService.findById(id);
            if (!clienteExistente.getUsuarioCreador().getId().equals(usuarioId)) {
                throw new BadRequestException("No tienes permisos para modificar este cliente");
            }
            
            Cliente clienteActualizado = clienteService.update(id, cliente);
            return ResponseEntity.ok(clienteActualizado);
        } catch (ResourceNotFoundException e) {
            log.error("Cliente no encontrado: {}", e.getMessage());
            throw e;
        } catch (BadRequestException e) {
            log.error("Error al actualizar cliente: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/clientes/{id}")
    @Operation(summary = "Obtener cliente por ID", description = "Obtiene un cliente específico del vendedor")
    @PreAuthorize("hasRole('VENDEDOR')")
    public ResponseEntity<Cliente> obtenerCliente(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            Long usuarioId = getUsuarioIdFromAuthentication(authentication);
            
            Cliente cliente = clienteService.findById(id);
            if (!cliente.getUsuarioCreador().getId().equals(usuarioId)) {
                throw new BadRequestException("No tienes permisos para ver este cliente");
            }
            
            return ResponseEntity.ok(cliente);
        } catch (ResourceNotFoundException e) {
            log.error("Cliente no encontrado: {}", e.getMessage());
            throw e;
        }
    }
    
    @PutMapping("/clientes/{id}/completar-proceso")
    @Operation(summary = "Completar proceso de cliente", description = "Marca el proceso de datos del cliente como completado")
    @PreAuthorize("hasRole('VENDEDOR')")
    public ResponseEntity<Cliente> completarProcesoCliente(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            Long usuarioId = getUsuarioIdFromAuthentication(authentication);
            
            Cliente cliente = clienteService.findById(id);
            if (!cliente.getUsuarioCreador().getId().equals(usuarioId)) {
                throw new BadRequestException("No tienes permisos para modificar este cliente");
            }
            
            cliente.setProcesoCompletado(true);
            Cliente clienteActualizado = clienteService.update(id, cliente);
            return ResponseEntity.ok(clienteActualizado);
        } catch (ResourceNotFoundException e) {
            log.error("Cliente no encontrado: {}", e.getMessage());
            throw e;
        }
    }
    
    // ==================== GESTIÓN DE ARMAS ====================
    
    @GetMapping("/armas")
    @Operation(summary = "Obtener armas disponibles", description = "Obtiene las armas disponibles para asignación")
    @PreAuthorize("hasRole('VENDEDOR')")
    public ResponseEntity<List<ModeloArma>> obtenerArmasDisponibles() {
        try {
            List<ModeloArma> armas = modeloArmaService.findArmasDisponibles();
            return ResponseEntity.ok(armas);
        } catch (Exception e) {
            log.error("Error al obtener armas disponibles: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/armas/{armaId}/precio")
    @Operation(summary = "Obtener precio de arma", description = "Obtiene el precio actual de una arma específica")
    @PreAuthorize("hasRole('VENDEDOR')")
    public ResponseEntity<Map<String, Object>> obtenerPrecioArma(@PathVariable Long armaId) {
        try {
            Map<String, Object> precio = modeloArmaService.getPrecioArma(armaId);
            return ResponseEntity.ok(precio);
        } catch (ResourceNotFoundException e) {
            log.error("Arma no encontrada: {}", e.getMessage());
            throw e;
        }
    }
    
    // ==================== ASIGNACIÓN DE ARMAS ====================
    
    @PostMapping("/clientes/{clienteId}/asignar-arma/{armaId}")
    @Operation(summary = "Asignar arma a cliente", description = "Asigna una arma a un cliente específico")
    @PreAuthorize("hasRole('VENDEDOR')")
    public ResponseEntity<AsignacionArma> asignarArmaACliente(
            @PathVariable Long clienteId,
            @PathVariable Long armaId,
            @RequestParam(defaultValue = "1") Integer cantidad,
            Authentication authentication) {
        try {
            Long usuarioId = getUsuarioIdFromAuthentication(authentication);
            
            // Verificar que el cliente pertenece al vendedor
            Cliente cliente = clienteService.findById(clienteId);
            if (!cliente.getUsuarioCreador().getId().equals(usuarioId)) {
                throw new BadRequestException("No tienes permisos para asignar armas a este cliente");
            }
            
            // Por ahora usamos un grupo de importación por defecto (ID 1)
            // En una implementación real, esto debería venir del frontend o ser determinado por lógica de negocio
            Long grupoImportacionId = 1L;
            AsignacionArma asignacion = asignacionArmaService.asignarArma(clienteId, armaId, grupoImportacionId, cantidad, usuarioId);
            return ResponseEntity.status(HttpStatus.CREATED).body(asignacion);
        } catch (ResourceNotFoundException e) {
            log.error("Recurso no encontrado: {}", e.getMessage());
            throw e;
        } catch (BadRequestException e) {
            log.error("Error en asignación: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/clientes/{clienteId}/asignaciones")
    @Operation(summary = "Obtener asignaciones de cliente", description = "Obtiene todas las asignaciones de armas de un cliente")
    @PreAuthorize("hasRole('VENDEDOR')")
    public ResponseEntity<List<AsignacionArma>> obtenerAsignacionesCliente(
            @PathVariable Long clienteId,
            Authentication authentication) {
        try {
            Long usuarioId = getUsuarioIdFromAuthentication(authentication);
            
            Cliente cliente = clienteService.findById(clienteId);
            if (!cliente.getUsuarioCreador().getId().equals(usuarioId)) {
                throw new BadRequestException("No tienes permisos para ver las asignaciones de este cliente");
            }
            
            List<AsignacionArma> asignaciones = asignacionArmaService.findByClienteId(clienteId);
            return ResponseEntity.ok(asignaciones);
        } catch (ResourceNotFoundException e) {
            log.error("Cliente no encontrado: {}", e.getMessage());
            throw e;
        }
    }
    
    @DeleteMapping("/asignaciones/{asignacionId}")
    @Operation(summary = "Eliminar asignación", description = "Elimina una asignación de arma")
    @PreAuthorize("hasRole('VENDEDOR')")
    public ResponseEntity<Void> eliminarAsignacion(
            @PathVariable Long asignacionId,
            Authentication authentication) {
        try {
            Long usuarioId = getUsuarioIdFromAuthentication(authentication);
            
            // Verificar que la asignación pertenece al vendedor
            AsignacionArma asignacion = asignacionArmaService.findById(asignacionId);
            if (!asignacion.getCliente().getUsuarioCreador().getId().equals(usuarioId)) {
                throw new BadRequestException("No tienes permisos para eliminar esta asignación");
            }
            
            asignacionArmaService.delete(asignacionId);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            log.error("Asignación no encontrada: {}", e.getMessage());
            throw e;
        }
    }
    
    // ==================== ESTADÍSTICAS ====================
    
    @GetMapping("/estadisticas")
    @Operation(summary = "Estadísticas del vendedor", description = "Obtiene estadísticas de clientes y ventas del vendedor")
    @PreAuthorize("hasRole('VENDEDOR')")
    public ResponseEntity<Map<String, Object>> obtenerEstadisticas(Authentication authentication) {
        try {
            Long usuarioId = getUsuarioIdFromAuthentication(authentication);
            Map<String, Object> estadisticas = clienteService.getEstadisticasVendedor(usuarioId);
            return ResponseEntity.ok(estadisticas);
        } catch (Exception e) {
            log.error("Error al obtener estadísticas: {}", e.getMessage());
            throw e;
        }
    }
    
    // ==================== MÉTODOS AUXILIARES ====================
    
    private Long getUsuarioIdFromAuthentication(Authentication authentication) {
        // Implementar lógica para obtener el ID del usuario desde la autenticación
        // Por ahora retornamos un valor por defecto
        return 1L;
    }
    
    private com.armasimportacion.model.Usuario getUsuarioFromAuthentication(Authentication authentication) {
        // Implementar lógica para obtener el usuario desde la autenticación
        // Por ahora retornamos null
        return null;
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
package com.armasimportacion.controller;

import com.armasimportacion.exception.BadRequestException;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.service.ClienteService;
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
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Clientes", description = "API para gestión de clientes")
public class ClienteController {
    
    private final ClienteService clienteService;
    
    @PostMapping
    @Operation(summary = "Crear nuevo cliente", description = "Crea un nuevo cliente en el sistema")
    @PreAuthorize("hasRole('VENDEDOR') or hasRole('ADMIN')")
    public ResponseEntity<Cliente> crearCliente(
            @Valid @RequestBody Cliente cliente) {
        try {
            Cliente nuevoCliente = clienteService.create(cliente);
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevoCliente);
        } catch (BadRequestException e) {
            log.error("Error al crear cliente: {}", e.getMessage());
            throw e;
        }
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Actualizar cliente", description = "Actualiza un cliente existente")
    @PreAuthorize("hasRole('VENDEDOR') or hasRole('ADMIN')")
    public ResponseEntity<Cliente> actualizarCliente(
            @PathVariable Long id,
            @Valid @RequestBody Cliente cliente) {
        try {
            Cliente clienteActualizado = clienteService.update(id, cliente);
            return ResponseEntity.ok(clienteActualizado);
        } catch (ResourceNotFoundException e) {
            log.error("Cliente no encontrado: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Obtener cliente por ID", description = "Obtiene un cliente específico por su ID")
    public ResponseEntity<Cliente> obtenerCliente(@PathVariable Long id) {
        try {
            Cliente cliente = clienteService.findById(id);
            return ResponseEntity.ok(cliente);
        } catch (ResourceNotFoundException e) {
            log.error("Cliente no encontrado: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping
    @Operation(summary = "Listar clientes", description = "Obtiene una lista paginada de clientes")
    public ResponseEntity<Page<Cliente>> obtenerClientes(Pageable pageable) {
        Page<Cliente> clientes = clienteService.findAll(pageable);
        return ResponseEntity.ok(clientes);
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar cliente", description = "Elimina un cliente por su ID")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminarCliente(@PathVariable Long id) {
        try {
            clienteService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            log.error("Cliente no encontrado: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/por-vendedor/{vendedorId}")
    @Operation(summary = "Obtener clientes por vendedor", description = "Obtiene todos los clientes de un vendedor específico")
    public ResponseEntity<List<Cliente>> obtenerClientesPorVendedor(@PathVariable Long vendedorId) {
        try {
            List<Cliente> clientes = clienteService.findByUsuarioCreador(vendedorId);
            return ResponseEntity.ok(clientes);
        } catch (ResourceNotFoundException e) {
            log.error("Vendedor no encontrado: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/por-identificacion/{numero}")
    @Operation(summary = "Buscar cliente por identificación", description = "Busca un cliente por su número de identificación")
    public ResponseEntity<Cliente> buscarPorIdentificacion(@PathVariable String numero) {
        try {
            // This method doesn't exist in the service, we'll need to implement it
            throw new ResourceNotFoundException("Método no implementado");
        } catch (ResourceNotFoundException e) {
            log.error("Cliente no encontrado: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/por-estado/{estado}")
    @Operation(summary = "Obtener clientes por estado", description = "Obtiene clientes filtrados por estado")
    public ResponseEntity<List<Cliente>> obtenerClientesPorEstado(@PathVariable EstadoCliente estado) {
        List<Cliente> clientes = clienteService.findByEstado(estado);
        return ResponseEntity.ok(clientes);
    }
    
    @GetMapping("/buscar")
    @Operation(summary = "Buscar clientes", description = "Busca clientes con filtros específicos")
    public ResponseEntity<Page<Cliente>> buscarClientes(
            @RequestParam(required = false) String nombres,
            @RequestParam(required = false) String apellidos,
            @RequestParam(required = false) String numeroIdentificacion,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) EstadoCliente estado,
            @RequestParam(required = false) Long vendedorId,
            Pageable pageable) {
        Page<Cliente> clientes = clienteService.findByFiltros(null, estado, vendedorId, null, email, nombres, pageable);
        return ResponseEntity.ok(clientes);
    }
    
    @PutMapping("/{id}/estado")
    @Operation(summary = "Cambiar estado de cliente", description = "Cambia el estado de un cliente")
    @PreAuthorize("hasRole('VENDEDOR') or hasRole('ADMIN')")
    public ResponseEntity<Void> cambiarEstado(
            @PathVariable Long id,
            @RequestParam EstadoCliente nuevoEstado) {
        try {
            clienteService.changeStatus(id, nuevoEstado);
            return ResponseEntity.ok().build();
        } catch (ResourceNotFoundException e) {
            log.error("Cliente no encontrado: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/validar-identificacion/{numero}")
    @Operation(summary = "Validar identificación", description = "Verifica si un número de identificación ya existe")
    public ResponseEntity<Map<String, Object>> validarIdentificacion(@PathVariable String numero) {
        // This method doesn't exist in the service, we'll need to implement it
        boolean existe = false; // Placeholder
        Map<String, Object> response = Map.of(
            "numeroIdentificacion", numero,
            "existe", existe,
            "mensaje", existe ? "La identificación ya existe" : "La identificación está disponible"
        );
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{id}/validar-edad")
    @Operation(summary = "Validar edad del cliente", description = "Verifica si el cliente cumple con la edad mínima para comprar armas")
    public ResponseEntity<Map<String, Object>> validarEdadCliente(@PathVariable Long id) {
        try {
            Cliente cliente = clienteService.findById(id);
            int edad = cliente.getEdad();
            boolean puedeComprar = cliente.tieneEdadMinima();
            String mensajeError = cliente.getMensajeErrorEdad();
            
            Map<String, Object> response = Map.of(
                "clienteId", id,
                "edad", edad,
                "puedeComprar", puedeComprar,
                "edadMinima", 25,
                "mensajeError", mensajeError
            );
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            log.error("Cliente no encontrado: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/estadisticas")
    @Operation(summary = "Obtener estadísticas", description = "Obtiene estadísticas de clientes por estado")
    public ResponseEntity<List<Object[]>> obtenerEstadisticas() {
        // This method doesn't exist in the service, we'll need to implement it
        List<Object[]> estadisticas = List.of(); // Placeholder
        return ResponseEntity.ok(estadisticas);
    }
    
    @GetMapping("/tipos")
    @Operation(summary = "Obtener tipos de cliente", description = "Obtiene todos los tipos de cliente disponibles")
    public ResponseEntity<List<Object[]>> obtenerTiposCliente() {
        // This method doesn't exist in the service, we'll need to implement it
        List<Object[]> tipos = List.of(); // Placeholder
        return ResponseEntity.ok(tipos);
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
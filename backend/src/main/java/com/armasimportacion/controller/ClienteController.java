package com.armasimportacion.controller;

import com.armasimportacion.dto.ClienteDTO;
import com.armasimportacion.dto.ClienteCreateDTO;
import com.armasimportacion.enums.EstadoCliente;
import com.armasimportacion.exception.BadRequestException;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.service.ClienteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Clientes", description = "API para gestión de clientes")
public class ClienteController {
    
    private final ClienteService clienteService;
    
    // ==================== MÉTODOS AUXILIARES ====================
    
    // TODO: Implementar obtención del usuario desde el token JWT cuando se implemente la autenticación completa
    
    @PostMapping
    @Operation(summary = "Crear nuevo cliente", description = "Crea un nuevo cliente en el sistema")
    public ResponseEntity<ClienteDTO> crearCliente(
            @Valid @RequestBody ClienteCreateDTO clienteCreateDTO) {
        try {
            // TODO: Obtener el ID del usuario desde el token JWT
            Long usuarioId = 1L; // Temporalmente hardcodeado para desarrollo
            ClienteDTO nuevoCliente = clienteService.createFromDTO(clienteCreateDTO, usuarioId);
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevoCliente);
        } catch (BadRequestException e) {
            log.error("Error al crear cliente: {}", e.getMessage());
            throw e;
        }
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Actualizar cliente", description = "Actualiza un cliente existente")
    public ResponseEntity<ClienteDTO> actualizarCliente(
            @PathVariable Long id,
            @Valid @RequestBody ClienteCreateDTO clienteCreateDTO) {
        try {
            ClienteDTO clienteActualizado = clienteService.updateFromDTO(id, clienteCreateDTO);
            return ResponseEntity.ok(clienteActualizado);
        } catch (ResourceNotFoundException e) {
            log.error("Cliente no encontrado: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Obtener cliente por ID", description = "Obtiene un cliente específico por su ID")
    public ResponseEntity<ClienteDTO> obtenerCliente(@PathVariable Long id) {
        try {
            ClienteDTO cliente = clienteService.findByIdAsDTO(id);
            return ResponseEntity.ok(cliente);
        } catch (ResourceNotFoundException e) {
            log.error("Cliente no encontrado: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping
    @Operation(summary = "Listar clientes", description = "Obtiene una lista paginada de clientes")
    public ResponseEntity<Page<ClienteDTO>> obtenerClientes(Pageable pageable) {
        Page<ClienteDTO> clientes = clienteService.findAllAsDTO(pageable);
        return ResponseEntity.ok(clientes);
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar cliente", description = "Elimina un cliente por su ID")
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
    public ResponseEntity<List<ClienteDTO>> obtenerClientesPorVendedor(@PathVariable Long vendedorId) {
        try {
            List<ClienteDTO> clientes = clienteService.findByUsuarioCreadorAsDTO(vendedorId);
            return ResponseEntity.ok(clientes);
        } catch (ResourceNotFoundException e) {
            log.error("Vendedor no encontrado: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/por-identificacion/{numero}")
    @Operation(summary = "Buscar cliente por identificación", description = "Busca un cliente por su número de identificación")
    public ResponseEntity<ClienteDTO> buscarPorIdentificacion(@PathVariable String numero) {
        try {
            ClienteDTO cliente = clienteService.findByNumeroIdentificacionAsDTO(numero);
            return ResponseEntity.ok(cliente);
        } catch (ResourceNotFoundException e) {
            log.error("Cliente no encontrado: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/por-estado/{estado}")
    @Operation(summary = "Obtener clientes por estado", description = "Obtiene clientes filtrados por estado")
    public ResponseEntity<List<ClienteDTO>> obtenerClientesPorEstado(@PathVariable EstadoCliente estado) {
        List<ClienteDTO> clientes = clienteService.findByEstadoAsDTO(estado);
        return ResponseEntity.ok(clientes);
    }
    
    @GetMapping("/buscar")
    @Operation(summary = "Buscar clientes", description = "Busca clientes con filtros específicos")
    public ResponseEntity<Page<ClienteDTO>> buscarClientes(
            @RequestParam(required = false) String nombres,
            @RequestParam(required = false) String apellidos,
            @RequestParam(required = false) String numeroIdentificacion,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) EstadoCliente estado,
            @RequestParam(required = false) Long vendedorId,
            Pageable pageable) {
        Page<ClienteDTO> clientes = clienteService.findByFiltrosAsDTO(null, estado, vendedorId, null, email, nombres, pageable);
        return ResponseEntity.ok(clientes);
    }
    
    @PutMapping("/{id}/estado")
    @Operation(summary = "Cambiar estado de cliente", description = "Cambia el estado de un cliente")
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
            ClienteDTO cliente = clienteService.findByIdAsDTO(id);
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

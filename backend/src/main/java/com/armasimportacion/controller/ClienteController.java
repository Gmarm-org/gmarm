package com.armasimportacion.controller;

import com.armasimportacion.dto.ClienteDTO;
import com.armasimportacion.exception.BadRequestException;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.security.JwtTokenProvider;
import com.armasimportacion.service.ClienteService;
import com.armasimportacion.service.ClienteCompletoService;
import com.armasimportacion.service.UsuarioService;
import org.springframework.dao.DataIntegrityViolationException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
    private final ClienteCompletoService clienteCompletoService;
    private final UsuarioService usuarioService;
    private final JwtTokenProvider jwtTokenProvider;
    
    // ==================== MÉTODOS AUXILIARES ====================
    
    // TODO: Implementar obtención del usuario desde el token JWT cuando se implemente la autenticación completa
    
    @PostMapping
    @Operation(summary = "Crear nuevo cliente", description = "Crea un nuevo cliente en el sistema")
    public ResponseEntity<?> crearCliente(
            @RequestBody Map<String, Object> requestData,
            @RequestHeader("Authorization") String authHeader) {
        try {
            log.info("🔄 ClienteController: Recibiendo solicitud completa: {}", requestData);
            log.info("🔍 ClienteController: requestData keys: {}", requestData.keySet());
            log.info("🔍 ClienteController: cliente data: {}", requestData.get("cliente"));
            
            // Obtener usuario actual desde JWT
            Long usuarioId = null;
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.error("❌ Token JWT requerido para crear clientes");
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Token JWT requerido"));
            }
            
            try {
                String token = authHeader.substring(7);
                String email = jwtTokenProvider.getUsernameFromToken(token);
                if (email == null) {
                    log.error("❌ Token JWT inválido");
                    return ResponseEntity.badRequest()
                        .body(Map.of("error", "Token JWT inválido"));
                }
                
                Usuario usuario = usuarioService.findByEmail(email);
                usuarioId = usuario.getId();
                log.info("✅ Usuario actual obtenido desde JWT: ID={}, Email={}, Nombre={}", 
                    usuarioId, email, usuario.getNombreCompleto());
            } catch (Exception e) {
                log.error("❌ Error obteniendo usuario desde JWT: {}", e.getMessage());
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Error procesando token JWT: " + e.getMessage()));
            }
            
            // Usar el nuevo ClienteCompletoService para el flujo completo
            // El frontend siempre envía: cliente, pago, arma, respuestas, cuotas, documento
            log.info("🔄 ClienteController: Usando ClienteCompletoService para flujo completo con usuarioId={}", usuarioId);
            Map<String, Object> response = clienteCompletoService.crearClienteCompleto(requestData, usuarioId);
            log.info("✅ ClienteController: Respuesta del ClienteCompletoService: {}", response);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (BadRequestException e) {
            log.error("Error al crear cliente: {}", e.getMessage());
            throw e;
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            log.error("Error de integridad de datos al crear cliente: {}", e.getMessage());
            // Si es un error de clave duplicada, convertirlo en BadRequestException
            String mensaje = e.getMessage();
            if (mensaje != null && mensaje.contains("duplicate key")) {
                if (mensaje.contains("numero_identificacion")) {
                    throw new BadRequestException("Ya existe un cliente con este número de identificación. Por favor, verifique los datos o use la opción de editar cliente existente.");
                } else if (mensaje.contains("email")) {
                    throw new BadRequestException("Ya existe un cliente con este email. Por favor, verifique los datos.");
                } else {
                    throw new BadRequestException("Error de datos duplicados: " + mensaje);
                }
            }
            throw new BadRequestException("Error al crear cliente: " + e.getMessage());
        } catch (Exception e) {
            log.error("Error inesperado al crear cliente: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al procesar solicitud: " + e.getMessage()));
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
    @Operation(summary = "Listar clientes", description = "Obtiene una lista paginada de clientes filtrada por rol del usuario")
    public ResponseEntity<Page<ClienteDTO>> obtenerClientes(
            Pageable pageable,
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader(value = "X-Active-Role", required = false) String activeRole) {
        
        try {
            // Extraer token JWT
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.error("Token JWT requerido para obtener clientes");
                return ResponseEntity.badRequest().build();
            }
            
            String token = authHeader.substring(7);
            String email = jwtTokenProvider.getUsernameFromToken(token);
            
            if (email == null) {
                log.error("Token JWT inválido");
                return ResponseEntity.badRequest().build();
            }
            
            // Obtener usuario y verificar roles
            Usuario usuario = usuarioService.findByEmail(email);
            
            // Usar el rol activo si se proporciona, sino verificar todos los roles
            boolean esJefeVentas = false;
            if (activeRole != null && !activeRole.isEmpty()) {
                log.info("🔍 Usuario {} usando rol activo: {}", email, activeRole);
                esJefeVentas = "SALES_CHIEF".equals(activeRole);
            } else {
                log.info("🔍 Usuario {} sin rol activo, verificando todos los roles", email);
                esJefeVentas = usuario.getRoles().stream()
                    .anyMatch(rol -> "SALES_CHIEF".equals(rol.getCodigo()));
            }
            
            Page<ClienteDTO> clientes;
            if (esJefeVentas) {
                // Jefe de Ventas: ver todos los clientes
                log.info("🔍 Usuario {} es Jefe de Ventas - mostrando todos los clientes", email);
                clientes = clienteService.findAllAsDTO(pageable);
            } else {
                // Vendedor: solo sus clientes
                log.info("🔍 Usuario {} es Vendedor - mostrando solo sus clientes (ID: {})", email, usuario.getId());
                clientes = clienteService.findByUsuarioCreadorAsDTO(usuario.getId(), pageable);
            }
            
            return ResponseEntity.ok(clientes);
            
        } catch (Exception e) {
            log.error("Error al obtener clientes: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
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
    
    @GetMapping("/validar-identificacion/{numero}")
    @Operation(summary = "Validar identificación", description = "Verifica si un número de identificación ya existe")
    public ResponseEntity<Map<String, Object>> validarIdentificacion(@PathVariable String numero) {
        try {
            boolean existe = clienteService.existsByNumeroIdentificacion(numero);
            Map<String, Object> response = Map.of(
                "numeroIdentificacion", numero,
                "existe", existe,
                "mensaje", existe ? "La identificación ya existe" : "La identificación está disponible"
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al validar identificación: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al validar identificación: " + e.getMessage()));
        }
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Actualizar cliente completo", description = "Actualiza un cliente completo con todos sus datos relacionados")
    public ResponseEntity<?> actualizarClienteCompleto(@PathVariable Long id, @RequestBody Map<String, Object> requestData) {
        try {
            log.info("🔄 ClienteController: Actualizando cliente completo ID: {}", id);
            log.info("🔍 ClienteController: requestData keys: {}", requestData.keySet());
            
            // Usar ClienteCompletoService para actualización completa
            Map<String, Object> response = clienteCompletoService.actualizarClienteCompleto(id, requestData);
            return ResponseEntity.ok(response);
            
        } catch (ResourceNotFoundException e) {
            log.error("Cliente no encontrado: {}", e.getMessage());
            throw e;
        } catch (BadRequestException e) {
            log.error("Error en la solicitud: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error inesperado al actualizar cliente: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al procesar actualización: " + e.getMessage()));
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

    /**
     * Obtener todos los clientes del sistema (para jefe de ventas)
     */
    @GetMapping("/todos")
    @Operation(summary = "Obtener todos los clientes", description = "Obtiene todos los clientes con información del vendedor")
    public ResponseEntity<List<ClienteDTO>> obtenerTodosClientes() {
        log.info("GET /api/clientes/todos - Obteniendo todos los clientes");
        
        List<ClienteDTO> clientes = clienteService.findAllAsDTO();
        return ResponseEntity.ok(clientes);
    }

} 

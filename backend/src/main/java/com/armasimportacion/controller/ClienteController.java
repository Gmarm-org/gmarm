package com.armasimportacion.controller;

import com.armasimportacion.dto.ClienteDTO;
import com.armasimportacion.exception.BadRequestException;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.enums.EstadoCliente;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.ClienteGrupoImportacion;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.repository.ClienteRepository;
import com.armasimportacion.security.JwtTokenProvider;
import com.armasimportacion.service.ClienteService;
import com.armasimportacion.service.ClienteQueryService;
import com.armasimportacion.service.ClienteCompletoService;
import com.armasimportacion.service.GrupoImportacionClienteService;
import com.armasimportacion.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Clientes", description = "API para gestión de clientes")
public class ClienteController {
    
    private final ClienteService clienteService;
    private final ClienteQueryService clienteQueryService;
    private final ClienteCompletoService clienteCompletoService;
    private final UsuarioService usuarioService;
    private final JwtTokenProvider jwtTokenProvider;
    private final ClienteRepository clienteRepository;
    private final GrupoImportacionClienteService grupoImportacionClienteService;

    // ==================== MÉTODOS AUXILIARES ====================
    
    // TODO: Implementar obtención del usuario desde el token JWT cuando se implemente la autenticación completa
    
    @PostMapping
    @Operation(summary = "Crear nuevo cliente", description = "Crea un nuevo cliente en el sistema")
    public ResponseEntity<?> crearCliente(
            @RequestBody Map<String, Object> requestData,
            @RequestHeader("Authorization") String authHeader) {
        log.info("ClienteController: Recibiendo solicitud completa, keys: {}", requestData.keySet());

        // Obtener usuario actual desde JWT
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new BadRequestException("Token JWT requerido");
        }

        String token = authHeader.substring(7);
        String email = jwtTokenProvider.getUsernameFromToken(token);
        if (email == null) {
            throw new BadRequestException("Token JWT inválido");
        }

        Usuario usuario = usuarioService.findByEmail(email);
        Long usuarioId = usuario.getId();
        log.info("Usuario actual obtenido desde JWT: ID={}, Email={}, Nombre={}",
            usuarioId, email, usuario.getNombreCompleto());

        // Usar el nuevo ClienteCompletoService para el flujo completo
        // El frontend siempre envía: cliente, pago, arma, respuestas, cuotas, documento
        log.info("ClienteController: Usando ClienteCompletoService para flujo completo con usuarioId={}", usuarioId);
        Map<String, Object> response = clienteCompletoService.crearClienteCompleto(requestData, usuarioId);
        log.info("ClienteController: Respuesta del ClienteCompletoService: {}", response);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    
    @GetMapping("/{id}")
    @Operation(summary = "Obtener cliente por ID", description = "Obtiene un cliente específico por su ID")
    public ResponseEntity<ClienteDTO> obtenerCliente(@PathVariable Long id) {
        ClienteDTO cliente = clienteQueryService.findByIdAsDTO(id);
        return ResponseEntity.ok(cliente);
    }

    @GetMapping
    @Operation(summary = "Listar clientes", description = "Obtiene una lista paginada de clientes filtrada por rol del usuario")
    public ResponseEntity<Page<ClienteDTO>> obtenerClientes(
            Pageable pageable,
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader(value = "X-Active-Role", required = false) String activeRole) {

        // Extraer token JWT
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new BadRequestException("Token JWT requerido para obtener clientes");
        }

        String token = authHeader.substring(7);
        String email = jwtTokenProvider.getUsernameFromToken(token);

        if (email == null) {
            throw new BadRequestException("Token JWT inválido");
        }

        // Obtener usuario y verificar roles
        Usuario usuario = usuarioService.findByEmail(email);

        // Usar el rol activo si se proporciona, sino verificar todos los roles
        boolean esJefeVentas = false;
        if (activeRole != null && !activeRole.isEmpty()) {
            log.info("Usuario {} usando rol activo: {}", email, activeRole);
            esJefeVentas = "SALES_CHIEF".equals(activeRole);
        } else {
            log.info("Usuario {} sin rol activo, verificando todos los roles", email);
            esJefeVentas = usuario.getRoles().stream()
                .anyMatch(rol -> "SALES_CHIEF".equals(rol.getCodigo()));
        }

        Page<ClienteDTO> clientes;
        if (esJefeVentas) {
            // Jefe de Ventas: ver todos los clientes
            log.info("Usuario {} es Jefe de Ventas - mostrando todos los clientes", email);
            clientes = clienteQueryService.findAllAsDTO(pageable);
        } else {
            // Vendedor: solo sus clientes
            log.info("Usuario {} es Vendedor - mostrando solo sus clientes (ID: {})", email, usuario.getId());
            clientes = clienteQueryService.findByUsuarioCreadorAsDTO(usuario.getId(), pageable);
        }

        return ResponseEntity.ok(clientes);
    }
    
    
    @GetMapping("/por-vendedor/{vendedorId}")
    @Operation(summary = "Obtener clientes por vendedor", description = "Obtiene todos los clientes de un vendedor específico")
    public ResponseEntity<List<ClienteDTO>> obtenerClientesPorVendedor(@PathVariable Long vendedorId) {
        List<ClienteDTO> clientes = clienteQueryService.findByUsuarioCreadorAsDTO(vendedorId);
        return ResponseEntity.ok(clientes);
    }
    
    @GetMapping("/por-identificacion/{numero}")
    @Operation(summary = "Buscar cliente por identificación", description = "Busca un cliente por su número de identificación")
    public ResponseEntity<ClienteDTO> buscarPorIdentificacion(@PathVariable String numero) {
        ClienteDTO cliente = clienteQueryService.findByNumeroIdentificacionAsDTO(numero);
        return ResponseEntity.ok(cliente);
    }
    
    @GetMapping("/validar-identificacion/{numero}")
    @Operation(summary = "Validar identificación", description = "Verifica si un número de identificación ya existe")
    public ResponseEntity<Map<String, Object>> validarIdentificacion(@PathVariable String numero) {
        boolean existe = clienteQueryService.existsByNumeroIdentificacion(numero);
        Map<String, Object> response = new HashMap<>();
        response.put("numeroIdentificacion", numero);
        response.put("existe", existe);

        if (existe) {
            // Obtener información del cliente existente
            Optional<Cliente> clienteOpt = clienteRepository.findByNumeroIdentificacion(numero);
            if (clienteOpt.isPresent()) {
                Cliente cliente = clienteOpt.get();
                response.put("mensaje", "El número de cédula/RUC " + numero + " ya está registrado a nombre de " + cliente.getNombres() + " " + cliente.getApellidos() + ". No es posible crear un nuevo cliente con este número.");
                response.put("clienteId", cliente.getId());
                response.put("clienteNombre", cliente.getNombres() + " " + cliente.getApellidos());
            } else {
                response.put("mensaje", "El número de cédula/RUC " + numero + " ya está registrado en el sistema.");
            }
        } else {
            response.put("mensaje", "El número de identificación está disponible");
        }

        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Actualizar cliente completo", description = "Actualiza un cliente completo con todos sus datos relacionados")
    public ResponseEntity<?> actualizarClienteCompleto(
            @PathVariable Long id,
            @RequestBody Map<String, Object> requestData,
            @RequestHeader("Authorization") String authHeader) {
        log.info("ClienteController: Actualizando cliente completo ID: {}", id);
        log.info("ClienteController: requestData keys: {}", requestData.keySet());

        // Obtener usuario actual desde JWT
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new BadRequestException("Token JWT requerido");
        }

        String token = authHeader.substring(7);
        String email = jwtTokenProvider.getUsernameFromToken(token);
        if (email == null) {
            throw new BadRequestException("Token JWT inválido");
        }

        Usuario usuario = usuarioService.findByEmail(email);
        Long usuarioId = usuario.getId();
        log.info("Usuario actual obtenido desde JWT: ID={}, Email={}", usuarioId, email);

        // Validar permisos: si es vendedor y el cliente ya confirmó sus datos, no puede editar
        Cliente cliente = clienteRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + id));

        boolean esVendedor = usuario.getRoles().stream()
            .anyMatch(rol -> "VENDOR".equals(rol.getCodigo()) || "VENDEDOR".equals(rol.getCodigo()));

        boolean esJefeVentas = usuario.getRoles().stream()
            .anyMatch(rol -> "SALES_CHIEF".equals(rol.getCodigo()) || "JEFE_VENTAS".equals(rol.getCodigo()));

        boolean esAdmin = usuario.getRoles().stream()
            .anyMatch(rol -> "ADMIN".equals(rol.getCodigo()));

        // Si es vendedor (no jefe ni admin) y el cliente ya confirmó datos, rechazar edición
        if (esVendedor && !esJefeVentas && !esAdmin) {
            Boolean emailVerificado = cliente.getEmailVerificado();
            if (Boolean.TRUE.equals(emailVerificado)) {
                log.warn("Vendedor {} intento editar cliente {} que ya confirmo sus datos",
                    usuarioId, id);
                throw new BadRequestException(
                    "No puede editar este cliente: El cliente ya confirmó sus datos. " +
                    "Solo el Jefe de Ventas puede editar clientes que confirmaron sus datos.");
            }
        }

        // Usar ClienteCompletoService para actualización completa
        Map<String, Object> response = clienteCompletoService.actualizarClienteCompleto(id, requestData);
        return ResponseEntity.ok(response);
    }
    
    @PatchMapping("/{id}")
    @Operation(summary = "Actualizar cliente parcial", description = "Actualiza solo los campos modificados del cliente (más eficiente que PUT)")
    public ResponseEntity<?> actualizarClienteParcial(
            @PathVariable Long id,
            @RequestBody Map<String, Object> requestData,
            @RequestHeader("Authorization") String authHeader) {
        log.info("ClienteController: Actualizando cliente parcial ID: {}", id);
        log.info("ClienteController: Campos recibidos: {}", requestData.keySet());

        // Obtener usuario actual desde JWT
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new BadRequestException("Token JWT requerido");
        }

        String token = authHeader.substring(7);
        String email = jwtTokenProvider.getUsernameFromToken(token);
        if (email == null) {
            throw new BadRequestException("Token JWT inválido");
        }

        Usuario usuario = usuarioService.findByEmail(email);
        Long usuarioId = usuario.getId();
        log.info("Usuario actual obtenido desde JWT: ID={}, Email={}", usuarioId, email);

        // Validar permisos: si es vendedor y el cliente ya confirmó sus datos, no puede editar
        Cliente cliente = clienteRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + id));

        boolean esVendedor = usuario.getRoles().stream()
            .anyMatch(rol -> "VENDOR".equals(rol.getCodigo()) || "VENDEDOR".equals(rol.getCodigo()));

        boolean esJefeVentas = usuario.getRoles().stream()
            .anyMatch(rol -> "SALES_CHIEF".equals(rol.getCodigo()) || "JEFE_VENTAS".equals(rol.getCodigo()));

        boolean esAdmin = usuario.getRoles().stream()
            .anyMatch(rol -> "ADMIN".equals(rol.getCodigo()));

        // Si es vendedor (no jefe ni admin) y el cliente ya confirmó datos, rechazar edición
        if (esVendedor && !esJefeVentas && !esAdmin) {
            Boolean emailVerificado = cliente.getEmailVerificado();
            if (Boolean.TRUE.equals(emailVerificado)) {
                log.warn("Vendedor {} intento editar cliente {} que ya confirmo sus datos",
                    usuarioId, id);
                throw new BadRequestException(
                    "No puede editar este cliente: El cliente ya confirmó sus datos. " +
                    "Solo el Jefe de Ventas puede editar clientes que confirmaron sus datos.");
            }
        }

        // Usar ClienteCompletoService para actualización parcial optimizada
        Map<String, Object> response = clienteCompletoService.actualizarClienteParcial(id, requestData);
        return ResponseEntity.ok(response);
    }
    
    @PatchMapping("/{id}/validar-datos")
    @Operation(summary = "Validar datos personales del cliente", description = "Marca los datos del cliente como validados manualmente por el vendedor y asigna a grupo disponible")
    public ResponseEntity<?> validarDatosPersonales(@PathVariable Long id) {
        log.info("ClienteController: Validando datos personales del cliente ID: {}", id);

        Cliente cliente = clienteService.findById(id);
        cliente.setEmailVerificado(true);
        clienteRepository.save(cliente);

        log.info("Datos personales validados para cliente ID: {}", id);

        // Intentar asignar cliente a un grupo disponible (provisional - PENDIENTE)
        // Solo si el cliente tiene un vendedor creador
        if (cliente.getUsuarioCreador() != null) {
            Long vendedorId = cliente.getUsuarioCreador().getId();
            log.info("Intentando asignar cliente ID {} a grupo disponible del vendedor ID: {}", id, vendedorId);

            try {
                ClienteGrupoImportacion asignacion =
                    grupoImportacionClienteService.asignarClienteAGrupoDisponible(cliente, vendedorId);

                if (asignacion != null) {
                    log.info("Cliente ID {} asignado provisionalmente al grupo ID: {} (estado: PENDIENTE)",
                        id, asignacion.getGrupoImportacion().getId());
                } else {
                    log.info("No hay grupo disponible para asignar cliente ID: {}", id);
                }
            } catch (Exception e) {
                log.warn("No se pudo asignar cliente a grupo (puede no haber grupos disponibles): {}", e.getMessage());
                // No fallar la validación si no hay grupos disponibles
            }
        } else {
            log.warn("Cliente ID {} no tiene vendedor creador, no se puede asignar a grupo", id);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Datos personales validados exitosamente");
        response.put("clienteId", id);
        response.put("emailVerificado", true);

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/estado-desistimiento")
    @Operation(summary = "Cambiar estado del cliente a DESISTIMIENTO", description = "Permite al Jefe de Ventas cambiar el estado del cliente a DESISTIMIENTO con una observación")
    public ResponseEntity<?> cambiarEstadoDesistimiento(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        log.info("ClienteController: Cambiando estado del cliente ID {} a DESISTIMIENTO", id);

        // Validar que el cliente existe
        Cliente cliente = clienteService.findById(id);

        // Cambiar estado a DESISTIMIENTO
        cliente.setEstado(EstadoCliente.DESISTIMIENTO);

        // Usar motivoRechazo para almacenar la observación del desistimiento
        Object observacionObj = request.get("observacion");
        String observacion = observacionObj != null ? observacionObj.toString() : null;
        if (observacion != null && !observacion.isBlank()) {
            cliente.setMotivoRechazo(observacion.trim());
        }

        // Establecer fecha de rechazo (usamos este campo también para desistimiento)
        cliente.setFechaRechazo(LocalDateTime.now());

        Cliente clienteActualizado = clienteRepository.save(cliente);
        log.info("Estado del cliente ID {} cambiado a DESISTIMIENTO con observacion: {}",
            id, observacion != null ? observacion : "sin observación");

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Estado del cliente actualizado a DESISTIMIENTO exitosamente",
            "cliente", clienteQueryService.findByIdAsDTO(clienteActualizado.getId())
        ));
    }
    
    
    
    
    
    
    // Excepciones manejadas por GlobalExceptionHandler

    /**
     * Obtener todos los clientes del sistema (para jefe de ventas)
     */
    @GetMapping("/todos")
    @Operation(summary = "Obtener todos los clientes", description = "Obtiene todos los clientes con información del vendedor")
    public ResponseEntity<List<ClienteDTO>> obtenerTodosClientes() {
        log.info("GET /api/clientes/todos - Obteniendo todos los clientes");
        
        List<ClienteDTO> clientes = clienteQueryService.findAllAsDTO();
        return ResponseEntity.ok(clientes);
    }
    
    /**
     * Buscar o crear el cliente fantasma del vendedor para armas sin cliente
     * Este endpoint permite obtener el cliente fantasma que se usa para almacenar armas
     * que el vendedor solicita sin tener un cliente específico
     */
    @PostMapping("/fantasma-vendedor")
    @Operation(summary = "Buscar o crear cliente fantasma del vendedor",
               description = "Busca o crea un cliente fantasma para el vendedor actual para almacenar armas sin cliente")
    public ResponseEntity<?> buscarOCrearClienteFantasmaVendedor(
            @RequestHeader("Authorization") String authHeader) {
        // Obtener usuario actual desde JWT
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new BadRequestException("Token JWT requerido");
        }

        String token = authHeader.substring(7);
        String email = jwtTokenProvider.getUsernameFromToken(token);
        if (email == null) {
            throw new BadRequestException("Token JWT inválido");
        }

        Usuario usuario = usuarioService.findByEmail(email);
        Cliente clienteFantasma = clienteService.buscarOCrearClienteFantasmaVendedor(usuario.getId());

        return ResponseEntity.ok(clienteQueryService.findByIdAsDTO(clienteFantasma.getId()));
    }

}

package com.armasimportacion.controller;

import com.armasimportacion.dto.ClienteDTO;
import com.armasimportacion.dto.DatosContratoDTO;
import com.armasimportacion.exception.BadRequestException;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.security.JwtTokenProvider;
import com.armasimportacion.service.ClienteService;
import com.armasimportacion.service.ClienteCompletoService;
import com.armasimportacion.service.UsuarioService;
import com.armasimportacion.model.Pago;
import com.armasimportacion.repository.PagoRepository;
import com.armasimportacion.service.helper.GestionDocumentosServiceHelper;
import com.armasimportacion.model.DocumentoGenerado;
import com.armasimportacion.repository.DocumentoGeneradoRepository;
import com.armasimportacion.service.FileStorageService;
import com.armasimportacion.enums.EstadoDocumentoGenerado;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;
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
import java.util.HashMap;
import java.util.stream.Collectors;

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
    private final com.armasimportacion.repository.ClienteRepository clienteRepository;
    private final PagoRepository pagoRepository;
    private final GestionDocumentosServiceHelper gestionDocumentosServiceHelper;
    private final DocumentoGeneradoRepository documentoGeneradoRepository;
    private final com.armasimportacion.service.GrupoImportacionService grupoImportacionService;
    private final com.armasimportacion.service.DocumentoClienteService documentoClienteService;
    private final FileStorageService fileStorageService;
    
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
    public ResponseEntity<?> actualizarClienteCompleto(
            @PathVariable Long id, 
            @RequestBody Map<String, Object> requestData,
            @RequestHeader("Authorization") String authHeader) {
        try {
            log.info("🔄 ClienteController: Actualizando cliente completo ID: {}", id);
            log.info("🔍 ClienteController: requestData keys: {}", requestData.keySet());
            
            // Obtener usuario actual desde JWT
            Long usuarioId = null;
            Usuario usuario = null;
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.error("❌ Token JWT requerido para actualizar clientes");
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
                
                usuario = usuarioService.findByEmail(email);
                usuarioId = usuario.getId();
                log.info("✅ Usuario actual obtenido desde JWT: ID={}, Email={}", usuarioId, email);
            } catch (Exception e) {
                log.error("❌ Error obteniendo usuario desde JWT: {}", e.getMessage());
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Error procesando token JWT: " + e.getMessage()));
            }
            
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
                    log.warn("⚠️ Vendedor {} intentó editar cliente {} que ya confirmó sus datos", 
                        usuarioId, id);
                    throw new BadRequestException(
                        "No puede editar este cliente: El cliente ya confirmó sus datos. " +
                        "Solo el Jefe de Ventas puede editar clientes que confirmaron sus datos.");
                }
            }
            
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
    
    @PatchMapping("/{id}")
    @Operation(summary = "Actualizar cliente parcial", description = "Actualiza solo los campos modificados del cliente (más eficiente que PUT)")
    public ResponseEntity<?> actualizarClienteParcial(
            @PathVariable Long id, 
            @RequestBody Map<String, Object> requestData,
            @RequestHeader("Authorization") String authHeader) {
        try {
            log.info("🔄 ClienteController: Actualizando cliente parcial ID: {}", id);
            log.info("🔍 ClienteController: Campos recibidos: {}", requestData.keySet());
            
            // Obtener usuario actual desde JWT
            Long usuarioId = null;
            Usuario usuario = null;
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.error("❌ Token JWT requerido para actualizar clientes");
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
                
                usuario = usuarioService.findByEmail(email);
                usuarioId = usuario.getId();
                log.info("✅ Usuario actual obtenido desde JWT: ID={}, Email={}", usuarioId, email);
            } catch (Exception e) {
                log.error("❌ Error obteniendo usuario desde JWT: {}", e.getMessage());
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Error procesando token JWT: " + e.getMessage()));
            }
            
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
                    log.warn("⚠️ Vendedor {} intentó editar cliente {} que ya confirmó sus datos", 
                        usuarioId, id);
                    throw new BadRequestException(
                        "No puede editar este cliente: El cliente ya confirmó sus datos. " +
                        "Solo el Jefe de Ventas puede editar clientes que confirmaron sus datos.");
                }
            }
            
            // Usar ClienteCompletoService para actualización parcial optimizada
            Map<String, Object> response = clienteCompletoService.actualizarClienteParcial(id, requestData);
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
    
    @PatchMapping("/{id}/validar-datos")
    @Operation(summary = "Validar datos personales del cliente", description = "Marca los datos del cliente como validados manualmente por el vendedor y asigna a grupo disponible")
    public ResponseEntity<?> validarDatosPersonales(@PathVariable Long id) {
        try {
            log.info("✅ ClienteController: Validando datos personales del cliente ID: {}", id);
            
            Cliente cliente = clienteService.findById(id);
            cliente.setEmailVerificado(true);
            clienteRepository.save(cliente);
            
            log.info("✅ Datos personales validados para cliente ID: {}", id);
            
            // Intentar asignar cliente a un grupo disponible (provisional - PENDIENTE)
            // Solo si el cliente tiene un vendedor creador
            Long vendedorId = null;
            if (cliente.getUsuarioCreador() != null) {
                vendedorId = cliente.getUsuarioCreador().getId();
                log.info("🔍 Intentando asignar cliente ID {} a grupo disponible del vendedor ID: {}", id, vendedorId);
                
                try {
                    com.armasimportacion.model.ClienteGrupoImportacion asignacion = 
                        grupoImportacionService.asignarClienteAGrupoDisponible(cliente, vendedorId);
                    
                    if (asignacion != null) {
                        log.info("✅ Cliente ID {} asignado provisionalmente al grupo ID: {} (estado: PENDIENTE)", 
                            id, asignacion.getGrupoImportacion().getId());
                    } else {
                        log.info("📭 No hay grupo disponible para asignar cliente ID: {}", id);
                    }
                } catch (Exception e) {
                    log.warn("⚠️ No se pudo asignar cliente a grupo (puede no haber grupos disponibles): {}", e.getMessage());
                    // No fallar la validación si no hay grupos disponibles
                }
            } else {
                log.warn("⚠️ Cliente ID {} no tiene vendedor creador, no se puede asignar a grupo", id);
            }
            
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("success", true);
            response.put("message", "Datos personales validados exitosamente");
            response.put("clienteId", id);
            response.put("emailVerificado", true);
            
            return ResponseEntity.ok(response);
            
        } catch (ResourceNotFoundException e) {
            log.error("Cliente no encontrado: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error inesperado al validar datos: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al validar datos: " + e.getMessage()));
        }
    }

    @PatchMapping("/{id}/estado-desistimiento")
    @Operation(summary = "Cambiar estado del cliente a DESISTIMIENTO", description = "Permite al Jefe de Ventas cambiar el estado del cliente a DESISTIMIENTO con una observación")
    public ResponseEntity<?> cambiarEstadoDesistimiento(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        try {
            log.info("🔄 ClienteController: Cambiando estado del cliente ID {} a DESISTIMIENTO", id);
            
            // Validar que el cliente existe
            Cliente cliente = clienteService.findById(id);
            
            // Cambiar estado a DESISTIMIENTO
            cliente.setEstado(com.armasimportacion.enums.EstadoCliente.DESISTIMIENTO);
            
            // Usar motivoRechazo para almacenar la observación del desistimiento
            Object observacionObj = request.get("observacion");
            String observacion = observacionObj != null ? observacionObj.toString() : null;
            if (observacion != null && !observacion.trim().isEmpty()) {
                cliente.setMotivoRechazo(observacion.trim());
            }
            
            // Establecer fecha de rechazo (usamos este campo también para desistimiento)
            cliente.setFechaRechazo(java.time.LocalDateTime.now());
            
            Cliente clienteActualizado = clienteRepository.save(cliente);
            log.info("✅ Estado del cliente ID {} cambiado a DESISTIMIENTO con observación: {}", 
                id, observacion != null ? observacion : "sin observación");
            
            return ResponseEntity.ok(Map.of(
                "success", true, 
                "message", "Estado del cliente actualizado a DESISTIMIENTO exitosamente",
                "cliente", clienteService.findByIdAsDTO(clienteActualizado.getId())
            ));
        } catch (ResourceNotFoundException e) {
            log.error("❌ Cliente no encontrado: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("❌ Error inesperado al cambiar estado del cliente a DESISTIMIENTO: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al cambiar estado del cliente: " + e.getMessage()));
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
    
    /**
     * Buscar o crear el cliente fantasma del vendedor para armas sin cliente
     * Este endpoint permite obtener el cliente fantasma que se usa para almacenar armas
     * que el vendedor solicita sin tener un cliente específico
     */
    @PostMapping("/fantasma-vendedor")
    @Operation(summary = "Buscar o crear cliente fantasma del vendedor", 
               description = "Busca o crea un cliente fantasma para el vendedor actual para almacenar armas sin cliente")
    public ResponseEntity<ClienteDTO> buscarOCrearClienteFantasmaVendedor(
            @RequestHeader("Authorization") String authHeader) {
        try {
            // Obtener usuario actual desde JWT
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.error("❌ Token JWT requerido para buscar cliente fantasma");
                return ResponseEntity.badRequest().build();
            }
            
            String token = authHeader.substring(7);
            String email = jwtTokenProvider.getUsernameFromToken(token);
            if (email == null) {
                log.error("❌ Token JWT inválido");
                return ResponseEntity.badRequest().build();
            }
            
            Usuario usuario = usuarioService.findByEmail(email);
            Cliente clienteFantasma = clienteService.buscarOCrearClienteFantasmaVendedor(usuario.getId());
            
            return ResponseEntity.ok(clienteService.findByIdAsDTO(clienteFantasma.getId()));
        } catch (Exception e) {
            log.error("❌ Error buscando/creando cliente fantasma: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obtener datos del contrato para mostrar en popup antes de generar
     * Solo datos de la BD (cliente, pago, armas)
     */
    @GetMapping("/{id}/datos-contrato")
    @Operation(summary = "Obtener datos del contrato", description = "Obtiene los datos del cliente, pago y armas para mostrar en el popup de generación de contrato")
    public ResponseEntity<DatosContratoDTO> obtenerDatosContrato(@PathVariable Long id) {
        try {
            log.info("📄 Obteniendo datos del contrato para cliente ID: {}", id);
            
            Cliente cliente = clienteService.findById(id);
            List<Pago> pagos = pagoRepository.findByClienteId(id);
            Pago pago = pagos != null && !pagos.isEmpty() ? pagos.get(0) : null;
            
            // Obtener armas asignadas
            List<com.armasimportacion.model.ClienteArma> armas = cliente.getAsignacionesArma() != null ? cliente.getAsignacionesArma() : new java.util.ArrayList<>();
            
            // Verificar documentos completos
            boolean documentosCompletos = documentoClienteService.verificarDocumentosCompletos(id);
            
            // Obtener emailVerificado del cliente
            Boolean emailVerificadoRaw = cliente.getEmailVerificado();
            Boolean emailVerificado = emailVerificadoRaw != null && emailVerificadoRaw;
            
            log.info("📋 Cliente ID {} - documentosCompletos: {}, emailVerificado (raw): {}, emailVerificado (calculado): {}", 
                id, documentosCompletos, emailVerificadoRaw, emailVerificado);
            
            // Construir DTO del cliente
            DatosContratoDTO.ClienteDTO clienteDTO = DatosContratoDTO.ClienteDTO.builder()
                .id(cliente.getId())
                .nombres(cliente.getNombres())
                .apellidos(cliente.getApellidos())
                .numeroIdentificacion(cliente.getNumeroIdentificacion())
                .email(cliente.getEmail())
                .telefonoPrincipal(cliente.getTelefonoPrincipal())
                .direccion(cliente.getDireccion())
                .provincia(cliente.getProvincia())
                .canton(cliente.getCanton())
                .emailVerificado(emailVerificado)
                .build();
            
            // Construir DTO del pago (si existe)
            DatosContratoDTO.PagoDTO pagoDTO = null;
            if (pago != null) {
                pagoDTO = DatosContratoDTO.PagoDTO.builder()
                    .id(pago.getId())
                    .montoTotal(pago.getMontoTotal())
                    .tipoPago(pago.getTipoPago())
                    .numeroCuotas(pago.getNumeroCuotas())
                    .build();
            }
            
            // Construir DTOs de armas
            List<DatosContratoDTO.ArmaDTO> armasDTO = armas.stream()
                .map(arma -> DatosContratoDTO.ArmaDTO.builder()
                    .id(arma.getId())
                    .nombre(arma.getArma() != null ? arma.getArma().getNombre() : "N/A")
                    .precioUnitario(arma.getPrecioUnitario())
                    .cantidad(arma.getCantidad())
                    .build())
                .collect(Collectors.toList());
            
            // Construir DTO principal
            DatosContratoDTO datosContratoDTO = DatosContratoDTO.builder()
                .cliente(clienteDTO)
                .pago(pagoDTO)
                .armas(armasDTO)
                .documentosCompletos(documentosCompletos)
                .build();
            
            log.info("📋 DTO construido - documentosCompletos: {}, emailVerificado: {}", 
                datosContratoDTO.getDocumentosCompletos(), 
                datosContratoDTO.getCliente() != null ? datosContratoDTO.getCliente().getEmailVerificado() : "null");
            
            return ResponseEntity.ok(datosContratoDTO);
        } catch (ResourceNotFoundException e) {
            log.error("Cliente no encontrado: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error obteniendo datos del contrato: {}", e.getMessage(), e);
            throw new RuntimeException("Error al obtener datos del contrato: " + e.getMessage(), e);
        }
    }

    /**
     * Generar contrato desde la vista del cliente (solo para JEFE DE VENTAS)
     * Guarda como: contrato_apellidos_nombres_cedula.pdf
     */
    @PostMapping("/{id}/generar-contrato")
    @Operation(summary = "Generar contrato del cliente", description = "Genera un contrato PDF para el cliente. Requiere documentos completos y email validado. Confirma asignación definitiva al grupo.")
    public ResponseEntity<Map<String, Object>> generarContrato(@PathVariable Long id) {
        try {
            log.info("📄 Generando contrato para cliente ID: {}", id);
            
            Cliente cliente = clienteService.findById(id);
            
            // VALIDACIÓN 0: Verificar que NO sea cliente fantasma (vendedor)
            if (cliente.getEstado() == com.armasimportacion.enums.EstadoCliente.PENDIENTE_ASIGNACION_CLIENTE) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "No se puede generar contrato para clientes fantasma (vendedores). Los vendedores no requieren contrato."));
            }
            
            // VALIDACIÓN 1: Verificar que el email esté validado
            if (cliente.getEmailVerificado() == null || !cliente.getEmailVerificado()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "El cliente debe tener su email validado antes de generar el contrato. Por favor, valide los datos personales del cliente primero."));
            }
            
            // VALIDACIÓN 2: Verificar que tenga todos los documentos obligatorios completos
            boolean documentosCompletos = documentoClienteService.verificarDocumentosCompletos(id);
            if (!documentosCompletos) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "El cliente debe tener todos sus documentos obligatorios cargados antes de generar el contrato."));
            }
            
            // Obtener pago (si existe, se usa; si no existe, se genera contrato sin pago)
            List<Pago> pagos = pagoRepository.findByClienteId(id);
            Pago pago = pagos != null && !pagos.isEmpty() ? pagos.get(0) : null;
            
            // Generar documentos según tipo de grupo usando GestionDocumentosServiceHelper
            List<DocumentoGenerado> documentos = gestionDocumentosServiceHelper.generarYGuardarDocumentos(cliente, pago);
            
            if (documentos == null || documentos.isEmpty()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "No se generaron documentos"));
            }
            
            // CONFIRMAR ASIGNACIÓN DEFINITIVA AL GRUPO
            // Si el cliente tiene una asignación PENDIENTE, confirmarla (cambiar a CONFIRMADO)
            try {
                grupoImportacionService.confirmarAsignacionCliente(id);
                log.info("✅ Asignación del cliente ID {} confirmada definitivamente al grupo", id);
            } catch (Exception e) {
                log.warn("⚠️ No se pudo confirmar asignación del cliente al grupo (puede no tener asignación pendiente): {}", e.getMessage());
                // No fallar la generación de documentos si no hay asignación pendiente
            }
            
            // Para compatibilidad, usar el primer documento como referencia
            DocumentoGenerado documentoPrincipal = documentos.get(0);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", documentos.size() + " documento(s) generado(s) exitosamente");
            response.put("documentosGenerados", documentos.size());
            response.put("documentoId", documentoPrincipal.getId());
            response.put("nombreArchivo", documentoPrincipal.getNombreArchivo());
            response.put("urlArchivo", documentoPrincipal.getUrlArchivo());
            
            // Agregar lista de documentos generados
            List<Map<String, Object>> documentosInfo = documentos.stream()
                .map(doc -> {
                    Map<String, Object> docInfo = new HashMap<>();
                    docInfo.put("id", doc.getId());
                    docInfo.put("nombre", doc.getNombre());
                    docInfo.put("tipoDocumento", doc.getTipoDocumento().name());
                    docInfo.put("nombreArchivo", doc.getNombreArchivo());
                    docInfo.put("urlArchivo", doc.getUrlArchivo());
                    return docInfo;
                })
                .collect(Collectors.toList());
            response.put("documentos", documentosInfo);
            
            log.info("✅ {} documento(s) generado(s) exitosamente: {}", documentos.size(), documentoPrincipal.getNombreArchivo());
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            log.error("Cliente no encontrado: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error generando contrato: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al generar contrato: " + e.getMessage()));
        }
    }

    /**
     * Cargar contrato firmado (reemplaza el contrato generado con el firmado)
     */
    @PostMapping(value = "/{id}/cargar-contrato-firmado", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Cargar contrato firmado", description = "Carga el contrato firmado del cliente, reemplazando el contrato generado")
    public ResponseEntity<Map<String, Object>> cargarContratoFirmado(
            @PathVariable Long id,
            @RequestParam("archivo") MultipartFile archivo) {
        try {
            log.info("📄 Cargando contrato firmado para cliente ID: {}", id);
            
            Cliente cliente = clienteService.findById(id);
            
            // Buscar el último contrato generado para este cliente
            List<DocumentoGenerado> contratos = documentoGeneradoRepository
                .findByClienteIdAndTipo(
                    cliente.getId(), 
                    com.armasimportacion.enums.TipoDocumentoGenerado.CONTRATO
                );
            
            // Ordenar por fecha de generación descendente y tomar el más reciente
            contratos.sort((a, b) -> {
                if (a.getFechaGeneracion() == null && b.getFechaGeneracion() == null) return 0;
                if (a.getFechaGeneracion() == null) return 1;
                if (b.getFechaGeneracion() == null) return -1;
                return b.getFechaGeneracion().compareTo(a.getFechaGeneracion());
            });
            
            if (contratos.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "No se encontró un contrato generado para este cliente. Debe generar el contrato primero."));
            }
            
            DocumentoGenerado contratoGenerado = contratos.get(0);
            
            // Guardar el archivo firmado (reemplazar el generado)
            String nombreArchivoFirmado = "contrato_firmado_" + cliente.getApellidos().replaceAll("[^a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]", "").trim().replaceAll("\\s+", "_").toLowerCase() 
                + "_" + cliente.getNombres().replaceAll("[^a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]", "").trim().replaceAll("\\s+", "_").toLowerCase()
                + "_" + cliente.getNumeroIdentificacion() + ".pdf";
            
            byte[] archivoBytes = archivo.getBytes();
            String rutaArchivo = fileStorageService.guardarDocumentoGeneradoCliente(
                cliente.getNumeroIdentificacion(), archivoBytes, nombreArchivoFirmado);
            
            // Actualizar el documento generado con el archivo firmado
            contratoGenerado.setNombreArchivo(nombreArchivoFirmado);
            contratoGenerado.setRutaArchivo(rutaArchivo);
            contratoGenerado.setTamanioBytes(archivo.getSize());
            contratoGenerado.setFechaFirma(java.time.LocalDateTime.now());
            contratoGenerado.setEstado(EstadoDocumentoGenerado.FIRMADO);
            contratoGenerado.setDescripcion("Contrato firmado por el cliente");
            
            documentoGeneradoRepository.save(contratoGenerado);
            
            // Actualizar estado del cliente a CONTRATO_FIRMADO
            cliente.setEstado(com.armasimportacion.enums.EstadoCliente.CONTRATO_FIRMADO);
            clienteRepository.save(cliente);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Contrato firmado cargado exitosamente");
            response.put("documentoId", contratoGenerado.getId());
            response.put("nombreArchivo", nombreArchivoFirmado);
            
            log.info("✅ Contrato firmado cargado exitosamente: {}", nombreArchivoFirmado);
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            log.error("Cliente no encontrado: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error cargando contrato firmado: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al cargar contrato firmado: " + e.getMessage()));
        }
    }

} 

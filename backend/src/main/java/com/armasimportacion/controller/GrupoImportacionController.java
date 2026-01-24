package com.armasimportacion.controller;

import com.armasimportacion.dto.GrupoImportacionResumenDTO;
import com.armasimportacion.dto.GrupoImportacionCreateDTO;
import com.armasimportacion.dto.AlertaProcesoImportacionDTO;
import com.armasimportacion.dto.GrupoImportacionProcesoDTO;
import com.armasimportacion.dto.GrupoImportacionProcesoUpdateDTO;
import com.armasimportacion.enums.EstadoGrupoImportacion;
import com.armasimportacion.enums.EstadoMilitar;
import com.armasimportacion.enums.EstadoCliente;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import com.armasimportacion.model.DocumentoGenerado;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.security.JwtTokenProvider;
import com.armasimportacion.service.GrupoImportacionService;
import com.armasimportacion.service.GrupoImportacionProcesoService;
import com.armasimportacion.service.UsuarioService;
import com.armasimportacion.service.DocumentoClienteService;
import com.armasimportacion.repository.ClienteArmaRepository;
import com.armasimportacion.repository.TipoClienteRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/grupos-importacion")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Grupos de Importación", description = "API para gestión de grupos de importación")
// CORS configurado globalmente en SecurityConfig - NO usar @CrossOrigin(origins = "*") por seguridad
public class GrupoImportacionController {

    private final GrupoImportacionService grupoImportacionService;
    private final GrupoImportacionProcesoService grupoImportacionProcesoService;
    private final UsuarioService usuarioService;
    private final JwtTokenProvider jwtTokenProvider;
    private final DocumentoClienteService documentoClienteService;
    private final com.armasimportacion.service.CategoriaArmaService categoriaArmaService;
    private final ClienteArmaRepository clienteArmaRepository;
    private final TipoClienteRepository tipoClienteRepository;

    /**
     * Obtiene el usuario actual desde el token JWT
     */
    private Long obtenerUsuarioId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Token JWT requerido");
        }
        
        String token = authHeader.substring(7);
        String email = jwtTokenProvider.getUsernameFromToken(token);
        if (email == null) {
            throw new RuntimeException("Token JWT inválido");
        }
        
        Usuario usuario = usuarioService.findByEmail(email);
        return usuario.getId();
    }

    private Long obtenerUsuarioIdOpcional(String authHeader, Long grupoId) {
        try {
            return obtenerUsuarioId(authHeader);
        } catch (Exception e) {
            log.warn("⚠️ Token no enviado en definir pedido, usando usuario creador del grupo {}", grupoId);
            return grupoImportacionService.obtenerGrupoImportacion(grupoId).getUsuarioCreador().getId();
        }
    }

    /**
     * Define el pedido para un grupo de importación
     * Genera el PDF "Pedido_Armas_Grupo_Importacion_AAAA_MM_DD" y cambia el estado
     */
    @PostMapping("/{id}/definir-pedido")
    @Operation(summary = "Definir pedido", 
               description = "Genera el documento PDF del pedido y cambia el estado del grupo a SOLICITAR_PROFORMA_FABRICA")
    public ResponseEntity<Map<String, Object>> definirPedido(
            @PathVariable @NotNull @Positive Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            log.info("📋 Definiendo pedido para grupo ID: {}", id);
            Long usuarioId = obtenerUsuarioIdOpcional(authHeader, id);
            
            DocumentoGenerado documento = grupoImportacionService.definirPedido(id, usuarioId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Pedido definido exitosamente");
            response.put("documentoId", documento.getId());
            response.put("nombreArchivo", documento.getNombreArchivo());
            response.put("rutaArchivo", documento.getRutaArchivo());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Error definiendo pedido para grupo ID {}: {}", id, e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Obtiene un grupo de importación completo por ID
     */
    @GetMapping("/{id}")
    @Operation(summary = "Obtener grupo de importación", 
               description = "Obtiene la información completa de un grupo de importación por su ID")
    public ResponseEntity<Map<String, Object>> obtenerGrupoImportacion(
            @PathVariable @NotNull @Positive Long id) {
        try {
            log.info("📋 Obteniendo grupo de importación ID: {}", id);
            
            com.armasimportacion.model.GrupoImportacion grupo = 
                grupoImportacionService.obtenerGrupoImportacion(id);
            
            Map<String, Object> grupoDTO = new HashMap<>();
            grupoDTO.put("id", grupo.getId());
            grupoDTO.put("nombre", grupo.getNombre());
            grupoDTO.put("descripcion", grupo.getDescripcion());
            grupoDTO.put("codigo", grupo.getCodigo());
            grupoDTO.put("estado", grupo.getEstado());
            grupoDTO.put("fechaInicio", grupo.getFechaInicio());
            grupoDTO.put("fechaFin", grupo.getFechaFin());
            grupoDTO.put("cupoTotal", grupo.getCupoTotal());
            grupoDTO.put("cupoDisponible", grupo.getCupoDisponible());
            grupoDTO.put("observaciones", grupo.getObservaciones());
            grupoDTO.put("fechaCreacion", grupo.getFechaCreacion());
            grupoDTO.put("fechaActualizacion", grupo.getFechaActualizacion());
            
            // Información de licencia
            if (grupo.getLicencia() != null) {
                Map<String, Object> licenciaInfo = new HashMap<>();
                licenciaInfo.put("id", grupo.getLicencia().getId());
                licenciaInfo.put("numero", grupo.getLicencia().getNumero());
                licenciaInfo.put("nombre", grupo.getLicencia().getNombre());
                grupoDTO.put("licencia", licenciaInfo);
            } else {
                grupoDTO.put("licencia", null);
            }
            
            // Información de tipo de proceso (opcional)
            if (grupo.getTipoProceso() != null) {
                Map<String, Object> tipoProcesoInfo = new HashMap<>();
                tipoProcesoInfo.put("id", grupo.getTipoProceso().getId());
                tipoProcesoInfo.put("nombre", grupo.getTipoProceso().getNombre());
                grupoDTO.put("tipoProceso", tipoProcesoInfo);
            } else {
                grupoDTO.put("tipoProceso", null);
            }
            
            // Información de documentos generados (solo IDs para pedidos de armas)
            // Forzar carga de documentos generados (lazy loading)
            try {
                if (grupo.getDocumentosGenerados() != null) {
                    grupo.getDocumentosGenerados().size(); // Trigger lazy load
                    List<Map<String, Object>> documentosInfo = grupo.getDocumentosGenerados().stream()
                        .filter(doc -> doc.getTipoDocumento() == com.armasimportacion.enums.TipoDocumentoGenerado.PEDIDO_ARMAS_GRUPO_IMPORTACION)
                        .map(doc -> {
                            Map<String, Object> docInfo = new HashMap<>();
                            docInfo.put("id", doc.getId());
                            docInfo.put("nombreArchivo", doc.getNombreArchivo());
                            docInfo.put("fechaGeneracion", doc.getFechaGeneracion());
                            return docInfo;
                        })
                        .collect(java.util.stream.Collectors.toList());
                    grupoDTO.put("documentosGenerados", documentosInfo);
                } else {
                    grupoDTO.put("documentosGenerados", new java.util.ArrayList<>());
                }
            } catch (Exception e) {
                log.warn("⚠️ No se pudieron cargar los documentos generados para el grupo {}: {}", id, e.getMessage());
                grupoDTO.put("documentosGenerados", new java.util.ArrayList<>());
            }
            
            // Calcular cupos disponibles por categoría (solo para tipo CUPO)
            if ("CUPO".equals(grupo.getTipoGrupo())) {
                Map<Long, Integer> cuposDisponibles = grupoImportacionService.calcularCuposDisponiblesPorCategoria(id);
                grupoDTO.put("cuposDisponiblesPorCategoria", cuposDisponibles);
                
                // Calcular cupo total disponible
                Integer cupoTotalDisponible = grupoImportacionService.calcularCupoTotalDisponible(id);
                grupoDTO.put("cupoTotalDisponible", cupoTotalDisponible);
            }
            
            // Agregar tipo de grupo y TRA
            grupoDTO.put("tipoGrupo", grupo.getTipoGrupo());
            grupoDTO.put("tra", grupo.getTra());
            
            // Agregar vendedores asignados con sus límites
            if (grupo.getVendedores() != null && !grupo.getVendedores().isEmpty()) {
                List<Map<String, Object>> vendedoresDTO = grupo.getVendedores().stream()
                    .map(gv -> {
                        Map<String, Object> vendedorMap = new HashMap<>();
                        vendedorMap.put("id", gv.getVendedor().getId());
                        vendedorMap.put("vendedorId", gv.getVendedor().getId());
                        vendedorMap.put("nombres", gv.getVendedor().getNombres());
                        vendedorMap.put("apellidos", gv.getVendedor().getApellidos());
                        vendedorMap.put("email", gv.getVendedor().getEmail());
                        vendedorMap.put("limiteArmas", gv.getLimiteArmas() != null ? gv.getLimiteArmas() : 0);
                        vendedorMap.put("activo", gv.getActivo() != null ? gv.getActivo() : true);
                        return vendedorMap;
                    })
                    .collect(java.util.stream.Collectors.toList());
                grupoDTO.put("vendedores", vendedoresDTO);
            } else {
                grupoDTO.put("vendedores", new java.util.ArrayList<>());
            }
            
            // Agregar límites por categoría
            if (grupo.getLimitesCategoria() != null && !grupo.getLimitesCategoria().isEmpty()) {
                List<Map<String, Object>> limitesDTO = grupo.getLimitesCategoria().stream()
                    .map(gl -> {
                        Map<String, Object> limiteMap = new HashMap<>();
                        limiteMap.put("categoriaArmaId", gl.getCategoriaArma().getId());
                        limiteMap.put("categoriaArmaNombre", gl.getCategoriaArma().getNombre());
                        limiteMap.put("categoriaArmaCodigo", gl.getCategoriaArma().getCodigo());
                        limiteMap.put("limiteMaximo", gl.getLimiteMaximo());
                        return limiteMap;
                    })
                    .collect(java.util.stream.Collectors.toList());
                grupoDTO.put("limitesCategoria", limitesDTO);
            } else {
                grupoDTO.put("limitesCategoria", new java.util.ArrayList<>());
            }
            
            return ResponseEntity.ok(grupoDTO);
        } catch (com.armasimportacion.exception.ResourceNotFoundException e) {
            log.warn("⚠️ Grupo de importación no encontrado ID: {}", id);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Grupo de importación no encontrado");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            log.error("❌ Error obteniendo grupo de importación ID {}: {}", id, e.getClass().getSimpleName(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Error al obtener el grupo de importación");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Obtiene el checklist de procesos por grupo
     */
    @GetMapping("/{id}/procesos")
    @Operation(summary = "Obtener procesos de importación",
               description = "Obtiene el checklist de procesos para un grupo de importación")
    public ResponseEntity<List<GrupoImportacionProcesoDTO>> obtenerProcesosPorGrupo(
            @PathVariable @NotNull @Positive Long id) {
        List<GrupoImportacionProcesoDTO> procesos = grupoImportacionProcesoService.obtenerProcesosPorGrupo(id);
        return ResponseEntity.ok(procesos);
    }

    /**
     * Actualiza el checklist de procesos por grupo
     */
    @PatchMapping("/{id}/procesos")
    @Operation(summary = "Actualizar procesos de importación",
               description = "Actualiza checklist de procesos para un grupo de importación")
    public ResponseEntity<List<GrupoImportacionProcesoDTO>> actualizarProcesosPorGrupo(
            @PathVariable @NotNull @Positive Long id,
            @RequestBody List<GrupoImportacionProcesoUpdateDTO> updates) {
        List<GrupoImportacionProcesoDTO> procesos = grupoImportacionProcesoService.actualizarProcesos(id, updates);
        return ResponseEntity.ok(procesos);
    }

    /**
     * Evalúa alertas de procesos cercanos y registra notificaciones
     */
    @GetMapping("/alertas-proceso")
    @Operation(summary = "Obtener alertas de procesos",
               description = "Evalúa procesos con fechas próximas y devuelve alertas")
    public ResponseEntity<List<AlertaProcesoImportacionDTO>> obtenerAlertasProcesos() {
        List<AlertaProcesoImportacionDTO> alertas = grupoImportacionProcesoService.evaluarAlertasProcesos();
        return ResponseEntity.ok(alertas);
    }

    /**
     * Obtiene el resumen de un grupo de importación con conteo de clientes por tipo
     */
    @GetMapping("/{id}/resumen")
    @Operation(summary = "Obtener resumen del grupo", 
               description = "Obtiene el resumen del grupo con conteo de clientes por tipo")
    public ResponseEntity<GrupoImportacionResumenDTO> obtenerResumen(
            @PathVariable @NotNull @Positive Long id) {
        try {
            log.info("📊 Obteniendo resumen del grupo ID: {}", id);
            
            GrupoImportacionResumenDTO resumen = grupoImportacionService.obtenerResumenGrupo(id);
            
            return ResponseEntity.ok(resumen);
        } catch (Exception e) {
            log.error("❌ Error obteniendo resumen del grupo ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Obtiene la lista de grupos de importación activos para el vendedor actual
     * Filtra por vendedor asignado y verifica cupos disponibles
     * Solo retorna grupos en estados: EN_PREPARACION o EN_PROCESO_ASIGNACION_CLIENTES
     */
    @GetMapping("/activos")
    @Operation(summary = "Obtener grupos activos para vendedor", 
               description = "Obtiene la lista de grupos de importación activos asignados al vendedor actual con cupos disponibles")
    public ResponseEntity<List<Map<String, Object>>> obtenerGruposActivos(
            @RequestHeader("Authorization") String authHeader) {
        try {
            log.info("📋 Obteniendo grupos de importación activos para vendedor");
            
            // Obtener ID del vendedor desde el token
            Long vendedorId = obtenerUsuarioId(authHeader);
            log.info("🔍 Buscando grupos para vendedor ID: {}", vendedorId);
            
            // Obtener grupos disponibles para este vendedor (con cupos verificados)
            List<com.armasimportacion.model.GrupoImportacion> grupos = 
                grupoImportacionService.obtenerGruposActivosParaVendedor(vendedorId);
            
            List<Map<String, Object>> gruposDTO = grupos.stream().map(grupo -> {
                Map<String, Object> grupoMap = new HashMap<>();
                grupoMap.put("id", grupo.getId());
                grupoMap.put("nombre", grupo.getNombre());
                grupoMap.put("codigo", grupo.getCodigo());
                grupoMap.put("estado", grupo.getEstado());
                grupoMap.put("tipoGrupo", grupo.getTipoGrupo());
                grupoMap.put("fechaInicio", grupo.getFechaInicio());
                grupoMap.put("fechaFin", grupo.getFechaFin());
                grupoMap.put("cupoDisponible", grupo.getCupoDisponible());
                grupoMap.put("cupoTotal", grupo.getCupoTotal());
                return grupoMap;
            }).collect(java.util.stream.Collectors.toList());
            
            log.info("✅ Retornando {} grupos activos disponibles para vendedor ID: {}", gruposDTO.size(), vendedorId);
            return ResponseEntity.ok(gruposDTO);
        } catch (Exception e) {
            log.error("❌ Error obteniendo grupos activos: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Error al obtener los grupos activos: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of(error));
        }
    }

    /**
     * Lista grupos de importación para Jefe de Ventas
     * Incluye filtros por estado y búsqueda
     */
    @GetMapping("/jefe-ventas")
    @Operation(summary = "Listar grupos para Jefe de Ventas", 
               description = "Obtiene la lista de grupos de importación con resumen para Jefe de Ventas")
    public ResponseEntity<Page<GrupoImportacionResumenDTO>> listarParaJefeVentas(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String busqueda,
            Pageable pageable) {
        try {
            log.info("📋 Listando grupos para Jefe de Ventas - Estado: {}, Búsqueda: {}", estado, busqueda);
            
            // TODO: Implementar búsqueda y filtrado en el repositorio
            // Por ahora retornamos todos los grupos activos
            Page<com.armasimportacion.model.GrupoImportacion> grupos = 
                grupoImportacionService.findAll(pageable);
            
            // Convertir a resúmenes
            Page<GrupoImportacionResumenDTO> resumenes = grupos.map(g -> 
                grupoImportacionService.obtenerResumenGrupo(g.getId())
            );
            
            return ResponseEntity.ok(resumenes);
        } catch (Exception e) {
            log.error("❌ Error listando grupos para Jefe de Ventas: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Lista grupos de importación para Gestión de Importaciones (Finanzas/Jefe de Ventas)
     * Incluye todos los grupos activos
     */
    @GetMapping("/gestion-importaciones")
    @Operation(summary = "Listar grupos para Gestión de Importaciones", 
               description = "Obtiene la lista paginada de grupos de importación activos para Finanzas/Jefe de Ventas")
    public ResponseEntity<Page<GrupoImportacionResumenDTO>> listarParaGestionImportaciones(Pageable pageable) {
        try {
            log.info("📋 Listando grupos para Gestión de Importaciones");
            
            // Obtener grupos paginados
            Page<com.armasimportacion.model.GrupoImportacion> grupos =
                grupoImportacionService.findAll(pageable);
            
            Page<GrupoImportacionResumenDTO> resumenes = grupos.map(g ->
                grupoImportacionService.obtenerResumenGrupo(g.getId())
            );
            
            return ResponseEntity.ok(resumenes);
        } catch (Exception e) {
            log.error("❌ Error listando grupos para Gestión de Importaciones: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Verifica si un grupo puede definir pedido
     */
    @GetMapping("/{id}/puede-definir-pedido")
    @Operation(summary = "Verificar si puede definir pedido", 
               description = "Verifica si el grupo está en un estado válido para definir pedido")
    public ResponseEntity<Map<String, Object>> puedeDefinirPedido(
            @PathVariable @NotNull @Positive Long id) {
        try {
            Map<String, Object> response = grupoImportacionService.verificarPuedeDefinirPedidoDetalle(id);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Error verificando si puede definir pedido: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Obtiene los clientes disponibles para asignar a grupos de importación
     * (clientes que no están asignados a ningún grupo activo)
     * IMPORTANTE: Este endpoint debe ir ANTES de /{id}/clientes para evitar conflictos de rutas
     */
    @GetMapping("/clientes-disponibles")
    @Operation(summary = "Obtener clientes disponibles", 
               description = "Retorna los clientes que no están asignados a ningún grupo de importación activo. Si se proporciona grupoId, filtra por compatibilidad con el tipo de grupo (CUPO/JUSTIFICATIVO).")
    public ResponseEntity<List<Map<String, Object>>> obtenerClientesDisponibles(
            @RequestParam(required = false) Long grupoId) {
        try {
            log.info("🔍 Obteniendo clientes disponibles para asignar a grupos{}", 
                    grupoId != null ? " (grupo ID: " + grupoId + ")" : "");
            
            List<com.armasimportacion.model.Cliente> clientes = 
                grupoImportacionService.obtenerClientesDisponibles(grupoId);
            
            List<Map<String, Object>> clientesDTO = clientes.stream().map(cliente -> {
                Map<String, Object> clienteMap = new HashMap<>();
                clienteMap.put("id", cliente.getId());
                clienteMap.put("nombres", cliente.getNombres());
                clienteMap.put("apellidos", cliente.getApellidos());
                clienteMap.put("numeroIdentificacion", cliente.getNumeroIdentificacion());
                clienteMap.put("email", cliente.getEmail());
                clienteMap.put("telefonoPrincipal", cliente.getTelefonoPrincipal());
                clienteMap.put("tipoCliente", cliente.getTipoCliente() != null ? 
                    cliente.getTipoCliente().getNombre() : null);
                
                // Verificar si tiene documentos completos
                boolean documentosCompletos = documentoClienteService.verificarDocumentosCompletos(cliente.getId());
                clienteMap.put("documentosCompletos", documentosCompletos);
                
                return clienteMap;
            }).toList();
            
            log.info("✅ Retornando {} clientes disponibles", clientesDTO.size());
            return ResponseEntity.ok(clientesDTO);
        } catch (Exception e) {
            log.error("❌ Error obteniendo clientes disponibles: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obtiene los clientes asignados a un grupo de importación
     */
    @GetMapping("/{id}/clientes")
    @Operation(summary = "Obtener clientes del grupo", 
               description = "Obtiene la lista de clientes asignados a un grupo de importación")
    public ResponseEntity<List<Map<String, Object>>> obtenerClientesDelGrupo(
            @PathVariable @NotNull @Positive Long id) {
        try {
            log.info("👥 Obteniendo clientes del grupo ID: {}", id);
            
            List<com.armasimportacion.model.ClienteGrupoImportacion> clientesGrupo = 
                grupoImportacionService.obtenerClientesPorGrupo(id);
            
            List<Map<String, Object>> clientesDTO = clientesGrupo.stream().map(cg -> {
                Map<String, Object> clienteMap = new HashMap<>();
                boolean esClienteFantasma = cg.getCliente().getEstado() == EstadoCliente.PENDIENTE_ASIGNACION_CLIENTE;
                clienteMap.put("id", cg.getId());
                clienteMap.put("clienteId", cg.getCliente().getId());
                clienteMap.put("clienteNombres", esClienteFantasma ? "SIN CLIENTE" : cg.getCliente().getNombres());
                clienteMap.put("clienteApellidos", esClienteFantasma ? "CIVIL" : cg.getCliente().getApellidos());
                clienteMap.put("clienteCedula", esClienteFantasma ? "N/A" : cg.getCliente().getNumeroIdentificacion());
                clienteMap.put("estado", cg.getEstado());
                clienteMap.put("fechaAsignacion", cg.getFechaAsignacion());
                clienteMap.put("fechaCreacion", cg.getFechaCreacion());

                int totalArmas = clienteArmaRepository.findByClienteId(cg.getCliente().getId()).stream()
                    .mapToInt(ca -> ca.getCantidad() != null ? ca.getCantidad() : 1)
                    .sum();
                clienteMap.put("totalArmas", totalArmas);
                
                // Incluir estado de documentos para referencia
                boolean documentosCompletos = documentoClienteService.verificarDocumentosCompletos(cg.getCliente().getId());
                clienteMap.put("documentosCompletos", documentosCompletos);
                
                return clienteMap;
            }).toList();
            
            return ResponseEntity.ok(clientesDTO);
        } catch (Exception e) {
            log.error("❌ Error obteniendo clientes del grupo ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/disponible-por-tipo")
    @Operation(summary = "Verificar grupos disponibles por tipo de cliente",
               description = "Valida si el vendedor tiene un grupo disponible según el tipo de cliente y estado militar")
    public ResponseEntity<Map<String, Object>> verificarGrupoDisponiblePorTipo(
            @RequestParam String tipoClienteCodigo,
            @RequestParam(required = false) String estadoMilitar,
            @RequestHeader("Authorization") String authHeader) {
        try {
            Long usuarioId = obtenerUsuarioId(authHeader);

            var tipoClienteOpt = tipoClienteRepository.findByCodigo(tipoClienteCodigo);
            if (tipoClienteOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Tipo de cliente inválido: " + tipoClienteCodigo));
            }

            EstadoMilitar estado = null;
            if (estadoMilitar != null && !estadoMilitar.trim().isEmpty()) {
                estado = EstadoMilitar.valueOf(estadoMilitar.trim().toUpperCase());
            }

            String tipoGrupoRequerido = grupoImportacionService.obtenerTipoGrupoRequerido(tipoClienteOpt.get(), estado);
            boolean disponible;

            if (estado == null && tipoClienteOpt.get().esUniformado()) {
                boolean disponibleActivo = grupoImportacionService.existeGrupoDisponibleParaVendedorPorTipo(
                    usuarioId, tipoClienteOpt.get(), EstadoMilitar.ACTIVO
                );
                boolean disponiblePasivo = grupoImportacionService.existeGrupoDisponibleParaVendedorPorTipo(
                    usuarioId, tipoClienteOpt.get(), EstadoMilitar.PASIVO
                );
                disponible = disponibleActivo || disponiblePasivo;
                if (!disponible) {
                    tipoGrupoRequerido = null;
                }
            } else {
                disponible = grupoImportacionService.existeGrupoDisponibleParaVendedorPorTipo(
                    usuarioId, tipoClienteOpt.get(), estado
                );
            }

            Map<String, Object> response = new HashMap<>();
            response.put("disponible", disponible);
            response.put("tipoGrupoRequerido", tipoGrupoRequerido);
            if (!disponible) {
                if (estado == null && tipoClienteOpt.get().esUniformado()) {
                    response.put("mensaje", "No existe grupo de tipo JUSTIFICATIVO ni CUPO para poder cargar el cliente.");
                } else if (tipoGrupoRequerido != null) {
                    response.put("mensaje", "No existe grupo de tipo " + tipoGrupoRequerido + " para poder cargar el cliente.");
                } else {
                    response.put("mensaje", "No hay grupos de importación disponibles para este tipo de cliente.");
                }
            }

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Estado militar inválido: " + estadoMilitar));
        } catch (Exception e) {
            log.error("❌ Error verificando grupos disponibles por tipo: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error verificando disponibilidad de grupos"));
        }
    }

    /**
     * Agrega un cliente a un grupo de importación
     */
    @PostMapping("/{id}/clientes/{clienteId}")
    @Operation(summary = "Agregar cliente al grupo", 
               description = "Agrega un cliente a un grupo de importación")
    public ResponseEntity<Map<String, String>> agregarClienteAlGrupo(
            @PathVariable @NotNull @Positive Long id,
            @PathVariable @NotNull @Positive Long clienteId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            log.info("➕ Agregando cliente ID: {} al grupo ID: {}", clienteId, id);
            
            grupoImportacionService.agregarCliente(id, clienteId);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Cliente agregado al grupo exitosamente");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Error agregando cliente al grupo: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Remueve un cliente de un grupo de importación
     */
    @DeleteMapping("/{id}/clientes/{clienteId}")
    @Operation(summary = "Remover cliente del grupo", 
               description = "Remueve un cliente de un grupo de importación")
    public ResponseEntity<Map<String, String>> removerClienteDelGrupo(
            @PathVariable @NotNull @Positive Long id,
            @PathVariable @NotNull @Positive Long clienteId) {
        try {
            log.info("➖ Removiendo cliente ID: {} del grupo ID: {}", clienteId, id);
            
            grupoImportacionService.removerCliente(id, clienteId);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Cliente removido del grupo exitosamente");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Error removiendo cliente del grupo: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Cambia el estado del grupo a "Notificar Agente Aduanero"
     */
    @PutMapping("/{id}/notificar-agente-aduanero")
    @Operation(summary = "Notificar agente aduanero", 
               description = "Cambia el estado del grupo a NOTIFICAR_AGENTE_ADUANERO")
    public ResponseEntity<Map<String, String>> notificarAgenteAduanero(
            @PathVariable @NotNull @Positive Long id,
            @RequestHeader("Authorization") String authHeader) {
        try {
            log.info("📢 Notificando agente aduanero para grupo ID: {}", id);
            
            Long usuarioId = obtenerUsuarioId(authHeader);
            grupoImportacionService.cambiarEstado(id, EstadoGrupoImportacion.NOTIFICAR_AGENTE_ADUANERO, usuarioId);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Estado del grupo cambiado a 'Notificar Agente Aduanero' exitosamente");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Error notificando agente aduanero: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Obtiene todos los vendedores activos (usuarios con rol VENDOR)
     */
    @GetMapping("/vendedores")
    @Operation(summary = "Obtener vendedores", 
               description = "Obtiene la lista de todos los vendedores activos para asignar a grupos")
    public ResponseEntity<List<Map<String, Object>>> obtenerVendedores() {
        try {
            log.info("👥 Obteniendo lista de vendedores");
            
            List<com.armasimportacion.model.Usuario> vendedores = usuarioService.findByRol("Vendedor");
            
            List<Map<String, Object>> vendedoresDTO = vendedores.stream()
                .map(v -> {
                    Map<String, Object> vendedorMap = new HashMap<>();
                    vendedorMap.put("id", v.getId());
                    vendedorMap.put("nombres", v.getNombres());
                    vendedorMap.put("apellidos", v.getApellidos());
                    vendedorMap.put("email", v.getEmail());
                    vendedorMap.put("nombreCompleto", v.getNombres() + " " + v.getApellidos());
                    return vendedorMap;
                })
                .collect(java.util.stream.Collectors.toList());
            
            return ResponseEntity.ok(vendedoresDTO);
        } catch (Exception e) {
            log.error("❌ Error obteniendo vendedores: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of(error));
        }
    }
    
    /**
     * Obtiene todas las categorías de armas
     */
    @GetMapping("/categorias-armas")
    @Operation(summary = "Obtener categorías de armas", 
               description = "Obtiene la lista de todas las categorías de armas para configurar límites")
    public ResponseEntity<List<Map<String, Object>>> obtenerCategoriasArmas() {
        try {
            log.info("🔫 Obteniendo lista de categorías de armas");
            
            List<com.armasimportacion.model.CategoriaArma> categorias = categoriaArmaService.getAllCategorias();
            
            List<Map<String, Object>> categoriasDTO = categorias.stream()
                .map(c -> {
                    Map<String, Object> categoriaMap = new HashMap<>();
                    categoriaMap.put("id", c.getId());
                    categoriaMap.put("nombre", c.getNombre());
                    categoriaMap.put("codigo", c.getCodigo());
                    categoriaMap.put("descripcion", c.getDescripcion());
                    return categoriaMap;
                })
                .collect(java.util.stream.Collectors.toList());
            
            return ResponseEntity.ok(categoriasDTO);
        } catch (Exception e) {
            log.error("❌ Error obteniendo categorías de armas: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of(error));
        }
    }

    /**
     * Crea un nuevo grupo de importación
     */
    @PostMapping
    @Operation(summary = "Crear grupo de importación", 
               description = "Crea un nuevo grupo de importación y bloquea la licencia asignada")
    public ResponseEntity<Map<String, Object>> crearGrupo(
            @Valid @RequestBody GrupoImportacionCreateDTO dto,
            @RequestHeader("Authorization") String authHeader) {
        try {
            log.info("📝 Creando nuevo grupo de importación: {}", dto.getNombre());
            
            Long usuarioId = obtenerUsuarioId(authHeader);
            com.armasimportacion.model.GrupoImportacion grupo = 
                grupoImportacionService.crearGrupoDesdeDTO(dto, usuarioId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", grupo.getId());
            response.put("nombre", grupo.getNombre());
            response.put("codigo", grupo.getCodigo());
            response.put("tra", grupo.getTra());
            response.put("tipoGrupo", grupo.getTipoGrupo());
            response.put("message", "Grupo de importación creado exitosamente");
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("❌ Error creando grupo de importación: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }
    
    /**
     * Actualiza un grupo de importación (editar vendedores y límites)
     */
    @PatchMapping("/{id}")
    @Operation(summary = "Actualizar grupo de importación", 
               description = "Actualiza un grupo de importación, permitiendo modificar vendedores y límites por categoría")
    public ResponseEntity<Map<String, Object>> actualizarGrupo(
            @PathVariable @NotNull @Positive Long id,
            @Valid @RequestBody GrupoImportacionCreateDTO dto,
            @RequestHeader("Authorization") String authHeader) {
        try {
            log.info("✏️ Actualizando grupo de importación ID: {}", id);
            
            Long usuarioId = obtenerUsuarioId(authHeader);
            com.armasimportacion.model.GrupoImportacion grupo = 
                grupoImportacionService.actualizarGrupoDesdeDTO(id, dto, usuarioId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", grupo.getId());
            response.put("nombre", grupo.getNombre());
            response.put("codigo", grupo.getCodigo());
            response.put("tra", grupo.getTra());
            response.put("tipoGrupo", grupo.getTipoGrupo());
            response.put("message", "Grupo de importación actualizado exitosamente");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Error actualizando grupo de importación ID {}: {}", id, e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

}


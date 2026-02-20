package com.armasimportacion.controller;

import com.armasimportacion.dto.DocumentoGrupoImportacionDTO;
import com.armasimportacion.dto.GrupoImportacionDTO;
import com.armasimportacion.exception.BadRequestException;
import com.armasimportacion.dto.GrupoImportacionResumenDTO;
import com.armasimportacion.enums.EstadoGrupoImportacion;
import com.armasimportacion.model.GrupoImportacion;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.security.JwtTokenProvider;
import com.armasimportacion.service.DocumentoGrupoImportacionService;
import com.armasimportacion.service.GrupoImportacionService;
import com.armasimportacion.service.GrupoImportacionWorkflowService;
import com.armasimportacion.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/operaciones")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Operaciones", description = "API para gestión de grupos de importación en operaciones")
@CrossOrigin(origins = "*")
public class OperacionesController {

    private final GrupoImportacionService grupoImportacionService;
    private final GrupoImportacionWorkflowService grupoImportacionWorkflowService;
    private final DocumentoGrupoImportacionService documentoGrupoImportacionService;
    private final UsuarioService usuarioService;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * Obtiene el usuario actual desde el token JWT
     */
    private Long obtenerUsuarioId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new BadRequestException("Token JWT requerido");
        }

        String token = authHeader.substring(7);
        String email = jwtTokenProvider.getUsernameFromToken(token);
        if (email == null) {
            throw new BadRequestException("Token JWT inválido");
        }
        
        Usuario usuario = usuarioService.findByEmail(email);
        return usuario.getId();
    }

    /**
     * Lista grupos de importación para operaciones
     * Solo grupos con estado SOLICITAR_PROFORMA_FABRICA o EN_PROCESO_OPERACIONES
     */
    @GetMapping("/grupos")
    @Operation(summary = "Listar grupos para operaciones", 
               description = "Obtiene la lista de grupos de importación que están en proceso de operaciones")
    public ResponseEntity<List<GrupoImportacionDTO>> listarGrupos(
            @RequestHeader("Authorization") String authHeader) {
        log.info("Listando grupos para operaciones");

        // TODO: Implementar filtrado por estado en el repositorio
        // Por ahora retornamos todos, el frontend filtrará
        List<GrupoImportacion> grupos =
            grupoImportacionService.obtenerGruposActivos();

        // Filtrar solo los que están en proceso de operaciones
        List<GrupoImportacion> gruposOperaciones = grupos.stream()
            .filter(g -> g.getEstado() == EstadoGrupoImportacion.SOLICITAR_PROFORMA_FABRICA ||
                        g.getEstado() == EstadoGrupoImportacion.EN_PROCESO_OPERACIONES)
            .toList();

        // Convertir a DTOs con información de documentos
        List<GrupoImportacionDTO> dtos = gruposOperaciones.stream()
            .map(g -> {
                GrupoImportacionDTO dto = new GrupoImportacionDTO();
                dto.setId(g.getId());
                dto.setNombre(g.getNombre());
                dto.setDescripcion(g.getDescripcion());
                dto.setEstado(g.getEstado());
                dto.setFechaCreacion(g.getFechaCreacion());
                dto.setFechaActualizacion(g.getFechaActualizacion());

                // Agregar información de estado de documentos
                try {
                    Map<String, Object> estadoDocs = documentoGrupoImportacionService.obtenerEstadoDocumentos(g.getId());
                    dto.setDocumentosCargados((Integer) estadoDocs.get("documentosCargados"));
                    dto.setDocumentosFaltantes((Integer) estadoDocs.get("documentosFaltantes"));
                    dto.setDocumentosRequeridosCargados((Integer) estadoDocs.get("documentosRequeridosCargados"));
                    dto.setPuedeNotificarPago((Boolean) estadoDocs.get("puedeNotificarPago"));
                } catch (Exception e) {
                    log.warn("Error obteniendo estado de documentos para grupo {}: {}", g.getId(), e.getMessage());
                }

                return dto;
            })
            .toList();

        return ResponseEntity.ok(dtos);
    }

    /**
     * Obtiene el detalle de un grupo de importación
     */
    @GetMapping("/grupos/{id}")
    @Operation(summary = "Obtener detalle de grupo", 
               description = "Obtiene la información completa de un grupo de importación")
    public ResponseEntity<GrupoImportacionResumenDTO> obtenerGrupo(
            @PathVariable Long id) {
        log.info("Obteniendo detalle del grupo ID: {}", id);

        GrupoImportacionResumenDTO resumen = grupoImportacionService.obtenerResumenGrupo(id);

        return ResponseEntity.ok(resumen);
    }

    /**
     * Carga un documento para un grupo de importación
     */
    @PostMapping("/grupos/{grupoId}/documentos")
    @Operation(summary = "Cargar documento", 
               description = "Carga un documento para un grupo de importación")
    public ResponseEntity<DocumentoGrupoImportacionDTO> cargarDocumento(
            @PathVariable Long grupoId,
            @RequestParam("tipoDocumentoId") Long tipoDocumentoId,
            @RequestParam("archivo") MultipartFile archivo,
            @RequestParam(value = "descripcion", required = false) String descripcion,
            @RequestHeader("Authorization") String authHeader) throws java.io.IOException {
        log.info("Cargando documento para grupo ID: {}, tipo: {}", grupoId, tipoDocumentoId);

        Long usuarioId = obtenerUsuarioId(authHeader);

        DocumentoGrupoImportacionDTO documento = documentoGrupoImportacionService.cargarDocumento(
            grupoId, tipoDocumentoId, archivo, descripcion, usuarioId);

        return ResponseEntity.ok(documento);
    }

    /**
     * Lista documentos de un grupo de importación
     */
    @GetMapping("/grupos/{grupoId}/documentos")
    @Operation(summary = "Listar documentos del grupo", 
               description = "Obtiene todos los documentos cargados para un grupo de importación")
    public ResponseEntity<List<DocumentoGrupoImportacionDTO>> listarDocumentos(
            @PathVariable Long grupoId) {
        log.info("Listando documentos del grupo ID: {}", grupoId);

        List<DocumentoGrupoImportacionDTO> documentos =
            documentoGrupoImportacionService.obtenerDocumentosPorGrupo(grupoId);

        return ResponseEntity.ok(documentos);
    }

    /**
     * Elimina un documento de un grupo
     */
    @DeleteMapping("/grupos/{grupoId}/documentos/{documentoId}")
    @Operation(summary = "Eliminar documento", 
               description = "Elimina un documento de un grupo de importación")
    public ResponseEntity<Void> eliminarDocumento(
            @PathVariable Long grupoId,
            @PathVariable Long documentoId) {
        log.info("Eliminando documento ID: {} del grupo ID: {}", documentoId, grupoId);

        documentoGrupoImportacionService.eliminarDocumento(documentoId);

        return ResponseEntity.noContent().build();
    }

    /**
     * Notifica el pago a fábrica
     */
    @PostMapping("/grupos/{grupoId}/notificar-pago-fabrica")
    @Operation(summary = "Notificar pago a fábrica", 
               description = "Notifica que se realizó el pago a fábrica. Requiere documentos 1, 2, 3 cargados")
    public ResponseEntity<Map<String, String>> notificarPagoFabrica(
            @PathVariable Long grupoId,
            @RequestHeader("Authorization") String authHeader) {
        log.info("Notificando pago a fabrica para grupo ID: {}", grupoId);

        Long usuarioId = obtenerUsuarioId(authHeader);

        grupoImportacionWorkflowService.notificarPagoFabrica(grupoId, usuarioId);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Pago a fábrica notificado exitosamente");

        return ResponseEntity.ok(response);
    }

    /**
     * Verifica si se puede notificar el pago a fábrica
     */
    @GetMapping("/grupos/{grupoId}/puede-notificar-pago")
    @Operation(summary = "Verificar si puede notificar pago", 
               description = "Verifica si los documentos requeridos están cargados para notificar pago")
    public ResponseEntity<Map<String, Object>> puedeNotificarPago(
            @PathVariable Long grupoId) {
        boolean puedeNotificar = documentoGrupoImportacionService.verificarDocumentosRequeridos(grupoId);

        Map<String, Object> response = new HashMap<>();
        response.put("puedeNotificar", puedeNotificar);
        response.put("mensaje", puedeNotificar ?
            "Todos los documentos requeridos están cargados" :
            "Faltan documentos requeridos (1, 2, 3)");

        return ResponseEntity.ok(response);
    }

    /**
     * Registra la fecha aproximada de llegada
     */
    @PutMapping("/grupos/{grupoId}/fecha-llegada")
    @Operation(summary = "Registrar fecha de llegada", 
               description = "Registra la fecha aproximada de llegada de la importación")
    public ResponseEntity<Map<String, String>> registrarFechaLlegada(
            @PathVariable Long grupoId,
            @RequestParam("fechaLlegada") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaLlegada,
            @RequestHeader("Authorization") String authHeader) {
        log.info("Registrando fecha de llegada para grupo ID: {} - Fecha: {}", grupoId, fechaLlegada);

        Long usuarioId = obtenerUsuarioId(authHeader);

        grupoImportacionWorkflowService.registrarFechaLlegada(grupoId, fechaLlegada, usuarioId);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Fecha de llegada registrada exitosamente");

        return ResponseEntity.ok(response);
    }

    /**
     * Registra el número de previa importación
     */
    @PutMapping("/grupos/{grupoId}/numero-previa")
    @Operation(summary = "Registrar número de previa", 
               description = "Registra el número de previa importación")
    public ResponseEntity<Map<String, String>> registrarNumeroPrevia(
            @PathVariable Long grupoId,
            @RequestParam("numeroPrevia") String numeroPrevia,
            @RequestHeader("Authorization") String authHeader) {
        log.info("Registrando numero de previa para grupo ID: {} - Numero: {}", grupoId, numeroPrevia);

        Long usuarioId = obtenerUsuarioId(authHeader);

        grupoImportacionWorkflowService.registrarNumeroPreviaImportacion(grupoId, numeroPrevia, usuarioId);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Número de previa importación registrado exitosamente");

        return ResponseEntity.ok(response);
    }
}


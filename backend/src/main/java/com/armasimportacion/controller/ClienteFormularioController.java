package com.armasimportacion.controller;

import com.armasimportacion.dto.PreguntaClienteDTO;
import com.armasimportacion.dto.TipoDocumentoDTO;
import com.armasimportacion.enums.TipoProceso;
import com.armasimportacion.service.PreguntaClienteService;
import com.armasimportacion.service.TipoDocumentoService;
import com.armasimportacion.service.TipoClienteService;
import com.armasimportacion.mapper.PreguntaClienteMapper;
import com.armasimportacion.mapper.TipoDocumentoMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cliente-formulario")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Formulario de Cliente", description = "API para obtener preguntas y documentos del formulario de cliente")
@CrossOrigin(origins = "*")
public class ClienteFormularioController {

    private final PreguntaClienteService preguntaService;
    private final TipoDocumentoService documentoService;
    private final TipoClienteService tipoClienteService;
    private final PreguntaClienteMapper preguntaMapper;
    private final TipoDocumentoMapper documentoMapper;

    @GetMapping("/{tipoClienteId}")
    @Operation(summary = "Obtener preguntas y documentos por tipo de cliente", description = "Retorna las preguntas y documentos necesarios para un tipo de cliente específico")
    public ResponseEntity<Map<String, Object>> getFormularioByTipoCliente(@PathVariable Long tipoClienteId) {
        log.info("Solicitud para obtener formulario del tipo de cliente: {}", tipoClienteId);
        
        try {
            // Obtener el tipo de cliente desde la base de datos
            var tipoCliente = tipoClienteService.findById(tipoClienteId);
            
            // Usar el tipoProcesoId directamente desde la entidad
            Long tipoProcesoId = tipoCliente.getTipoProcesoId();
            
            // Obtener preguntas y documentos para ese tipo de proceso
            List<PreguntaClienteDTO> preguntas = preguntaMapper.toDTOList(
                preguntaService.findByTipoProcesoId(tipoProcesoId)
            );
            
            List<TipoDocumentoDTO> documentos = documentoMapper.toDTOList(
                documentoService.findByTipoProcesoId(tipoProcesoId)
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("tipoCliente", tipoCliente.getNombre());
            response.put("tipoProcesoId", tipoProcesoId);
            response.put("preguntas", preguntas);
            response.put("documentos", documentos);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error obteniendo formulario para tipo de cliente {}: {}", tipoClienteId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{tipoClienteId}/{estadoMilitar}")
    @Operation(summary = "Obtener preguntas y documentos por tipo de cliente y estado militar", description = "Retorna las preguntas y documentos considerando el estado militar (ACTIVO/PASIVO)")
    public ResponseEntity<Map<String, Object>> getFormularioByTipoClienteYEstadoMilitar(
            @PathVariable Long tipoClienteId, 
            @PathVariable String estadoMilitar) {
        log.info("Solicitud para obtener formulario del tipo de cliente: {} con estado militar: {}", tipoClienteId, estadoMilitar);
        
        try {
            // Obtener el tipo de cliente desde la base de datos
            var tipoCliente = tipoClienteService.findById(tipoClienteId);
            
            // Determinar el tipo de proceso considerando el estado militar
            Long tipoProcesoId = determinarTipoProcesoConEstadoMilitar(tipoCliente, estadoMilitar);
            
            // Obtener preguntas y documentos para ese tipo de proceso
            List<PreguntaClienteDTO> preguntas = preguntaMapper.toDTOList(
                preguntaService.findByTipoProcesoId(tipoProcesoId)
            );
            
            List<TipoDocumentoDTO> documentos = documentoMapper.toDTOList(
                documentoService.findByTipoProcesoId(tipoProcesoId)
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("tipoCliente", tipoCliente.getNombre());
            response.put("estadoMilitar", estadoMilitar);
            response.put("tipoProcesoId", tipoProcesoId);
            response.put("preguntas", preguntas);
            response.put("documentos", documentos);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error obteniendo formulario para tipo de cliente {} con estado militar {}: {}", tipoClienteId, estadoMilitar, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Determina el tipo de proceso considerando el estado militar/policial
     * Si es uniformado PASIVO, se trata como civil
     */
    private Long determinarTipoProcesoConEstadoMilitar(com.armasimportacion.model.TipoCliente tipoCliente, String estadoMilitar) {
        boolean esPasivo = "PASIVO".equals(estadoMilitar);
        
        // Si es uniformado pero está PASIVO, se trata como civil
        if (tipoCliente.esUniformado() && esPasivo) {
            log.info("Cliente uniformado {} con estado PASIVO - tratando como civil", tipoCliente.getNombre());
            return TipoProceso.CUPO_CIVIL.getId();
        }
        
        // Para todos los demás casos, usar el tipoProcesoId de la entidad
        return tipoCliente.getTipoProcesoId();
    }
    
    @GetMapping("/tipos-cliente-config")
    @Operation(summary = "Obtener configuración de tipos de cliente", description = "Retorna la configuración completa de tipos de cliente con sus códigos y procesos desde la base de datos")
    public ResponseEntity<Map<String, Object>> getTiposClienteConfig() {
        log.info("Solicitud para obtener configuración dinámica de tipos de cliente desde BD");
        
        try {
            Map<String, Object> config = new HashMap<>();
            
            // Obtener todos los tipos de cliente desde la base de datos
            List<com.armasimportacion.model.TipoCliente> tiposCliente = tipoClienteService.findAll();
            
            for (com.armasimportacion.model.TipoCliente tipo : tiposCliente) {
                Map<String, Object> tipoConfig = new HashMap<>();
                tipoConfig.put("codigo", tipo.getCodigo());
                tipoConfig.put("tipoProcesoId", tipo.getTipoProcesoId());
                tipoConfig.put("requiereIssfa", tipo.getRequiereIssfa());
                tipoConfig.put("esMilitar", tipo.getEsMilitar());
                tipoConfig.put("esPolicia", tipo.getEsPolicia());
                tipoConfig.put("esEmpresa", tipo.getEsEmpresa());
                tipoConfig.put("esDeportista", tipo.getEsDeportista());
                tipoConfig.put("esCivil", tipo.getEsCivil());
                tipoConfig.put("debeTratarseComoCivilCuandoPasivo", tipo.getEsMilitar()); // Los militares pasivos se tratan como civiles
                
                config.put(tipo.getNombre(), tipoConfig);
            }
            
            log.info("✅ Configuración dinámica de {} tipos de cliente cargada desde BD", tiposCliente.size());
            return ResponseEntity.ok(config);
        } catch (Exception e) {
            log.error("❌ Error obteniendo configuración de tipos de cliente: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}

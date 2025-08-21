package com.armasimportacion.controller;

import com.armasimportacion.dto.PreguntaClienteDTO;
import com.armasimportacion.dto.TipoDocumentoDTO;
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
            // Obtener el tipo de cliente
            var tipoCliente = tipoClienteService.findById(tipoClienteId);
            
            // Determinar el tipo de proceso basado en el tipo de cliente
            Long tipoProcesoId = determinarTipoProceso(tipoCliente.getNombre());
            
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

    private Long determinarTipoProceso(String nombreTipoCliente) {
        // Mapeo de tipos de cliente a tipos de proceso
        switch (nombreTipoCliente) {
            case "Civil":
                return 1L; // Cupo Civil
            case "Militar Fuerza Terrestre":
            case "Militar Fuerza Naval":
            case "Militar Fuerza Aerea":
            case "Uniformado Policial":
                return 2L; // Extracupo Uniformado
            case "Compañía de Seguridad":
                return 3L; // Extracupo Empresa
            case "Deportista":
                return 4L; // Cupo Deportista
            default:
                return 1L; // Por defecto Cupo Civil
        }
    }
}

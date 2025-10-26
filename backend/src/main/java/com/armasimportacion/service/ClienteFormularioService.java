package com.armasimportacion.service;

import com.armasimportacion.dto.PreguntaClienteDTO;
import com.armasimportacion.dto.TipoDocumentoDTO;
import com.armasimportacion.mapper.PreguntaClienteMapper;
import com.armasimportacion.mapper.TipoDocumentoMapper;
import com.armasimportacion.model.TipoCliente;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class ClienteFormularioService {

    private final PreguntaClienteService preguntaService;
    private final TipoDocumentoService documentoService;
    private final TipoClienteService tipoClienteService;
    private final PreguntaClienteMapper preguntaMapper;
    private final TipoDocumentoMapper documentoMapper;

    public Map<String, Object> getFormularioPorTipoCliente(Long tipoClienteId) {
        log.info("Obteniendo formulario para tipo de cliente: {}", tipoClienteId);
        
        // Obtener el tipo de cliente
        TipoCliente tipoCliente = tipoClienteService.findById(tipoClienteId);
        log.info("Tipo de cliente encontrado: {}", tipoCliente.getNombre());
        
        // Determinar el tipo de proceso basado en el tipo de cliente
        Long tipoProcesoId = determinarTipoProceso(tipoCliente.getNombre());
        log.info("Tipo de proceso determinado: {}", tipoProcesoId);
        
        // Obtener preguntas y documentos para ese tipo de proceso
        List<PreguntaClienteDTO> preguntas = preguntaMapper.toDTOList(
            preguntaService.findByTipoProcesoId(tipoProcesoId)
        );
        log.info("Preguntas encontradas: {}", preguntas.size());
        
        List<TipoDocumentoDTO> documentos = documentoMapper.toDTOList(
            documentoService.findByTipoProcesoId(tipoProcesoId)
        );
        log.info("Documentos encontrados: {}", documentos.size());
        
        Map<String, Object> response = new HashMap<>();
        response.put("tipoCliente", tipoCliente.getNombre());
        response.put("tipoProcesoId", tipoProcesoId);
        response.put("preguntas", preguntas);
        response.put("documentos", documentos);
        
        log.info("Formulario generado exitosamente para tipo de cliente: {}", tipoClienteId);
        return response;
    }

    private Long determinarTipoProceso(String nombreTipoCliente) {
        // Mapeo de tipos de cliente a tipos de proceso
        switch (nombreTipoCliente) {
            case "Civil":
                return 1L; // Cupo Civil
            case "Militar Fuerza Terrestre":
            case "Militar Fuerza Naval":
            case "Militar Fuerza Aérea":
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

package com.armasimportacion.controller;

import com.armasimportacion.dto.TipoClienteDTO;
import com.armasimportacion.mapper.TipoClienteMapper;
import com.armasimportacion.service.TipoClienteService;
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
@RequestMapping("/api/tipos-cliente")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Tipos de Cliente", description = "API para gestión de tipos de cliente (plural)")
@CrossOrigin(origins = "*")
public class TiposClienteController {

    private final TipoClienteService service;
    private final TipoClienteMapper mapper;

    @GetMapping("/config")
    @Operation(summary = "Obtener configuración de tipos de cliente", description = "Retorna un mapa con la configuración de cada tipo de cliente para el frontend")
    public ResponseEntity<Map<String, Map<String, Object>>> getTiposClienteConfig() {
        log.info("✅ GET /api/tipos-cliente/config - Obteniendo configuración de tipos de cliente");
        
        List<TipoClienteDTO> tipos = mapper.toDTOList(service.findAllActive());
        Map<String, Map<String, Object>> config = new HashMap<>();
        
        for (TipoClienteDTO tipo : tipos) {
            Map<String, Object> tipoConfig = new HashMap<>();
            tipoConfig.put("codigo", tipo.getCodigo());
            tipoConfig.put("tipoProcesoId", tipo.getTipoProcesoId());
            tipoConfig.put("requiereIssfa", tipo.getRequiereIssfa());
            tipoConfig.put("esMilitar", tipo.getEsMilitar());
            tipoConfig.put("debeTratarseComoCivilCuandoPasivo", false);
            
            config.put(tipo.getNombre(), tipoConfig);
            log.info("  📋 Tipo: {} → Código: {}, Requiere ISSFA: {}", tipo.getNombre(), tipo.getCodigo(), tipo.getRequiereIssfa());
        }
        
        log.info("✅ Configuración generada para {} tipos de cliente", config.size());
        return ResponseEntity.ok(config);
    }
}


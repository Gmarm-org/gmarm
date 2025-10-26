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
@RequestMapping("/api/tipo-cliente")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Tipos de Cliente", description = "API para gestión de tipos de cliente")
@CrossOrigin(origins = "*")
public class TipoClienteController {

    private final TipoClienteService service;
    private final TipoClienteMapper mapper;

    @GetMapping
    @Operation(summary = "Obtener todos los tipos de cliente", description = "Retorna la lista de todos los tipos de cliente activos")
    public ResponseEntity<List<TipoClienteDTO>> getAllTiposCliente() {
        log.info("Solicitud para obtener todos los tipos de cliente");
        List<TipoClienteDTO> tipos = mapper.toDTOList(service.findAllActive());
        return ResponseEntity.ok(tipos);
    }

    @GetMapping("/config")
    @Operation(summary = "Obtener configuración de tipos de cliente", description = "Retorna un mapa con la configuración de cada tipo de cliente para el frontend")
    public ResponseEntity<Map<String, Map<String, Object>>> getTiposClienteConfig() {
        log.info("Solicitud para obtener configuración de tipos de cliente");
        
        List<TipoClienteDTO> tipos = mapper.toDTOList(service.findAllActive());
        Map<String, Map<String, Object>> config = new HashMap<>();
        
        for (TipoClienteDTO tipo : tipos) {
            Map<String, Object> tipoConfig = new HashMap<>();
            tipoConfig.put("codigo", tipo.getCodigo());
            tipoConfig.put("tipoProcesoId", tipo.getTipoProcesoId());
            tipoConfig.put("requiereIssfa", tipo.getRequiereIssfa());
            tipoConfig.put("esMilitar", tipo.getEsMilitar());
            tipoConfig.put("debeTratarseComoCivilCuandoPasivo", false); // Puedes ajustar esto según lógica de negocio
            
            config.put(tipo.getNombre(), tipoConfig);
        }
        
        log.info("Configuración de tipos de cliente generada: {} tipos", config.size());
        return ResponseEntity.ok(config);
    }
}

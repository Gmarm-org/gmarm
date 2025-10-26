package com.armasimportacion.controller;

import com.armasimportacion.dto.ConfiguracionSistemaDTO;
import com.armasimportacion.service.ConfiguracionSistemaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/configuracion-sistema")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Configuración del Sistema", description = "API para gestionar configuraciones del sistema")
@CrossOrigin(origins = "*")
public class ConfiguracionSistemaController {

    private final ConfiguracionSistemaService configuracionService;

    @GetMapping
    @Operation(summary = "Obtener configuración completa", description = "Retorna todas las configuraciones del sistema")
    public ResponseEntity<Map<String, Object>> getConfiguracionCompleta() {
        log.info("GET /api/configuracion-sistema - Obteniendo configuración completa");
        Map<String, Object> configuracion = configuracionService.getConfiguracionCompleta();
        return ResponseEntity.ok(configuracion);
    }

    @GetMapping("/{clave}")
    @Operation(summary = "Obtener configuración por clave", description = "Retorna una configuración específica por su clave")
    public ResponseEntity<ConfiguracionSistemaDTO> getConfiguracionPorClave(@PathVariable String clave) {
        log.info("GET /api/configuracion-sistema/{} - Obteniendo configuración", clave);
        ConfiguracionSistemaDTO configuracion = configuracionService.getConfiguracionPorClave(clave);
        return ResponseEntity.ok(configuracion);
    }

    @GetMapping("/valor/{clave}")
    @Operation(summary = "Obtener solo el valor de una configuración", description = "Retorna únicamente el valor de una configuración por su clave")
    public ResponseEntity<String> getValorConfiguracion(@PathVariable String clave) {
        log.info("GET /api/configuracion-sistema/valor/{} - Obteniendo valor", clave);
        String valor = configuracionService.getValorConfiguracion(clave);
        return ResponseEntity.ok(valor);
    }

    @GetMapping("/editables")
    @Operation(summary = "Obtener configuraciones editables", description = "Retorna solo las configuraciones que pueden ser modificadas")
    public ResponseEntity<List<ConfiguracionSistemaDTO>> getConfiguracionesEditables() {
        log.info("GET /api/configuracion-sistema/editables - Obteniendo configuraciones editables");
        List<ConfiguracionSistemaDTO> configuraciones = configuracionService.getConfiguracionesEditables();
        return ResponseEntity.ok(configuraciones);
    }

    @PutMapping("/{clave}")
    @Operation(summary = "Actualizar configuración", description = "Actualiza el valor de una configuración existente")
    public ResponseEntity<ConfiguracionSistemaDTO> updateConfiguracion(
            @PathVariable String clave,
            @RequestBody ConfiguracionSistemaDTO configuracionDTO) {
        log.info("PUT /api/configuracion-sistema/{} - Actualizando configuración", clave);
        ConfiguracionSistemaDTO configuracionActualizada = configuracionService.updateConfiguracion(clave, configuracionDTO);
        return ResponseEntity.ok(configuracionActualizada);
    }
}


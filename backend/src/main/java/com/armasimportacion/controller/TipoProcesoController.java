package com.armasimportacion.controller;

import com.armasimportacion.dto.TipoProcesoDTO;
import com.armasimportacion.mapper.TipoProcesoMapper;
import com.armasimportacion.service.TipoProcesoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tipo-proceso")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Tipos de Proceso", description = "API para gestión de tipos de proceso")
@CrossOrigin(origins = "*")
public class TipoProcesoController {

    private final TipoProcesoService service;
    private final TipoProcesoMapper mapper;

    @GetMapping
    @Operation(summary = "Obtener todos los tipos de proceso", description = "Retorna la lista de todos los tipos de proceso activos")
    public ResponseEntity<List<TipoProcesoDTO>> getAllTiposProceso() {
        log.info("Solicitud para obtener todos los tipos de proceso");
        List<TipoProcesoDTO> tipos = mapper.toDTOList(service.findAllActive());
        return ResponseEntity.ok(tipos);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener tipo de proceso por ID", description = "Retorna un tipo de proceso específico por su ID")
    public ResponseEntity<TipoProcesoDTO> getTipoProcesoById(@PathVariable Long id) {
        log.info("Solicitud para obtener tipo de proceso con ID: {}", id);
        TipoProcesoDTO tipo = mapper.toDTO(service.findById(id));
        return ResponseEntity.ok(tipo);
    }
}

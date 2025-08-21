package com.armasimportacion.controller;

import com.armasimportacion.dto.TipoDocumentoDTO;
import com.armasimportacion.mapper.TipoDocumentoMapper;
import com.armasimportacion.service.TipoDocumentoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tipo-documento")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Tipos de Documento", description = "API para gestión de tipos de documento")
@CrossOrigin(origins = "*")
public class TipoDocumentoController {

    private final TipoDocumentoService service;
    private final TipoDocumentoMapper mapper;

    @GetMapping
    @Operation(summary = "Obtener todos los tipos de documento", description = "Retorna la lista de todos los tipos de documento activos")
    public ResponseEntity<List<TipoDocumentoDTO>> getAllTiposDocumento() {
        log.info("Solicitud para obtener todos los tipos de documento");
        List<TipoDocumentoDTO> tipos = mapper.toDTOList(service.findAllActive());
        return ResponseEntity.ok(tipos);
    }

    @GetMapping("/tipo-proceso/{tipoProcesoId}")
    @Operation(summary = "Obtener tipos de documento por tipo de proceso", description = "Retorna los tipos de documento para un tipo de proceso específico")
    public ResponseEntity<List<TipoDocumentoDTO>> getTiposDocumentoByTipoProceso(@PathVariable Long tipoProcesoId) {
        log.info("Solicitud para obtener tipos de documento del tipo de proceso: {}", tipoProcesoId);
        List<TipoDocumentoDTO> tipos = mapper.toDTOList(service.findByTipoProcesoId(tipoProcesoId));
        return ResponseEntity.ok(tipos);
    }
}

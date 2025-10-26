package com.armasimportacion.controller;

import com.armasimportacion.dto.PreguntaClienteDTO;
import com.armasimportacion.mapper.PreguntaClienteMapper;
import com.armasimportacion.service.PreguntaClienteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pregunta-cliente")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Preguntas del Cliente", description = "API para gestión de preguntas del cliente")
@CrossOrigin(origins = "*")
public class PreguntaClienteController {

    private final PreguntaClienteService service;
    private final PreguntaClienteMapper mapper;

    @GetMapping
    @Operation(summary = "Obtener todas las preguntas", description = "Retorna la lista de todas las preguntas activas")
    public ResponseEntity<List<PreguntaClienteDTO>> getAllPreguntas() {
        log.info("Solicitud para obtener todas las preguntas");
        List<PreguntaClienteDTO> preguntas = mapper.toDTOList(service.findAllActive());
        return ResponseEntity.ok(preguntas);
    }

    @GetMapping("/tipo-proceso/{tipoProcesoId}")
    @Operation(summary = "Obtener preguntas por tipo de proceso", description = "Retorna las preguntas para un tipo de proceso específico")
    public ResponseEntity<List<PreguntaClienteDTO>> getPreguntasByTipoProceso(@PathVariable Long tipoProcesoId) {
        log.info("Solicitud para obtener preguntas del tipo de proceso: {}", tipoProcesoId);
        List<PreguntaClienteDTO> preguntas = mapper.toDTOList(service.findByTipoProcesoId(tipoProcesoId));
        return ResponseEntity.ok(preguntas);
    }
}

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
    @Operation(summary = "Obtener todas las preguntas", description = "Retorna la lista de todas las preguntas")
    public ResponseEntity<List<PreguntaClienteDTO>> getAllPreguntas(
            @RequestParam(required = false, defaultValue = "false") boolean incluirInactivas) {
        log.info("GET /api/pregunta-cliente - Obteniendo preguntas (incluirInactivas: {})", incluirInactivas);
        List<PreguntaClienteDTO> preguntas = incluirInactivas
            ? mapper.toDTOList(service.findAll())
            : mapper.toDTOList(service.findAllActive());
        log.info("Preguntas encontradas: {}", preguntas.size());
        return ResponseEntity.ok(preguntas);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener pregunta por ID", description = "Retorna una pregunta específica")
    public ResponseEntity<PreguntaClienteDTO> getPreguntaById(@PathVariable Long id) {
        log.info("GET /api/pregunta-cliente/{} - Obteniendo pregunta", id);
        return ResponseEntity.ok(mapper.toDTO(service.findById(id)));
    }

    @GetMapping("/tipo-proceso/{tipoProcesoId}")
    @Operation(summary = "Obtener preguntas por tipo de proceso", description = "Retorna las preguntas para un tipo de proceso específico")
    public ResponseEntity<List<PreguntaClienteDTO>> getPreguntasByTipoProceso(@PathVariable Long tipoProcesoId) {
        log.info("Solicitud para obtener preguntas del tipo de proceso: {}", tipoProcesoId);
        List<PreguntaClienteDTO> preguntas = mapper.toDTOList(service.findByTipoProcesoId(tipoProcesoId));
        return ResponseEntity.ok(preguntas);
    }

    @PostMapping
    @Operation(summary = "Crear nueva pregunta", description = "Crea una nueva pregunta para clientes")
    public ResponseEntity<PreguntaClienteDTO> createPregunta(@RequestBody PreguntaClienteDTO dto) {
        log.info("POST /api/pregunta-cliente - Creando nueva pregunta: {}", dto.getPregunta());
        var entity = mapper.toEntity(dto);
        var saved = service.save(entity);
        log.info("Pregunta creada con ID: {}", saved.getId());
        return ResponseEntity.ok(mapper.toDTO(saved));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar pregunta", description = "Actualiza una pregunta existente")
    public ResponseEntity<PreguntaClienteDTO> updatePregunta(@PathVariable Long id, @RequestBody PreguntaClienteDTO dto) {
        log.info("PUT /api/pregunta-cliente/{} - Actualizando pregunta", id);
        var existing = service.findById(id);
        existing.setPregunta(dto.getPregunta());
        existing.setOrden(dto.getOrden());
        existing.setObligatoria(dto.getObligatoria());
        existing.setEstado(dto.getEstado());
        existing.setTipoRespuesta(dto.getTipoRespuesta());
        var updated = service.save(existing);
        log.info("Pregunta actualizada: {}", updated.getPregunta());
        return ResponseEntity.ok(mapper.toDTO(updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar pregunta", description = "Elimina una pregunta")
    public ResponseEntity<Void> deletePregunta(@PathVariable Long id) {
        log.info("DELETE /api/pregunta-cliente/{} - Eliminando pregunta", id);
        service.delete(id);
        log.info("Pregunta eliminada");
        return ResponseEntity.ok().build();
    }
}

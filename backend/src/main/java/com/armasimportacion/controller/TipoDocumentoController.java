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
    @Operation(summary = "Obtener todos los tipos de documento", description = "Retorna la lista de todos los tipos de documento")
    public ResponseEntity<List<TipoDocumentoDTO>> getAllTiposDocumento(
            @RequestParam(required = false, defaultValue = "false") boolean incluirInactivos) {
        log.info("📋 GET /api/tipo-documento - Obteniendo tipos (incluirInactivos: {})", incluirInactivos);
        List<TipoDocumentoDTO> tipos = incluirInactivos
            ? mapper.toDTOList(service.findAll())
            : mapper.toDTOList(service.findAllActive());
        log.info("✅ Tipos de documento encontrados: {}", tipos.size());
        return ResponseEntity.ok(tipos);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener tipo de documento por ID", description = "Retorna un tipo de documento específico")
    public ResponseEntity<TipoDocumentoDTO> getTipoDocumentoById(@PathVariable Long id) {
        log.info("📋 GET /api/tipo-documento/{} - Obteniendo tipo", id);
        return ResponseEntity.ok(mapper.toDTO(service.findById(id)));
    }

    @GetMapping("/tipo-proceso/{tipoProcesoId}")
    @Operation(summary = "Obtener tipos de documento por tipo de proceso", description = "Retorna los tipos de documento para un tipo de proceso específico")
    public ResponseEntity<List<TipoDocumentoDTO>> getTiposDocumentoByTipoProceso(@PathVariable Long tipoProcesoId) {
        log.info("Solicitud para obtener tipos de documento del tipo de proceso: {}", tipoProcesoId);
        List<TipoDocumentoDTO> tipos = mapper.toDTOList(service.findByTipoProcesoId(tipoProcesoId));
        return ResponseEntity.ok(tipos);
    }

    @PostMapping
    @Operation(summary = "Crear nuevo tipo de documento", description = "Crea un nuevo tipo de documento")
    public ResponseEntity<TipoDocumentoDTO> createTipoDocumento(@RequestBody TipoDocumentoDTO dto) {
        log.info("📝 POST /api/tipo-documento - Creando nuevo tipo: {}", dto.getNombre());
        var entity = mapper.toEntity(dto);
        var saved = service.save(entity);
        log.info("✅ Tipo de documento creado con ID: {}", saved.getId());
        return ResponseEntity.ok(mapper.toDTO(saved));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar tipo de documento", description = "Actualiza un tipo de documento existente")
    public ResponseEntity<TipoDocumentoDTO> updateTipoDocumento(@PathVariable Long id, @RequestBody TipoDocumentoDTO dto) {
        log.info("📝 PUT /api/tipo-documento/{} - Actualizando tipo", id);
        var existing = service.findById(id);
        existing.setNombre(dto.getNombre());
        existing.setDescripcion(dto.getDescripcion());
        existing.setObligatorio(dto.getObligatorio());
        existing.setEstado(dto.getEstado());
        var updated = service.save(existing);
        log.info("✅ Tipo de documento actualizado: {}", updated.getNombre());
        return ResponseEntity.ok(mapper.toDTO(updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar tipo de documento", description = "Elimina un tipo de documento")
    public ResponseEntity<Void> deleteTipoDocumento(@PathVariable Long id) {
        log.info("🗑️ DELETE /api/tipo-documento/{} - Eliminando tipo", id);
        service.delete(id);
        log.info("✅ Tipo de documento eliminado");
        return ResponseEntity.ok().build();
    }
}

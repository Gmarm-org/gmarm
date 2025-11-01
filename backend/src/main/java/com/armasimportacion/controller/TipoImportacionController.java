package com.armasimportacion.controller;

import com.armasimportacion.dto.TipoImportacionDTO;
import com.armasimportacion.mapper.TipoImportacionMapper;
import com.armasimportacion.service.TipoImportacionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tipo-importacion")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Tipos de Importación", description = "Gestión de tipos de importación")
@CrossOrigin(origins = "*")
public class TipoImportacionController {

    private final TipoImportacionService service;
    private final TipoImportacionMapper mapper;

    @GetMapping
    @Operation(summary = "Obtener todos los tipos de importación", description = "Retorna la lista de todos los tipos de importación")
    public ResponseEntity<List<TipoImportacionDTO>> getAllTiposImportacion(
            @RequestParam(required = false, defaultValue = "false") boolean incluirInactivos) {
        log.info("📋 GET /api/tipo-importacion - Obteniendo tipos (incluirInactivos: {})", incluirInactivos);
        List<TipoImportacionDTO> tipos = incluirInactivos 
            ? mapper.toDTOList(service.findAll())
            : mapper.toDTOList(service.findAllActive());
        log.info("✅ Tipos de importación encontrados: {}", tipos.size());
        return ResponseEntity.ok(tipos);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener tipo de importación por ID", description = "Retorna un tipo de importación específico")
    public ResponseEntity<TipoImportacionDTO> getTipoImportacionById(@PathVariable Long id) {
        log.info("📋 GET /api/tipo-importacion/{} - Obteniendo tipo", id);
        return ResponseEntity.ok(mapper.toDTO(service.findById(id)));
    }

    @PostMapping
    @Operation(summary = "Crear nuevo tipo de importación", description = "Crea un nuevo tipo de importación")
    public ResponseEntity<TipoImportacionDTO> createTipoImportacion(@RequestBody TipoImportacionDTO dto) {
        log.info("📝 POST /api/tipo-importacion - Creando nuevo tipo: {}", dto.getNombre());
        var entity = mapper.toEntity(dto);
        var saved = service.save(entity);
        log.info("✅ Tipo de importación creado con ID: {}", saved.getId());
        return ResponseEntity.ok(mapper.toDTO(saved));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar tipo de importación", description = "Actualiza un tipo de importación existente")
    public ResponseEntity<TipoImportacionDTO> updateTipoImportacion(@PathVariable Long id, @RequestBody TipoImportacionDTO dto) {
        log.info("📝 PUT /api/tipo-importacion/{} - Actualizando tipo", id);
        var existing = service.findById(id);
        existing.setCodigo(dto.getCodigo());
        existing.setNombre(dto.getNombre());
        existing.setCupoMaximo(dto.getCupoMaximo());
        existing.setDescripcion(dto.getDescripcion());
        existing.setEstado(dto.getEstado());
        var updated = service.save(existing);
        log.info("✅ Tipo de importación actualizado: {}", updated.getNombre());
        return ResponseEntity.ok(mapper.toDTO(updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar tipo de importación", description = "Elimina un tipo de importación")
    public ResponseEntity<Void> deleteTipoImportacion(@PathVariable Long id) {
        log.info("🗑️ DELETE /api/tipo-importacion/{} - Eliminando tipo", id);
        service.delete(id);
        log.info("✅ Tipo de importación eliminado");
        return ResponseEntity.ok().build();
    }
}


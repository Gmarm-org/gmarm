package com.armasimportacion.controller;

import com.armasimportacion.dto.TipoIdentificacionDTO;
import com.armasimportacion.mapper.TipoIdentificacionMapper;
import com.armasimportacion.service.TipoIdentificacionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tipo-identificacion")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Tipos de Identificación", description = "API para gestión de tipos de identificación")
@CrossOrigin(origins = "*")
public class TipoIdentificacionController {

    private final TipoIdentificacionService service;
    private final TipoIdentificacionMapper mapper;

    @GetMapping
    @Operation(summary = "Obtener todos los tipos de identificación", description = "Retorna la lista de todos los tipos de identificación")
    public ResponseEntity<List<TipoIdentificacionDTO>> getAllTiposIdentificacion(
            @RequestParam(required = false, defaultValue = "false") boolean incluirInactivos) {
        log.info("Solicitud para obtener todos los tipos de identificación (incluirInactivos: {})", incluirInactivos);
        List<TipoIdentificacionDTO> tipos = incluirInactivos 
            ? mapper.toDTOList(service.findAll())
            : mapper.toDTOList(service.findAllActive());
        log.info("✅ Tipos de identificación encontrados: {}", tipos.size());
        return ResponseEntity.ok(tipos);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener tipo de identificación por ID", description = "Retorna un tipo de identificación específico")
    public ResponseEntity<TipoIdentificacionDTO> getTipoIdentificacionById(@PathVariable Long id) {
        log.info("📋 GET /api/tipo-identificacion/{} - Obteniendo tipo", id);
        return ResponseEntity.ok(mapper.toDTO(service.findById(id)));
    }

    @PostMapping
    @Operation(summary = "Crear nuevo tipo de identificación", description = "Crea un nuevo tipo de identificación")
    public ResponseEntity<TipoIdentificacionDTO> createTipoIdentificacion(@RequestBody TipoIdentificacionDTO dto) {
        log.info("📝 POST /api/tipo-identificacion - Creando nuevo tipo: {}", dto.getNombre());
        var entity = mapper.toEntity(dto);
        var saved = service.save(entity);
        log.info("✅ Tipo de identificación creado con ID: {}", saved.getId());
        return ResponseEntity.ok(mapper.toDTO(saved));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar tipo de identificación", description = "Actualiza un tipo de identificación existente")
    public ResponseEntity<TipoIdentificacionDTO> updateTipoIdentificacion(@PathVariable Long id, @RequestBody TipoIdentificacionDTO dto) {
        log.info("📝 PUT /api/tipo-identificacion/{} - Actualizando tipo", id);
        var existing = service.findById(id);
        existing.setNombre(dto.getNombre());
        existing.setDescripcion(dto.getDescripcion());
        existing.setEstado(dto.getEstado());
        var updated = service.save(existing);
        log.info("✅ Tipo de identificación actualizado: {}", updated.getNombre());
        return ResponseEntity.ok(mapper.toDTO(updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar tipo de identificación", description = "Elimina un tipo de identificación")
    public ResponseEntity<Void> deleteTipoIdentificacion(@PathVariable Long id) {
        log.info("🗑️ DELETE /api/tipo-identificacion/{} - Eliminando tipo", id);
        service.delete(id);
        log.info("✅ Tipo de identificación eliminado");
        return ResponseEntity.ok().build();
    }
}

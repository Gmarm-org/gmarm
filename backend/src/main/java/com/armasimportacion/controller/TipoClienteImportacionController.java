package com.armasimportacion.controller;

import com.armasimportacion.dto.TipoClienteImportacionDTO;
import com.armasimportacion.mapper.TipoClienteImportacionMapper;
import com.armasimportacion.service.TipoClienteImportacionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tipo-cliente-importacion")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Tipo Cliente Importación", description = "Gestión de relación entre tipos de cliente y tipos de importación")
@CrossOrigin(origins = "*")
public class TipoClienteImportacionController {

    private final TipoClienteImportacionService service;
    private final TipoClienteImportacionMapper mapper;

    @GetMapping
    @Operation(summary = "Obtener todas las relaciones", description = "Retorna todas las relaciones tipo cliente - tipo importación")
    public ResponseEntity<List<TipoClienteImportacionDTO>> getAll() {
        log.info("📋 GET /api/tipo-cliente-importacion - Obteniendo todas las relaciones");
        List<TipoClienteImportacionDTO> relaciones = mapper.toDTOList(service.findAll());
        log.info("✅ Relaciones encontradas: {}", relaciones.size());
        return ResponseEntity.ok(relaciones);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener relación por ID", description = "Retorna una relación específica")
    public ResponseEntity<TipoClienteImportacionDTO> getById(@PathVariable Long id) {
        log.info("📋 GET /api/tipo-cliente-importacion/{} - Obteniendo relación", id);
        return ResponseEntity.ok(mapper.toDTO(service.findById(id)));
    }

    @GetMapping("/tipo-cliente/{tipoClienteId}")
    @Operation(summary = "Obtener por tipo de cliente", description = "Retorna relaciones para un tipo de cliente específico")
    public ResponseEntity<List<TipoClienteImportacionDTO>> getByTipoCliente(@PathVariable Long tipoClienteId) {
        log.info("📋 GET /api/tipo-cliente-importacion/tipo-cliente/{} - Obteniendo relaciones", tipoClienteId);
        List<TipoClienteImportacionDTO> relaciones = mapper.toDTOList(service.findByTipoClienteId(tipoClienteId));
        return ResponseEntity.ok(relaciones);
    }

    @PostMapping
    @Operation(summary = "Crear nueva relación", description = "Crea una nueva relación tipo cliente - tipo importación")
    public ResponseEntity<TipoClienteImportacionDTO> create(@RequestBody TipoClienteImportacionDTO dto) {
        log.info("📝 POST /api/tipo-cliente-importacion - Creando nueva relación");
        var entity = mapper.toEntity(dto);
        var saved = service.save(entity);
        log.info("✅ Relación creada con ID: {}", saved.getId());
        return ResponseEntity.ok(mapper.toDTO(saved));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar relación", description = "Elimina una relación tipo cliente - tipo importación")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        log.info("🗑️ DELETE /api/tipo-cliente-importacion/{} - Eliminando relación", id);
        service.delete(id);
        log.info("✅ Relación eliminada");
        return ResponseEntity.ok().build();
    }
}


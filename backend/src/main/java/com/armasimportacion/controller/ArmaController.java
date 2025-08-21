package com.armasimportacion.controller;

import com.armasimportacion.dto.ArmaDTO;
import com.armasimportacion.mapper.ArmaMapper;
import com.armasimportacion.model.Arma;
import com.armasimportacion.service.ArmaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/arma")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Armas", description = "API para gestionar armas")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://localhost:8080"})
public class ArmaController {

    private final ArmaService armaService;
    private final ArmaMapper armaMapper;

    @GetMapping
    @Operation(summary = "Obtener todas las armas", description = "Retorna la lista de todas las armas disponibles")
    public ResponseEntity<List<ArmaDTO>> getAllArmas() {
        log.info("Solicitud para obtener todas las armas");
        List<Arma> armas = armaService.findAllActive();
        log.info("Total de armas devueltas por la API: {}", armas.size());
        List<ArmaDTO> armasDTO = armaMapper.toDTOList(armas);
        return ResponseEntity.ok(armasDTO);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener arma por ID", description = "Retorna una arma específica por su ID")
    public ResponseEntity<ArmaDTO> getArmaById(@PathVariable Long id) {
        log.info("Solicitud para obtener arma con ID: {}", id);
        Arma arma = armaService.findById(id);
        ArmaDTO armaDTO = armaMapper.toDTO(arma);
        return ResponseEntity.ok(armaDTO);
    }

    @GetMapping("/categoria/{categoriaId}")
    @Operation(summary = "Obtener armas por categoría", description = "Retorna armas filtradas por categoría")
    public ResponseEntity<List<ArmaDTO>> getArmasByCategoria(@PathVariable Long categoriaId) {
        log.info("Solicitud para obtener armas por categoría: {}", categoriaId);
        List<Arma> armas = armaService.findByCategoriaId(categoriaId);
        List<ArmaDTO> armasDTO = armaMapper.toDTOList(armas);
        return ResponseEntity.ok(armasDTO);
    }

    @GetMapping("/disponibles")
    @Operation(summary = "Obtener armas disponibles", description = "Retorna solo las armas disponibles")
    public ResponseEntity<List<ArmaDTO>> getArmasDisponibles() {
        log.info("Solicitud para obtener armas disponibles");
        List<Arma> armas = armaService.findAllActive();
        List<ArmaDTO> armasDTO = armaMapper.toDTOList(armas);
        return ResponseEntity.ok(armasDTO);
    }

    @PostMapping
    @Operation(summary = "Crear nueva arma", description = "Crea una nueva arma en el sistema")
    public ResponseEntity<ArmaDTO> createArma(@RequestBody Arma arma) {
        log.info("Solicitud para crear nueva arma: {}", arma.getNombre());
        Arma nuevaArma = armaService.save(arma);
        ArmaDTO armaDTO = armaMapper.toDTO(nuevaArma);
        return ResponseEntity.ok(armaDTO);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar arma", description = "Actualiza una arma existente")
    public ResponseEntity<ArmaDTO> updateArma(@PathVariable Long id, @RequestBody Arma armaDetails) {
        log.info("Solicitud para actualizar arma con ID: {}", id);
        Arma armaActualizada = armaService.update(id, armaDetails);
        ArmaDTO armaDTO = armaMapper.toDTO(armaActualizada);
        return ResponseEntity.ok(armaDTO);
    }

    @PatchMapping("/{id}/estado")
    @Operation(summary = "Cambiar estado de arma", description = "Cambia el estado de una arma")
    public ResponseEntity<ArmaDTO> changeEstado(@PathVariable Long id, @RequestParam Boolean estado) {
        log.info("Solicitud para cambiar estado de arma ID: {} a: {}", id, estado);
        Arma arma = armaService.changeEstado(id, estado);
        ArmaDTO armaDTO = armaMapper.toDTO(arma);
        return ResponseEntity.ok(armaDTO);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar arma", description = "Elimina una arma (cambia estado a false)")
    public ResponseEntity<Void> deleteArma(@PathVariable Long id) {
        log.info("Solicitud para eliminar arma con ID: {}", id);
        armaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

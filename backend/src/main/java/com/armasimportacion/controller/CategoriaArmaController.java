package com.armasimportacion.controller;

import com.armasimportacion.dto.CategoriaArmaDTO;
import com.armasimportacion.mapper.CategoriaArmaMapper;
import com.armasimportacion.model.CategoriaArma;
import com.armasimportacion.service.CategoriaArmaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categoria-arma")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Categorías de Armas", description = "API para gestionar categorías de armas")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://localhost:8080"})
public class CategoriaArmaController {

    private final CategoriaArmaService categoriaArmaService;
    private final CategoriaArmaMapper categoriaArmaMapper;

    @GetMapping
    @Operation(summary = "Obtener todas las categorías de armas", description = "Retorna la lista completa de categorías de armas")
    public ResponseEntity<List<CategoriaArmaDTO>> getAllCategorias() {
        log.info("Solicitud para obtener todas las categorías de armas");
        
        try {
            List<CategoriaArma> categorias = categoriaArmaService.getAllCategorias();
            List<CategoriaArmaDTO> categoriasDTO = categoriaArmaMapper.toDTOList(categorias);
            
            log.info("Categorías obtenidas exitosamente: {}", categorias.size());
            return ResponseEntity.ok(categoriasDTO);
            
        } catch (Exception e) {
            log.error("Error obteniendo categorías de armas", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener categoría por ID", description = "Retorna una categoría específica por su ID")
    public ResponseEntity<CategoriaArmaDTO> getCategoriaById(@PathVariable Long id) {
        log.info("Solicitud para obtener categoría de arma con ID: {}", id);
        
        try {
            CategoriaArma categoria = categoriaArmaService.getCategoriaById(id);
            CategoriaArmaDTO categoriaDTO = categoriaArmaMapper.toDTO(categoria);
            
            log.info("Categoría obtenida exitosamente: {}", categoriaDTO.getNombre());
            return ResponseEntity.ok(categoriaDTO);
            
        } catch (Exception e) {
            log.error("Error obteniendo categoría de arma con ID: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping
    @Operation(summary = "Crear nueva categoría", description = "Crea una nueva categoría de arma")
    public ResponseEntity<CategoriaArmaDTO> createCategoria(@RequestBody CategoriaArmaDTO categoriaDTO) {
        log.info("Solicitud para crear nueva categoría: {}", categoriaDTO.getNombre());
        
        try {
            CategoriaArma categoria = categoriaArmaMapper.toEntity(categoriaDTO);
            CategoriaArma categoriaCreada = categoriaArmaService.createCategoria(categoria);
            CategoriaArmaDTO categoriaCreadaDTO = categoriaArmaMapper.toDTO(categoriaCreada);
            
            log.info("Categoría creada exitosamente con ID: {}", categoriaCreada.getId());
            return ResponseEntity.ok(categoriaCreadaDTO);
            
        } catch (Exception e) {
            log.error("Error creando categoría de arma", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar categoría", description = "Actualiza una categoría existente")
    public ResponseEntity<CategoriaArmaDTO> updateCategoria(@PathVariable Long id, @RequestBody CategoriaArmaDTO categoriaDTO) {
        log.info("Solicitud para actualizar categoría con ID: {}", id);
        
        try {
            categoriaDTO.setId(id);
            CategoriaArma categoria = categoriaArmaMapper.toEntity(categoriaDTO);
            CategoriaArma categoriaActualizada = categoriaArmaService.updateCategoria(id, categoria);
            CategoriaArmaDTO categoriaActualizadaDTO = categoriaArmaMapper.toDTO(categoriaActualizada);
            
            log.info("Categoría actualizada exitosamente: {}", categoriaActualizadaDTO.getNombre());
            return ResponseEntity.ok(categoriaActualizadaDTO);
            
        } catch (Exception e) {
            log.error("Error actualizando categoría de arma con ID: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar categoría", description = "Elimina una categoría de arma")
    public ResponseEntity<Void> deleteCategoria(@PathVariable Long id) {
        log.info("Solicitud para eliminar categoría con ID: {}", id);
        
        try {
            categoriaArmaService.deleteCategoria(id);
            log.info("Categoría eliminada exitosamente con ID: {}", id);
            return ResponseEntity.ok().build();
            
        } catch (Exception e) {
            log.error("Error eliminando categoría de arma con ID: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/activas")
    @Operation(summary = "Obtener categorías activas", description = "Retorna solo las categorías de armas activas")
    public ResponseEntity<List<CategoriaArmaDTO>> getCategoriasActivas() {
        log.info("Solicitud para obtener categorías activas");
        
        try {
            List<CategoriaArma> categorias = categoriaArmaService.getCategoriasActivas();
            List<CategoriaArmaDTO> categoriasDTO = categoriaArmaMapper.toDTOList(categorias);
            
            log.info("Categorías activas obtenidas exitosamente: {}", categorias.size());
            return ResponseEntity.ok(categoriasDTO);
            
        } catch (Exception e) {
            log.error("Error obteniendo categorías activas", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}

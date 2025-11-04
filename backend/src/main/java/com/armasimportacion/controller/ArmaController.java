package com.armasimportacion.controller;

import com.armasimportacion.dto.ArmaDTO;
import com.armasimportacion.dto.ArmaUpdateDTO;
import com.armasimportacion.dto.ArmaCreateDTO;
import com.armasimportacion.mapper.ArmaMapper;
import com.armasimportacion.model.Arma;
import com.armasimportacion.service.ArmaService;
import com.armasimportacion.service.InventarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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
    private final InventarioService inventarioService;

    @GetMapping
    @Operation(summary = "Obtener todas las armas", description = "Retorna la lista de todas las armas disponibles")
    public ResponseEntity<List<ArmaDTO>> getAllArmas(
            @RequestParam(required = false, defaultValue = "false") boolean incluirInactivas) {
        log.info("Solicitud para obtener todas las armas (incluirInactivas: {})", incluirInactivas);
        
        // Si incluirInactivas=true (para admin), devolver TODAS las armas
        if (incluirInactivas) {
            log.info("🔧 ADMIN MODE - Obteniendo TODAS las armas (activas e inactivas)");
            List<Arma> todasArmas = armaService.findAll();
            List<ArmaDTO> armasDTO = armaMapper.toDTOList(todasArmas);
            log.info("✅ Total de armas (ADMIN): {}", armasDTO.size());
            return ResponseEntity.ok(armasDTO);
        }
        
        // Para vendedores: verificar si la expoferia está activa
        boolean isExpoferiaActiva = inventarioService.isExpoferiaActiva();
        
        // Usar el inventario para obtener armas disponibles
        List<Arma> armas;
        if (isExpoferiaActiva) {
            log.info("🎯 EXPOFERIA ACTIVA - Obteniendo solo armas con stock disponible");
            armas = inventarioService.getArmasConStockDisponible().stream()
                    .map(stock -> stock.getArma())
                    .toList();
        } else {
            log.info("🎯 MODO NORMAL - Obteniendo todas las armas activas (sin control de stock)");
            armas = armaService.findAllActive();
        }
        
        log.info("Total de armas encontradas: {}", armas.size());
        
        // Mapear a DTOs (incluye información de stock)
        List<ArmaDTO> armasDTO = armaMapper.toDTOList(armas);
        
        // CRÍTICO: Solo filtrar por stock si es EXPOFERIA
        if (isExpoferiaActiva) {
            List<ArmaDTO> armasConStock = armasDTO.stream()
                    .filter(arma -> arma.getTieneStock() != null && arma.getTieneStock())
                    .toList();
            log.info("✅ EXPOFERIA - Armas con stock disponible: {}", armasConStock.size());
            return ResponseEntity.ok(armasConStock);
        } else {
            log.info("✅ MODO NORMAL - Todas las armas activas: {}", armasDTO.size());
            return ResponseEntity.ok(armasDTO);
        }
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

    @PostMapping("/with-image")
    @Operation(summary = "Crear arma con imagen", description = "Crea una nueva arma incluyendo su imagen")
    public ResponseEntity<ArmaDTO> createArmaWithImage(
            @RequestParam("nombre") String nombre,
            @RequestParam("calibre") String calibre,
            @RequestParam("capacidad") Integer capacidad,
            @RequestParam("precioReferencia") String precioReferencia,
            @RequestParam("categoriaId") Long categoriaId,
            @RequestParam("estado") Boolean estado,
            @RequestParam(value = "expoferia", required = false, defaultValue = "false") Boolean expoferia,
            @RequestParam("codigo") String codigo,
            @RequestParam(value = "urlProducto", required = false) String urlProducto,
            @RequestParam(value = "imagen", required = false) MultipartFile imagen) {

        log.info("Solicitud para crear nueva arma con imagen");

        try {
            // Crear DTO con los datos recibidos
            ArmaCreateDTO createDTO = ArmaCreateDTO.builder()
                    .nombre(nombre)
                    .calibre(calibre)
                    .capacidad(capacidad)
                    .precioReferencia(new java.math.BigDecimal(precioReferencia))
                    .categoriaId(categoriaId)
                    .estado(estado)
                    .expoferia(expoferia)
                    .codigo(codigo)
                    .urlProducto(urlProducto)
                    .imagen(imagen)
                    .build();

            // Crear arma con imagen
            Arma armaCreada = armaService.createWithImage(createDTO);
            ArmaDTO armaDTO = armaMapper.toDTO(armaCreada);

            log.info("Arma creada exitosamente con ID: {}", armaCreada.getId());
            return ResponseEntity.ok(armaDTO);

        } catch (IOException e) {
            log.error("Error procesando imagen para nueva arma", e);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error creando arma", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar arma", description = "Actualiza una arma existente")
    public ResponseEntity<ArmaDTO> updateArma(@PathVariable Long id, @RequestBody Arma armaDetails) {
        log.info("Solicitud para actualizar arma con ID: {}", id);
        Arma armaActualizada = armaService.update(id, armaDetails);
        ArmaDTO armaDTO = armaMapper.toDTO(armaActualizada);
        return ResponseEntity.ok(armaDTO);
    }

    @PutMapping("/{id}/with-image")
    @Operation(summary = "Actualizar arma con imagen", description = "Actualiza una arma existente incluyendo su imagen")
    public ResponseEntity<ArmaDTO> updateArmaWithImage(
            @PathVariable Long id,
            @RequestParam("nombre") String nombre,
            @RequestParam("calibre") String calibre,
            @RequestParam("capacidad") Integer capacidad,
            @RequestParam("precioReferencia") String precioReferencia,
            @RequestParam("categoriaId") Long categoriaId,
            @RequestParam("estado") Boolean estado,
            @RequestParam(value = "expoferia", required = false, defaultValue = "false") Boolean expoferia,
            @RequestParam("codigo") String codigo,
            @RequestParam(value = "urlProducto", required = false) String urlProducto,
            @RequestParam(value = "imagen", required = false) MultipartFile imagen) {
        
        log.info("Solicitud para actualizar arma con ID: {} e imagen", id);
        
        try {
            // Crear DTO con los datos recibidos
            ArmaUpdateDTO updateDTO = ArmaUpdateDTO.builder()
                    .nombre(nombre)
                    .calibre(calibre)
                    .capacidad(capacidad)
                    .precioReferencia(new java.math.BigDecimal(precioReferencia))
                    .categoriaId(categoriaId)
                    .estado(estado)
                    .expoferia(expoferia)
                    .codigo(codigo)
                    .urlProducto(urlProducto)
                    .imagen(imagen)
                    .build();
            
            // Actualizar arma con imagen
            Arma armaActualizada = armaService.updateWithImage(id, updateDTO);
            ArmaDTO armaDTO = armaMapper.toDTO(armaActualizada);
            
            log.info("Arma actualizada exitosamente con ID: {}", id);
            return ResponseEntity.ok(armaDTO);
            
        } catch (IOException e) {
            log.error("Error procesando imagen para arma ID: {}", id, e);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error actualizando arma con ID: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
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

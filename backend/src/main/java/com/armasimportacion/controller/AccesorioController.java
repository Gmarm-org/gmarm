package com.armasimportacion.controller;

import com.armasimportacion.dto.AccesorioDTO;
import com.armasimportacion.service.AccesorioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Controlador para la gestión de accesorios
 */
@RestController
@RequestMapping("/api/accesorios")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AccesorioController {

    private final AccesorioService accesorioService;

    /**
     * Crear un nuevo accesorio
     */
    @PostMapping
    public ResponseEntity<AccesorioDTO> crearAccesorio(@RequestBody AccesorioDTO accesorioDTO) {
        log.info("POST /api/accesorios - Creando nuevo accesorio: {}", accesorioDTO.getNombre());
        
        AccesorioDTO accesorio = accesorioService.crearAccesorio(accesorioDTO);
        return ResponseEntity.ok(accesorio);
    }

    /**
     * Obtener todos los accesorios
     */
    @GetMapping
    public ResponseEntity<List<AccesorioDTO>> obtenerTodos() {
        log.info("GET /api/accesorios - Obteniendo todos los accesorios");
        
        List<AccesorioDTO> accesorios = accesorioService.obtenerTodos();
        return ResponseEntity.ok(accesorios);
    }

    /**
     * Obtener solo accesorios activos
     */
    @GetMapping("/activos")
    public ResponseEntity<List<AccesorioDTO>> obtenerActivos() {
        log.info("GET /api/accesorios/activos - Obteniendo accesorios activos");
        
        List<AccesorioDTO> accesorios = accesorioService.obtenerActivos();
        return ResponseEntity.ok(accesorios);
    }

    /**
     * Obtener accesorio por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<AccesorioDTO> obtenerPorId(@PathVariable Long id) {
        log.info("GET /api/accesorios/{} - Obteniendo accesorio por ID", id);
        
        AccesorioDTO accesorio = accesorioService.obtenerPorId(id);
        return ResponseEntity.ok(accesorio);
    }

    /**
     * Obtener accesorio por código
     */
    @GetMapping("/codigo/{codigo}")
    public ResponseEntity<AccesorioDTO> obtenerPorCodigo(@PathVariable String codigo) {
        log.info("GET /api/accesorios/codigo/{} - Obteniendo accesorio por código", codigo);
        
        AccesorioDTO accesorio = accesorioService.obtenerPorCodigo(codigo);
        return ResponseEntity.ok(accesorio);
    }

    /**
     * Buscar accesorios por nombre
     */
    @GetMapping("/buscar")
    public ResponseEntity<List<AccesorioDTO>> buscarPorNombre(@RequestParam String nombre) {
        log.info("GET /api/accesorios/buscar?nombre={} - Buscando accesorios por nombre", nombre);
        
        List<AccesorioDTO> accesorios = accesorioService.buscarPorNombre(nombre);
        return ResponseEntity.ok(accesorios);
    }

    /**
     * Buscar accesorios por categoría
     */
    @GetMapping("/categoria/{categoria}")
    public ResponseEntity<List<AccesorioDTO>> buscarPorCategoria(@PathVariable String categoria) {
        log.info("GET /api/accesorios/categoria/{} - Buscando accesorios por categoría", categoria);
        
        List<AccesorioDTO> accesorios = accesorioService.buscarPorCategoria(categoria);
        return ResponseEntity.ok(accesorios);
    }

    /**
     * Buscar accesorios por rango de precio
     */
    @GetMapping("/precio")
    public ResponseEntity<List<AccesorioDTO>> buscarPorRangoPrecio(
            @RequestParam BigDecimal precioMin,
            @RequestParam BigDecimal precioMax) {
        log.info("GET /api/accesorios/precio?precioMin={}&precioMax={} - Buscando por rango de precio", precioMin, precioMax);
        
        List<AccesorioDTO> accesorios = accesorioService.buscarPorRangoPrecio(precioMin, precioMax);
        return ResponseEntity.ok(accesorios);
    }

    /**
     * Actualizar accesorio
     */
    @PutMapping("/{id}")
    public ResponseEntity<AccesorioDTO> actualizarAccesorio(
            @PathVariable Long id,
            @RequestBody AccesorioDTO accesorioDTO) {
        log.info("PUT /api/accesorios/{} - Actualizando accesorio", id);
        
        AccesorioDTO accesorio = accesorioService.actualizarAccesorio(id, accesorioDTO);
        return ResponseEntity.ok(accesorio);
    }

    /**
     * Activar accesorio
     */
    @PutMapping("/{id}/activar")
    public ResponseEntity<AccesorioDTO> activarAccesorio(@PathVariable Long id) {
        log.info("PUT /api/accesorios/{}/activar - Activando accesorio", id);
        
        AccesorioDTO accesorio = accesorioService.activarAccesorio(id);
        return ResponseEntity.ok(accesorio);
    }

    /**
     * Desactivar accesorio
     */
    @PutMapping("/{id}/desactivar")
    public ResponseEntity<AccesorioDTO> desactivarAccesorio(@PathVariable Long id) {
        log.info("PUT /api/accesorios/{}/desactivar - Desactivando accesorio", id);
        
        AccesorioDTO accesorio = accesorioService.desactivarAccesorio(id);
        return ResponseEntity.ok(accesorio);
    }

    /**
     * Eliminar accesorio
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarAccesorio(@PathVariable Long id) {
        log.info("DELETE /api/accesorios/{} - Eliminando accesorio", id);
        
        accesorioService.eliminarAccesorio(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Obtener estadísticas de accesorios
     */
    @GetMapping("/estadisticas")
    public ResponseEntity<AccesorioService.AccesorioStatsDTO> obtenerEstadisticas() {
        log.info("GET /api/accesorios/estadisticas - Obteniendo estadísticas");
        
        AccesorioService.AccesorioStatsDTO estadisticas = accesorioService.obtenerEstadisticas();
        return ResponseEntity.ok(estadisticas);
    }
}

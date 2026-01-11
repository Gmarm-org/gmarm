package com.armasimportacion.controller;

import com.armasimportacion.model.ArmaStock;
import com.armasimportacion.service.InventarioService;
import com.armasimportacion.dto.ArmaStockDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador para la gestión del inventario
 */
@RestController
@RequestMapping("/api/inventario")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class InventarioController {

    private final InventarioService inventarioService;

    /**
     * Obtener todas las armas con stock disponible
     */
    @GetMapping("/armas-disponibles")
    public ResponseEntity<List<ArmaStock>> getArmasDisponibles() {
        log.info("GET /api/inventario/armas-disponibles - Obteniendo armas disponibles");
        
        List<ArmaStock> armas = inventarioService.getArmasConStockDisponible();
        return ResponseEntity.ok(armas);
    }

    /**
     * Verificar stock de una arma
     */
    @GetMapping("/stock/{armaId}")
    public ResponseEntity<Integer> getStockArma(@PathVariable Long armaId) {
        log.info("GET /api/inventario/stock/{} - Verificando stock", armaId);
        
        Integer stock = inventarioService.getStockDisponible(armaId);
        return ResponseEntity.ok(stock);
    }

    /**
     * Verificar si hay stock suficiente
     */
    @GetMapping("/verificar-stock/{armaId}/{cantidad}")
    public ResponseEntity<Boolean> verificarStock(@PathVariable Long armaId, @PathVariable Integer cantidad) {
        log.info("GET /api/inventario/verificar-stock/{}/{} - Verificando stock suficiente", armaId, cantidad);
        
        boolean tieneStock = inventarioService.tieneStockSuficiente(armaId, cantidad);
        return ResponseEntity.ok(tieneStock);
    }

    /**
     * Obtener información completa de stock de una arma
     */
    @GetMapping("/arma-stock/{armaId}")
    public ResponseEntity<ArmaStock> getArmaStock(@PathVariable Long armaId) {
        log.info("GET /api/inventario/arma-stock/{} - Obteniendo información de stock", armaId);
        
        return inventarioService.getArmaStock(armaId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Obtener stock de todas las armas (para panel de jefe de ventas)
     */
    @GetMapping("/stock/todas")
    public ResponseEntity<List<ArmaStockDTO>> getStockTodasArmas() {
        log.info("GET /api/inventario/stock/todas - Obteniendo stock de todas las armas");
        
        List<ArmaStockDTO> stockTotal = inventarioService.getStockTodasArmas();
        return ResponseEntity.ok(stockTotal);
    }
}

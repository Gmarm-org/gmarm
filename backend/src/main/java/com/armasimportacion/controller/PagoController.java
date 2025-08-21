package com.armasimportacion.controller;

import com.armasimportacion.exception.BadRequestException;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.model.Pago;
import com.armasimportacion.service.PagoService;
import com.armasimportacion.enums.EstadoPago;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pagos")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Pagos", description = "API para gestión de pagos")
public class PagoController {
    
    private final PagoService pagoService;
    
    @PostMapping
    @Operation(summary = "Crear nuevo pago", description = "Crea un nuevo pago para un cliente")
    public ResponseEntity<Pago> crearPago(
            @Valid @RequestBody Pago pago,
            @RequestParam Long usuarioId) {
        try {
            Pago nuevoPago = pagoService.crearPago(pago, usuarioId);
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevoPago);
        } catch (BadRequestException e) {
            log.error("Error al crear pago: {}", e.getMessage());
            throw e;
        }
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Actualizar pago", description = "Actualiza un pago existente")
    public ResponseEntity<Pago> actualizarPago(
            @PathVariable Long id,
            @Valid @RequestBody Pago pago,
            @RequestParam Long usuarioId) {
        try {
            Pago pagoActualizado = pagoService.actualizarPago(id, pago, usuarioId);
            return ResponseEntity.ok(pagoActualizado);
        } catch (ResourceNotFoundException e) {
            log.error("Pago no encontrado: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Obtener pago por ID", description = "Obtiene un pago específico por su ID")
    public ResponseEntity<Pago> obtenerPago(@PathVariable Long id) {
        try {
            Pago pago = pagoService.obtenerPago(id);
            return ResponseEntity.ok(pago);
        } catch (ResourceNotFoundException e) {
            log.error("Pago no encontrado: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping
    @Operation(summary = "Listar pagos", description = "Obtiene una lista paginada de pagos")
    public ResponseEntity<Page<Pago>> obtenerPagos(Pageable pageable) {
        Page<Pago> pagos = pagoService.obtenerPagos(pageable);
        return ResponseEntity.ok(pagos);
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar pago", description = "Elimina un pago por su ID")
    public ResponseEntity<Void> eliminarPago(@PathVariable Long id) {
        try {
            pagoService.eliminarPago(id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            log.error("Pago no encontrado: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/cliente/{clienteId}")
    @Operation(summary = "Obtener pagos por cliente", description = "Obtiene todos los pagos de un cliente específico")
    public ResponseEntity<List<Pago>> obtenerPagosPorCliente(@PathVariable Long clienteId) {
        try {
            List<Pago> pagos = pagoService.obtenerPagosPorCliente(clienteId);
            return ResponseEntity.ok(pagos);
        } catch (ResourceNotFoundException e) {
            log.error("Cliente no encontrado: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/cliente/{clienteId}/saldo")
    @Operation(summary = "Obtener saldo del cliente", description = "Obtiene el saldo actual de un cliente")
    public ResponseEntity<Map<String, Object>> obtenerSaldoCliente(@PathVariable Long clienteId) {
        try {
            BigDecimal saldo = pagoService.obtenerSaldoCliente(clienteId);
            boolean tieneSaldoPendiente = pagoService.clienteTieneSaldoPendiente(clienteId);
            
            Map<String, Object> response = Map.of(
                "clienteId", clienteId,
                "saldo", saldo,
                "tieneSaldoPendiente", tieneSaldoPendiente
            );
            
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            log.error("Cliente no encontrado: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/por-fecha")
    @Operation(summary = "Obtener pagos por fecha", description = "Obtiene pagos en un rango de fechas")
    public ResponseEntity<List<Pago>> obtenerPagosPorFecha(
            @RequestParam LocalDateTime fechaInicio,
            @RequestParam LocalDateTime fechaFin) {
        List<Pago> pagos = pagoService.obtenerPagosPorFecha(fechaInicio, fechaFin);
        return ResponseEntity.ok(pagos);
    }
    
    @GetMapping("/pendientes")
    @Operation(summary = "Obtener pagos pendientes", description = "Obtiene todos los pagos pendientes")
    public ResponseEntity<List<Pago>> obtenerPagosPendientes() {
        List<Pago> pagos = pagoService.obtenerPagosPendientes();
        return ResponseEntity.ok(pagos);
    }
    
    @GetMapping("/buscar")
    @Operation(summary = "Buscar pagos", description = "Busca pagos con filtros específicos")
    public ResponseEntity<Page<Pago>> buscarPagos(
            @RequestParam(required = false) String numeroComprobante,
            @RequestParam(required = false) EstadoPago estado,
            @RequestParam(required = false) Long planPagoId,
            @RequestParam(required = false) LocalDateTime fechaInicio,
            @RequestParam(required = false) LocalDateTime fechaFin,
            Pageable pageable) {
        Page<Pago> pagos = pagoService.buscarPagos(numeroComprobante, estado, planPagoId, fechaInicio, fechaFin, pageable);
        return ResponseEntity.ok(pagos);
    }
    
    @GetMapping("/estadisticas")
    @Operation(summary = "Obtener estadísticas", description = "Obtiene estadísticas de pagos por estado")
    public ResponseEntity<List<Object[]>> obtenerEstadisticas() {
        List<Object[]> estadisticas = pagoService.obtenerEstadisticasPorEstado();
        return ResponseEntity.ok(estadisticas);
    }
    
    @PutMapping("/{id}/estado")
    @Operation(summary = "Cambiar estado de pago", description = "Cambia el estado de un pago")
    public ResponseEntity<Void> cambiarEstado(
            @PathVariable Long id,
            @RequestParam EstadoPago nuevoEstado) {
        try {
            pagoService.cambiarEstado(id, nuevoEstado);
            return ResponseEntity.ok().build();
        } catch (ResourceNotFoundException e) {
            log.error("Pago no encontrado: {}", e.getMessage());
            throw e;
        }
    }
    
    @GetMapping("/generar-comprobante")
    @Operation(summary = "Generar número de comprobante", description = "Genera un número de comprobante automático")
    public ResponseEntity<Map<String, String>> generarNumeroComprobante() {
        String numeroComprobante = pagoService.generarNumeroComprobante();
        Map<String, String> response = Map.of("numeroComprobante", numeroComprobante);
        return ResponseEntity.ok(response);
    }
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleResourceNotFoundException(ResourceNotFoundException e) {
        Map<String, String> error = Map.of("error", e.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
    
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Map<String, String>> handleBadRequestException(BadRequestException e) {
        Map<String, String> error = Map.of("error", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGenericException(Exception e) {
        log.error("Error inesperado: ", e);
        Map<String, String> error = Map.of("error", "Error interno del servidor");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
} 

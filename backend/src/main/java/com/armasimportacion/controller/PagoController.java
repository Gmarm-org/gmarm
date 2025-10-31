package com.armasimportacion.controller;

import com.armasimportacion.dto.CuotaPagoDTO;
import com.armasimportacion.enums.EstadoPago;
import com.armasimportacion.mapper.CuotaPagoMapper;
import com.armasimportacion.model.Pago;
import com.armasimportacion.model.CuotaPago;
import com.armasimportacion.service.PagoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pagos")
@RequiredArgsConstructor
@Slf4j
public class PagoController {

    private final PagoService pagoService;
    private final CuotaPagoMapper cuotaPagoMapper;

    @PostMapping
    public ResponseEntity<Pago> crearPago(@RequestBody Pago pago) {
        log.info("Creando nuevo pago para cliente: {}", pago.getClienteId());
        Pago pagoCreado = pagoService.crearPago(pago);
        return ResponseEntity.ok(pagoCreado);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pago> obtenerPago(@PathVariable Long id) {
        return pagoService.obtenerPagoPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<Pago>> obtenerPagosPorCliente(@PathVariable Long clienteId) {
        List<Pago> pagos = pagoService.obtenerPagosPorCliente(clienteId);
        return ResponseEntity.ok(pagos);
    }

    @GetMapping("/estado/{estado}")
    public ResponseEntity<List<Pago>> obtenerPagosPorEstado(@PathVariable EstadoPago estado) {
        List<Pago> pagos = pagoService.obtenerPagosPorEstado(estado);
        return ResponseEntity.ok(pagos);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Pago> actualizarPago(@PathVariable Long id, @RequestBody Pago pago) {
        pago.setId(id);
        Pago pagoActualizado = pagoService.actualizarPago(pago);
        return ResponseEntity.ok(pagoActualizado);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarPago(@PathVariable Long id) {
        pagoService.eliminarPago(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/buscar")
    public ResponseEntity<Page<Pago>> buscarPagos(
            @RequestParam(required = false) String numeroComprobante,
            @RequestParam(required = false) EstadoPago estado,
            @RequestParam(required = false) Long clienteId,
            @RequestParam(required = false) LocalDateTime fechaInicio,
            @RequestParam(required = false) LocalDateTime fechaFin,
            Pageable pageable) {
        
        Page<Pago> pagos = pagoService.buscarPagos(numeroComprobante, estado, clienteId, fechaInicio, fechaFin, pageable);
        return ResponseEntity.ok(pagos);
    }

    @GetMapping("/cliente/{clienteId}/saldo")
    public ResponseEntity<BigDecimal> obtenerSaldoCliente(@PathVariable Long clienteId) {
        BigDecimal saldo = pagoService.obtenerSaldoCliente(clienteId);
        return ResponseEntity.ok(saldo);
    }

    @GetMapping("/cliente/{clienteId}/tiene-saldo")
    public ResponseEntity<Boolean> clienteTieneSaldoPendiente(@PathVariable Long clienteId) {
        boolean tieneSaldo = pagoService.clienteTieneSaldoPendiente(clienteId);
        return ResponseEntity.ok(tieneSaldo);
    }

    @GetMapping("/{pagoId}/cuotas")
    public ResponseEntity<List<CuotaPagoDTO>> obtenerCuotasPorPago(@PathVariable Long pagoId) {
        log.info("📅 Obteniendo cuotas para pago ID: {}", pagoId);
        List<CuotaPago> cuotas = pagoService.obtenerCuotasPorPago(pagoId);
        log.info("✅ Se encontraron {} cuotas para pago ID: {}", cuotas.size(), pagoId);
        List<CuotaPagoDTO> cuotasDTO = cuotas.stream()
                .map(cuotaPagoMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(cuotasDTO);
    }

    @PostMapping("/cuota/{cuotaId}/pagar")
    public ResponseEntity<CuotaPago> pagarCuota(
            @PathVariable Long cuotaId,
            @RequestParam String referenciaPago,
            @RequestParam Long usuarioConfirmadorId) {
        
        CuotaPago cuotaPagada = pagoService.pagarCuota(cuotaId, referenciaPago, usuarioConfirmadorId);
        return ResponseEntity.ok(cuotaPagada);
    }

    @GetMapping("/cuotas/vencidas")
    public ResponseEntity<List<CuotaPago>> obtenerCuotasVencidas() {
        List<CuotaPago> cuotasVencidas = pagoService.obtenerCuotasVencidas();
        return ResponseEntity.ok(cuotasVencidas);
    }

    @GetMapping("/cliente/{clienteId}/cuotas")
    public ResponseEntity<List<CuotaPago>> obtenerCuotasPorCliente(@PathVariable Long clienteId) {
        List<CuotaPago> cuotas = pagoService.obtenerCuotasPorCliente(clienteId);
        return ResponseEntity.ok(cuotas);
    }
} 
